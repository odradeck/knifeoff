import { useEffect, useState } from "react";
import { LEADER } from "../data.js";
import { fmtStamp } from "../generate.js";
import { confettiBurst, toast } from "../ui.js";
import DocView from "../components/DocView.jsx";
import RunawayButton from "./RunawayButton.jsx";
import CaptchaModal from "./CaptchaModal.jsx";
import MathModal from "./MathModal.jsx";

function statusKo(s) {
  return s === "approved" ? "승인" : s === "rejected" ? "반려" : "대기중";
}

function employeeOf(doc) {
  return doc.employee || { name: "팀원", rank: "", team: doc.teamName || "" };
}

export default function LeaderApp({ docs, user, onUpdate, selectedId, onSelect }) {
  const [tab, setTab] = useState("pending");
  const [stamped, setStamped] = useState(false);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [mathOpen, setMathOpen] = useState(false);

  const selected = selectedId ? docs.find((d) => d.id === selectedId) : null;
  const leader = user || LEADER;

  useEffect(() => { setStamped(false); setCaptchaOpen(false); setMathOpen(false); }, [selectedId]);

  function approve(doc) {
    const employee = employeeOf(doc);
    setMathOpen(false);
    setStamped(true);
    confettiBurst();
    toast(doc.type === "leave"
      ? `결재 승인! ${employee.name}님이 칼퇴합니다.`
      : `결재 승인! ${employee.name}님이 쉬러 갑니다.`, true);
    onUpdate(doc.id, { status: "approved", decidedAt: Date.now() });
    setTimeout(() => setStamped(false), 1900);
  }

  if (selected) {
    const doc = selected;
    const decided = doc.status !== "pending";
    return (
      <div className="container">
        <div className="leader-head">
          <button className="btn btn-ghost" onClick={() => onSelect(null)}>결재함</button>
          <span className={"chip-type " + doc.cls}>{doc.emoji} {doc.typeKo} 기안 · {statusKo(doc.status)}</span>
        </div>

        <DocView doc={doc} stamped={stamped} viewer={user} />

        {decided ? (
          <div className={"decided-note " + (doc.status === "approved" ? "ok" : "")}>
            <span>
              {doc.status === "approved" ? "이미 승인 처리된 결재입니다." : "반려 처리된 결재입니다."}
              {" · "}{fmtStamp(doc.decidedAt)}
            </span>
            <button className="btn btn-primary" onClick={() => onSelect(null)}>기안 목록으로</button>
          </div>
        ) : (
          <div className="decide-bar">
            {doc.type === "annual"
              ? <RunawayButton />
              : <button className="btn btn-reject" onClick={() => setCaptchaOpen(true)}>거절</button>}
            <button className="btn btn-approve" onClick={() => approve(doc)}>승인</button>
          </div>
        )}

        {captchaOpen && (
          <CaptchaModal
            onVerified={() => { setCaptchaOpen(false); setMathOpen(true); }}
            onClose={() => setCaptchaOpen(false)}
          />
        )}
        {mathOpen && (
          <MathModal onApprove={() => approve(doc)} onClose={() => setMathOpen(false)} />
        )}
      </div>
    );
  }

  const pending = docs.filter((d) => d.status === "pending");
  const done = docs.filter((d) => d.status !== "pending");
  const list = tab === "pending" ? pending : done;

  return (
    <div className="container">
      <div className="leader-head">
        <div>
          <div className="eyebrow">팀장 · 결재함</div>
          <h1 className="title">{leader.name} {leader.rank}님의 결재 대기열</h1>
          <p className="sub">같은 팀 코드로 들어온 팀원 기안을 확인합니다. 새 기안은 몇 초 안에 자동으로 반영됩니다.</p>
        </div>
        <div className="tabs">
          <button className={tab === "pending" ? "on" : ""} onClick={() => setTab("pending")}>대기중 <span className="cnt">{pending.length}</span></button>
          <button className={tab === "done" ? "on" : ""} onClick={() => setTab("done")}>처리완료 <span className="cnt">{done.length}</span></button>
        </div>
      </div>

      <div className="inbox">
        {list.length === 0 ? (
          <div className="empty">
            <div className="e">{tab === "pending" ? "0" : "✓"}</div>
            <p>{tab === "pending" ? "대기중인 결재가 없습니다.\n팀원이 같은 팀 코드로 기안을 상신하면 여기에 표시됩니다." : "아직 처리 완료된 결재가 없습니다."}</p>
          </div>
        ) : list.map((doc) => {
          const employee = employeeOf(doc);
          return (
            <button key={doc.id} className={"doc-row " + doc.cls} onClick={() => onSelect(doc.id)}>
              <span className="ic">{doc.emoji}</span>
              <span className="meta">
                <span className="t">{doc.docTitle}</span>
                <span className="s">{employee.name} {employee.rank} · {employee.team || doc.teamName || "팀"} · {doc.when} · 상신 {fmtStamp(doc.createdAt)}</span>
              </span>
              <span className={"badge " + doc.status + (doc.status === "pending" ? " blink" : "")}>{statusKo(doc.status)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
