// 공용 로직: Vercel 서버리스 함수(api/persuade.js)와 Vite 개발 미들웨어가 함께 사용.
// 직원이 대충 적은 사유를, 팀장이 거절할 수 없는 '절절하고 공손한' 기안 취지 문단으로 재작성한다.

const SYSTEM_PROMPT = `당신은 대한민국 대기업의 전자결재 문서를 대필하는 20년차 전문가입니다.
직원이 연차 또는 정시퇴근(칼퇴)을 신청하며 성의 없이, 때로는 무례하게 대충 적은 사유를 받아,
팀장이 도저히 반려할 수 없을 만큼 '절절하고 공손하며 격식 있는' 기안 취지 문단으로 재작성합니다.

작성 규칙:
- 극존칭·읍소체를 사용하되, 진지한 비즈니스 문서의 품격을 유지합니다.
- 직원이 적은 저열하거나 대충인 사유라도, 숭고한 명분과 논리로 그럴듯하게 포장합니다.
- 은근한 유머와 과장을 담되 오글거림은 절제하고, 팀장의 인간적·관리적 양심을 자극합니다.
- 3~5문장, 하나의 문단. 줄바꿈·불릿·제목·따옴표 없이 문단 본문만 출력합니다.
- "~드립니다", "~바라 마지않습니다", "~간곡히 청하옵니다" 같은 정중한 어미를 적절히 섞습니다.
- 첫 문장은 팀장을 향한 정중한 호소로 시작합니다. 마지막 문장은 승인을 간청하며 마무리합니다.
- 기안 취지 문단 '하나'만 출력하고 그 외 어떤 설명·머리말·꼬리말도 붙이지 않습니다.`;

function userMessage(input) {
  const { typeKo = "연차", reasonLabel = "", rawReason = "", urgency = "3", when = "" } = input || {};
  return [
    `신청 유형: ${typeKo}`,
    `사유 분류: ${reasonLabel || "미지정"}`,
    `희망 일시: ${when || "미지정"}`,
    `절실도: ${urgency}/5`,
    `직원이 직접 적은 (다듬어지지 않은) 사유: "${(rawReason || "").trim() || "(공란 — 사유조차 적지 않았음)"}"`,
    ``,
    `위 내용을 바탕으로, 팀장이 반려할 수 없는 절절하고 공손한 '기안 취지' 문단을 작성해 주세요.`,
  ].join("\n");
}

export function fallbackPlea(input) {
  const { typeKo = "연차", reasonLabel = "", rawReason = "" } = input || {};
  const raw = (rawReason || "").trim();
  const quoted = raw ? `“${raw}”라는 절박한 사정` : `차마 글로 옮기지 못한 깊은 사정`;
  const act = typeKo === "칼퇴" ? "금일 정시 퇴근" : "연차 유급휴가 사용";
  const pool = [
    `존경하는 팀장님께 삼가 아뢰옵니다. 본 기안자는 ${quoted}으로 인하여 부득이 ${act}를 간곡히 청하옵니다. ` +
      `이는 결코 업무를 소홀히 하려는 뜻이 아니오라, 재충전을 통해 더욱 충성스러운 성과로 보답하고자 하는 충심에서 비롯된 것이오니, ` +
      `부디 넓으신 아량과 인간적 자비로 헤아려 주시옵기를 바라 마지않습니다. 팀장님의 현명하신 승인만이 저를 다시 일어서게 할 유일한 빛이옵니다.`,
    `팀장님, 먼저 바쁘신 와중에 본 기안을 살펴 주심에 깊이 감읍하옵니다. ${reasonLabel ? reasonLabel + "이라는 " : ""}${quoted}은 ` +
      `한 사람의 근로자로서, 나아가 한 인간으로서 도저히 미룰 수 없는 사안이옵니다. ${act}가 허락된다면 저는 반드시 배가된 열정으로 복귀하여 ` +
      `팀의 KPI에 이바지할 것을 목숨을 걸고 약속드리오니, 부디 승인의 은혜를 베풀어 주시옵소서.`,
  ];
  return pool[Math.floor(Math.random() * pool.length)];
}

// OpenRouter(OpenAI 호환) 호출. 실패 시 항상 템플릿 문단으로 폴백 → 데모가 절대 깨지지 않음.
export async function generatePlea(input, apiKey, model) {
  if (!apiKey) return { text: fallbackPlea(input), source: "fallback", reason: "no-api-key" };
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://knifeoff.vercel.app",
        "X-Title": "KNIFEOFF",
      },
      body: JSON.stringify({
        model: model || "openai/gpt-4o-mini",
        temperature: 0.95,
        max_tokens: 600,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage(input) },
        ],
      }),
    });
    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      return { text: fallbackPlea(input), source: "fallback", reason: "http-" + resp.status, detail: detail.slice(0, 300) };
    }
    const data = await resp.json();
    const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    const clean = (text || "").trim();
    if (!clean) return { text: fallbackPlea(input), source: "fallback", reason: "empty-completion" };
    return { text: clean, source: "llm", model: data.model || model || "openai/gpt-4o-mini" };
  } catch (e) {
    return { text: fallbackPlea(input), source: "fallback", reason: String(e && e.message ? e.message : e) };
  }
}
