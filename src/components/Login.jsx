import { useState } from "react";
import { createMember, hasSupabaseConfig, makeLocalMember } from "../supabaseApi.js";

const initialForm = {
  name: "",
  rank: "사원",
  role: "employee",
  teamCode: "dev-2",
  teamName: "개발 2팀",
};

function roleDescription(role) {
  return role === "leader"
    ? "팀장으로 입장하면 같은 팀 코드로 올라온 기안을 결재함에서 확인합니다."
    : "팀원으로 입장하면 기안을 작성해서 팀장 화면으로 보냅니다.";
}

function roleName(role) {
  return role === "leader" ? "팀장" : "팀원";
}

export default function Login({ onPick }) {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const canSubmit = form.name.trim() && form.rank.trim() && form.teamCode.trim();

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    if (!canSubmit || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const member = hasSupabaseConfig ? await createMember(form) : makeLocalMember(form);
      onPick(member.role, member);
    } catch (err) {
      setMessage(`입장 실패: ${err.message}`);
      setBusy(false);
    }
  }

  return (
    <div className="center-hero">
      <div className="login-wrap">
        <div className="login-head">
          <div className="knife-logo knife-logo-lg" aria-hidden="true">🔪</div>
          <h1>빼박결재 <b>Demo</b><span className="tm">signup</span></h1>
          <p>이름과 팀을 입력하면 바로 데모 계정으로 입장합니다.</p>
          <div className="marquee">같은 팀 코드를 쓰면 팀원과 팀장이 같은 결재 흐름에 연결됩니다.</div>
          <div className={"login-source " + (hasSupabaseConfig ? "supabase" : "fallback")}>
            {hasSupabaseConfig ? "🟢 Supabase 연동됨 — 팀원 데이터가 서버에 저장됩니다" : "🟡 로컬 데모 모드 — Supabase 미설정, 이 브라우저에만 저장됩니다"}
          </div>
          {message && <div className="login-source error">{message}</div>}
        </div>

        <form className="signup-card" onSubmit={submit}>
          <div className="signup-tabs" role="tablist" aria-label="role">
            <button
              type="button"
              className={form.role === "employee" ? "on" : ""}
              onClick={() => setField("role", "employee")}
            >
              팀원
            </button>
            <button
              type="button"
              className={form.role === "leader" ? "on" : ""}
              onClick={() => setField("role", "leader")}
            >
              팀장
            </button>
          </div>

          <div className="signup-role-note">{roleDescription(form.role)}</div>

          <div className="signup-grid">
            <label className="field signup-field">
              <span>이름</span>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="예: 하주임" />
            </label>
            <label className="field signup-field">
              <span>직급</span>
              <input value={form.rank} onChange={(e) => setField("rank", e.target.value)} placeholder="예: 사원 / 팀장" />
            </label>
            <label className="field signup-field">
              <span>팀 코드</span>
              <input value={form.teamCode} onChange={(e) => setField("teamCode", e.target.value)} placeholder="예: dev-2" />
              <div className="hint">팀장과 팀원이 같은 코드를 쓰면 같은 팀으로 묶입니다.</div>
            </label>
            <label className="field signup-field">
              <span>팀 이름</span>
              <input value={form.teamName} onChange={(e) => setField("teamName", e.target.value)} placeholder="예: 개발 2팀" />
            </label>
          </div>

          <button className="btn btn-primary btn-lg btn-block signup-submit" disabled={!canSubmit || busy}>
            {busy ? "입장 준비 중..." : `${roleName(form.role)}으로 입장`}
          </button>
        </form>
      </div>
    </div>
  );
}
