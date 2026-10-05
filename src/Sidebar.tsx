import { useRef, useState } from "react";
import type { FormEventHandler, MouseEvent } from "react";
import type { Task } from "./types";
import type { Course } from "./api/courses";

type SidebarProps = {
  tasks: Task[];
  courses: Course[];
  onAddProject: (projectName: string) => Promise<void>;
  onDeleteCourse: (courseId: number) => Promise<void>;
  onClose: () => void;
};

function Sidebar({
  tasks,
  courses,
  onAddProject,
  onDeleteCourse,
  onClose,
}: SidebarProps) {
  const [projectName, setProjectName] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set()
  );
  const visibleDeleteRow = useRef<HTMLDivElement | null>(null);

  const handleSubmit: FormEventHandler<HTMLFormElement> = 
    async (event) => {
    event.preventDefault();

    const trimmedName = projectName.trim();

    if (trimmedName === "") {
      return;
    }

    await onAddProject(trimmedName);

    setExpandedProjects((currentProjects) => {
      const updatedProjects = new Set(currentProjects);
      updatedProjects.add(trimmedName);
      return updatedProjects;
    });

    setProjectName("");
  };

  function toggleProject(project: string) {
    setExpandedProjects((currentProjects) => {
      const updatedProjects = new Set(currentProjects);

      if (updatedProjects.has(project)) {
        updatedProjects.delete(project);
      } else {
        updatedProjects.add(project);
      }

      return updatedProjects;
    });
  }

  function handleCourseContextMenu(
    event: MouseEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    const currentRow = event.currentTarget;

    if (visibleDeleteRow.current === currentRow) {
      currentRow.scrollTo({ left: 0, behavior: "smooth" });
      visibleDeleteRow.current = null;
      return;
    }

    visibleDeleteRow.current?.scrollTo({
      left: 0,
      behavior: "smooth",
    });

    currentRow.scrollTo({
      left: currentRow.scrollWidth,
      behavior: "smooth",
    });

    visibleDeleteRow.current = currentRow;
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>项目分类</h2>

        <button type="button" onClick={onClose}>
          ×
        </button>
      </div>

      <form className="project-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          placeholder="添加新分类"
          aria-label="项目分类名称"
        />

        <button type="submit">添加</button>
      </form>

      <div className="project-list">
        {courses.length === 0 ? (
          <p>还没有项目分类。</p>
        ) : (
          courses.map((course) => {
            const project = course.name;
            const isExpanded = expandedProjects.has(project);

            const projectTasks = tasks.filter((task) => {
              return (
                task.category.toLowerCase() === project.toLowerCase()
              );
            });

            return (
              <section className="project-group" key={course.id}>
                <div
                  className="project-swipe-row"
                  onContextMenu={handleCourseContextMenu}
                >
                  <button
                    type="button"
                    className="project-toggle"
                    onClick={() => toggleProject(project)}
                    aria-expanded={isExpanded}
                  >
                    <span>{isExpanded ? "⌄" : "›"}</span>

                    <span>{project}</span>

                    <span className="project-count">
                      {projectTasks.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="project-delete-button"
                    disabled={projectTasks.length > 0}
                    onClick={async () => {
                      await onDeleteCourse(course.id);
                      visibleDeleteRow.current = null;
                    }}
                    aria-label={
                      projectTasks.length > 0
                        ? `${project}中还有任务，无法删除`
                        : `删除分类${project}`
                    }
                  >
                    {projectTasks.length > 0 ? "有任务" : "删除"}
                  </button>
                </div>

                {isExpanded && (
                  <div className="project-tasks">
                    {projectTasks.length === 0 ? (
                      <p>这个分类还没有任务。</p>
                    ) : (
                      <ul>
                        {projectTasks.map((task) => {
                          return (
                            <li
                              key={task.id}
                              className={
                                task.completed
                                  ? "sidebar-task completed"
                                  : "sidebar-task"
                              }
                            >
                              <span>
                                {task.completed ? "✓" : "○"}
                              </span>

                              <span className="sidebar-task-datetime">
                                <time
                                  className="sidebar-task-date"
                                  dateTime={task.date}
                                >
                                  {task.date}
                                </time>

                                <time
                                  className="sidebar-task-time"
                                  dateTime={`${task.date}T${task.time}`}
                                >
                                  {task.time}
                                </time>
                              </span>

                              <span className="sidebar-task-title">
                                {task.title}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
