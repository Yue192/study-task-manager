import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";

import HomePage from "./pages/HomePage";
import ProgressPage from "./pages/ProgressPage";
import ResourcesPage from "./pages/ResourcesPage";
import AuthPage from "./pages/AuthPage";

import type { TaskFormData } from "./TaskForm";

import type { Task } from "./types";
import {
  getTasks,
  addTask,
  deleteTask,
  updateTask,
  updateTaskCompleted,
} from "./api/tasks";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
} from "./api/auth";
import {
  addCourse,
  deleteCourse,
  getCourses,
  type Course,
} from "./api/courses";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [taskLoadError, setTaskLoadError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    async function checkCurrentUser() {
      try {
        const user = await getCurrentUser();

        if (!isCancelled) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to check current user:", error);
      } finally {
        if (!isCancelled) {
          setIsCheckingAuth(false);
        }
      }
    }

    checkCurrentUser();

    return () => {
      isCancelled = true;
    };
  }, []);

    useEffect(() => {
      if (!currentUser) {
        return;
      }

    let isCancelled = false;

    async function loadUserData() {
      try {
        setTaskLoadError("");

        const [taskData, courseData] = await Promise.all([
          getTasks(),
          getCourses(),
        ]);

        if (!isCancelled) {
          setTasks(taskData);
          setCourses(courseData);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);

        if (!isCancelled) {
          setTaskLoadError("数据加载失败，请稍后重试。");
        }
      }
    }

    loadUserData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  const projects = courses.map((course) => {
    return course.name;
  });

  async function handleToggleTask(id: number) {
    const task = tasks.find((task) => task.id === id);

    if (!task) {
      return;
    }

    const updatedTask = await updateTaskCompleted(
      id,
      !task.completed
    );

    setTasks((currentTasks) => {
      return currentTasks.map((task) => {
        if (task.id === id) {
          return updatedTask;
        }

        return task;
      });
    });
  }

    async function handleAddTaskFromModal(
    taskData: TaskFormData
  ) {
    let selectedCourse: Course | undefined;

    if (taskData.courseId) {
      selectedCourse = courses.find((course) => {
        return course.id === taskData.courseId;
      });
    } else if (taskData.newCourseName) {
      selectedCourse = await addCourse(
        taskData.newCourseName
      );

      setCourses((currentCourses) => {
        return [...currentCourses, selectedCourse!].sort(
          (courseA, courseB) => {
            return courseA.name.localeCompare(courseB.name);
          }
        );
      });
    }

    if (!selectedCourse) {
      throw new Error("请选择或创建一个分类。");
    }

    const newTask = await addTask({
      title: taskData.title,
      description: taskData.description,
      category: selectedCourse.name,
      courseId: selectedCourse.id,
      date: taskData.date,
      time: taskData.time,
      duration: taskData.duration,
    });

    setTasks((currentTasks) => {
      return [...currentTasks, newTask];
    });
  }

  async function handleEditTask(
    id: number,
    taskData: TaskFormData
  ) {
    let selectedCourse: Course | undefined;

    if (taskData.courseId) {
      selectedCourse = courses.find((course) => {
        return course.id === taskData.courseId;
      });
    } else if (taskData.newCourseName) {
      selectedCourse = await addCourse(
        taskData.newCourseName
      );

      setCourses((currentCourses) => {
        return [...currentCourses, selectedCourse!].sort(
          (courseA, courseB) => {
            return courseA.name.localeCompare(
              courseB.name
            );
          }
        );
      });
    }

    if (!selectedCourse) {
      throw new Error("请选择或创建一个分类。");
    }

    const editedTask = await updateTask(id, {
      title: taskData.title,
      description: taskData.description,
      courseId: selectedCourse.id,
      date: taskData.date,
      time: taskData.time,
      duration: taskData.duration,
    });

    setTasks((currentTasks) => {
      return currentTasks.map((task) => {
        if (task.id === id) {
          return editedTask;
        }

        return task;
      });
    });
  }

  async function handleDeleteTask(id: number) {
    await deleteTask(id);

    setTasks((currentTasks) => {
      return currentTasks.filter((task) => task.id !== id);
    });
  }

  async function handleAddProject(projectName: string) {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      return;
    }

    const newCourse = await addCourse(trimmedName);

    setCourses((currentCourses) => {
      return [...currentCourses, newCourse].sort((courseA, courseB) => {
        return courseA.name.localeCompare(courseB.name);
      });
    });
  }

  async function handleDeleteCourse(courseId: number) {
    await deleteCourse(courseId);

    setCourses((currentCourses) => {
      return currentCourses.filter((course) => {
        return course.id !== courseId;
      });
    });
  }

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  function handleToggleTheme() {
    setTheme((currentTheme) => {
      return currentTheme === "light"
        ? "dark"
        : "light";
    });
  }

  async function handleLogin(email: string, password: string) {
    const user = await loginUser(email, password);
    setCurrentUser(user);
  }

  async function handleRegister(
    name: string,
    email: string,
    password: string
  ) {
    await registerUser(name, email, password);

    const user = await loginUser(email, password);
    setCurrentUser(user);
  }

  async function handleLogout() {
    try {
      await logoutUser();

      setCurrentUser(null);
      setTasks([]);
      setCourses([]);
      setTaskLoadError("");
    } catch (error) {
      console.error("Failed to log out:", error);
      setTaskLoadError("退出登录失败，请稍后重试。");
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="app" data-theme={theme}>
        <div className="auth-loading" role="status">
          正在检查登录状态…
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="app" data-theme={theme}>
        <AuthPage
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </main>
    );
  }

  return (
    <main className="app" data-theme={theme}>
      <div className="session-toolbar">
        <span className="session-user">{currentUser.name}</span>
        <button type="button" onClick={handleLogout}>
          退出登录
        </button>
      </div>

      {taskLoadError && (
        <p className="task-load-error" role="alert">
          {taskLoadError}
        </p>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              tasks={tasks}
              courses={courses}
              projects={projects}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onAddProject={handleAddProject}
              onAddTask={handleAddTaskFromModal}
              onEditTask={handleEditTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onDeleteCourse={handleDeleteCourse}
            />
          }
        />

        <Route
          path="/progress"
          element={
            <ProgressPage
              tasks={tasks}
              projects={projects}
            />
          }
        />
        <Route path="/resources" element={<ResourcesPage />} />
      </Routes>
    </main>
  );
}

export default App;
