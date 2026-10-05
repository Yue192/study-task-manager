import {useEffect, useState } from "react";
import TaskCard from "../TaskCard";
import type { Task } from "../types";
import TaskForm, {
  type TaskFormData,
} from "../TaskForm";
import type { Course } from "../api/courses";
import Sidebar from "../Sidebar";
import { Link } from "react-router-dom";

type HomePageProps = {
  tasks: Task[];
  courses: Course[];
  projects: string[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onAddProject: (projectName: string) => Promise<void>;
  onDeleteCourse: (courseId: number) => Promise<void>;
  onAddTask: (taskData: TaskFormData) => Promise<void>;
  onEditTask: (id: number,taskData: TaskFormData) => Promise<void>;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
};

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function HomePage({
  tasks,
  courses,
  theme,
  onToggleTheme,
  onAddProject,
  onDeleteCourse,
  onAddTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
}: HomePageProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      setIsAddTaskOpen(false);
      setEditingTask(null);
      setIsSidebarOpen(false);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddTaskOpen, isSidebarOpen]);

  const selectedTasks = tasks
    .filter((task) => {
      return task.date === selectedDate;
    })
    .sort((taskA, taskB) => {
      return taskA.time.localeCompare(taskB.time);
    });
  
    const cleanSearchQuery =
      searchQuery.trim().toLowerCase();

    const searchResults = cleanSearchQuery
      ? tasks
          .filter((task) => {
            return (
              task.title
                .toLowerCase()
                .includes(cleanSearchQuery) ||
              task.description
                .toLowerCase()
                .includes(cleanSearchQuery) ||
              task.category
                .toLowerCase()
                .includes(cleanSearchQuery)
            );
          })
          .sort((taskA, taskB) => {
            const taskADateTime =
              `${taskA.date}T${taskA.time}`;

            const taskBDateTime =
              `${taskB.date}T${taskB.time}`;

            return taskADateTime.localeCompare(
              taskBDateTime
            );
          })
      : [];
  function changeDate(numberOfDays: number) {
    const date = new Date(`${selectedDate}T00:00:00`);

    date.setDate(date.getDate() + numberOfDays);

    setSelectedDate(formatDate(date));
  }

  function openAddTaskModal() {
    setEditingTask(null);
    setIsAddTaskOpen(true);
  }

  function openEditTaskModal(task: Task) {
    setEditingTask(task);
    setIsAddTaskOpen(true);
  }

  function closeTaskModal() {
    setIsAddTaskOpen(false);
    setEditingTask(null);
  }

  function closeSearchModal() {
    setIsSearchOpen(false);
    setSearchQuery("");
  }

  return (
    <section className="home-page">
      <header className="home-header">
        <div className="home-header-content">
          <button
            type="button"
            className="icon-button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="打开项目分类"
          >
            ☰
          </button>

          <nav className="view-navigation" aria-label="任务视图">
            <button
              type="button"
              className="view-button active"
            >
              Today
            </button>

            <button
              type="button"
              className="view-button"
              disabled
              aria-label="Weekly 功能尚未开放"
              title="Coming soon"
            >
              Weekly
            </button>

            <button
              type="button"
              className="view-button"
              disabled
              aria-label="Calendar 功能尚未开放"
              title="Coming soon"
            >
              Calendar
            </button>
          </nav>

          <div className="home-actions">
            <button
              type="button"
              className="icon-button"
              onClick={onToggleTheme}
              aria-label={
                theme === "light"
                  ? "切换到深色模式"
                  : "切换到浅色模式"
              }
            >
              {theme === "light" ? "☾" : "☀"}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={openAddTaskModal}
              aria-label="添加任务"
            >
              ＋
            </button>
            
            <button
              type="button"
              className="icon-button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="搜索任务"
            >
              🔍
            </button>

            <Link
              to="/progress"
              className="icon-button analytics-link"
              aria-label="查看学习进度"
            >
              ↗
            </Link>
          </div>
        </div>
      </header>

      <div className="home-content">
        {selectedTasks.length === 0 ? (
          <div className="empty-tasks">
            <div className="empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                ✓
              </span>

              <h2>这一天还没有任务</h2>

              <p>点击右上角的添加按钮，安排一个新任务。</p>

              <button
                type="button"
                className="empty-state-button"
                onClick={openAddTaskModal}
              >
                添加任务
              </button>
            </div>
          </div>
        ) : (
          <div className="task-timeline">
            {selectedTasks.map((task, index) => {
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  onEdit={openEditTaskModal}                  
                />
              );
            })}
          </div>
        )}
      </div>

      <footer className="date-navigation">
        <div className="date-navigation-content">
          <button
            type="button"
            className="date-button"
            onClick={() => changeDate(-1)}
            aria-label="前一天"
          >
            ←
          </button>

          <input
            type="date"
            className="selected-date selected-date-input"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
            }}
            onClick={(event) => {
              if ("showPicker" in event.currentTarget) {
                event.currentTarget.showPicker();
              }
            }}
            aria-label="选择日期"
          />

          <button
            type="button"
            className="date-button"
            onClick={() => changeDate(1)}
            aria-label="后一天"
          >
            →
          </button>
        </div>
      </footer>

      {isAddTaskOpen && (
        // 若isAddTaskOpen是true，打开弹窗，不然不打开
      <div className="modal-backdrop">
        <div 
          className="task-modal"   
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-title"
        >
          <div className="modal-header">
            <h2 id="add-task-title">
              {editingTask ? "编辑任务" : "添加任务"}
            </h2>

            <button
              type="button"
              onClick={closeTaskModal}
            >
              ×
            </button>
          </div>

           <TaskForm
            defaultDate={selectedDate}
            courses={courses}
            initialTask={editingTask}
            onAddTask={async (taskData) => {
            if (editingTask) {
              await onEditTask(
                editingTask.id,
                taskData
              );
            } else {
              await onAddTask(taskData);
            }

            closeTaskModal();
          }}
            onCancel={closeTaskModal}
          />
        </div>
      </div>
    )}
    
    {isSearchOpen && (
      <div className="modal-backdrop">
        <div
          className="task-modal search-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-task-title"
        >
          <div className="modal-header">
            <h2 id="search-task-title">
              搜索任务
            </h2>

            <button
              type="button"
              onClick={closeSearchModal}
              aria-label="关闭搜索"
            >
              ×
            </button>
          </div>

          <input
            type="search"
            className="task-search-input"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
            }}
            placeholder="搜索标题、描述或分类"
            aria-label="搜索任务"
            autoFocus
          />

          <div className="search-results">
            {!cleanSearchQuery ? (
              <p className="search-message">
                输入关键词开始搜索。
              </p>
            ) : searchResults.length === 0 ? (
              <p className="search-message">
                没有找到匹配的任务。
              </p>
            ) : (
              <ul className="search-result-list">
                {searchResults.map((task) => {
                  return (
                    <li key={task.id}>
                      <button
                        type="button"
                        className="search-result-button"
                        onClick={() => {
                          setSelectedDate(task.date);
                          closeSearchModal();
                        }}
                      >
                        <span className="search-result-title">
                          {task.title}
                        </span>

                        <span className="search-result-category">
                          {task.category}
                        </span>

                        <span className="search-result-datetime">
                          <time dateTime={task.date}>
                            {task.date}
                          </time>

                          <time
                            dateTime={`${task.date}T${task.time}`}
                          >
                            {task.time}
                          </time>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    )}

    {isSidebarOpen && (
      <>
        <button
          type="button"
          className="sidebar-backdrop"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="关闭侧边栏"
          tabIndex={-1}
        />

       <Sidebar
          tasks={tasks}
          courses={courses}
          onAddProject={onAddProject}
          onDeleteCourse={onDeleteCourse}
          onClose={() => setIsSidebarOpen(false)}
        />
      </>
    )}
    </section>
  );
}

export default HomePage;