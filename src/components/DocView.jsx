import { COMPANY, EMP, LEADER } from "../data.js";
import { fmtStamp } from "../generate.js";

function MiniStamp({ status }) {
  if (status === "approved") return <span className="mini-stamp">승인</span>;
  if (status === "rejected") return <span className="mini-stamp rejected">반려</span>;
  return <span className="mini-stamp pending">대기</span>;
}

function fallbackEmployee(doc) {
  return doc.employee || {
    name: EMP.name,
    rank: EMP.rank,
    team: doc.teamName || EMP.team,
  };
}

function fallbackLeader(doc, viewer) {
  if (doc.leader) return doc.leader;
  if (viewer && viewer.role === "leader") {
    return {
      name: viewer.name,
      rank: viewer.rank,
      team: viewer.team_name || viewer.team,
    };
  }
  return LEADER;
}

export default function DocView({ doc, stamped, viewer }) {
  const employee = fallbackEmployee(doc);
  const leader = fallbackLeader(doc, viewer);
  const n = doc.ledger ? 1 : 0;

  return (
    <div className="doc-outer">
      {stamped && (
        <div className="stamp-overlay">
          <div className="big-stamp">
            <div><div className="st-main">승인</div><div className="st-sub">{leader.name} {leader.rank}</div></div>
          </div>
        </div>
      )}
      <div className="doc">
        <div className="doc-strip" />
        <div className="doc-inner">
          <div className="doc-h">
            <div className="doc-kicker">{COMPANY} · 전자결재</div>
            <h2>{doc.docTitle}</h2>
          </div>
          <div className="doc-meta">
            <span>문서번호 <b>{doc.docNo}</b></span>
            <span>기안자 <b>{employee.name} {employee.rank}</b> ({employee.team || doc.teamName || "-"})</span>
            <span>{doc.ledger ? "사용일" : "퇴근시각"} <b>{doc.when}</b></span>
            <span>상신일 <b>{fmtStamp(doc.createdAt)}</b></span>
          </div>

          <table className="approval-line">
            <tbody>
              <tr>
                <td className="lbl" rowSpan={2}>결재</td>
                <td className="who">기안<br />{employee.name}</td>
                <td className="who">승인<br />{leader.name} {leader.rank}</td>
              </tr>
              <tr>
                <td className="sign"><span className="mini-stamp" style={{ transform: "rotate(-8deg)" }}>기안</span></td>
                <td className="sign"><MiniStamp status={doc.status} /></td>
              </tr>
            </tbody>
          </table>

          <div className="doc-body">
            <p>{doc.intro}</p>

            {doc.plea && (
              <div className="plea-block">
                <div className="plea-label"><span>기안 취지</span></div>
                <p className="plea">{doc.plea}</p>
              </div>
            )}

            {doc.ledger && (
              <>
                <h4>1. 연차 현황</h4>
                <div className="ledger">
                  <div className="cell"><div className="n">{doc.ledger.granted}</div><div className="k">부여</div></div>
                  <div className="cell"><div className="n">{doc.ledger.used}</div><div className="k">사용</div></div>
                  <div className="cell"><div className="n warn">{doc.ledger.remain}</div><div className="k">잔여</div></div>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-mute)", marginTop: 8 }}>
                  잔여 연차 미사용 시 연차수당 정산 및 회사 비용 증가 요인이 됩니다.
                </p>
              </>
            )}

            <h4>{n + 1}. 상신 근거</h4>
            <ul className="grounds">
              {doc.grounds.map((g, i) => (
                <li key={i}><span className={"gtag " + g.cls}>{g.tag}</span><span className="gtxt">{g.txt}</span></li>
              ))}
            </ul>

            <h4>{n + 2}. 기대 효과</h4>
            <div className="stat-row">
              {doc.stats.map((s, i) => (
                <div className="stat" key={i}><div className="sv">{s.sv}</div><div className="sk">{s.sk}</div></div>
              ))}
            </div>

            <p style={{ marginTop: 22, fontWeight: 600 }}>{doc.closing}</p>
          </div>

          <div className="doc-foot">
            <div className="co">{COMPANY}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
