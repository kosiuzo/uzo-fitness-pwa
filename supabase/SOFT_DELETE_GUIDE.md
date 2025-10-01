# Soft Delete Implementation Guide

## Overview

This database implements **soft deletes** for data recovery. Records are marked as deleted with a `deleted_at` timestamp instead of being permanently removed, allowing for easy restoration.

## How It Works

### Automatic Exclusion

**All queries automatically exclude soft-deleted records** thanks to RLS policies:

```typescript
// This only returns non-deleted workouts
const { data: workouts } = await supabase
  .from('workouts')
  .select('*');

// Soft-deleted records are invisible to normal queries
```

### Tables with Soft Delete Support

All user-facing tables support soft deletes:
- `exercises`
- `workouts`
- `workout_groups`
- `workout_items`
- `cycles`
- `sessions`
- `session_groups`
- `session_items`
- `sets`

## Usage Examples

### 1. Soft Delete a Record

```typescript
import { supabase } from './config/supabase';

// Method A: Use the helper function
const { data, error } = await supabase.rpc('soft_delete', {
  table_name: 'workouts',
  record_id: 'workout-uuid-here'
});

// Method B: Update deleted_at directly
const { data, error } = await supabase
  .from('workouts')
  .update({ deleted_at: new Date().toISOString() })
  .eq('id', 'workout-uuid-here');
```

### 2. View Deleted Records

```typescript
// See what you've deleted (for recovery)
const { data: deletedWorkouts, error } = await supabase.rpc('view_deleted_records', {
  table_name: 'workouts'
});

console.log(deletedWorkouts);
// [
//   { id: 'uuid', name: 'Push Day A', deleted_at: '2025-09-30T...' },
//   { id: 'uuid', name: 'Leg Day B', deleted_at: '2025-09-29T...' }
// ]
```

### 3. Restore a Deleted Record

```typescript
// Bring back a deleted record
const { data, error } = await supabase.rpc('restore_deleted', {
  table_name: 'workouts',
  record_id: 'workout-uuid-here'
});

if (data) {
  console.log('Workout restored successfully!');
}
```

### 4. Permanent Delete (Careful!)

```typescript
// Permanently delete a soft-deleted record (cannot be undone)
const { data, error } = await supabase.rpc('permanent_delete', {
  table_name: 'workouts',
  record_id: 'workout-uuid-here'
});

// Note: This only works on records that are already soft-deleted
// You must soft delete first, then permanently delete
```

## UI Implementation Examples

### Delete Button with Confirmation

```typescript
async function handleDelete(workoutId: string) {
  if (!confirm('Delete this workout? You can restore it later.')) {
    return;
  }

  const { error } = await supabase.rpc('soft_delete', {
    table_name: 'workouts',
    record_id: workoutId
  });

  if (error) {
    alert('Failed to delete workout');
  } else {
    alert('Workout deleted. Check trash to restore.');
  }
}
```

### Trash/Recovery View

```typescript
function TrashView() {
  const [deletedItems, setDeletedItems] = useState([]);

  useEffect(() => {
    loadDeletedItems();
  }, []);

  async function loadDeletedItems() {
    const { data } = await supabase.rpc('view_deleted_records', {
      table_name: 'workouts'
    });
    setDeletedItems(data || []);
  }

  async function handleRestore(id: string) {
    await supabase.rpc('restore_deleted', {
      table_name: 'workouts',
      record_id: id
    });
    loadDeletedItems(); // Refresh list
  }

  return (
    <div>
      <h2>Deleted Workouts</h2>
      {deletedItems.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <button onClick={() => handleRestore(item.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Security & RLS

### Automatic Protection

RLS policies automatically enforce:
- ✅ Users can only soft-delete their own records
- ✅ Users can only restore their own records
- ✅ Users can only permanently delete their own records
- ✅ Deleted records are invisible in normal queries
- ✅ Deleted records don't appear in views or aggregations

### Permission Model

```typescript
// ✅ Allowed: Delete your own workout
await supabase.rpc('soft_delete', {
  table_name: 'workouts',
  record_id: 'your-workout-id'
});

// ❌ Blocked: Cannot delete another user's workout
await supabase.rpc('soft_delete', {
  table_name: 'workouts',
  record_id: 'other-users-workout-id'  // Returns false, no access
});
```

## Admin Functions

### Cleanup Old Deleted Records

Permanently remove soft-deleted records older than N days (admin only):

```typescript
// Run via service role (backend/cron job)
const { data } = await supabase.rpc('cleanup_old_deleted_records', {
  older_than_days: 90  // Default: 90 days
});

console.log('Cleanup results:', data);
// [
//   { table_name: 'workouts', records_deleted: 15 },
//   { table_name: 'sessions', records_deleted: 42 }
// ]
```

**Recommended Schedule**: Run monthly via cron job to prevent database bloat.

## Performance Considerations

### Partial Indexes

The migration creates partial indexes for efficient queries:

```sql
create index idx_workouts_not_deleted
on workouts(id)
where deleted_at is null;
```

These indexes only include non-deleted records, making queries fast even with many soft-deleted records.

### Query Performance

- ✅ **Listing active records**: Fast (uses partial index)
- ✅ **Filtering by user**: Fast (RLS + indexes)
- ⚠️ **Listing deleted records**: Slower (full table scan)
- ⚠️ **Counting all records**: Slower (includes deleted)

**Recommendation**: Keep deleted records under 20% of total for optimal performance. Run cleanup regularly.

## Best Practices

### 1. Two-Step Delete UX

```
User clicks "Delete" → Soft delete (reversible)
User clicks "Empty Trash" → Permanent delete (irreversible)
```

### 2. Show Deletion Date

```typescript
function formatDeletedTime(deleted_at: string) {
  const date = new Date(deleted_at);
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}
```

### 3. Auto-Cleanup Warnings

```typescript
// Warn before permanent deletion
if (daysSinceDeleted >= 90) {
  alert('This item will be permanently deleted soon. Restore now to keep it.');
}
```

### 4. Cascade Considerations

When soft-deleting parent records, consider soft-deleting children:

```typescript
async function deleteWorkoutWithChildren(workoutId: string) {
  // Soft delete the workout
  await supabase.rpc('soft_delete', {
    table_name: 'workouts',
    record_id: workoutId
  });

  // Soft delete all groups
  const { data: groups } = await supabase
    .from('workout_groups')
    .select('id')
    .eq('workout_id', workoutId);

  for (const group of groups) {
    await supabase.rpc('soft_delete', {
      table_name: 'workout_groups',
      record_id: group.id
    });
  }

  // Note: Consider implementing this as a database function for atomicity
}
```

## Troubleshooting

### "Record not found" after deletion

**Expected behavior**: Soft-deleted records are invisible to normal queries. Use `view_deleted_records()` to see them.

### Cannot permanently delete

**Cause**: Record must be soft-deleted first.

**Solution**:
```typescript
// Step 1: Soft delete
await supabase.rpc('soft_delete', { table_name: 'workouts', record_id: id });

// Step 2: Permanently delete
await supabase.rpc('permanent_delete', { table_name: 'workouts', record_id: id });
```

### Performance degradation

**Cause**: Too many soft-deleted records.

**Solution**: Run cleanup function to permanently delete old records:
```typescript
await supabase.rpc('cleanup_old_deleted_records', { older_than_days: 90 });
```

## Migration Notes

The soft delete feature was added in migration `20250930000006_soft_deletes.sql` and includes:
- ✅ `deleted_at` columns on all tables
- ✅ Partial indexes for performance
- ✅ Updated RLS policies to exclude deleted records
- ✅ Helper functions for delete/restore/view
- ✅ Admin cleanup function
- ✅ Updated views to exclude deleted records

All existing data remains intact and unaffected.
