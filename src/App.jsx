import { useEffect, useState } from "react";
import TopBar from "./components/TopBar.jsx";
import Login from "./components/Login.jsx";
import EmployeeApp from "./employee/EmployeeApp.jsx";
import LeaderApp from "./leader/LeaderApp.jsx";
import { toast } from "./ui.js";
import { addRemoteDoc, hasSupabaseConfig, loadRemoteDocs, resetRemoteDocs, updateRemoteDoc } from "./supabaseApi.js";

export default function App() {
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [leaderSelectedId, setLeaderSelectedId] = useState(null);
  const [empKey, setEmpKey] = useState(0);

  const remoteEnabled = hasSupabaseConfig && currentUser && currentUser.team_id;
  const pendingCount = docs.filter((d) => d.status === "pending").length;

  async function refreshDocs(user = currentUser) {
    if (!hasSupabaseConfig || !user || !user.team_id) return;

    try {
      const remoteDocs = await loadRemoteDocs(user);
      setDocs(remoteDocs);
    } catch (err) {
      toast(`Supabase sync failed: ${err.message}`);
    }
  }

  useEffect(() => {
    if (!role || !currentUser) return;
    setDocs([]);
    refreshDocs(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, currentUser && currentUser.id]);

  useEffect(() => {
    if (role !== "leader" || !remoteEnabled) return;
    const timer = setInterval(() => refreshDocs(currentUser), 3000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, remoteEnabled, currentUser && currentUser.id]);

  function pickRole(r, user = null) {
    setRole(r);
    setCurrentUser(user);
    setLeaderSelectedId(null);
    if (r === "employee") setEmpKey((k) => k + 1);
  }

  function onHome() {
    if (role === "leader") setLeaderSelectedId(null);
    else if (role === "employee") setEmpKey((k) => k + 1);
  }

  function onSwitch() {
    setRole(null);
    setCurrentUser(null);
    setDocs([]);
    setLeaderSelectedId(null);
  }

  async function onReset() {
    if (!confirm("현재 팀의 결재 데이터를 삭제할까요?\n되돌릴 수 없습니다.")) return;
    setDocs([]);
    setLeaderSelectedId(null);
    setEmpKey((k) => k + 1);

    if (remoteEnabled) {
      try {
        await resetRemoteDocs(currentUser);
      } catch (err) {
        toast(`Supabase reset failed: ${err.message}`);
        return;
      }
    }

    toast("초기화했습니다.");
  }

  function stampDoc(doc) {
    if (!currentUser || currentUser.role !== "employee") return doc;
    return {
      ...doc,
      employeeId: currentUser.id,
      teamId: currentUser.team_id || null,
      employee: {
        id: currentUser.id,
        name: currentUser.name,
        rank: currentUser.rank,
        team: currentUser.team_name || currentUser.team,
      },
      teamName: currentUser.team_name || currentUser.team,
    };
  }

  async function submitDoc(doc) {
    const stamped = stampDoc(doc);
    setDocs((prev) => [stamped, ...prev]);

    if (!remoteEnabled) return;
    try {
      await addRemoteDoc(stamped);
      await refreshDocs(currentUser);
    } catch (err) {
      toast(`Supabase submit failed: ${err.message}`);
    }
  }

  async function updateAndSync(id, patch) {
    const current = docs.find((d) => d.id === id);
    const leaderPatch = currentUser && currentUser.role === "leader" ? {
      leaderId: currentUser.id,
      leader: {
        id: currentUser.id,
        name: currentUser.name,
        rank: currentUser.rank,
        team: currentUser.team_name || currentUser.team,
      },
    } : {};
    const next = current ? { ...current, ...leaderPatch, ...patch } : null;

    setDocs((prev) => prev.map((doc) => (doc.id === id ? { ...doc, ...leaderPatch, ...patch } : doc)));

    if (!remoteEnabled || !next) return;
    try {
      await updateRemoteDoc(next);
      await refreshDocs(currentUser);
    } catch (err) {
      toast(`Supabase update failed: ${err.message}`);
    }
  }

  if (!role) return <Login onPick={pickRole} />;

  return (
    <>
      <TopBar role={role} user={currentUser} pendingCount={pendingCount} onHome={onHome} onSwitch={onSwitch} onReset={onReset} />
      {role === "employee" ? (
        <EmployeeApp key={empKey} docs={docs} user={currentUser} onSubmit={submitDoc} />
      ) : (
        <LeaderApp docs={docs} user={currentUser} onUpdate={updateAndSync} selectedId={leaderSelectedId} onSelect={setLeaderSelectedId} />
      )}
    </>
  );
}
