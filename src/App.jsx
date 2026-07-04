import { useState } from "react";
import TopBar from "./components/TopBar.jsx";
import Login from "./components/Login.jsx";
import EmployeeApp from "./employee/EmployeeApp.jsx";
import LeaderApp from "./leader/LeaderApp.jsx";
import { loadDocs, addDoc, updateDoc, resetDocs } from "./store.js";
import { toast } from "./ui.js";

export default function App() {
  const [role, setRole] = useState(null);
  const [docs, setDocs] = useState(() => loadDocs());
  const [leaderSelectedId, setLeaderSelectedId] = useState(null);
  const [empKey, setEmpKey] = useState(0); // 직원 플로우 리셋용

  const pendingCount = docs.filter((d) => d.status === "pending").length;

  function pickRole(r) {
    setRole(r);
    setLeaderSelectedId(null);
    if (r === "employee") setEmpKey((k) => k + 1);
  }

  function onHome() {
    if (role === "leader") setLeaderSelectedId(null);
    else if (role === "employee") setEmpKey((k) => k + 1);
  }

  function onSwitch() {
    setRole(null);
    setLeaderSelectedId(null);
  }

  function onReset() {
    if (!confirm("모든 결재 데이터를 삭제할까요?\n(데모 초기화용 · 되돌릴 수 없습니다)")) return;
    resetDocs();
    setDocs([]);
    setLeaderSelectedId(null);
    setEmpKey((k) => k + 1);
    toast("🧹 스토리지를 초기화했습니다");
  }

  function submitDoc(doc) {
    addDoc(doc);
    setDocs(loadDocs());
  }

  function updateAndSync(id, patch) {
    updateDoc(id, patch);
    setDocs(loadDocs());
  }

  function goLeaderWith(id) {
    setRole("leader");
    setLeaderSelectedId(id || null);
  }

  if (!role) return <Login onPick={pickRole} />;

  return (
    <>
      <TopBar role={role} pendingCount={pendingCount} onHome={onHome} onSwitch={onSwitch} onReset={onReset} />
      {role === "employee" ? (
        <EmployeeApp key={empKey} docs={docs} onSubmit={submitDoc} onGoLeader={goLeaderWith} />
      ) : (
        <LeaderApp docs={docs} onUpdate={updateAndSync} selectedId={leaderSelectedId} onSelect={setLeaderSelectedId} />
      )}
    </>
  );
}
