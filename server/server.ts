import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "./prisma";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import cors from "cors";
import * as argon2 from "argon2";
import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}
// 补充typescript模型，增加userId的type

const app = express();
// 创建一个server应用叫app
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
// 自动读取body里的json,转换为js对象放到req.body里

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;
const databaseUrl = process.env.DATABASE_URL;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET is missing");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing");
}

const PostgresSessionStore = connectPgSimple(session);

if (isProduction) {
  app.set("trust proxy", 1);
}

app.use(
  session({
    store: new PostgresSessionStore({
      conString: databaseUrl,
      tableName: "sessions",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
// use:每个进入服务器的request先经过以上处理：middleware
function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session.userId) {
    res.status(401).json({
      message: "Not authenticated",
    });

    return;
  }

  next();
}
// middleware，验证用户信息

type TaskForResponse = {
  id: number;
  title: string | null;
  description: string | null;
  course_id: number | null;
  date: Date | null;
  time: Date | null;
  duration: number | null;
  completed: boolean | null;
  courses?: {
    name: string;
  } | null;
};

function formatTask(task: TaskForResponse) {
  return {
    id: task.id,
    title: task.title ?? "",
    description: task.description ?? "",
    category: task.courses?.name ?? "",
    courseId: task.course_id ?? undefined,
    date: task.date
      ? task.date.toISOString().slice(0, 10)
      : "",
    time: task.time
      ? task.time.toISOString().slice(11, 16)
      : "",
    duration: task.duration ?? 0,
    completed: task.completed ?? false,
  };
}

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      return res.status(400).json({
        message: "Name and email cannot be empty",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await prisma.users.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const passwordHash = await argon2.hash(password);

    const newUser = await prisma.users.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password_hash: passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    return res.status(201).json(newUser);
  } catch (error) {
    console.error("Register failed:", error);

    return res.status(500).json({
      message: "Failed to register user",
    });
  }
});

app.get("/auth/me", async (req, res) => {
  try {
    const userId = req.session.userId;
// req自动携带cookie，用cookie里的session id查找对应session里的userid
    if (!userId) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Get current user failed:", error);

    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return res.status(400).json({
        message: "Email and password cannot be empty",
      });
    }

    const user = await prisma.users.findUnique({
      where: {
        email: cleanEmail,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordIsCorrect = await argon2.verify(
      user.password_hash,
      password
    );

    if (!passwordIsCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    req.session.userId = user.id;

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Login failed:", error);

    return res.status(500).json({
      message: "Failed to log in",
    });
  }
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((error) => {
    // 删除保存的session
    if (error) {
      console.error("Logout failed:", error);

      return res.status(500).json({
        message: "Failed to log out",
      });
    }

    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    // 删除cookie

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
});

app.get("/courses", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;

    const courses = await prisma.courses.findMany({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json(courses);
  } catch (error) {
    console.error("Get courses failed:", error);

    return res.status(500).json({
      message: "Failed to get courses",
    });
  }
});

app.post("/courses", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const name = req.body?.name;

    if (typeof name !== "string") {
      return res.status(400).json({
        message: "Course name is required",
      });
    }

    const cleanName = name.trim();

    if (!cleanName) {
      return res.status(400).json({
        message: "Course name cannot be empty",
      });
    }

    if (cleanName.length > 50) {
      return res.status(400).json({
        message: "Course name must be 50 characters or fewer",
      });
    }

    const existingCourse = await prisma.courses.findFirst({
      where: {
        user_id: userId,
        name: {
          equals: cleanName,
          mode: "insensitive",
        },
      },
    });

    if (existingCourse) {
      return res.status(409).json({
        message: "Course already exists",
      });
    }

    const newCourse = await prisma.courses.create({
      data: {
        name: cleanName,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return res.status(201).json(newCourse);
  } catch (error) {
    console.error("Create course failed:", error);

    return res.status(500).json({
      message: "Failed to create course",
    });
  }
});

app.delete("/courses/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const courseId = Number(req.params.id);

    if (!Number.isInteger(courseId)) {
      return res.status(400).json({
        message: "Invalid course ID",
      });
    }

    const existingCourse = await prisma.courses.findFirst({
      where: {
        id: courseId,
        user_id: userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!existingCourse) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const taskCount = await prisma.tasks.count({
      where: {
        user_id: userId,
        course_id: courseId,
      },
    });

    if (taskCount > 0) {
      return res.status(409).json({
        message: "Course still has tasks",
      });
    }

    await prisma.courses.delete({
      where: {
        id: courseId,
      },
    });

    return res.status(200).json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course failed:", error);

    return res.status(500).json({
      message: "Failed to delete course",
    });
  }
});

app.get("/tasks", requireAuth, async (req, res) => {
  const userId = req.session.userId!;
  const tasks = await prisma.tasks.findMany({
    where: {
      user_id: userId,
    },
    include: {
      courses: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
// 去数据库查询所有结果，prisma版sql
  res.json(tasks.map(formatTask));
});
// 接受get请求，把tasks转为json返回
app.post("/tasks", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const courseId = Number(req.body.courseId);

    if (!Number.isInteger(courseId)) {
      return res.status(400).json({
        message: "A valid course ID is required",
      });
    }

    const course = await prisma.courses.findFirst({
      where: {
        id: courseId,
        user_id: userId,
      },
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const newTask = await prisma.tasks.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        date: new Date(`${req.body.date}T00:00:00.000Z`),
        time: new Date(`1970-01-01T${req.body.time}:00.000Z`),
        duration: Number(req.body.duration),
        completed: req.body.completed ?? false,
        user_id: userId,
        course_id: courseId,
      },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(201).json(formatTask(newTask));
  } catch (error) {
    console.error("Create task failed:", error);

    return res.status(500).json({
      message: "Failed to create task",
    });
  }
});

app.patch("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const existingTask = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    // 请求中没有 title，表示只修改完成状态
    if (req.body.title === undefined) {
      if (typeof req.body.completed !== "boolean") {
        return res.status(400).json({
          message: "Completed must be a boolean",
        });
      }

      const updatedTask = await prisma.tasks.update({
        where: {
          id: taskId,
        },
        data: {
          completed: req.body.completed,
        },
        include: {
          courses: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(200).json(formatTask(updatedTask));
    }

    // 以下是编辑完整任务
    const {
      title,
      description,
      courseId,
      date,
      time,
      duration,
    } = req.body;

    if (
      typeof title !== "string" ||
      typeof description !== "string" ||
      typeof date !== "string" ||
      typeof time !== "string"
    ) {
      return res.status(400).json({
        message: "Invalid task data",
      });
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const parsedCourseId = Number(courseId);
    const parsedDuration = Number(duration);

    if (!cleanTitle) {
      return res.status(400).json({
        message: "Title cannot be empty",
      });
    }

    if (!Number.isInteger(parsedCourseId)) {
      return res.status(400).json({
        message: "A valid course ID is required",
      });
    }

    if (
      !Number.isFinite(parsedDuration) ||
      parsedDuration < 5
    ) {
      return res.status(400).json({
        message: "Duration must be at least 5 minutes",
      });
    }

    const taskDate = new Date(
      `${date}T00:00:00.000Z`
    );

    const taskTime = new Date(
      `1970-01-01T${time}:00.000Z`
    );

    if (
      Number.isNaN(taskDate.getTime()) ||
      Number.isNaN(taskTime.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid date or time",
      });
    }

    // 确认新分类也属于当前登录用户
    const course = await prisma.courses.findFirst({
      where: {
        id: parsedCourseId,
        user_id: userId,
      },
    });

    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    const updatedTask = await prisma.tasks.update({
      where: {
        id: taskId,
      },
      data: {
        title: cleanTitle,
        description:
          cleanDescription || "暂无描述",
        course_id: parsedCourseId,
        date: taskDate,
        time: taskTime,
        duration: parsedDuration,
      },
      include: {
        courses: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json(
      formatTask(updatedTask)
    );
  } catch (error) {
    console.error("Update task failed:", error);

    return res.status(500).json({
      message: "Failed to update task",
    });
  }
});


app.delete("/tasks/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const taskId = Number(req.params.id);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const existingTask = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        user_id: userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await prisma.tasks.delete({
      where: {
        id: taskId,
      },
    });

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Delete task failed:", error);

    return res.status(500).json({
      message: "Failed to delete task",
    });
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "..", "dist");

if (process.env.NODE_ENV === "production") {
  app.use(express.static(distPath));

  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
// 启动服务器
