import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].completed).toEqual(false);
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should default completed status to false', async () => {
    const result = await createTask(testInput);

    expect(result.completed).toEqual(false);
    
    // Verify in database as well
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].completed).toEqual(false);
  });

  it('should handle different task titles', async () => {
    const inputs = [
      { title: 'Buy groceries' },
      { title: 'Complete project' },
      { title: 'Walk the dog' }
    ];

    for (const input of inputs) {
      const result = await createTask(input);
      
      expect(result.title).toEqual(input.title);
      expect(result.completed).toEqual(false);
      expect(result.id).toBeDefined();
    }

    // Verify all tasks are in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(3);
    expect(allTasks.map(task => task.title)).toEqual([
      'Buy groceries',
      'Complete project', 
      'Walk the dog'
    ]);
  });

  it('should set created_at timestamp correctly', async () => {
    const beforeCreation = new Date();
    const result = await createTask(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});