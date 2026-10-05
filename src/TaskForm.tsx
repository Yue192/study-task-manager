import { useState } from "react";
import type { FormEventHandler } from "react";
import type { Task } from "./types";
import type { Course } from "./api/courses";

export type TaskFormData = Omit<Task, "id" | "completed"> & {
  newCourseName?: string;
};

type TaskFormProps = {
  defaultDate: string;
  courses?: Course[];
  initialTask?: Task | null;
  onAddTask: (taskData: TaskFormData) => void;
  onCancel: () => void;
};

function TaskForm({
  defaultDate,
  courses = [],
  initialTask = null,
  onAddTask,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(
    initialTask?.title ?? ""
  );

  const [description, setDescription] = useState(
    initialTask?.description ?? ""
  );

  const [selectedCourseId, setSelectedCourseId] =
    useState(
      initialTask?.courseId !== undefined
        ? String(initialTask.courseId)
        : ""
    );

  const [newCourseName, setNewCourseName] =
    useState("");

  const [taskDate, setTaskDate] = useState(
    initialTask?.date ?? defaultDate
  );

  const [time, setTime] = useState(
    initialTask?.time ?? "09:00"
  );

  const [duration, setDuration] = useState(
    String(initialTask?.duration ?? 30)
  );

  const [formError, setFormError] = useState("");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    
    const selectedCourse = courses.find((course) => {
      return course.id === Number(selectedCourseId);
    });

    const cleanNewCourseName = newCourseName.trim();

    const duplicateCourse = courses.some((course) => {
      return (
        course.name.trim().toLowerCase() ===
        cleanNewCourseName.toLowerCase()
      );
    });

    if (cleanNewCourseName && duplicateCourse) {
      setFormError(
        "这个分类已经存在，请从已有分类中选择。"
      );
      return;
    }

    if (!selectedCourse && !cleanNewCourseName) {
      setFormError("请选择或创建一个分类。");
      return;
    }

    setFormError("");

    onAddTask({
      title: title.trim(),
      description: description.trim() || "暂无描述",
      category: selectedCourse?.name ?? cleanNewCourseName,
      courseId: selectedCourse?.id,
      newCourseName: selectedCourse
        ? undefined
        : cleanNewCourseName,
      date: taskDate,
      time,
      duration: Number(duration),
    });
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label>
        任务名称
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
      </label>

      <label>
        描述
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </label>

      <label>
      选择已有分类
      <select
        value={selectedCourseId}
        onChange={(event) => {
          setSelectedCourseId(event.target.value);
          setFormError("");
        }}
        disabled={newCourseName.trim() !== ""}
        required={newCourseName.trim() === ""}
      >
        <option value="">请选择分类</option>

        {courses.map((course) => {
          return (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          );
        })}
      </select>
    </label>

    <p className="category-divider">或者创建新分类</p>

    <label>
      新分类名称
      <input
        type="text"
        value={newCourseName}
        onChange={(event) => {
          setNewCourseName(event.target.value);
          setFormError("");
        }}
        placeholder="例如：React"
        disabled={selectedCourseId !== ""}
        required={selectedCourseId === ""}
        maxLength={50}
      />
    </label>

      <label>
        日期
        <input
          type="date"
          value={taskDate}
          onChange={(event) => setTaskDate(event.target.value)}
          required
        />
      </label>

      <label>
        开始时间
        <input
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          required
        />
      </label>

      <label>
        持续时间（分钟）
        <input
          type="number"
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          min="5"
          step="5"
          required
        />
      </label>

      {formError && (
        <p className="task-form-error" role="alert">
          {formError}
        </p>
      )}

      <div className="modal-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          取消
        </button>

        <button
          type="submit"
          className="primary-button"
        >
          {initialTask ? "保存修改" : "添加任务"}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;