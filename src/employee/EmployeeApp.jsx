import { useEffect, useState } from "react";
import { TYPES, REASONS, GEN_STEPS, EMP } from "../data.js";
import { generateDoc, fetchPersuasion, todayISO, fmtStamp } from "../generate.js";
import { confettiBurst } from "../ui.js";
import DocView from "../components/DocView.jsx";

const URG = [
  { v: "1", label: "그냥 쉬고파", small: "여유" },
  { v: "2", label: "좀 급함", small: "·" },
  { v: "3", label: "꽤 절실", small: "·" },
  { v: "4", label: "매우 절실", small: "·" },
  { v: "5", label: "안 되면 퇴사각", small: "⚠️" },
];

function statusKo(s) { return s === "approved" ? "승인됨" : s === "rejected" ? "반려됨" : "대기중"; }

// 생성 애니메이션 + LLM 호출을 담당. 최소 노출시간과 호출 완료를 함께 기다린 뒤 onDone.
function Generating({ type, answers, onDone }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    let alive = true;
    const started = Date.now();
    const iv = setInterval(() => setI((v) => Math.min(v + 1, GEN_STEPS.length - 1)), 460);
    const doc = generateDoc(type, answers);
    const payload = {
      type, typeKo: doc.typeKo, reasonLabel: doc.reasonLabel,
      rawReason: doc.rawReason, urgency: doc.urgency, when: doc.when,
    };
    fetchPersuasion(payload).then((res) => {
      const wait = Math.max(0, 1800 - (Date.now() - started));
      setTimeout(() => {
        if (!alive) return;
        doc.plea = res.text;
        doc.pleaSource = res.source;
        onDone(doc);
      }, wait);
    });
    return () => { alive = false; clearInterval(iv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const T = TYPES[type];
  return (
    <div className="container narrow">
      <div className="card gen-wrap">
        <div className="gen-orb" />
        <div className="core-emoji">{T.emoji}</div>
        <h2>AI가 <b>반려 불가능한</b> 결재서를 쓰는 중…</h2>
        <div className="gen-status">{GEN_STEPS[i]}</div>
        <div className="gen-bar"><i style={{ width: Math.round(((i + 1) / GEN_STEPS.length) * 100) + "%" }} /></div>
      </div>
    </div>
  );
}

export default function EmployeeApp({ docs, user, onSubmit }) {
  const [stage, setStage] = useState("home");
  const [type, setType] = useState(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ date: todayISO(1), time: "18:00", reason: "", rawReason: "", urgency: "" });
  const [doc, setDoc] = useState(null);
  const me = user || EMP;

  const set = (patch) => setAnswers((a) => ({ ...a, ...patch }));

  function startType(t) {
    setType(t); setStep(0);
    setAnswers({ date: todayISO(1), time: "18:00", reason: "", rawReason: "", urgency: "" });
    setStage("wizard");
  }

  /* ---------- 홈 ---------- */
  if (stage === "home") {
    return (
      <div className="container narrow">
        <div className="section-head">
          <div className="eyebrow">직원 · 기안 작성</div>
          <h1 className="title">{me.name}님, 오늘은 무엇을 쟁취하시겠어요?</h1>
          <p className="sub">목적을 고르면 AI가 <b>팀장님이 거절 못 할 근거</b>와 <b>절절한 읍소문</b>을 알아서 써드립니다.</p>
        </div>
        <div className="purpose-grid">
          <button className="purpose-card annual" onClick={() => startType("annual")}>
            <div className="emoji">🌴</div><h3>연차 신청</h3>
            <p>하루쯤 나를 위해. 법·재무·생산성 근거 + 읍소문 자동 첨부.</p>
            <div className="kill">거절 버튼 → 영원히 도망칩니다 🏃</div>
          </button>
          <button className="purpose-card leave" onClick={() => startType("leave")}>
            <div className="emoji">🔪</div><h3>칼퇴 신청</h3>
            <p>정시 퇴근은 권리입니다. 저녁이 있는 삶을 지금 상신.</p>
            <div className="kill">거절 버튼 → 못 푸는 수학문제 🧮</div>
          </button>
        </div>
        {docs.length > 0 && (
          <>
            <h4 style={{ margin: "30px 0 12px", fontSize: 14, color: "var(--ink-soft)" }}>📮 내 상신 내역</h4>
            <div className="inbox">
              {docs.slice(0, 4).map((x) => (
                <div key={x.id} className={"doc-row " + x.cls} style={{ padding: "12px 14px" }}>
                  <span className="ic" style={{ width: 38, height: 38, fontSize: 20 }}>{x.emoji}</span>
                  <span className="meta">
                    <span className="t" style={{ fontSize: 14 }}>{x.docTitle}</span>
                    <span className="s">{x.when} · {fmtStamp(x.createdAt)}</span>
                  </span>
                  <span className={"badge " + x.status}>{statusKo(x.status)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="foot-credit">데모 팁: 상신 후 상단 <b>역할 전환</b> → 팀장으로 로그인하면 결재함에 뜹니다.</div>
      </div>
    );
  }

  /* ---------- 위저드 ---------- */
  if (stage === "wizard") {
    const T = TYPES[type];
    const total = 4;
    const pct = Math.round((step / total) * 100);

    const canNext =
      step === 1 ? !!answers.reason :
      step === 3 ? !!answers.urgency : true;

    let body = null;
    if (step === 0 && type === "annual") {
      body = (
        <>
          <div className="q-title">🌴 언제 재충전하실 건가요?</div>
          <p className="q-help">희망 날짜를 선택하세요. (주말·공휴일도 막지 않습니다)</p>
          <div className="field"><label>연차 희망일</label>
            <input type="date" value={answers.date} min={todayISO(0)} onChange={(e) => set({ date: e.target.value })} />
            <div className="hint">고른 날짜 기준으로 요일까지 결재서에 자동 표기됩니다.</div></div>
        </>
      );
    } else if (step === 0) {
      body = (
        <>
          <div className="q-title">🔪 오늘 몇 시에 탈출하시겠어요?</div>
          <p className="q-help">희망 퇴근 시각을 선택하세요. (18:00 = 정시 = 정의)</p>
          <div className="field"><label>희망 퇴근 시각</label>
            <input type="time" value={answers.time} onChange={(e) => set({ time: e.target.value })} />
            <div className="hint">정규 근로시간(09:00–18:00) 완수가 기본 전제로 첨부됩니다.</div></div>
        </>
      );
    } else if (step === 1) {
      body = (
        <>
          <div className="q-title">가장 솔직한 사유는 무엇인가요?</div>
          <p className="q-help">고르기만 하세요. 그럴듯한 논리로 포장하는 건 AI 담당입니다.</p>
          <div className="choices">
            {REASONS[type].map((o) => (
              <button key={o.v} className={"choice" + (answers.reason === o.v ? " sel" : "")} onClick={() => set({ reason: o.v })}>
                <span className="ce">{o.e}</span>{o.label}
              </button>
            ))}
          </div>
        </>
      );
    } else if (step === 2) {
      body = (
        <>
          <div className="q-title">진짜 속마음을 적어주세요 ✍️</div>
          <p className="q-help">막 적으셔도 됩니다. 무례하고 대충 쓸수록, AI가 더 절절하고 공손하게 포장해드립니다.</p>
          <div className="field">
            <textarea value={answers.rawReason} onChange={(e) => set({ rawReason: e.target.value })}
              placeholder={type === "leave" ? "예) 그냥 집 가고싶음 ㅋㅋ 넷플 신작 정주행할거임" : "예) 걍 쉬고싶어요 번아웃 올거같음 진짜"} />
            <div className="hint">이 문장을 근거로 <b>「기안 취지」</b> 읍소문이 LLM으로 생성됩니다. (비워도 됨)</div>
          </div>
        </>
      );
    } else if (step === 3) {
      body = (
        <>
          <div className="q-title">절실도를 알려주세요</div>
          <p className="q-help">높을수록 결재서의 어조가 비장해집니다.</p>
          <div className="urgency">
            {URG.map((u) => (
              <button key={u.v} className={"choice" + (answers.urgency === u.v ? " sel" : "")} onClick={() => set({ urgency: u.v })}>
                {u.label}<small>{u.small}</small>
              </button>
            ))}
          </div>
        </>
      );
    }

    return (
      <div className="container narrow">
        <div className="wizard-top">
          <span className={"chip-type " + T.cls}>{T.emoji} {T.ko} 기안</span>
          <span className="progress"><i style={{ width: pct + "%" }} /></span>
          <span className="step-count">{step + 1} / {total}</span>
        </div>
        <div className="card q-card">
          {body}
          <div className="wizard-nav">
            <button className="btn btn-ghost" onClick={() => (step === 0 ? setStage("home") : setStep(step - 1))}>
              {step === 0 ? "← 목적 다시 고르기" : "← 이전"}
            </button>
            <button className="btn btn-primary" disabled={!canNext}
              onClick={() => (step === total - 1 ? setStage("generating") : setStep(step + 1))}>
              {step === total - 1 ? "✨ AI로 근거·읍소문 생성 →" : "다음 →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 생성 중 ---------- */
  if (stage === "generating") {
    return <Generating type={type} answers={answers} onDone={(d) => { setDoc(d); setStage("preview"); }} />;
  }

  /* ---------- 미리보기 ---------- */
  if (stage === "preview") {
    return (
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">미리보기 · 상신 전 최종 검토</div>
          <h1 className="title">이대로 상신하면 팀장님은 빼도 박도 못합니다 😎</h1>
          <p className="sub">상단 <b>「기안 취지」</b>는 방금 적으신 사유로 생성된 읍소문입니다. 마음에 안 들면 다시 생성하세요.</p>
        </div>
        <DocView doc={{
          ...doc,
          employee: user ? { id: user.id, name: user.name, rank: user.rank, team: user.team_name || user.team } : doc.employee,
          teamName: user ? (user.team_name || user.team) : doc.teamName,
        }} />
        <div className="wizard-nav" style={{ marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={() => { setStep(0); setStage("wizard"); }}>← 답변 수정</button>
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn" onClick={() => setStage("generating")}>🔄 다시 생성</button>
            <button className="btn btn-primary btn-lg" onClick={() => { onSubmit(doc); confettiBurst(); setStage("done"); }}>📤 상신하기</button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- 상신 완료 ---------- */
  return (
    <div className="container narrow">
      <div className="card" style={{ padding: "40px 34px", textAlign: "center" }}>
        <div style={{ fontSize: 60 }}>📤</div>
        <h1 className="title" style={{ marginTop: 10 }}>상신 완료!</h1>
        <p className="sub">「{doc.docTitle}」이(가) <b>{me.team_name || me.team || "같은 팀"} 팀장님</b>의 결재함으로 날아갔습니다.</p>
        <div style={{ background: "var(--brand-soft)", borderRadius: 14, padding: 16, margin: "22px 0", fontSize: 14, color: "var(--brand-ink)" }}>
          문서번호 <b>{doc.docNo}</b> · 현재 상태 <b>대기중</b><br />
          <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>이제 팀장님이 할 수 있는 건… 승인뿐입니다.</span>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => { setStage("home"); }}>📝 새 기안 작성</button>
        </div>
        <div className="foot-credit">팀장 계정으로 로그인하면 같은 팀 코드의 결재함에서 확인할 수 있습니다.</div>
      </div>
    </div>
  );
}
