// 결재서 자동 생성 + LLM 기안취지 호출
import { TYPES, REASON_COPY, REASON_LABEL, EMP, WD } from "./data.js";

export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function fmtDate(iso) {
  if (!iso) return "-";
  const p = iso.split("-").map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  return p[0] + "년 " + p[1] + "월 " + p[2] + "일 (" + WD[d.getDay()] + ")";
}
export function fmtStamp(ts) {
  const d = new Date(ts);
  return (d.getMonth() + 1) + "/" + d.getDate() + " " +
    String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
}

// 개조식 근거 + 통계 + 원장 (동기 생성). 절절한 기안취지(plea)는 이후 LLM으로 채운다.
export function generateDoc(type, a) {
  const isAnnual = type === "annual";
  const T = TYPES[type];
  const heart = REASON_COPY[a.reason] || "사유는 충분합니다.";
  const docNo = "KO-" + new Date().getFullYear() + "-" + String(randInt(10000, 99999));
  const granted = 15, used = randInt(1, 4), remain = granted - used;
  const prodUp = randInt(28, 44), bugDown = randInt(41, 63), donePct = randInt(96, 100);

  let grounds, stats, ledger = null, intro, closing;
  if (isAnnual) {
    ledger = { granted, used, remain };
    intro = "본인은 아래와 같은 정당한 사유로 연차 유급휴가 사용을 신청합니다. 검토 결과 반려 사유가 발견되지 않을 것을 미리 확인하였습니다.";
    grounds = [
      { tag: "법적", cls: "law", txt: "근로기준법 제60조 — 연차 유급휴가는 근로자의 법적 권리이며, 사용 시기는 원칙적으로 근로자가 지정합니다." },
      { tag: "재무", cls: "money", txt: "잔여 연차 " + remain + "일 미사용 시 연차수당으로 정산되어 회사 비용이 증가합니다. 지금 쓰는 편이 재무적으로 이득입니다." },
      { tag: "생산성", cls: "prod", txt: "사내 추정상 휴식 후 복귀 첫날 생산성 +" + prodUp + "%p, 버그 유발률 -" + bugDown + "%. 승인은 팀 KPI 방어 행위입니다." },
      { tag: "사유", cls: "heart", txt: heart },
      { tag: "관리", cls: "morale", txt: "적절한 휴식은 번아웃과 조용한 퇴사를 예방합니다. (팀장님 인력 관리 리스크 ↓)" },
    ];
    stats = [
      { sv: "+" + prodUp + "%p", sk: "복귀 첫날 생산성" },
      { sv: "-" + bugDown + "%", sk: "번아웃 위험도" },
      { sv: "0.00%", sk: "정당한 반려 사유" },
    ];
    closing = "위와 같은 사유로 연차 유급휴가를 신청하오니 부디 인간적인 승인을 부탁드립니다. 반려 사유가 존재하지 않음을 미리 알려드립니다.";
  } else {
    intro = "본인은 금일 정규 근로시간을 성실히 완수하였으며, 아래 근거에 따라 정시 퇴근(칼퇴)을 신청합니다.";
    grounds = [
      { tag: "법적", cls: "law", txt: "정규 근로시간 09:00–18:00을 성실히 완수하였음이 확인됩니다. 초과근로는 계약상 의무가 아닙니다." },
      { tag: "완수", cls: "prod", txt: "금일 배정 업무 " + donePct + "% 처리 완료. 잔여 업무는 정규 시간 내 처리 가능 범위입니다." },
      { tag: "효율", cls: "money", txt: "무의미한 잔류는 시간당 생산성을 " + randInt(18, 31) + "% 감소시킵니다. 칼퇴는 곧 효율입니다." },
      { tag: "사유", cls: "heart", txt: heart },
      { tag: "문화", cls: "morale", txt: "「저녁이 있는 삶」은 사회적 합의이며, 워라밸은 우수 인재 리텐션의 핵심 지표입니다." },
    ];
    stats = [
      { sv: donePct + "%", sk: "금일 업무 완수율" },
      { sv: "+" + randInt(22, 33) + "%", sk: "내일 아침 컨디션" },
      { sv: "0건", sk: "잔업 의무" },
    ];
    closing = "이에 금일 정시 퇴근을 신청하오니 승인하여 주시기 바랍니다. 반려 시도 시 별도의 수학 시험이 준비되어 있음을 미리 안내드립니다.";
  }

  return {
    id: "doc_" + Date.now() + "_" + randInt(100, 999),
    type, typeKo: T.ko, emoji: T.emoji, cls: T.cls, docTitle: T.title, docNo,
    when: isAnnual ? fmtDate(a.date) : (a.time + " 정시 퇴근 예정"),
    whenRaw: isAnnual ? a.date : a.time,
    reason: a.reason, reasonLabel: REASON_LABEL[a.reason] || "",
    rawReason: (a.rawReason || "").trim(), urgency: a.urgency,
    ledger, intro, grounds, stats, closing,
    plea: "", pleaSource: "",
    status: "pending", createdAt: Date.now(), decidedAt: null,
  };
}

// 요청이 통째로 실패해도 문단이 나오도록 하는 클라이언트측 최후 폴백
function clientFallbackPlea(p) {
  const raw = (p.rawReason || "").trim();
  const q = raw ? "“" + raw + "”라는 절박한 사정" : "차마 글로 옮기지 못한 깊은 사정";
  const act = p.typeKo === "칼퇴" ? "금일 정시 퇴근" : "연차 유급휴가 사용";
  return "존경하는 팀장님께 삼가 아뢰옵니다. 본 기안자는 " + q + "으로 인하여 부득이 " + act +
    "를 간곡히 청하옵니다. 결코 업무를 소홀히 하려는 뜻이 아니오라, 재충전을 통해 더욱 충성스러운 성과로 " +
    "보답하고자 하는 충심에서 비롯된 것이오니, 부디 넓으신 아량으로 승인하여 주시옵기를 바라 마지않습니다.";
}

// /api/persuade 로 절절한 기안취지 문단 요청. 실패 시 폴백.
export async function fetchPersuasion(payload) {
  try {
    const r = await fetch("/api/persuade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error("http " + r.status);
    const d = await r.json();
    if (!d || !d.text) throw new Error("empty");
    return d; // { text, source, model? }
  } catch (e) {
    return { text: clientFallbackPlea(payload), source: "fallback", reason: String(e && e.message ? e.message : e) };
  }
}
