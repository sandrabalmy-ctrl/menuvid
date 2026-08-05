"use client";

// Petite explosion de confettis (canvas, sans librairie externe).
// Se nettoie toute seule après ~2,6 s.
export function fireConfetti() {
  if (typeof document === "undefined") return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60";
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
  };
  resize();
  window.addEventListener("resize", resize);

  const colors = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#ffffff"];
  const parts = Array.from({ length: 150 }, () => ({
    x: canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.35,
    y: canvas.height * 0.32,
    vx: (Math.random() - 0.5) * canvas.width * 0.013,
    vy: (Math.random() * -1 - 0.5) * canvas.height * 0.015,
    size: (4 + Math.random() * 6) * dpr,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  const g = 0.35 * dpr;
  const start = performance.now();
  let raf = 0;

  function frame(t: number) {
    const elapsed = t - start;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.globalAlpha = Math.max(0, 1 - elapsed / 2600);
    for (const p of parts) {
      p.vy += g;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rot);
      ctx!.fillStyle = p.color;
      ctx!.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx!.restore();
    }
    if (elapsed < 2600) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);
}
