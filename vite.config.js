import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { generatePlea } from "./api/_core.js";

// 로컬 `npm run dev` 에서도 /api/persuade 가 동작하도록 하는 개발용 미들웨어.
// (프로덕션에서는 Vercel 서버리스 함수 api/persuade.js 가 같은 일을 합니다)
function devPersuadeApi(env) {
  return {
    name: "dev-persuade-api",
    configureServer(server) {
      server.middlewares.use("/api/persuade", (req, res, next) => {
        if (req.method !== "POST") return next();
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", async () => {
          let input = {};
          try { input = JSON.parse(body || "{}"); } catch (e) {}
          const result = await generatePlea(input, env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(result));
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), devPersuadeApi(env)],
    server: { port: 5173, strictPort: true },
  };
});
