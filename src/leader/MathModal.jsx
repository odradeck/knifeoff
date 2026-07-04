import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { MATH_PROBLEMS, WRONG } from "../data.js";
import { toast } from "../ui.js";

// 칼퇴 거절용 '풀 수 없는 수학문제'. 어떤 답도 오답 처리되며, 유일한 탈출구는 '포기하고 승인'.
export default function MathModal({ onApprove, onClose }) {
  const problem = useMemo(() => MATH_PROBLEMS[Math.floor(Math.random() * MATH_PROBLEMS.length)], []);
  const problemHtml = useMemo(
    () => katex.renderToString(problem, { displayMode: true, throwOnError: false, output: "html" }),
    [problem]
  );
  const [attempts, setAttempts] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current && inputRef.current.focus();
    const started = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(iv);
  }, []);

  function submit() {
    const v = inputRef.current;
    if (!v || !v.value.trim()) { v && v.focus(); return; }
    const next = attempts + 1;
    setAttempts(next);
    setVerdict(WRONG[Math.min(next - 1, WRONG.length - 1)]);
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    v.value = ""; v.focus();
    if (next === 4) toast("힌트: 이 문제는 풀 수 없습니다 🤫");
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (shake ? " shake" : "")} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-kick">거절 자격 검증 · KNIFEOFF 반려 시험</div>
          <h3>🧮 아래 문제를 풀면 거절할 수 있습니다</h3>
        </div>
        <div className="m-body">
          <div className="exam" dangerouslySetInnerHTML={{ __html: problemHtml }} />
          <div className="exam-meta">
            <span>고민한 시간: <b>{mm}:{ss}</b></span>
            <span>시도 <b>{attempts}</b>회 · 거절 확률 <b className="red">0%</b></span>
          </div>
          <div className="answer">
            <input ref={inputRef} type="text" placeholder="정답을 입력하세요" autoComplete="off"
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            <button className="btn btn-primary" onClick={submit}>제출</button>
          </div>
          <div className="verdict wrong">{verdict || " "}</div>
        </div>
        <div className="m-foot">
          <button className="btn btn-ghost" onClick={onApprove}>😮‍💨 포기하고 승인하기</button>
          <button className={"btn btn-approve" + (attempts >= 3 ? " mega" : "")} onClick={onApprove}>✅ 그냥 승인</button>
        </div>
      </div>
    </div>
  );
}
