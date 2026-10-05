import type { Task } from "../types";

export async function getTasks(): Promise<Task[]> {
//   getTask()最终会返回Task[]
    const response = await fetch(
    "http://localhost:3000/tasks",
    {
      credentials: "include",
    }
  );
//   实际上是GET/tasks

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
//   状态码为200时为true

  const data: Task[] = await response.json();

  return data;
}

export async function addTask(
  taskData: Omit<Task, "id" | "completed">
): Promise<Task> {
  const response = await fetch(
    "http://localhost:3000/tasks",
    {
      method: "POST",
      // POST/task
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      // 告诉服务器下面的时json
      body: JSON.stringify({
      title: taskData.title,
      description: taskData.description,
      courseId: taskData.courseId,
      date: taskData.date,
      time: taskData.time,
      duration: taskData.duration,
      completed: false,
    }),
      // 须转化为json字符串，服务器会自动生成id
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add task");
  }

  const newTask: Task = await response.json();

  return newTask;
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(
    `http://localhost:3000/tasks/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
}

export async function updateTaskCompleted(
  id: number,
  completed: boolean
): Promise<Task> {
  const response = await fetch(
    `http://localhost:3000/tasks/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        completed,
      }),
      // 只更改完成状态
    }
  );

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  const updatedTask: Task = await response.json();

  return updatedTask;
}

export type UpdateTaskData = {
  title: string;
  description: string;
  courseId: number;
  date: string;
  time: string;
  duration: number;
};

export async function updateTask(
  id: number,
  taskData: UpdateTaskData
): Promise<Task> {
  const response = await fetch(
    `http://localhost:3000/tasks/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title: taskData.title,
        description: taskData.description,
        courseId: taskData.courseId,
        date: taskData.date,
        time: taskData.time,
        duration: taskData.duration,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to edit task");
  }

  const updatedTask: Task =
    await response.json();

  return updatedTask;
}