import type { Task } from "../types";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

type ProgressPageProps = {
  tasks: Task[];
  projects: string[];
};

type CompletionStats = {
  total: number;
  completed: number;
  percentage: number;
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCompletionStats(tasks: Task[]): CompletionStats {
  const total = tasks.length;

  const completed = tasks.filter((task) => {
    return task.completed;
  }).length;

  const percentage =
    total === 0
      ? 0
      : Math.round((completed / total) * 100);

  return {
    total,
    completed,
    percentage,
  };
}

function getCurrentWeekRange() {
  const today = new Date();

  // JavaScript 中：星期日是 0，星期一是 1
  const dayOfWeek = today.getDay();

  // 将星期一作为一周的第一天
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysSinceMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: formatDate(weekStart),
    end: formatDate(weekEnd),
  };
}

function ProgressPage({
  tasks,
  projects,
}: ProgressPageProps) {
  const today = formatDate(new Date());
  const currentWeek = getCurrentWeekRange();

  const todayTasks = tasks.filter((task) => {
    return task.date === today;
  });

  const weeklyTasks = tasks.filter((task) => {
    return (
      task.date >= currentWeek.start &&
      task.date <= currentWeek.end
    );
  });

  const todayStats = getCompletionStats(todayTasks);
  const weeklyStats = getCompletionStats(weeklyTasks);

  const projectStats = projects.map((project) => {
    const projectTasks = tasks.filter((task) => {
      return (
        task.category.toLowerCase() === project.toLowerCase()
      );
    });

    return {
      name: project,
      ...getCompletionStats(projectTasks),
    };
  });

  return (
  <main className="progress-page">
    <header className="progress-page-header">
      <Link
        to="/"
        className="back-link"
        aria-label="返回首页"
      >
        ←
      </Link>
      <h1>Analytics</h1>
    </header>

    <section
      className="progress-panel overview-panel"
      aria-labelledby="task-completeness-title"
    >
      <h2 id="task-completeness-title">
        任务完成度
      </h2>

      <div className="completion-overview">
        <article className="completion-item">
          <div
            className="progress-ring"
            style={
              {
                "--progress": `${todayStats.percentage}%`,
              } as CSSProperties
              // react内部css
            }
            role="progressbar"
            aria-label="当天任务完成度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={todayStats.percentage}
          >
            <span className="progress-ring-value">
              {todayStats.percentage}%
            </span>
          </div>

          <div className="completion-text">
            <h3>当天完成度</h3>

            <p>
              已完成 {todayStats.completed} / {todayStats.total}
            </p>
          </div>
        </article>

        <article className="completion-item">
          <div
            className="progress-ring"
            style={
              {
                "--progress": `${weeklyStats.percentage}%`,
              } as CSSProperties
            }
            role="progressbar"
            aria-label="本周任务完成度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={weeklyStats.percentage}
          >
            <span className="progress-ring-value">
              {weeklyStats.percentage}%
            </span>
          </div>

          <div className="completion-text">
            <h3>本周完成度</h3>

            <p>
              已完成 {weeklyStats.completed} / {weeklyStats.total}
            </p>
          </div>
        </article>
      </div>
    </section>

    <section
      className="progress-panel projects-panel"
      aria-labelledby="project-completeness-title"
    >
      <h2 id="project-completeness-title">
        项目完成度
      </h2>

      {projectStats.length === 0 ? (
        <p className="progress-empty">
          还没有项目分类。
        </p>
      ) : (
        <div className="project-progress-list">
          {projectStats.map((project) => {
            return (
              <article
                className="project-progress-row"
                key={project.name}
              >
                <div className="project-progress-info">
                  <h3>{project.name}</h3>

                  <span>
                    {project.completed} / {project.total}
                  </span>
                </div>

                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${project.name}项目完成度`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={project.percentage}
                >
                  <div
                    className="progress-fill"
                    style={{
                      width: `${project.percentage}%`,
                    }}
                  />
                </div>

                <span className="project-progress-value">
                  {project.percentage}%
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  </main>
);
}

export default ProgressPage;