import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all tasks', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        { title: 'First task', completed: false },
        { title: 'Second task', completed: true },
        { title: 'Third task', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Check that all tasks have required fields
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(typeof task.title).toBe('string');
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
    });

    // Check specific task data
    const titles = result.map(task => task.title);
    expect(titles).toContain('First task');
    expect(titles).toContain('Second task');
    expect(titles).toContain('Third task');
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Insert tasks with different timestamps
    const firstTask = await db.insert(tasksTable)
      .values({ title: 'First task', completed: false })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const secondTask = await db.insert(tasksTable)
      .values({ title: 'Second task', completed: true })
      .returning()
      .execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    const thirdTask = await db.insert(tasksTable)
      .values({ title: 'Third task', completed: false })
      .returning()
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);

    // Verify ordering: newest first (third, second, first)
    expect(result[0].title).toBe('Third task');
    expect(result[1].title).toBe('Second task');
    expect(result[2].title).toBe('First task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle tasks with different completion states', async () => {
    // Create tasks with mixed completion states
    await db.insert(tasksTable)
      .values([
        { title: 'Completed task', completed: true },
        { title: 'Pending task', completed: false },
        { title: 'Another completed task', completed: true }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);

    // Check that both completed and pending tasks are returned
    const completedTasks = result.filter(task => task.completed);
    const pendingTasks = result.filter(task => !task.completed);

    expect(completedTasks).toHaveLength(2);
    expect(pendingTasks).toHaveLength(1);

    // Verify specific tasks
    expect(completedTasks.map(t => t.title)).toContain('Completed task');
    expect(completedTasks.map(t => t.title)).toContain('Another completed task');
    expect(pendingTasks[0].title).toBe('Pending task');
  });

  it('should return tasks with correct data types', async () => {
    await db.insert(tasksTable)
      .values({ title: 'Type check task', completed: true })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(typeof task.id).toBe('number');
    expect(typeof task.title).toBe('string');
    expect(typeof task.completed).toBe('boolean');
    expect(task.created_at).toBeInstanceOf(Date);

    // Verify specific values
    expect(task.title).toBe('Type check task');
    expect(task.completed).toBe(true);
  });
});