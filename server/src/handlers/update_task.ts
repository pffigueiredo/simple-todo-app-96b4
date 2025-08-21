import { type UpdateTaskInput, type Task } from '../schema';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is updating a task's completion status in the database.
    // It should find the task by ID and update its completed field
    return Promise.resolve({
        id: input.id,
        title: "Updated task", // Placeholder - should fetch from DB
        completed: input.completed,
        created_at: new Date() // Placeholder - should preserve original date
    } as Task);
};