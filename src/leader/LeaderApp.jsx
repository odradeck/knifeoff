import { useEffect, useState } from "react";
import { EMP, LEADER } from "../data.js";
import { fmtStamp } from "../generate.js";
import { confettiBurst, toast } from "../ui.js";
import DocView from "../components/DocView.jsx";
import RunawayButton from "./RunawayButton.jsx";
import MathModal from "./MathModal.jsx";

function statusKo(s) { return s === "approved" ? "승인됨" : s === "rejected" ? "반려됨" : "대기중"; }

export default function LeaderApp({ docs, onUpdate, selectedId, onSelect }) {
  const [tab, setTab] = useState("pending");
  const [stamped, setStamped] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);

  const selected = selectedId ? docs.find((d) => d.id === selectedId) : null;

  useEffect(() => { setStamped(false); setMathOpen(false); }, [selectedId]);

  function approve(doc) {
    setMathOpen(false);
    setStamped(true);
    confettiBurst();
    toast(doc.type === "leave"
      ? "결재 승인! 나칼퇴 사원이 칼같이 퇴근합니다 🏃💨"
      : "결재 승인! 나칼퇴 사원이 재충전하러 갑니다 🌴", true);
    onUpdate(doc.id, { status: "approved", decidedAt: Date.now() });
    setTimeout(() => setStamped(false), 1900);
  }

  /* ---------- 상세 ---------- */
  if (selected) {
    const doc = selected;
    const decided = doc.status !== "pending";
    return (
      <div className="container">
        <div className="leader-head">
          <button className="btn btn-ghost" onClick={() => onSelect(null)}>← 결재함</button>
          <span className={"chip-type " + doc.cls}>{doc.emoji} {doc.typeKo} 기안 · {statusKo(doc.status)}</span>
        </div>

        <DocView doc={doc} stamped={stamped} />

        {decided ? (
          <div className={"decided-note " + (doc.status === "approved" ? "ok" : "")}>
            {doc.status === "approved" ? "✅ 이미 승인 처리된 결재입니다." : "🚫 (놀랍게도) 반려된 결재입니다."}
            {" · "}{fmtStamp(doc.decidedAt)}
          </div>
        ) : (
          <div className="decide-bar">
            {doc.type === "annual"
              ? <RunawayButton />
              : <button className="btn btn-reject" onClick={() => setMathOpen(true)}>✋ 거절</button>}
            <button className="btn btn-approve" onClick={() => approve(doc)}>✅ 승인</button>
          </div>
        )}

        {mathOpen && (
          <MathModal onApprove={() => approve(doc)} onClose={() => setMathOpen(false)} />
        )}
      </div>
    );
  }

  /* ---------- 결재함 ---------- */
  const pending = docs.filter((d) => d.status === "pending");
  const done = docs.filter((d) => d.status !== "pending");
  const list = tab === "pending" ? pending : done;

  return (
    <div className="container">
      <div className="leader-head">
        <div>
          <div className="eyebrow">팀장 · 결재함</div>
          <h1 className="title">{LEADER.name} {LEADER.rank}님의 결재 대기열</h1>
          <p className="sub">클릭해서 내용을 확인하세요. 승인은 자유롭게, 거절은… 한번 해보세요.</p>
        </div>
        <div className="tabs">
          <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>대기중 <span className="cnt">{pending.length}</span></button>
          <button className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>처리완료 <span className="cnt">{done.length}</span></button>
        </div>
      </div>

      <div className="inbox">
        {list.length === 0 ? (
          <div className="empty">
            <div className="e">{tab === "pending" ? "🍃" : "🗂️"}</div>
            <p>{tab === "pending" ? "대기중인 결재가 없습니다.\n직원 뷰에서 기안을 상신해보세요." : "아직 처리한 결재가 없습니다."}</p>
          </div>
        ) : list.map((x) => (
          <button key={x.id} className={"doc-row " + x.cls} onClick={() => onSelect(x.id)}>
            <span className="ic">{x.emoji}</span>
            <span className="meta">
              <span className="t">{x.docTitle}</span>
              <span className="s">{EMP.name} {EMP.rank} · {x.when} · 상신 {fmtStamp(x.createdAt)}</span>
            </span>
            <span className={"badge " + x.status + (x.status === "pending" ? " blink" : "")}>{statusKo(x.status)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
