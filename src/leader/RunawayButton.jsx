import { useEffect, useRef, useState } from "react";
import { TAUNTS } from "../data.js";
import { toast } from "../ui.js";

// 연차 거절용 '도망가는 버튼'.
// 화면 밖으로 사라지지 않고, 항상 뷰포트 안 어딘가에 존재하며, 커서가 다가오면 도망치고
// 가만히 둬도 1.3초마다 스스로 자리를 옮겨 계속 도망다닌다. (영원히 클릭 불가)
export default function RunawayButton() {
  const btnRef = useRef(null);
  const posRef = useRef(null);          // 현재 좌표 {x,y} (null = 아직 정위치에 도킹)
  const cursorRef = useRef({ x: -9999, y: -9999 });
  const dodgesRef = useRef(0);
  const wanderRef = useRef(null);
  const [pos, setPos] = useState(null);
  const [taunt, setTaunt] = useState(null); // {x,y,msg}
  const tauntTimer = useRef(null);

  function size() {
    const b = btnRef.current;
    return { w: (b && b.offsetWidth) || 150, h: (b && b.offsetHeight) || 52 };
  }

  // 뷰포트 안, 상단바 아래, 커서에서 먼, 직전 위치와도 충분히 떨어진 새 좌표
  function nextSpot() {
    const { w, h } = size();
    const minX = 16, maxX = Math.max(minX, window.innerWidth - w - 16);
    const minY = 78, maxY = Math.max(minY, window.innerHeight - h - 18);
    const prev = posRef.current;
    const cur = cursorRef.current;
    let best = null, bestScore = -1;
    for (let i = 0; i < 12; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const cx = x + w / 2, cy = y + h / 2;
      const dCursor = Math.hypot(cur.x - cx, cur.y - cy);
      const dPrev = prev ? Math.hypot(prev.x - x, prev.y - y) : 999;
      if (dCursor > 150 && dPrev > 120) return { x, y };
      const score = Math.min(dCursor, 300) + Math.min(dPrev, 200);
      if (score > bestScore) { bestScore = score; best = { x, y }; }
    }
    return best || { x: minX, y: minY };
  }

  function flee() {
    const spot = nextSpot();
    posRef.current = spot;
    setPos(spot);
    dodgesRef.current += 1;
    const d = dodgesRef.current;
    const { w } = size();
    setTaunt({ x: spot.x + w / 2, y: spot.y, msg: TAUNTS[Math.floor(Math.random() * TAUNTS.length)] });
    clearTimeout(tauntTimer.current);
    tauntTimer.current = setTimeout(() => setTaunt(null), 1100);
    if (d === 1) toast("거절 버튼이… 도망칩니다 🏃");
    else if (d === 6) toast("승인 버튼은 안 도망가요 😊");
    else if (d === 16) toast("통계상 여기서 다들 포기하십니다");
    startWander();
  }

  function startWander() {
    if (wanderRef.current) return;
    wanderRef.current = setInterval(() => {
      const spot = nextSpot();
      posRef.current = spot;
      setPos(spot);
    }, 1300);
  }

  // 창 크기가 바뀌어도 버튼이 화면 밖에 방치되지 않도록 즉시 안쪽으로 되끌어온다.
  function clampToView() {
    if (!posRef.current) return;
    const { w, h } = size();
    const minX = 16, maxX = Math.max(minX, window.innerWidth - w - 16);
    const minY = 78, maxY = Math.max(minY, window.innerHeight - h - 18);
    const x = Math.min(Math.max(posRef.current.x, minX), maxX);
    const y = Math.min(Math.max(posRef.current.y, minY), maxY);
    posRef.current = { x, y };
    setPos({ x, y });
  }

  useEffect(() => {
    const onMove = (e) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      const b = btnRef.current;
      if (!b) return;
      const r = b.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < 110) flee();
    };
    document.addEventListener("mousemove", onMove);
    window.addEventListener("resize", clampToView);
    return () => {
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", clampToView);
      clearInterval(wanderRef.current);
      clearTimeout(tauntTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = pos ? { position: "fixed", left: pos.x + "px", top: pos.y + "px" } : undefined;

  return (
    <>
      <button
        ref={btnRef}
        className={"btn btn-reject" + (pos ? " runaway" : "")}
        style={style}
        onMouseEnter={flee}
        onMouseDown={(e) => { e.preventDefault(); flee(); }}
        onTouchStart={(e) => { e.preventDefault(); flee(); }}
        onClick={(e) => { e.preventDefault(); flee(); }}
      >
        ✋ 거절
      </button>
      {taunt && (
        <div className="taunt" style={{ left: taunt.x + "px", top: taunt.y + "px" }}>{taunt.msg}</div>
      )}
    </>
  );
}
