import { useEffect, useRef, useState } from "react";
import { TAUNTS } from "../data.js";
import { toast } from "../ui.js";

// 연차 거절용 '다리 달고 뛰어다니는' 버튼.
// 순간이동 대신 requestAnimationFrame 물리 엔진으로 화면 위를 실제로 달린다.
// 항상 보이는 '아레나'(상단바 아래 ~ 하단 결재바 위) 안에서만 움직여 절대 화면 밖으로 사라지지 않는다.
// 커서가 다가오면 겁먹고(😱) 질주하며 반대로 튄다. (클릭은 영원히 불가)
const TOPBAR = 64;        // 상단바 높이 여백
const BOTTOM_RESERVE = 96; // 하단 sticky 결재바 확보 (→ 하단으로 사라지지 않음)
const EDGE = 12;          // 좌우 여백
const REPEL = 180;        // 커서 감지 반경

export default function RunawayButton() {
  const btnRef = useRef(null);
  const faceRef = useRef(null);
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const cursorRef = useRef({ x: -99999, y: -99999 });
  const aliveRef = useRef(false);
  const rafRef = useRef(null);
  const panicRef = useRef(false);
  const fastRef = useRef(false);
  const dodgesRef = useRef(0);
  const lastTauntRef = useRef(0);
  const tauntTimer = useRef(null);
  const [alive, setAlive] = useState(false);
  const [taunt, setTaunt] = useState(null); // {x,y,msg}

  function metrics() {
    const b = btnRef.current;
    return { w: (b && b.offsetWidth) || 96, h: (b && b.offsetHeight) || 46 };
  }

  function kickAway(mag) {
    const b = btnRef.current;
    const r = b.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = cx - cursorRef.current.x, dy = cy - cursorRef.current.y;
    if (cursorRef.current.x < -9999) { dx = (Math.random() - 0.5); dy = -1; } // 커서 없으면 위로 튐
    const d = Math.hypot(dx, dy) || 1;
    return { vx: (dx / d) * mag, vy: (dy / d) * mag };
  }

  function applyTransform() {
    const b = btnRef.current;
    if (b) b.style.transform = `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`;
  }

  function activate() {
    if (aliveRef.current || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    posRef.current = { x: r.left, y: r.top };
    velRef.current = kickAway(4.5);
    applyTransform();                       // 클래스 전환 전에 위치를 먼저 박아 깜빡임 방지
    if (faceRef.current) faceRef.current.textContent = "😏";
    aliveRef.current = true;
    setAlive(true);
    rafRef.current = requestAnimationFrame(loop);
  }

  function maybeTaunt(pos, w) {
    const now = performance.now();
    if (now - lastTauntRef.current < 1150) return;
    lastTauntRef.current = now;
    dodgesRef.current += 1;
    const d = dodgesRef.current;
    setTaunt({ x: pos.x + w / 2, y: pos.y, msg: TAUNTS[Math.floor(Math.random() * TAUNTS.length)] });
    clearTimeout(tauntTimer.current);
    tauntTimer.current = setTimeout(() => setTaunt(null), 1000);
    if (d === 1) toast("거절 버튼이… 다리 달고 도망칩니다 🏃💨");
    else if (d === 5) toast("승인 버튼은 안 도망가요 😊");
    else if (d === 12) toast("통계상 여기서 다들 포기하십니다");
  }

  function loop() {
    if (!aliveRef.current) return;
    const b = btnRef.current;
    if (!b) return;
    const { w, h } = metrics();
    const left = EDGE, right = Math.max(left, window.innerWidth - w - EDGE);
    const top = TOPBAR + 8, bottom = Math.max(top, window.innerHeight - h - BOTTOM_RESERVE);

    const pos = posRef.current, vel = velRef.current, cur = cursorRef.current;
    const cx = pos.x + w / 2, cy = pos.y + h / 2;
    const dx = cx - cur.x, dy = cy - cur.y;
    const dist = Math.hypot(dx, dy) || 1;

    let panic = false;
    if (dist < REPEL) {
      panic = true;
      const force = (REPEL - dist) / REPEL;   // 0..1
      vel.vx += (dx / dist) * force * 2.6;
      vel.vy += (dy / dist) * force * 2.6;
    } else {
      vel.vx += (Math.random() - 0.5) * 0.5;  // 어슬렁 배회
      vel.vy += (Math.random() - 0.5) * 0.5;
    }

    // 속도 상·하한 + 마찰
    let sp = Math.hypot(vel.vx, vel.vy);
    const maxSp = panic ? 9.5 : 3.2, minSp = panic ? 4.5 : 1.1;
    if (sp > maxSp) { vel.vx *= maxSp / sp; vel.vy *= maxSp / sp; }
    else if (sp < minSp) {
      if (sp < 0.001) { vel.vx = Math.random() - 0.5; vel.vy = Math.random() - 0.5; sp = 1; }
      vel.vx *= minSp / sp; vel.vy *= minSp / sp;
    }
    vel.vx *= 0.99; vel.vy *= 0.99;

    // 이동 + 아레나 튕김
    pos.x += vel.vx; pos.y += vel.vy;
    if (pos.x < left)   { pos.x = left;   vel.vx = Math.abs(vel.vx); }
    if (pos.x > right)  { pos.x = right;  vel.vx = -Math.abs(vel.vx); }
    if (pos.y < top)    { pos.y = top;    vel.vy = Math.abs(vel.vy); }
    if (pos.y > bottom) { pos.y = bottom; vel.vy = -Math.abs(vel.vy); }

    const speed = Math.hypot(vel.vx, vel.vy);
    const tilt = Math.max(-13, Math.min(13, vel.vx * 2.4));
    b.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) rotate(${tilt}deg)`;
    b.style.setProperty("--run-speed", Math.max(0.11, 0.44 - speed * 0.032) + "s");

    const isFast = speed > 4.5;
    if (isFast !== fastRef.current) { fastRef.current = isFast; b.classList.toggle("fast", isFast); }
    if (panic !== panicRef.current) {
      panicRef.current = panic;
      b.classList.toggle("panic", panic);
      if (faceRef.current) faceRef.current.textContent = panic ? "😱" : "😏";
    }
    if (panic) maybeTaunt(pos, w);

    rafRef.current = requestAnimationFrame(loop);
  }

  function poke() {
    if (!aliveRef.current) { activate(); return; }
    const k = kickAway(9);
    velRef.current.vx += k.vx; velRef.current.vy += k.vy;
  }

  useEffect(() => {
    const track = (x, y) => {
      cursorRef.current = { x, y };
      if (aliveRef.current || !btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.hypot(x - cx, y - cy) < 210) activate();   // 다가오면 살아난다
    };
    const onMove = (e) => track(e.clientX, e.clientY);
    const onTouch = (e) => { const t = e.touches[0]; if (t) track(t.clientX, t.clientY); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onTouch, { passive: true });
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onTouch);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(tauntTimer.current);
      aliveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        className={"btn btn-reject" + (alive ? " runaway" : "")}
        onMouseEnter={poke}
        onMouseDown={(e) => { e.preventDefault(); poke(); }}
        onClick={(e) => { e.preventDefault(); poke(); }}
        onTouchStart={(e) => { e.preventDefault(); poke(); }}
      >
        <span className="rb-face" ref={faceRef}>✋</span>
        <span className="rb-label">거절</span>
        <span className="rb-leg rb-leg-l" />
        <span className="rb-leg rb-leg-r" />
        <span className="rb-dust">💨</span>
      </button>
      {taunt && (
        <div className="taunt" style={{ left: taunt.x + "px", top: taunt.y + "px" }}>{taunt.msg}</div>
      )}
    </>
  );
}
