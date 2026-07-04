// 프레임워크 독립적인 연출 유틸 (토스트 · 컨페티)

export function toast(msg, good) {
  const host = document.getElementById("toastHost");
  if (!host) return;
  const t = document.createElement("div");
  t.className = "toast" + (good ? " good" : "");
  t.textContent = msg;
  host.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

export function confettiBurst() {
  const c = document.getElementById("confetti");
  if (!c) return;
  const ctx = c.getContext("2d");
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  const cols = ["#2b44e0", "#4d63ff", "#ffcf33", "#16a34a", "#ef4444", "#7c3aed"];
  const P = [];
  for (let i = 0; i < 170; i++)
    P.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 240,
      y: window.innerHeight / 3,
      vx: (Math.random() - 0.5) * 12, vy: Math.random() * -14 - 4,
      g: 0.34 + Math.random() * 0.22, s: 6 + Math.random() * 8,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.45, col: cols[i % cols.length],
    });
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    f++;
    P.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62); ctx.restore();
    });
    if (f < 180) requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, c.width, c.height);
  })();
}
