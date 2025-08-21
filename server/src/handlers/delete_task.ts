import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task by ID
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    // Check if a task was actually deleted
    const success = result.length > 0;
    
    return { success };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};