import { useState, type FormEvent } from "react";

type AuthMode = "login" | "register";

type AuthPageProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
};

function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === "login") {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "请求失败，请稍后重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <header className="auth-header">
          <p className="auth-eyebrow">TASK MANAGER</p>
          <h1>{mode === "login" ? "欢迎回来" : "创建账户"}</h1>
          <p>
            {mode === "login"
              ? "登录后继续管理你的任务。"
              : "注册后会自动登录你的新账户。"}
          </p>
        </header>

        <div className="auth-tabs" aria-label="登录或注册">
          <button
            type="button"
            className={mode === "login" ? "active" : ""}
            aria-pressed={mode === "login"}
            onClick={() => changeMode("login")}
          >
            登录
          </button>
          <button
            type="button"
            className={mode === "register" ? "active" : ""}
            aria-pressed={mode === "register"}
            onClick={() => changeMode("register")}
          >
            注册
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="auth-field">
              <span>姓名</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label className="auth-field">
            <span>邮箱</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>密码</span>
            <input
              type="password"
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={mode === "register" ? 8 : undefined}
              required
            />
          </label>

          {mode === "register" && (
            <label className="auth-field">
              <span>确认密码</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "请稍候…"
              : mode === "login"
                ? "登录"
                : "注册并登录"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default AuthPage;
