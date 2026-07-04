const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

async function rest(path, options = {}) {
  if (!hasSupabaseConfig) throw new Error("Supabase env vars are missing");

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${detail || res.statusText}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function normalizeTeamId(teamCode) {
  const cleaned = (teamCode || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "demo-team";
}

function makeId(prefix) {
  const uuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return `${prefix}_${uuid}`;
}

export function makeLocalMember(form) {
  const role = form.role === "leader" ? "leader" : "employee";
  const teamId = normalizeTeamId(form.teamCode);
  return {
    id: makeId(role === "leader" ? "leader" : "emp"),
    name: form.name.trim(),
    rank: form.rank.trim(),
    role,
    team_id: teamId,
    team_name: form.teamName.trim() || form.teamCode.trim() || "Demo Team",
    emoji: role === "leader" ? "TL" : "ME",
  };
}

async function ensureTeam(member) {
  const teamId = encodeURIComponent(member.team_id);
  const existing = await rest(`teams?select=*&id=eq.${teamId}`);

  if (!existing || existing.length === 0) {
    await rest("teams", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id: member.team_id,
        name: member.team_name,
        leader_id: member.role === "leader" ? member.id : null,
      }),
    });
    return;
  }

  if (member.role === "leader") {
    await rest(`teams?id=eq.${teamId}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        name: member.team_name,
        leader_id: member.id,
      }),
    });
  }
}

export async function createMember(form) {
  const member = makeLocalMember(form);
  await ensureTeam(member);

  const rows = await rest("members", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(member),
  });

  return rows && rows[0] ? rows[0] : member;
}

function rowToDoc(row) {
  const payload = row.payload || {};
  return {
    ...payload,
    id: row.id || payload.id,
    employeeId: row.employee_id || payload.employeeId,
    leaderId: row.leader_id || payload.leaderId,
    teamId: row.team_id || payload.teamId,
    status: row.status || payload.status || "pending",
    createdAt: payload.createdAt || (row.created_at ? Date.parse(row.created_at) : Date.now()),
    decidedAt: payload.decidedAt || (row.decided_at ? Date.parse(row.decided_at) : null),
  };
}

export async function loadRemoteDocs(user) {
  if (!user || !user.team_id) return [];
  const teamId = user.team_id;
  const rows = await rest(`documents?select=*&team_id=eq.${encodeURIComponent(teamId)}&order=created_at.desc`);
  const allRows = await rest("documents?select=*&order=created_at.desc");
  const docs = [...(rows || []), ...(allRows || [])]
    .map(rowToDoc)
    .filter((doc) => doc.teamId === teamId || doc.team_id === teamId);
  return Array.from(new Map(docs.map((doc) => [doc.id, doc])).values());
}

export async function addRemoteDoc(doc) {
  const body = {
    id: doc.id,
    employee_id: doc.employeeId || null,
    leader_id: doc.leaderId || null,
    team_id: doc.teamId || null,
    payload: doc,
    status: doc.status || "pending",
    decided_at: doc.decidedAt ? new Date(doc.decidedAt).toISOString() : null,
  };

  const rows = await rest("documents", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });

  return rows && rows[0] ? rowToDoc(rows[0]) : doc;
}

export async function updateRemoteDoc(doc) {
  const body = {
    employee_id: doc.employeeId || null,
    leader_id: doc.leaderId || null,
    team_id: doc.teamId || null,
    payload: doc,
    status: doc.status || "pending",
    decided_at: doc.decidedAt ? new Date(doc.decidedAt).toISOString() : null,
  };

  const rows = await rest(`documents?id=eq.${encodeURIComponent(doc.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });

  return rows && rows[0] ? rowToDoc(rows[0]) : doc;
}

export async function resetRemoteDocs(user) {
  if (!user || !user.team_id) return null;
  return rest(`documents?team_id=eq.${encodeURIComponent(user.team_id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
