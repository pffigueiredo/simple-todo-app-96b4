import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task completion status to true', async () => {
    // Create a test task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the returned task has updated completion status
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Test Task');
    expect(result.completed).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update task completion status to false', async () => {
    // Create a test task that is completed
    const createdTask = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        completed: true
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: false
    };

    const result = await updateTask(updateInput);

    // Verify the returned task has updated completion status
    expect(result.id).toEqual(taskId);
    expect(result.title).toEqual('Completed Task');
    expect(result.completed).toBe(false);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist changes in the database', async () => {
    // Create a test task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: 'Task to Update',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    await updateTask(updateInput);

    // Query the database directly to verify the change was persisted
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    expect(updatedTasks[0].completed).toBe(true);
    expect(updatedTasks[0].title).toEqual('Task to Update');
  });

  it('should preserve original created_at timestamp', async () => {
    // Create a test task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: 'Time Preservation Test',
        completed: false
      })
      .returning()
      .execute();

    const originalCreatedAt = createdTask[0].created_at;
    const taskId = createdTask[0].id;

    // Wait a small amount to ensure timestamp would be different if it was updated
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const result = await updateTask(updateInput);

    // Verify the created_at timestamp wasn't changed
    expect(result.created_at).toEqual(originalCreatedAt);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent task ID
      completed: true
    };

    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/i);
  });

  it('should handle multiple updates to the same task', async () => {
    // Create a test task
    const createdTask = await db.insert(tasksTable)
      .values({
        title: 'Multi-Update Task',
        completed: false
      })
      .returning()
      .execute();

    const taskId = createdTask[0].id;

    // First update: set to completed
    const firstUpdate: UpdateTaskInput = {
      id: taskId,
      completed: true
    };

    const firstResult = await updateTask(firstUpdate);
    expect(firstResult.completed).toBe(true);

    // Second update: set back to incomplete
    const secondUpdate: UpdateTaskInput = {
      id: taskId,
      completed: false
    };

    const secondResult = await updateTask(secondUpdate);
    expect(secondResult.completed).toBe(false);
    expect(secondResult.title).toEqual('Multi-Update Task');

    // Verify final state in database
    const finalTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(finalTask[0].completed).toBe(false);
  });
});