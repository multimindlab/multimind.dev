// Living neural field — scroll-reactive background animation.
// Nodes drift on 3 depth layers; nearby nodes link; signal pulses travel
// along links, spawning faster while the user scrolls.
(function () {
  const canvas = document.getElementById("neural-bg");
  if (!canvas) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const PURPLE = [124, 92, 252];
  const BLUE = [78, 127, 239];
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  let W = 0, H = 0;
  let nodes = [];
  let pulses = [];
  let linkDist = 130;
  let scrollY = window.scrollY;
  let scrollVel = 0;
  let pointer = null; // {x, y}
  let rafId = null;
  let lastTime = 0;

  // parallax factor per depth layer (farther layers move less with scroll)
  const LAYER_PARALLAX = [0.04, 0.09, 0.16];
  const LAYER_SCALE = [0.5, 0.75, 1];

  function init() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    linkDist = Math.max(100, Math.min(150, W * 0.11));
    const count = Math.max(24, Math.min(90, Math.floor((W * H) / 20000)));
    nodes = [];
    for (let i = 0; i < count; i++) {
      const layer = i % 3;
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        layer,
        r: (1 + Math.random() * 1.4) * LAYER_SCALE[layer],
        phase: Math.random() * Math.PI * 2,
      });
    }
    pulses = [];
  }

  // scroll-position-driven blend between brand purple and blue
  function themeColor(extra) {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - H);
    const f = Math.min(1, scrollY / max);
    const t = Math.min(1, Math.max(0, f + (extra || 0)));
    return [
      Math.round(PURPLE[0] + (BLUE[0] - PURPLE[0]) * t),
      Math.round(PURPLE[1] + (BLUE[1] - PURPLE[1]) * t),
      Math.round(PURPLE[2] + (BLUE[2] - PURPLE[2]) * t),
    ];
  }

  function drawnPos(n) {
    // wrap vertically as parallax pushes nodes off-screen
    let y = n.y - scrollY * LAYER_PARALLAX[n.layer];
    y = ((y % H) + H) % H;
    return { x: n.x, y };
  }

  function frame(now) {
    const dt = Math.min(50, now - lastTime) / 16.7; // normalize to ~60fps ticks
    lastTime = now;

    ctx.clearRect(0, 0, W, H);
    const [cr, cg, cb] = themeColor(0);

    // integrate node drift
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -10) n.x = W + 10;
      if (n.x > W + 10) n.x = -10;
      n.phase += 0.008 * dt;
    }

    // spatial grid over drawn positions
    const cell = linkDist;
    const cols = Math.ceil(W / cell) + 1;
    const grid = new Map();
    const pos = nodes.map((n) => drawnPos(n));
    pos.forEach((p, i) => {
      const key = Math.floor(p.x / cell) + cols * Math.floor(p.y / cell);
      let bucket = grid.get(key);
      if (!bucket) { bucket = []; grid.set(key, bucket); }
      bucket.push(i);
    });

    // links between near neighbors
    const links = [];
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const p = pos[i];
      const cx = Math.floor(p.x / cell);
      const cy = Math.floor(p.y / cell);
      for (let gx = cx - 1; gx <= cx + 1; gx++) {
        for (let gy = cy - 1; gy <= cy + 1; gy++) {
          const bucket = grid.get(gx + cols * gy);
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            const q = pos[j];
            const dx = p.x - q.x, dy = p.y - q.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > linkDist * linkDist) continue;
            const d = Math.sqrt(d2);
            const a = (1 - d / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${a})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
            links.push([i, j]);
          }
        }
      }
    }

    // pointer acts as a temporary node (desktop only)
    if (pointer && !isTouch) {
      const reach = linkDist * 1.3;
      for (let i = 0; i < nodes.length; i++) {
        const p = pos[i];
        const dx = p.x - pointer.x, dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > reach * reach) continue;
        const d = Math.sqrt(d2);
        const a = (1 - d / reach) * 0.3;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${a})`;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pointer.x, pointer.y);
        ctx.stroke();
        // gentle attraction toward the cursor
        nodes[i].x -= dx * 0.0006 * dt;
      }
    }

    // spawn pulses: slow baseline + extra while scrolling
    const spawnChance = (0.012 + Math.min(0.2, scrollVel * 0.004)) * dt;
    if (links.length && Math.random() < spawnChance) {
      const [i, j] = links[(Math.random() * links.length) | 0];
      pulses.push({ i, j, t: 0, speed: 0.012 + Math.random() * 0.02 });
    }
    scrollVel *= Math.pow(0.9, dt);

    // draw pulses traveling along their (live) link
    const [pr, pg, pb] = themeColor(0.25);
    pulses = pulses.filter((pu) => {
      pu.t += pu.speed * dt;
      if (pu.t >= 1) return false;
      const a = pos[pu.i], b = pos[pu.j];
      const dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy > linkDist * linkDist * 2.6) return false; // link broke
      const x = a.x + (b.x - a.x) * pu.t;
      const y = a.y + (b.y - a.y) * pu.t;
      const fade = Math.sin(pu.t * Math.PI);
      ctx.fillStyle = `rgba(${pr},${pg},${pb},${0.75 * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });

    // nodes on top, with a soft breathing glow
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      const p = pos[i];
      const glow = 0.35 + 0.25 * Math.sin(n.phase);
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${glow})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (rafId !== null) return;
    lastTime = performance.now();
    rafId = requestAnimationFrame(frame);
  }
  function stop() {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    scrollVel = Math.min(80, Math.abs(y - scrollY));
    scrollY = y;
  }, { passive: true });

  if (!isTouch) {
    window.addEventListener("pointermove", (e) => { pointer = { x: e.clientX, y: e.clientY }; });
    document.addEventListener("pointerleave", () => { pointer = null; });
  }

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop(); else start();
  });

  init();
  start();
})();
