/**
 * Supabase RPC Client Wrapper Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from '@/lib/supabase/client';
import { RPCError } from '@/lib/rpc';

// Note: supabase client is mocked in test setup; grab the mock to control behavior
import { supabase } from '@/config/supabase';
vi.mock('@/config/supabase');

describe('supaRpc read methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('workoutListJson returns data', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [{ id: 'w1' }], error: null } as any);
    const data = await client.workoutListJson();
    expect(data).toEqual([{ id: 'w1' }]);
    expect(supabase.rpc).toHaveBeenCalledWith('workout_list_json', undefined);
  });

  it('workoutDetailJson passes params', async () => {
    const mock = { id: 'w1', name: 'Push' };
    vi.mocked(supabase.rpc).mockResolvedValue({ data: mock, error: null } as any);
    const data = await client.workoutDetailJson('w1');
    expect(data).toEqual(mock);
    expect(supabase.rpc).toHaveBeenCalledWith('workout_detail_json', { p_workout_id: 'w1' });
  });

  it('sessionDetailJson throws RPCError on error', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found', details: null, hint: undefined },
    } as any);

    await expect(client.sessionDetailJson('s1')).rejects.toEqual(
      new RPCError('PGRST116', 'Not found', null, undefined)
    );
  });
});

describe('supaRpc write methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('addWorkout returns new id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'w-new', error: null } as any);
    const id = await client.addWorkout({ p_name: 'New', p_description: null });
    expect(id).toBe('w-new');
    expect(supabase.rpc).toHaveBeenCalledWith('add_workout', {
      p_name: 'New',
      p_description: null,
    });
  });

  it('updateWorkout returns void', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
    await client.updateWorkout({ p_workout_id: 'w1', p_name: 'X', p_description: 'Y' });
    expect(supabase.rpc).toHaveBeenCalledWith('update_workout', {
      p_workout_id: 'w1',
      p_name: 'X',
      p_description: 'Y',
    });
  });

  it('deleteWorkout calls with id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any);
    await client.deleteWorkout('w9');
    expect(supabase.rpc).toHaveBeenCalledWith('delete_workout', { p_workout_id: 'w9' });
  });

  it('logSet returns set id', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 'set-1', error: null } as any);
    const id = await client.logSet({ p_session_item_id: 'si1', p_reps: 8, p_weight: 30 });
    expect(id).toBe('set-1');
    expect(supabase.rpc).toHaveBeenCalledWith('log_set', {
      p_session_item_id: 'si1',
      p_reps: 8,
      p_weight: 30,
    });
  });

  it('finishSession propagates RPC errors', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { code: '500', message: 'boom', details: 'x', hint: 'y' },
    } as any);

    await expect(client.finishSession({ p_session_id: 's1' })).rejects.toEqual(
      new RPCError('500', 'boom', 'x', 'y')
    );
  });
});
