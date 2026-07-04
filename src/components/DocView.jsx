import { COMPANY, EMP, LEADER } from "../data.js";
import { fmtStamp } from "../generate.js";

function MiniStamp({ status }) {
  if (status === "approved") return <span className="mini-stamp">승인</span>;
  if (status === "rejected") return <span className="mini-stamp" style={{ borderColor: "#b91c1c", color: "#b91c1c" }}>반려</span>;
  return <span className="mini-stamp pending">대기</span>;
}

export default function DocView({ doc, stamped }) {
  const n = doc.ledger ? 1 : 0; // 섹션 번호 오프셋
  return (
    <div className="doc-outer">
      {stamped && (
        <div className="stamp-overlay">
          <div className="big-stamp">
            <div><div className="st-main">承認</div><div className="st-sub">{LEADER.name} {LEADER.rank}</div></div>
          </div>
        </div>
      )}
      <div className="doc">
        <div className="doc-strip" />
        <div className="doc-inner">
          <div className="doc-h">
            <div className="doc-kicker">{COMPANY} · 전 자 결 재</div>
            <h2>{doc.docTitle}</h2>
          </div>
          <div className="doc-meta">
            <span>문서번호 <b>{doc.docNo}</b></span>
            <span>기안자 <b>{EMP.name} {EMP.rank}</b> ({EMP.team})</span>
            <span>{doc.ledger ? "휴가일" : "퇴근시각"} <b>{doc.when}</b></span>
            <span>기안일 <b>{fmtStamp(doc.createdAt)}</b></span>
          </div>

          <table className="approval-line">
            <tbody>
              <tr>
                <td className="lbl" rowSpan={2}>결재</td>
                <td className="who">기안<br />{EMP.name}</td>
                <td className="who">검토<br />AI 어시스트</td>
                <td className="who">승인<br />{LEADER.name} {LEADER.rank}</td>
              </tr>
              <tr>
                <td className="sign"><span className="mini-stamp" style={{ borderColor: "var(--brand)", color: "var(--brand)", transform: "rotate(-8deg)" }}>기안</span></td>
                <td className="sign"><span className="mini-stamp" style={{ borderColor: "#0f766e", color: "#0f766e", transform: "rotate(6deg)" }}>완료</span></td>
                <td className="sign"><MiniStamp status={doc.status} /></td>
              </tr>
            </tbody>
          </table>

          <div className="doc-body">
            <p>{doc.intro}</p>

            {doc.plea && (
              <div className="plea-block">
                <div className="plea-label">
                  <span>■ 기안 취지</span>
                  <span className={"plea-src " + (doc.pleaSource === "llm" ? "llm" : "tpl")}>
                    {doc.pleaSource === "llm" ? "✨ AI 대필" : "✍️ 자동 작성"}
                  </span>
                </div>
                <p className="plea">{doc.plea}</p>
              </div>
            )}

            {doc.ledger && (
              <>
                <h4>1. 기존 연차 현황 (자동 조회)</h4>
                <div className="ledger">
                  <div className="cell"><div className="n">{doc.ledger.granted}</div><div className="k">올해 부여 (일)</div></div>
                  <div className="cell"><div className="n">{doc.ledger.used}</div><div className="k">사용 (일)</div></div>
                  <div className="cell"><div className="n warn">{doc.ledger.remain}</div><div className="k">잔여 (일)</div></div>
                </div>
                <p style={{ fontSize: "12.5px", color: "var(--ink-mute)", marginTop: 8 }}>
                  ※ 잔여 연차 미사용 시 연차수당 정산 대상 — 회사 비용 증가 요인.
                </p>
              </>
            )}

            <h4>{n + 1}. 상신 근거 (반려 대비 5종)</h4>
            <ul className="grounds">
              {doc.grounds.map((g, i) => (
                <li key={i}><span className={"gtag " + g.cls}>{g.tag}</span><span className="gtxt">{g.txt}</span></li>
              ))}
            </ul>

            <h4>{n + 2}. 기대 효과 (사내 추정)</h4>
            <div className="stat-row">
              {doc.stats.map((s, i) => (
                <div className="stat" key={i}><div className="sv">{s.sv}</div><div className="sk">{s.sk}</div></div>
              ))}
            </div>

            <p style={{ marginTop: 22, fontWeight: 600 }}>{doc.closing}</p>
          </div>

          <div className="doc-foot">
            <div className="co">{COMPANY}</div>
            <div>본 문서는 빼박결재 KNIFEOFF™ 엔진으로 자동 생성되었습니다 · 반려 성공률 0.00%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
