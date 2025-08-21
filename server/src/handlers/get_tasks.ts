import { type Task } from '../schema';

export const getTasks = async (): Promise<Task[]> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all tasks from the database.
    // It should return all tasks ordered by creation date (newest first)
    return Promise.resolve([
        {
            id: 1,
            title: "Example task",
            completed: false,
            created_at: new Date()
        }
    ] as Task[]);
};