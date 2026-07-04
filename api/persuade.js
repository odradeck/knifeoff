// Vercel 서버리스 함수 — POST /api/persuade
// 클라이언트에서 사유를 받아 OpenRouter로 '절절한 기안 취지' 문단을 생성해 돌려준다.
// API 키는 서버 환경변수(OPENROUTER_API_KEY)에만 존재 → 브라우저에 절대 노출되지 않음.
import { generatePlea } from "./_core.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  let input = req.body;
  if (typeof input === "string") { try { input = JSON.parse(input); } catch (e) { input = {}; } }
  const result = await generatePlea(input || {}, process.env.OPENROUTER_API_KEY, process.env.OPENROUTER_MODEL);
  res.status(200).json(result);
}
