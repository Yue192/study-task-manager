import type { Task } from "./types";
type TaskCardProps = {
  task:Task;
  index: number;
  onToggle: (id: number) => void;
  // a function which returns void
  // 等于handleToggleTask函数
  onDelete: (id: number) => void;
  onEdit: (task: Task) => void;
};
// 定义props类型
function TaskCard({
  task,
  index,
  onToggle,
  onDelete,
  onEdit,
}: TaskCardProps) {
  return (
    <article
      className={
        task.completed
          ? "task-row completed"
          : "task-row"
      }
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <time
        className="task-time"
        dateTime={`${task.date}T${task.time}`}
      >
        {task.time}
      </time>

      <button
        type="button"
        className="task-card"
        onClick={() => onEdit(task)}
        aria-label={`编辑任务${task.title}`}
      >
        <h2 className="task-title">{task.title}</h2>

        <p className="task-category">
          {task.category}
        </p>
      </button>

      <p className="task-duration">
        {task.duration} 分钟
      </p>

      <div className="task-actions">
        <button
          type="button"
          className="task-action-button complete-button"
          onClick={() => onToggle(task.id)}
          aria-label={
            task.completed
              ? `取消完成${task.title}`
              : `完成${task.title}`
          }
        >
          {task.completed ? "✓" : "○"}
        </button>

        <button
          type="button"
          className="task-action-button delete-button"
          onClick={() => onDelete(task.id)}
          aria-label={`删除${task.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
}

export default TaskCard;