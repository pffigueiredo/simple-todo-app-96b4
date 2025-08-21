import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        completed: false, // Default value for new tasks
      })
      .returning()
      .execute();

    // Return the created task
    const task = result[0];
    return {
      id: task.id,
      title: task.title,
      completed: task.completed,
      created_at: task.created_at
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};