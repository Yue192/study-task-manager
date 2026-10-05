import { useEffect, useState } from "react";

type Resource = {
  id: number;
  title: string;
  completed: boolean;
};

function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResources() {
      try {
        const response = await fetch(
          "https://jsonplaceholder.typicode.com/todos?_limit=5"
        );

        if (!response.ok) {
          throw new Error("请求失败");
        }

        const data = await response.json();

        setResources(data);
      } catch {
        setError("学习资源加载失败，请稍后再试。");
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  return (
    <section>
      <h1>学习资源</h1>
      <p>这里用 fetch 模拟从 API 获取学习资源。</p>

      {loading && <p>加载中...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && (
        <ul>
          {resources.map((resource) => {
            return (
              <li key={resource.id}>
                {resource.title} - {resource.completed ? "已完成" : "未完成"}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default ResourcesPage;