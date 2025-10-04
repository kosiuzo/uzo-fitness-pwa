import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Spinner } from '../shared/Spinner';
import {
  useWorkoutDetail,
  useReorderWorkoutGroups,
  useReorderWorkoutItems,
  useAddWorkoutGroup,
  useAddWorkoutItem,
} from '../../hooks/useWorkouts';
import { useExercises } from '../../hooks/useExercises';
import { useStartSession } from '../../hooks/useSessions';

const GROUP_TYPE_LABELS = {
  single: 'Single',
  superset: 'Superset',
  triset: 'Triset',
  circuit: 'Circuit',
};

function groupLetter(position) {
  if (!position) return '?';
  const code = 64 + position; // 1 => A
  if (code < 65) return '?';
  return String.fromCharCode(code);
}

function formatRest(seconds) {
  if (!seconds && seconds !== 0) return '—';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (remaining === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remaining}s`;
}

function SortableGroup({ group, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `group-${group.id}`,
    data: {
      type: 'group',
      groupId: group.id,
    },
  });

  const { setNodeRef: setItemsRef } = useDroppable({
    id: `items-${group.id}`,
    data: {
      type: 'container',
      groupId: group.id,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-4 rounded-xl border border-gray-200 bg-white shadow-sm"
      data-testid={`group-${group.id}`}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:text-gray-700"
            aria-label="Reorder group"
            {...listeners}
            {...attributes}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M3 5h10v2H3V5zm0 4h10v2H3V9z" />
            </svg>
          </button>
          <div>
            <p className="text-base font-semibold text-gray-900">
              {groupLetter(group.position)} • {group.name}
            </p>
            <p className="text-sm text-gray-500">
              {GROUP_TYPE_LABELS[group.groupType] || group.groupType} · Rest {formatRest(group.restSeconds)}
            </p>
          </div>
        </div>
      </div>
      {children(setItemsRef)}
    </div>
  );
}

SortableGroup.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    position: PropTypes.number.isRequired,
    groupType: PropTypes.oneOf(['single', 'superset', 'triset', 'circuit']).isRequired,
    restSeconds: PropTypes.number.isRequired,
  }).isRequired,
  children: PropTypes.func.isRequired,
};

function SortableItem({ item, order }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${item.id}`,
    data: {
      type: 'item',
      groupId: order.groupId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:text-gray-700"
          aria-label="Reorder exercise"
          {...listeners}
          {...attributes}
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M3 5h10v2H3V5zm0 4h10v2H3V9z" />
          </svg>
        </button>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {item.groupPosition || `${order.groupLabel}${order.index + 1}`} · {item.exerciseName}
          </p>
          <p className="text-sm text-gray-600">
            {item.targetSets ? `${item.targetSets}×` : ''}
            {item.targetReps ? `${item.targetReps}` : ''}
            {item.targetWeight ? ` @ ${item.targetWeight}kg` : ''}
          </p>
          {item.restSeconds ? (
            <p className="text-xs text-gray-500">Rest {formatRest(item.restSeconds)}</p>
          ) : null}
          {item.notes ? (
            <p className="mt-1 text-xs text-gray-500">{item.notes}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

SortableItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    groupPosition: PropTypes.string,
    exerciseName: PropTypes.string.isRequired,
    targetSets: PropTypes.number,
    targetReps: PropTypes.number,
    targetWeight: PropTypes.number,
    restSeconds: PropTypes.number,
    notes: PropTypes.string,
  }).isRequired,
  order: PropTypes.shape({
    groupId: PropTypes.string.isRequired,
    groupLabel: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
  }).isRequired,
};

function AddGroupForm({ values, onChange, onCancel, onSubmit, isSubmitting }) {
  const groupTypeOptions = [
    { value: 'single', label: 'Single' },
    { value: 'superset', label: 'Superset' },
    { value: 'triset', label: 'Triset' },
    { value: 'circuit', label: 'Circuit' },
  ];

  return (
    <form className="mb-4 rounded-xl border border-dashed border-gray-300 bg-white p-4" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Group name"
          name="name"
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          placeholder="e.g. Group A"
          required
        />
        <Select
          label="Group type"
          name="groupType"
          value={values.groupType}
          onChange={(event) => onChange({ ...values, groupType: event.target.value })}
          options={groupTypeOptions}
          required
        />
        <Input
          label="Rest seconds"
          name="restSeconds"
          type="number"
          min="0"
          value={values.restSeconds}
          onChange={(event) => onChange({ ...values, restSeconds: event.target.value })}
          placeholder="120"
        />
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Add Group
        </Button>
      </div>
    </form>
  );
}

AddGroupForm.propTypes = {
  values: PropTypes.shape({
    name: PropTypes.string.isRequired,
    groupType: PropTypes.string.isRequired,
    restSeconds: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

function AddItemForm({
  values,
  group,
  exercises,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting,
}) {
  const exerciseOptions = useMemo(
    () =>
      exercises.map((exercise) => ({
        value: exercise.id,
        label: exercise.name,
      })),
    [exercises]
  );

  return (
    <form className="mt-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select
          label="Exercise"
          name="exerciseId"
          value={values.exerciseId}
          onChange={(event) => onChange({ ...values, exerciseId: event.target.value })}
          options={exerciseOptions}
          required
        />
        <Input
          label="Target sets"
          name="targetSets"
          type="number"
          min="1"
          value={values.targetSets}
          onChange={(event) => onChange({ ...values, targetSets: event.target.value })}
          placeholder="4"
        />
        <Input
          label="Target reps"
          name="targetReps"
          type="number"
          min="1"
          value={values.targetReps}
          onChange={(event) => onChange({ ...values, targetReps: event.target.value })}
          placeholder="10"
        />
        <Input
          label="Target weight (optional)"
          name="targetWeight"
          type="number"
          min="0"
          step="0.5"
          value={values.targetWeight}
          onChange={(event) => onChange({ ...values, targetWeight: event.target.value })}
          placeholder="30"
        />
        <Input
          label="Rest seconds (optional)"
          name="restSeconds"
          type="number"
          min="0"
          value={values.restSeconds}
          onChange={(event) => onChange({ ...values, restSeconds: event.target.value })}
          placeholder={`${group.restSeconds}`}
          helpText="Leave blank to inherit the group rest"
        />
      </div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          Add Exercise
        </Button>
      </div>
    </form>
  );
}

AddItemForm.propTypes = {
  values: PropTypes.shape({
    exerciseId: PropTypes.string.isRequired,
    targetSets: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    targetReps: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    targetWeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    restSeconds: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    restSeconds: PropTypes.number.isRequired,
  }).isRequired,
  exercises: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export function WorkoutEditor({ workoutId }) {
  const navigate = useNavigate();
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: '',
    groupType: 'single',
    restSeconds: 120,
  });

  const [itemForm, setItemForm] = useState({
    groupId: null,
    exerciseId: '',
    targetSets: '',
    targetReps: '',
    targetWeight: '',
    restSeconds: '',
  });

  const { data: workout, isLoading, error } = useWorkoutDetail(workoutId);
  const reorderGroups = useReorderWorkoutGroups();
  const reorderItems = useReorderWorkoutItems();
  const addGroup = useAddWorkoutGroup();
  const addItem = useAddWorkoutItem();
  const startSession = useStartSession();
  const { data: exercises, isLoading: isExercisesLoading } = useExercises();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddGroupSubmit = (event) => {
    event.preventDefault();
    if (!workout) return;

    addGroup.mutate(
      {
        p_workout_id: workout.id,
        p_name: groupForm.name.trim(),
        p_group_type: groupForm.groupType,
        p_rest_seconds: groupForm.restSeconds ? Number(groupForm.restSeconds) : 0,
      },
      {
        onSuccess: () => {
          setGroupForm({ name: '', groupType: 'single', restSeconds: 120 });
          setIsAddingGroup(false);
        },
      }
    );
  };

  const handleAddItemSubmit = (event) => {
    event.preventDefault();
    if (!workout || !itemForm.groupId) return;

    const payload = {
      workoutId: workout.id,
      p_workout_group_id: itemForm.groupId,
      p_exercise_id: itemForm.exerciseId,
      p_target_sets: itemForm.targetSets ? Number(itemForm.targetSets) : null,
      p_target_reps: itemForm.targetReps ? Number(itemForm.targetReps) : null,
      p_target_weight: itemForm.targetWeight ? Number(itemForm.targetWeight) : null,
      p_rest_seconds: itemForm.restSeconds ? Number(itemForm.restSeconds) : null,
    };

    addItem.mutate(payload, {
      onSuccess: () => {
        setItemForm({
          groupId: null,
          exerciseId: '',
          targetSets: '',
          targetReps: '',
          targetWeight: '',
          restSeconds: '',
        });
      },
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || !workout) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'group' && overType === 'group') {
      const movedId = active.id.replace('group-', '');
      const overId = over.id.replace('group-', '');
      if (movedId === overId) return;

      const groups = workout.groups;
      const activeIndex = groups.findIndex((group) => group.id === movedId);
      const overIndex = groups.findIndex((group) => group.id === overId);
      if (activeIndex === -1 || overIndex === -1) return;

      const newOrder = arrayMove(groups, activeIndex, overIndex);
      const nextGroup = newOrder[overIndex + 1];

      reorderGroups.mutate({
        p_workout_id: workout.id,
        p_moved_group_id: movedId,
        p_before_group_id: nextGroup ? nextGroup.id : null,
      });
      return;
    }

    if (activeType === 'item') {
      const movedId = active.id.replace('item-', '');
      const sourceGroupId = active.data.current?.groupId;

      let targetGroupId = null;
      if (overType === 'item') {
        targetGroupId = over.data.current?.groupId;
      } else if (overType === 'container') {
        targetGroupId = over.data.current?.groupId;
      }

      if (!targetGroupId || !sourceGroupId) return;

      const sourceGroup = workout.groups.find((group) => group.id === sourceGroupId);
      const targetGroup = workout.groups.find((group) => group.id === targetGroupId);
      if (!sourceGroup || !targetGroup) return;

      const overItemId = overType === 'item' ? over.id.replace('item-', '') : null;

      if (sourceGroup.id === targetGroup.id) {
        const items = sourceGroup.items;
        const activeIndex = items.findIndex((item) => item.id === movedId);
        const overIndex = overItemId
          ? items.findIndex((item) => item.id === overItemId)
          : items.length - 1;

        if (activeIndex === -1 || overIndex === -1 || activeIndex === overIndex) return;

        const newOrder = arrayMove(items, activeIndex, overIndex);
        const newIndex = newOrder.findIndex((item) => item.id === movedId);
        const beforeItem = newOrder[newIndex + 1];

        reorderItems.mutate({
          workoutId: workout.id,
          p_workout_group_id: targetGroup.id,
          p_moved_item_id: movedId,
          p_before_item_id: beforeItem ? beforeItem.id : null,
        });
        return;
      }

      const targetItems = targetGroup.items.filter((item) => item.id !== movedId);
      const insertIndex = overItemId
        ? targetItems.findIndex((item) => item.id === overItemId)
        : targetItems.length;
      const validIndex = insertIndex >= 0 ? insertIndex : targetItems.length;

      const beforeItem = targetItems[validIndex] || null;

      reorderItems.mutate({
        workoutId: workout.id,
        p_workout_group_id: targetGroup.id,
        p_moved_item_id: movedId,
        p_before_item_id: beforeItem ? beforeItem.id : null,
      });
    }
  };

  const handleStartSession = () => {
    if (!workout) return;
    startSession.mutate(
      { p_workout_id: workout.id },
      {
        onSuccess: (sessionId) => {
          navigate(`/sessions/${sessionId}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Spinner center label="Loading workout" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Failed to load workout. {error.message}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-yellow-800">
          Workout not found.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
            aria-label="Go back"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{workout.name}</h1>
            {workout.description ? (
              <p className="text-sm text-gray-500">{workout.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate(`/cycles/new?workoutId=${workout.id}`)}
          >
            Start Cycle
          </Button>
          <Button onClick={handleStartSession} loading={startSession.isPending}>
            Start Session
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={workout.groups.map((group) => `group-${group.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {workout.groups.map((group) => {
              const isItemFormOpen = itemForm.groupId === group.id;
              const groupLabel = groupLetter(group.position);

              return (
                <SortableGroup key={group.id} group={group}>
                  {(setItemsRef) => (
                    <div ref={setItemsRef} className="space-y-3 px-4 py-4">
                      <SortableContext
                        id={`items-${group.id}`}
                        items={group.items.map((item) => `item-${item.id}`)}
                        strategy={verticalListSortingStrategy}
                      >
                      {group.items.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-6 text-center text-sm text-gray-500">
                          Drag exercises here or add a new one
                        </div>
                      ) : (
                        group.items.map((item, index) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            order={{ groupId: group.id, groupLabel, index }}
                          />
                        ))
                      )}
                    </SortableContext>

                      {isItemFormOpen ? (
                        exercises && exercises.length > 0 ? (
                          <AddItemForm
                            values={itemForm}
                            group={group}
                            exercises={exercises}
                            onChange={(next) => setItemForm(next)}
                            onCancel={() =>
                              setItemForm({
                                groupId: null,
                                exerciseId: '',
                                targetSets: '',
                                targetReps: '',
                                targetWeight: '',
                                restSeconds: '',
                              })
                            }
                            onSubmit={handleAddItemSubmit}
                            isSubmitting={addItem.isPending}
                          />
                        ) : (
                          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                            {isExercisesLoading
                              ? 'Loading exercises…'
                              : 'No exercises found. Add exercises in the library first.'}
                          </div>
                        )
                      ) : null}

                      {!isItemFormOpen ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            setItemForm({
                              groupId: group.id,
                              exerciseId: '',
                              targetSets: '',
                              targetReps: '',
                              targetWeight: '',
                              restSeconds: '',
                            })
                          }
                        >
                          + Add Exercise
                        </Button>
                      ) : null}
                    </div>
                  )}
                </SortableGroup>
              );
            })}
          </SortableContext>
        </DndContext>

        {isAddingGroup ? (
          <AddGroupForm
            values={groupForm}
            onChange={setGroupForm}
            onCancel={() => setIsAddingGroup(false)}
            onSubmit={handleAddGroupSubmit}
            isSubmitting={addGroup.isPending}
          />
        ) : null}

        {!isAddingGroup ? (
          <div className="mt-4">
            <Button variant="secondary" onClick={() => setIsAddingGroup(true)}>
              + Add Group
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

WorkoutEditor.propTypes = {
  workoutId: PropTypes.string.isRequired,
};
