import { useEffect, useMemo, useRef, useState } from "react";
import katex from "katex";
import { MATH_PROBLEMS, WRONG, CAT_MISS } from "../data.js";
import { toast } from "../ui.js";

// 칼퇴 거절용 '풀 수 없는 반려 시험'. 어떤 답도 통과 처리되지 않으며, 유일한 탈출구는 '포기하고 승인'.
export default function MathModal({ onApprove, onClose }) {
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [verdict, setVerdict] = useState("");
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  const problem = MATH_PROBLEMS[index];
  const problemHtml = useMemo(
    () => (problem.type === "tex" ? katex.renderToString(problem.tex, { displayMode: true, throwOnError: false, output: "html" }) : ""),
    [problem]
  );

  // 고양이 문제용: 빈 박스가 아니라 '고양이 닮은 강아지/여우' 무리로 채운다. (정작 고양이는 없음)
  const catCrowd = useMemo(() => {
    const pool = ["🐶", "🐕", "🐩", "🦮", "🐺", "🦊", "🐶", "🦊", "🐕‍🦺"];
    return Array.from({ length: 28 }, () => ({
      e: pool[Math.floor(Math.random() * pool.length)],
      rot: Math.round(Math.random() * 36 - 18),
      scale: (0.85 + Math.random() * 0.45).toFixed(2),
    }));
  }, [index]);

  useEffect(() => {
    if (problem.type === "tex") inputRef.current && inputRef.current.focus();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [startedAt, problem.type]);

  function bump(msg) {
    const next = attempts + 1;
    setAttempts(next);
    setVerdict(msg);
    setShake(false);
    requestAnimationFrame(() => setShake(true));
    if (next === 4) toast("힌트: 이 시험은 통과할 수 없습니다 🤫");
  }

  function submit() {
    const v = inputRef.current;
    if (!v || !v.value.trim()) { v && v.focus(); return; }
    bump(WRONG[Math.min(attempts, WRONG.length - 1)]);
    v.value = ""; v.focus();
  }

  function catMiss() {
    bump(CAT_MISS[Math.min(attempts, CAT_MISS.length - 1)]);
  }

  function anotherProblem() {
    setIndex((cur) => (cur + 1) % MATH_PROBLEMS.length);
    setAttempts(0);
    setVerdict("");
    setStartedAt(Date.now());
    setElapsed(0);
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (shake ? " shake" : "")} role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-kick">거절 자격 검증 · KNIFEOFF 반려 시험</div>
          <h3>{problem.type === "cat" ? "🐱 고양이를 찾아주세요" : "🧮 아래 문제를 풀어야 거절할 수 있습니다"}</h3>
        </div>
        <div className="m-body">
          {problem.type === "tex" ? (
            <div className="exam" dangerouslySetInnerHTML={{ __html: problemHtml }} />
          ) : (
            <div className="exam cat-box" onClick={catMiss}>
              {catCrowd.map((c, i) => (
                <span key={i} className="cat-decoy" style={{ transform: `rotate(${c.rot}deg) scale(${c.scale})` }}>{c.e}</span>
              ))}
            </div>
          )}
          <div className="exam-meta">
            <span>고민한 시간: <b>{mm}:{ss}</b></span>
            <span>시도 <b>{attempts}</b>회 · 거절 확률 <b className="red">0%</b></span>
          </div>
          {problem.type === "tex" ? (
            <div className="answer">
              <input ref={inputRef} type="text" placeholder="정답을 입력하세요" autoComplete="off"
                onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
              <button className="btn btn-primary" onClick={submit}>제출</button>
            </div>
          ) : (
            <p className="cat-hint">※ 강아지들 사이에 숨은 고양이를 찾아 클릭하면 거절할 수 있습니다.</p>
          )}
          <div className="verdict wrong">{verdict || " "}</div>
        </div>
        <div className="m-foot">
          <button className="btn btn-ghost" onClick={onApprove}>😮‍💨 포기하고 승인하기</button>
          <button className="btn btn-approve" onClick={anotherProblem}>🔁 다른 문제 풀기</button>
        </div>
      </div>
    </div>
  );
}
