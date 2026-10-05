export type Course = {
  id: number;
  name: string;
};

const API_URL = "http://localhost:3000";

async function getErrorMessage(
  response: Response,
  fallbackMessage: string
) {
  try {
    const data: { message?: string } = await response.json();

    return data.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function getCourses(): Promise<Course[]> {
  const response = await fetch(`${API_URL}/courses`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to get courses")
    );
  }

  const courses: Course[] = await response.json();

  return courses;
}

export async function addCourse(name: string): Promise<Course> {
  const response = await fetch(`${API_URL}/courses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      name,
    }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to create course")
    );
  }

  const newCourse: Course = await response.json();

  return newCourse;
}

export async function deleteCourse(id: number): Promise<void> {
  const response = await fetch(
    `${API_URL}/courses/${id}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Failed to delete course")
    );
  }
}