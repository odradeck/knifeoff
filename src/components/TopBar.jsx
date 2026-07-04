import { EMP, LEADER } from "../data.js";

export default function TopBar({ role, pendingCount, onHome, onSwitch, onReset }) {
  const who = role === "leader" ? LEADER : EMP;
  return (
    <div className="topbar">
      <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onHome(); }}>
        <span className="logo">🔪</span>
        <span>
          <span className="name">빼박<b>결재</b><span className="tm">™</span></span>
          <span className="tag">KNIFEOFF · 거절 불가 전자결재</span>
        </span>
      </a>
      <span className="spacer" />
      {role === "leader" && pendingCount > 0 && (
        <span className="whoami"><span className="dot" style={{ background: "#ef4444" }} />대기 <b>{pendingCount}</b>건</span>
      )}
      <span className="whoami"><span className="dot" />{who.emoji} <b>{who.name}</b> {who.rank}</span>
      <button className="pill-btn" onClick={onSwitch}>역할 전환</button>
      <button className="pill-btn danger" onClick={onReset}>초기화</button>
    </div>
  );
}
