import { EMP, LEADER } from "../data.js";

export default function Login({ onPick }) {
  return (
    <div className="center-hero">
      <div className="login-wrap">
        <div className="login-head">
          <div className="big-logo">🔪</div>
          <h1>빼박<b>결재</b><span className="tm">™</span></h1>
          <p>팀장이 <b>거절할 수 없는</b> 내부 결재 시스템</p>
          <div className="marquee">“상신하는 순간, 승인은 이미 정해져 있다.”</div>
        </div>
        <div className="role-grid">
          <button className="role-card emp" onClick={() => onPick("employee")}>
            <div className="corner-tag">칼퇴각</div>
            <div className="avatar">🧑‍💻</div>
            <h3>직원으로 로그인</h3>
            <div className="role-name">{EMP.name} {EMP.rank} · {EMP.team}</div>
            <div className="role-desc">연차·칼퇴 기안을 작성합니다. AI가 <b>반려 불가능한 근거</b>와 <b>절절한 읍소문</b>을 자동으로 써드립니다.</div>
            <div className="enter">기안 작성하러 가기 →</div>
          </button>
          <button className="role-card lead" onClick={() => onPick("leader")}>
            <div className="corner-tag">결재</div>
            <div className="avatar">🧑‍💼</div>
            <h3>팀장으로 로그인</h3>
            <div className="role-name">{LEADER.name} {LEADER.rank} · {LEADER.team}</div>
            <div className="role-desc">상신된 기안을 검토합니다. 승인은 자유. <b>거절은… 글쎄요.</b> 성함부터 이미 ‘승인’이십니다.</div>
            <div className="enter">결재함 열기 →</div>
          </button>
        </div>
        <div className="foot-credit">POC · <code>localStorage</code> + <code>Vercel Functions</code> · codename <code>knifeoff</code></div>
      </div>
    </div>
  );
}
