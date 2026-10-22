/*
 * Motion layer: Lenis smooth scroll + GSAP (ScrollTrigger, SplitText).
 * SplitText / BlurText / ScrollReveal / CountUp / Magnet / ClickSpark / SpotlightCard / ScrollVelocity
 * are vanilla adaptations of React Bits effects (reactbits.dev, MIT + Commons Clause, © David Haz).
 * The page works without this file; if the CDN scripts fail to load it simply does nothing.
 */
(() => {
  "use strict";

  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  if (!gsap || !ScrollTrigger || !SplitText) return;
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const SIGNAL = "#F6B92B";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Lenis, driven by GSAP's ticker ---------- */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ stopInertiaOnNavigate: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    // Smooth in-page links ourselves instead of `anchors: true`: that option would also catch the
    // skip link (which must move focus natively) and would rewrite the #plan=… share hash.
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.classList.contains("skip") || e.defaultPrevented) return;
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : id.length > 1 && document.getElementById(id.slice(1));
      if (target === false || target === null) return;
      e.preventDefault();
      lenis.scrollTo(target); // honours scroll-padding-top from the CSS
    });
  }

  // <details> (case ledgers, planner groups, FAQ) change the page height without a resize event.
  document.addEventListener("toggle", () => ScrollTrigger.refresh(), true);

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const restore = [];

    // SplitText's automatic aria-label drops the space a <br> stands for, so build the label
    // from the source text (not innerText, which would pick up CSS text-transform).
    const split = (el, type, animate) => {
      const copy = el.cloneNode(true);
      copy.querySelectorAll("br").forEach(br => br.replaceWith(" "));
      const label = copy.textContent.replace(/\s+/g, " ").trim();
      SplitText.create(el, {
        type,
        autoSplit: true,
        onSplit: self => {
          el.setAttribute("aria-label", label);
          return animate(self);
        },
      });
    };

    /* ---------- Hero title: React Bits SplitText (chars rise in) ---------- */
    const heroTitle = $(".hero__title");
    if (heroTitle) {
      heroTitle.classList.remove("reveal"); // GSAP owns this one; app.js staggers the rest
      split(heroTitle, "words,chars", self => gsap.from(self.chars, {
        opacity: 0, y: 40, duration: 0.6, ease: "power3.out", stagger: 0.03, delay: 0.15,
      }));
    }

    gsap.to(".hero__contours", {
      yPercent: 14, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    /* ---------- Section titles: React Bits BlurText (words unblur on enter) ---------- */
    $$(".section__title").forEach(el => split(el, "words", self => gsap.from(self.words, {
      opacity: 0, y: 24, filter: "blur(10px)", duration: 0.8, ease: "power3.out", stagger: 0.06,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    })));

    /* ---------- Big statements: React Bits ScrollReveal (scrubbed with scroll) ---------- */
    $$(".why__title").forEach(el => split(el, "words", self => gsap.fromTo(self.words,
      { opacity: 0.12, filter: "blur(4px)" },
      {
        opacity: 1, filter: "blur(0px)", ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 45%", scrub: true },
      })));

    const ctaTitle = $(".cta__title");
    if (ctaTitle) {
      split(ctaTitle, "words,chars", self => gsap.from(self.chars, {
        opacity: 0, yPercent: 60, rotateX: -80, transformOrigin: "50% 100%", transformPerspective: 600,
        duration: 0.9, ease: "back.out(1.6)", stagger: 0.035,
        scrollTrigger: { trigger: ctaTitle, start: "top 85%", once: true },
      }));
    }

    /* ---------- Case studies: pins pop in, phone floats ---------- */
    $$(".showcase").forEach(showcase => {
      const pins = $$(".pin", showcase);
      if (pins.length) {
        gsap.from(pins, {
          scale: 0, duration: 0.5, ease: "back.out(2.2)", stagger: 0.12,
          scrollTrigger: { trigger: showcase, start: "top 70%", once: true },
        });
      }
    });

    /* ---------- Cards and steps: batched fade-up ---------- */
    [".skill", ".why__items article", ".steps li"].forEach(sel => {
      const items = $$(sel);
      if (!items.length) return;
      gsap.set(items, { opacity: 0, y: 32 });
      ScrollTrigger.batch(items, {
        start: "top 88%",
        once: true,
        onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 }),
      });
    });

    /* ---------- React Bits CountUp ---------- */
    $$("[data-count]").forEach(el => {
      const end = Number(el.dataset.count || el.textContent);
      const counter = { v: 0 };
      el.style.display = "inline-block";
      el.style.minWidth = `${el.offsetWidth}px`; // no layout jump while digits change
      el.style.fontVariantNumeric = "tabular-nums";
      el.textContent = "0";
      gsap.to(counter, {
        v: end, duration: 1.8, ease: "power2.out",
        onUpdate: () => { el.textContent = Math.round(counter.v).toLocaleString("tr-TR"); },
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
      });
      restore.push(() => { el.textContent = String(end); });
    });

    return () => restore.forEach(fn => fn());
  });

  // Separate query so crossing the breakpoint only rebuilds the parallax, not every reveal.
  mm.add("(prefers-reduced-motion: no-preference) and (min-width: 901px)", () => {
    $$(".showcase").forEach(showcase => {
      const phone = $(".frame--phone", showcase);
      if (!phone) return;
      gsap.fromTo(phone, { y: 70 }, {
        y: -50, ease: "none",
        scrollTrigger: { trigger: showcase, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  });

  /* ---------- React Bits ScrollVelocity: tech stack marquee reacting to Lenis velocity ---------- */
  const stack = $(".stack");
  if (stack && !reduceMotion) {
    const marquee = document.createElement("div");
    marquee.className = "marquee";
    const track = document.createElement("div");
    track.className = "marquee__track";
    stack.replaceWith(marquee);
    marquee.append(track);
    track.append(stack);

    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const clones = [];
    const fill = () => {
      clones.forEach(c => c.remove());
      clones.length = 0;
      const need = Math.ceil(marquee.offsetWidth / (stack.offsetWidth + gap)) + 1;
      for (let i = 0; i < need; i++) {
        const c = stack.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.removeAttribute("aria-label");
        track.append(c);
        clones.push(c);
      }
    };
    fill();

    let x = 0, dir = -1, active = false;
    const setX = gsap.quickSetter(track, "x", "px");
    const BASE = 40; // px per second
    gsap.ticker.add((_, delta) => {
      if (!active) return;
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
      const speed = BASE * (1 + Math.min(Math.abs(v), 60) * 0.25);
      const span = stack.offsetWidth + gap;
      x = gsap.utils.wrap(-span, 0, x + dir * speed * (delta / 1000));
      setX(x);
    });
    ScrollTrigger.create({ trigger: marquee, start: "top bottom", end: "bottom top", onToggle: self => { active = self.isActive; } });
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fill, 200); });
  }

  if (reduceMotion) return;

  /* ---------- React Bits ClickSpark ---------- */
  const canvas = document.createElement("canvas");
  canvas.className = "spark-layer";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx2d = canvas.getContext("2d");
  const sizeCanvas = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);

  const sparks = [];
  const SPARK = { count: 8, size: 12, radius: 26, duration: 450, width: 2 };
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  let drawing = false;
  const draw = now => {
    ctx2d.clearRect(0, 0, innerWidth, innerHeight);
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      const t = (now - s.start) / SPARK.duration;
      if (t >= 1) { sparks.splice(i, 1); continue; }
      const e = easeOut(t);
      const dist = e * SPARK.radius;
      const len = SPARK.size * (1 - e);
      ctx2d.strokeStyle = s.color;
      ctx2d.lineWidth = SPARK.width;
      ctx2d.lineCap = "round";
      ctx2d.beginPath();
      ctx2d.moveTo(s.x + dist * Math.cos(s.angle), s.y + dist * Math.sin(s.angle));
      ctx2d.lineTo(s.x + (dist + len) * Math.cos(s.angle), s.y + (dist + len) * Math.sin(s.angle));
      ctx2d.stroke();
    }
    if (sparks.length) requestAnimationFrame(draw);
    else drawing = false;
  };
  document.addEventListener("click", e => {
    if (!e.target.closest(".btn, .route, .seg label, .stepper button, .frame__tabs button, .board__rows li")) return;
    if (e.detail === 0) return; // keyboard activation: no pointer position
    const start = performance.now();
    const offset = Math.random() * Math.PI;
    for (let i = 0; i < SPARK.count; i++) {
      sparks.push({ x: e.clientX, y: e.clientY, angle: offset + (2 * Math.PI * i) / SPARK.count, start, color: SIGNAL });
    }
    if (!drawing) { drawing = true; requestAnimationFrame(draw); }
  });

  if (!finePointer) return;

  /* ---------- React Bits Magnet: main CTAs lean toward the pointer ---------- */
  const magnets = $$(".hero__actions .btn, .cta__actions .btn").map(el => ({
    el,
    x: gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" }),
    on: false,
  }));
  const PADDING = 70, STRENGTH = 3;
  window.addEventListener("pointermove", e => {
    magnets.forEach(m => {
      const r = m.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - gsap.getProperty(m.el, "x");
      const cy = r.top + r.height / 2 - gsap.getProperty(m.el, "y");
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const inside = Math.abs(dx) < r.width / 2 + PADDING && Math.abs(dy) < r.height / 2 + PADDING;
      if (inside) {
        m.on = true;
        m.x(dx / STRENGTH);
        m.y(dy / STRENGTH);
      } else if (m.on) {
        m.on = false;
        gsap.to(m.el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", overwrite: true });
      }
    });
  }, { passive: true });

  /* ---------- React Bits SpotlightCard: pointer-following light on service cards ---------- */
  $$(".skill").forEach(card => {
    card.classList.add("has-spotlight");
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
})();
