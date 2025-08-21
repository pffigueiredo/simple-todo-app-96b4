import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Task, CreateTaskInput } from '../../server/src/schema';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsLoading(true);
    try {
      const taskData: CreateTaskInput = {
        title: newTaskTitle.trim()
      };
      const newTask = await trpc.createTask.mutate(taskData);
      setTasks((prev: Task[]) => [newTask, ...prev]);
      setNewTaskTitle('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTask = async (taskId: number, completed: boolean) => {
    try {
      const updatedTask = await trpc.updateTask.mutate({
        id: taskId,
        completed
      });
      setTasks((prev: Task[]) =>
        prev.map((task: Task) =>
          task.id === taskId ? updatedTask : task
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter((task: Task) => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const filteredTasks = tasks.filter((task: Task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const completedCount = tasks.filter((task: Task) => task.completed).length;
  const activeCount = tasks.length - completedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done</p>
        </div>

        {/* Add Task Form */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Add New Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="flex gap-3">
              <Input
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTaskTitle(e.target.value)
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !newTaskTitle.trim()}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Badge variant="outline" className="px-4 py-2">
            Total: {tasks.length}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Active: {activeCount}
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            Completed: {completedCount}
          </Badge>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            onClick={() => setFilter('active')}
            size="sm"
          >
            Active
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed
          </Button>
        </div>

        {/* Tasks List */}
        <Card className="shadow-lg">
          <CardContent className="p-0">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {filter === 'completed' ? '🎉' : '📝'}
                </div>
                <p className="text-gray-500 text-lg">
                  {filter === 'completed'
                    ? 'No completed tasks yet'
                    : filter === 'active'
                    ? 'No active tasks'
                    : 'No tasks yet. Add one above!'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTasks.map((task: Task, index: number) => (
                  <div
                    key={task.id}
                    className={`p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                      task.completed ? 'bg-gray-50/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleToggleTask(task.id, !task.completed)}
                      className="flex-shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-lg ${
                          task.completed
                            ? 'line-through text-gray-500'
                            : 'text-gray-900'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {task.created_at.toLocaleDateString()}
                      </p>
                    </div>

                    {task.completed && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Done
                      </Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {tasks.length > 0 && (
          <div className="text-center mt-6">
            <p className="text-gray-500">
              {completedCount > 0 && activeCount === 0
                ? '🎉 All tasks completed! Great job!'
                : `Keep going! ${activeCount} task${
                    activeCount !== 1 ? 's' : ''
                  } remaining.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;