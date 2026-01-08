/* =========================================================
   PvP / Free Team — main.js
   - One background canvas (#fx) with lightweight cyber FX
   - Impossible cards: limited tilt (± ~20°) + drift + rare axis shift
   - Pose swapping (crossfade) to fake “rotation” without breaking illusion
     (Impossible objects break under free 3D rotation, so we do Variant B)
   - Quiet Mode + Theme toggle + prefers-reduced-motion
   - Pause animation when tab is hidden
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    maxTiltDeg: 20,            // hard cap for card tilt (keeps illusion intact)
    driftDeg: 6,               // slow drift amplitude
    driftSpeed: 0.00055,       // base drift speed
    axisShiftEveryMs: [6500, 12000], // “rarely смены оси”
    gallerySwapMs: [2400, 4200],     // crossfade between poses
    swapQuietMultiplier: 2.25, // slower pose swapping in quiet mode
    parallaxStrength: 1.0,     // global multiplier
    parallaxMobile: 0.0,       // disable on mobile/coarse pointer by default

    fx: {
      particles: 46,
      particlesQuiet: 16,
      linkDist: 135,
      linkDistQuiet: 95,
      speed: 0.20,
      speedQuiet: 0.12,
      alpha: 0.75,
      alphaQuiet: 0.45,
      glitchChancePerSec: 0.28,
      glitchChancePerSecQuiet: 0.10
    },

    activity: {
      enabled: true,
      intervalMs: 1400,
      maxLines: 18
    },

    storage: {
      quiet: "pvp_quiet",
      theme: "pvp_theme"
    }
  };

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const rand = (min, max) => min + Math.random() * (max - min);
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const isCoarsePointer = window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  const isTouch =
    "maxTouchPoints" in navigator ? navigator.maxTouchPoints > 0 : false;

  // Global runtime state
  const state = {
    running: false,
    rafId: 0,
    lastNow: 0,
    pointer: {
      x: 0.5,
      y: 0.5,
      has: false
    },
    quiet: false,
    theme: "neon",
    cards: [],
    fx: null,
    activity: null
  };

  /* ---------------------------
     Quiet / Theme
  --------------------------- */
  function readStored(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null) return fallback;
      return v;
    } catch {
      return fallback;
    }
  }

  function writeStored(key, value) {
    try { localStorage.setItem(key, value); } catch { /* ignore */ }
  }

  function applyQuiet(isQuiet) {
    state.quiet = !!isQuiet;

    // Respect prefers-reduced-motion: force quiet on
    if (prefersReducedMotion) state.quiet = true;

    document.body.classList.toggle("quiet", state.quiet);

    const btn = qs("#quietToggle");
    if (btn) {
      btn.setAttribute("aria-pressed", String(state.quiet));
      btn.textContent = `Quiet: ${state.quiet ? "ON" : "OFF"}`;
    }

    // Update FX immediately
    if (state.fx) state.fx.setQuiet(state.quiet);
  }

  function applyTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "neon";
    document.body.dataset.theme = state.theme;

    const btn = qs("#themeToggle");
    if (btn) {
      const isNeon = state.theme === "neon";
      btn.setAttribute("aria-pressed", String(isNeon));
      btn.textContent = `Theme: ${isNeon ? "NEON" : "DARK"}`;
    }
  }

  function setupToggles() {
    // initial
    const storedTheme = readStored(CONFIG.storage.theme, "neon");
    applyTheme(storedTheme);

    const storedQuiet = readStored(CONFIG.storage.quiet, "0");
    applyQuiet(storedQuiet === "1");

    const quietBtn = qs("#quietToggle");
    if (quietBtn) {
      quietBtn.addEventListener("click", () => {
        const next = !state.quiet;
        // If user explicitly toggles off but prefers reduced motion is on,
        // we still keep quiet ON.
        if (prefersReducedMotion) {
          applyQuiet(true);
          writeStored(CONFIG.storage.quiet, "1");
          return;
        }
        applyQuiet(next);
        writeStored(CONFIG.storage.quiet, next ? "1" : "0");
      });
    }

    const themeBtn = qs("#themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = state.theme === "neon" ? "dark" : "neon";
        applyTheme(next);
        writeStored(CONFIG.storage.theme, next);
      });
    }
  }

  /* ---------------------------
     Pointer tracking (parallax)
  --------------------------- */
  function setupPointer() {
    // disable parallax on coarse/touch by default
    const allowParallax = !(isCoarsePointer || isTouch) && !prefersReducedMotion;

    if (!allowParallax) return;

    const onMove = (e) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;

      state.pointer.x = clamp(e.clientX / w, 0, 1);
      state.pointer.y = clamp(e.clientY / h, 0, 1);
      state.pointer.has = true;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("blur", () => { state.pointer.has = false; }, { passive: true });
  }

  /* ---------------------------
     Impossible cards system
  --------------------------- */
  function collectPoses(card) {
    // We expect SVGs inside .figureStack with classes: .poseA .poseB (and maybe more)
    const poses = qsa(".pose", card);
    if (poses.length === 0) return [];
    return poses;
  }

  function setPose(poses, index) {
    poses.forEach((p, i) => p.classList.toggle("isOn", i === index));
  }

  function setupCards() {
    const cards = qsa(".impossibleCard");

    state.cards = cards.map((card) => {
      const poses = collectPoses(card);
      let poseIndex = 0;
      if (poses.length) setPose(poses, 0);

      const axisMode = randInt(0, 2);

      const item = {
        el: card,
        poses,
        poseIndex,
        nextSwapAt: performance.now() + rand(CONFIG.gallerySwapMs[0], CONFIG.gallerySwapMs[1]),
        axisMode,
        nextAxisAt: performance.now() + rand(CONFIG.axisShiftEveryMs[0], CONFIG.axisShiftEveryMs[1]),
        phase: rand(0, Math.PI * 2),
        driftK: rand(0.85, 1.2),
        // smooth targets
        rx: 0,
        ry: 0,
        rz: 0,
        tx: 0,
        ty: 0,
        tz: 0
      };

      return item;
    });
  }

  function updateCards(now) {
    const quiet = state.quiet;
    const allowParallax = !(isCoarsePointer || isTouch) && !prefersReducedMotion;
    const parallaxMul = allowParallax ? CONFIG.parallaxStrength : CONFIG.parallaxMobile;

    for (const c of state.cards) {
      const el = c.el;

      // Axis shift (rare)
      if (!prefersReducedMotion && now >= c.nextAxisAt) {
        c.axisMode = (c.axisMode + 1 + randInt(0, 1)) % 3;
        c.nextAxisAt = now + rand(CONFIG.axisShiftEveryMs[0], CONFIG.axisShiftEveryMs[1]) * (quiet ? 1.35 : 1.0);
      }

      // Pose swap (crossfade). Quiet mode slows it down.
      if (!prefersReducedMotion && c.poses.length >= 2 && now >= c.nextSwapAt) {
        c.poseIndex = (c.poseIndex + 1) % c.poses.length;
        setPose(c.poses, c.poseIndex);

        const mul = quiet ? CONFIG.swapQuietMultiplier : 1.0;
        c.nextSwapAt = now + rand(CONFIG.gallerySwapMs[0], CONFIG.gallerySwapMs[1]) * mul;
      }

      // Drift: slow, subtle
      const t = now * CONFIG.driftSpeed;
      const d = CONFIG.driftDeg * c.driftK * (quiet ? 0.55 : 1.0);

      let rxBase = Math.sin(t + c.phase) * d;
      let ryBase = Math.cos(t * 0.92 + c.phase * 1.2) * d;
      let rzBase = Math.sin(t * 0.62 + c.phase * 0.7) * (d * 0.35);

      // “rare axis changes”: remap drift components by mode
      if (c.axisMode === 1) {
        [rxBase, ryBase] = [ryBase, -rxBase];
        rzBase *= -1;
      } else if (c.axisMode === 2) {
        rxBase *= -1;
        ryBase *= 0.75;
        rzBase *= 1.15;
      }

      // Parallax tilt from pointer, per-card relative to its rect (keeps it “attached”)
      let px = 0, py = 0;
      if (parallaxMul > 0 && state.pointer.has && !quiet) {
        const r = el.getBoundingClientRect();
        // normalize pointer relative to card center
        const cx = (r.left + r.right) / 2;
        const cy = (r.top + r.bottom) / 2;
        const nx = clamp((state.pointer.x * window.innerWidth - cx) / (r.width * 0.9), -1, 1);
        const ny = clamp((state.pointer.y * window.innerHeight - cy) / (r.height * 0.9), -1, 1);
        px = nx * (CONFIG.maxTiltDeg * 0.75) * parallaxMul;
        py = ny * (CONFIG.maxTiltDeg * 0.75) * parallaxMul;
      }

      // Target rotations (limited)
      c.tx = clamp(rxBase + (-py), -CONFIG.maxTiltDeg, CONFIG.maxTiltDeg);
      c.ty = clamp(ryBase + (px), -CONFIG.maxTiltDeg, CONFIG.maxTiltDeg);
      c.tz = clamp(rzBase, -10, 10);

      // Smooth
      const smooth = quiet ? 0.10 : 0.14;
      c.rx = lerp(c.rx, c.tx, smooth);
      c.ry = lerp(c.ry, c.ty, smooth);
      c.rz = lerp(c.rz, c.tz, smooth);

      // Write CSS variables
      el.style.setProperty("--rx", `${c.rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${c.ry.toFixed(2)}deg`);
      el.style.setProperty("--rz", `${c.rz.toFixed(2)}deg`);
    }
  }

  /* ---------------------------
     Background FX Canvas
  --------------------------- */
  function createFX() {
    const canvas = qs("#fx");
    if (!canvas) return null;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return null;

    const fx = {
      canvas,
      ctx,
      w: 0,
      h: 0,
      dpr: 1,
      particles: [],
      quiet: false,
      glitchUntil: 0,
      lastGlitchTry: 0,

      setQuiet(q) {
        this.quiet = !!q;
        // rebuild particles count
        this.initParticles();
      },

      resize() {
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        this.dpr = dpr;
        this.w = Math.floor(window.innerWidth * dpr);
        this.h = Math.floor(window.innerHeight * dpr);
        canvas.width = this.w;
        canvas.height = this.h;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        this.initParticles();
      },

      initParticles() {
        const count = prefersReducedMotion
          ? 0
          : (this.quiet ? CONFIG.fx.particlesQuiet : CONFIG.fx.particles);

        const arr = [];
        for (let i = 0; i < count; i++) {
          arr.push({
            x: Math.random() * this.w,
            y: Math.random() * this.h,
            vx: (Math.random() - 0.5) * (this.w / 900),
            vy: (Math.random() - 0.5) * (this.h / 900),
            s: rand(0.6, 1.6)
          });
        }
        this.particles = arr;
      },

      tick(now, dt) {
        const ctx = this.ctx;
        if (!ctx) return;

        // clear
        ctx.clearRect(0, 0, this.w, this.h);

        if (prefersReducedMotion) return;

        const speed = this.quiet ? CONFIG.fx.speedQuiet : CONFIG.fx.speed;
        const alpha = this.quiet ? CONFIG.fx.alphaQuiet : CONFIG.fx.alpha;
        const linkDist = (this.quiet ? CONFIG.fx.linkDistQuiet : CONFIG.fx.linkDist) * this.dpr;

        // Fill faint vignette for depth
        ctx.save();
        ctx.globalAlpha = 0.20;
        const g = ctx.createRadialGradient(
          this.w * 0.5, this.h * 0.35, 0,
          this.w * 0.5, this.h * 0.55, Math.max(this.w, this.h) * 0.65
        );
        g.addColorStop(0, "rgba(30,240,255,0.05)");
        g.addColorStop(0.5, "rgba(255,43,214,0.03)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, this.w, this.h);
        ctx.restore();

        // maybe start a micro glitch bar
        const sec = now / 1000;
        if (sec - this.lastGlitchTry > 0.45) {
          this.lastGlitchTry = sec;
          const chance = this.quiet ? CONFIG.fx.glitchChancePerSecQuiet : CONFIG.fx.glitchChancePerSec;
          if (Math.random() < chance * 0.45) {
            this.glitchUntil = now + rand(90, 180);
          }
        }

        // move particles
        for (const p of this.particles) {
          p.x += p.vx * dt * speed;
          p.y += p.vy * dt * speed;

          // gentle drift bias
          p.x += Math.sin((now * 0.00025) + p.s) * 0.08 * this.dpr;
          p.y += Math.cos((now * 0.00023) + p.s) * 0.08 * this.dpr;

          if (p.x < -40) p.x = this.w + 40;
          if (p.x > this.w + 40) p.x = -40;
          if (p.y < -40) p.y = this.h + 40;
          if (p.y > this.h + 40) p.y = -40;
        }

        // draw links
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = alpha * 0.55;

        for (let i = 0; i < this.particles.length; i++) {
          const a = this.particles[i];
          for (let j = i + 1; j < this.particles.length; j++) {
            const b = this.particles[j];
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const dist = Math.hypot(dx, dy);
            if (dist < linkDist) {
              const t = 1 - dist / linkDist;
              ctx.lineWidth = (0.8 + t * 1.2) * this.dpr;
              const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
              grad.addColorStop(0, `rgba(30,240,255,${0.16 * t})`);
              grad.addColorStop(0.5, `rgba(155,255,60,${0.10 * t})`);
              grad.addColorStop(1, `rgba(255,43,214,${0.14 * t})`);
              ctx.strokeStyle = grad;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }

        // draw particles
        ctx.globalAlpha = alpha * 0.55;
        for (const p of this.particles) {
          ctx.fillStyle = "rgba(233,238,248,0.10)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * this.dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // glitch bars
        if (now < this.glitchUntil && !this.quiet) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.globalAlpha = 0.16;
          const barH = rand(18, 52) * this.dpr;
          const y = rand(0, this.h - barH);
          ctx.fillStyle = "rgba(30,240,255,0.35)";
          ctx.fillRect(0, y, this.w, barH);

          ctx.globalAlpha = 0.12;
          ctx.fillStyle = "rgba(255,43,214,0.30)";
          ctx.fillRect(0, y + barH * 0.35, this.w, barH * 0.22);

          ctx.globalAlpha = 0.10;
          ctx.fillStyle = "rgba(155,255,60,0.25)";
          ctx.fillRect(0, y + barH * 0.62, this.w, barH * 0.18);

          ctx.restore();
        }
      }
    };

    fx.resize();
    window.addEventListener("resize", () => fx.resize(), { passive: true });

    return fx;
  }

  /* ---------------------------
     Activity wall (terminal feed)
     Works if you have an element with:
     - [data-activity="feed"]  OR
     - #activityFeed          OR
     - .terminalBody (first one)
  --------------------------- */
  function setupActivityFeed() {
    if (!CONFIG.activity.enabled || prefersReducedMotion) return null;

    const host =
      qs('[data-activity="feed"]') ||
      qs("#activityFeed") ||
      qs(".terminalBody");

    if (!host) return null;

    // If host is .terminalBody, keep existing header overlays etc.
    const feedEl = host;

    const verbs = [
      "собрал билд", "пофиксил баг", "задеплоил", "закоммитил",
      "протестировал", "ускорил загрузку", "сверстал блок",
      "подкрутил UI", "обновил бота", "прогнал логи"
    ];
    const objects = [
      "лендинг", "форму", "анимации", "фид терминала",
      "галерею фигур", "стили", "скрипты", "параллакс",
      "оптимизацию", "модуль"
    ];
    const tags = ["ui", "perf", "hotfix", "refactor", "ship", "sync"];
    const channels = ["FT", "PvP", "dev", "ops"];

    function pad2(n) { return String(n).padStart(2, "0"); }

    function ts() {
      const d = new Date();
      return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    }

    function lineHTML() {
      const v = verbs[randInt(0, verbs.length - 1)];
      const o = objects[randInt(0, objects.length - 1)];
      const t = tags[randInt(0, tags.length - 1)];
      const c = channels[randInt(0, channels.length - 1)];

      // No money/sums, just “activity”
      return `
        <div class="logLine">
          <div class="ts">${ts()}</div>
          <div class="msg">
            <span class="hl1">[${c}]</span>
            ${v} <span class="hl2">${o}</span>
            <span class="hl3">#${t}</span>
          </div>
        </div>
      `;
    }

    let timer = 0;

    function start() {
      stop();
      timer = window.setInterval(() => {
        // In quiet mode we still can run, but slower
        if (state.quiet) return;

        feedEl.insertAdjacentHTML("afterbegin", lineHTML());

        // trim
        const lines = qsa(".logLine", feedEl);
        if (lines.length > CONFIG.activity.maxLines) {
          for (let i = CONFIG.activity.maxLines; i < lines.length; i++) {
            lines[i].remove();
          }
        }
      }, CONFIG.activity.intervalMs);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = 0;
    }

    // Seed a few lines if empty-ish
    if (qsa(".logLine", feedEl).length < 3) {
      const seed = state.quiet ? 3 : 6;
      for (let i = 0; i < seed; i++) {
        feedEl.insertAdjacentHTML("beforeend", lineHTML());
      }
    }

    start();

    return { start, stop, host: feedEl };
  }

  /* ---------------------------
     Main loop (RAF)
  --------------------------- */
  function startLoop() {
    if (state.running) return;
    state.running = true;
    state.lastNow = performance.now();

    const frame = (now) => {
      if (!state.running) return;

      const dt = Math.min(48, now - state.lastNow);
      state.lastNow = now;

      // Cards update (even in quiet; but reduced motion = quiet forced anyway)
      if (!prefersReducedMotion) {
        updateCards(now);
      } else {
        // If reduced motion: keep poses at first and zero tilt
        for (const c of state.cards) {
          c.el.style.setProperty("--rx", `0deg`);
          c.el.style.setProperty("--ry", `0deg`);
          c.el.style.setProperty("--rz", `0deg`);
          if (c.poses.length) setPose(c.poses, 0);
        }
      }

      // FX canvas update
      if (state.fx) state.fx.tick(now, dt);

      state.rafId = requestAnimationFrame(frame);
    };

    state.rafId = requestAnimationFrame(frame);
  }

  function stopLoop() {
    state.running = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = 0;
  }

  function setupVisibilityPause() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopLoop();
        if (state.activity) state.activity.stop();
      } else {
        // resume
        if (!prefersReducedMotion) {
          startLoop();
          if (state.activity) state.activity.start();
        }
      }
    });
  }

  /* ---------------------------
     Init
  --------------------------- */
  function init() {
    setupToggles();
    setupPointer();
    setupCards();

    // FX
    state.fx = createFX();
    if (state.fx) state.fx.setQuiet(state.quiet);

    // Activity feed (optional)
    state.activity = setupActivityFeed();

    setupVisibilityPause();

    // Start animation if allowed
    if (!prefersReducedMotion) {
      startLoop();
    } else {
      // Make sure quiet visuals are applied
      applyQuiet(true);
      // Still render one static “frame” for cards (pose 0)
      updateCards(performance.now());
      if (state.fx) state.fx.tick(performance.now(), 16);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();