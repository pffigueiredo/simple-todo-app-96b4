import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test data
const testTaskInput: CreateTaskInput = {
  title: 'Test Task for Deletion'
};

const createTestTask = async () => {
  const result = await db.insert(tasksTable)
    .values({
      title: testTaskInput.title,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing task', async () => {
    // Create a test task first
    const createdTask = await createTestTask();
    
    const deleteInput: DeleteTaskInput = {
      id: createdTask.id
    };

    // Delete the task
    const result = await deleteTask(deleteInput);

    // Should indicate success
    expect(result.success).toBe(true);

    // Verify task was actually removed from database
    const remainingTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    const deleteInput: DeleteTaskInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteTask(deleteInput);

    // Should indicate failure
    expect(result.success).toBe(false);
  });

  it('should only delete the specified task', async () => {
    // Create multiple test tasks
    const task1 = await createTestTask();
    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Test Task',
        completed: true
      })
      .returning()
      .execute()
      .then(result => result[0]);

    const deleteInput: DeleteTaskInput = {
      id: task1.id
    };

    // Delete only the first task
    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify first task is deleted
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task1.id))
      .execute();

    expect(deletedTask).toHaveLength(0);

    // Verify second task still exists
    const remainingTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task2.id))
      .execute();

    expect(remainingTask).toHaveLength(1);
    expect(remainingTask[0].title).toEqual('Second Test Task');
    expect(remainingTask[0].completed).toBe(true);
  });

  it('should handle database constraints properly', async () => {
    // Create and then delete a task
    const createdTask = await createTestTask();
    
    const deleteInput: DeleteTaskInput = {
      id: createdTask.id
    };

    // First deletion should succeed
    const result1 = await deleteTask(deleteInput);
    expect(result1.success).toBe(true);

    // Second deletion of same ID should return false (not throw)
    const result2 = await deleteTask(deleteInput);
    expect(result2.success).toBe(false);
  });

  it('should verify task existence before and after deletion', async () => {
    // Create a task
    const createdTask = await createTestTask();

    // Verify task exists before deletion
    const beforeDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(beforeDeletion).toHaveLength(1);
    expect(beforeDeletion[0].title).toEqual(testTaskInput.title);

    // Delete the task
    const deleteResult = await deleteTask({ id: createdTask.id });
    expect(deleteResult.success).toBe(true);

    // Verify task no longer exists
    const afterDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});