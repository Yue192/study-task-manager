export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

const API_URL = "";

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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "无法检查登录状态。")
    );
  }

  return response.json();
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "登录失败，请检查邮箱和密码。")
    );
  }

  return response.json();
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "注册失败，请检查填写内容。")
    );
  }

  return response.json();
}

export async function logoutUser(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "退出登录失败。")
    );
  }
}
