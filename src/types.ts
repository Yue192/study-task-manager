export type Task = {
  id: number;
  title: string;
  description: string;
  category: string;
  courseId?: number;
  date: string;
  time: string;
  duration: number;
  completed: boolean;
};