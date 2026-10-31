/*
 * Motion layer: Lenis smooth scroll + GSAP ScrollTrigger.
 * Kept deliberately quiet (knc-studio DESIGN.md: slow, heavy easing; no effects for their own sake):
 * sections fade up once as they arrive, nothing follows the pointer and nothing loops.
 * The page works without this file; if the CDN scripts fail to load it simply does nothing.
 */
(() => {
  "use strict";

  const { gsap, ScrollTrigger, Lenis } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  // phones resize the viewport as the address bar shows/hides; re-measuring then makes the pinned intro jump
  ScrollTrigger.config({ ignoreMobileResize: true });

  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const topbarH = () => document.querySelector(".topbar").offsetHeight;

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

  /* ---------- Intro scene (after Moktaine/knc-studio, scene 1): the drawing finishes itself ----------
     Pinned for about one screen of scrolling and scrubbed to it. The CSS holds the finished state;
     these .set() calls draw the wireframe on top, and matchMedia reverts them if motion is reduced. */
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const intro = document.querySelector(".intro");
    if (!intro) return;
    const q = gsap.utils.selector(document);
    const open = "inset(0% 0% 0% 0%)";
    // negative insets keep the italic overhang and descenders of the serif inside the wipe
    gsap.set(q(".intro__fill"), { clipPath: "inset(-20% 100% -30% -5%)" });
    gsap.set(q(".intro__line--solid, .topbar__rule--solid"), { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(q(".intro__line--dash, .topbar__rule--dash"), { clipPath: open });
    gsap.set(q(".intro__cross, .intro__wire"), { opacity: 1 });
    gsap.set(q(".intro__bg, .intro__decor"), { opacity: 0 });
    gsap.set(q(".intro__gold"), { clipPath: "inset(100% 0% 0% 0%)" });

    const slow = { ease: "power1.inOut" };
    gsap.timeline({
      defaults: { ease: "none" },
      // pin under the sticky topbar, not under the viewport edge
      scrollTrigger: { trigger: intro, start: () => `top ${topbarH()}px`, end: "+=110%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
    })
      .to(q(".intro__hint"), { opacity: 0, duration: 5 }, 1)
      .to(q(".intro__fill"), { clipPath: "inset(-20% -5% -30% -5%)", duration: 26 }, 4)
      .to(q(".intro__line--dash, .topbar__rule--dash"), { clipPath: "inset(0% 0% 0% 100%)", duration: 16, ...slow }, 12)
      .to(q(".intro__line--solid, .topbar__rule--solid"), { clipPath: open, duration: 16, ...slow }, 12)
      .to(q(".intro__cross"), { opacity: 0, duration: 10, ...slow }, 12)
      .to(q(".intro__bg"), { opacity: 1, duration: 14, ...slow }, 16)
      .to(q(".intro__gold"), { clipPath: open, duration: 16, ease: "power2.inOut" }, 18)
      .to(q(".intro__wire"), { opacity: 0, duration: 10, ...slow }, 20)
      .to(q(".intro__decor"), { opacity: 1, duration: 12, ...slow }, 23)
      .to({}, { duration: 14 }); // rest on the finished drawing before the page moves on

    // On load the wireframe draws itself before the visitor takes over: the frame opens from the
    // top-left corner, the diagonals grow out of the centre, the arch rises, the headline slides in.
    // These tween other properties than the scroll scene, so the two never fight.
    if (window.scrollY < 5) {
      lenis?.stop();
      gsap.timeline({ defaults: { ease: "power3.inOut" }, onComplete: () => lenis?.start() })
        .from(q(".intro__frame"), { clipPath: "inset(0% 100% 100% 0%)", duration: 1.2 }, 0)
        .from(q(".intro__a"), { yPercent: 60, opacity: 0, duration: 1, ease: "power3.out" }, 0.1)
        .from(q(".intro__cross"), { clipPath: "inset(50% 50% 50% 50%)", duration: 1 }, 0.45)
        .from(q(".intro__wire"), { clipPath: "inset(100% 0% 0% 0%)", duration: 1 }, 0.6)
        .from(q(".intro__ghost"), { opacity: 0, duration: 0.8, ease: "power1.out" }, 0.7)
        .from(q(".intro__hint"), { y: 16, opacity: 0, duration: 0.6, ease: "power2.out" }, 1.25);
    }
  });

  /* ---------- Selected works: a 3D ring of delivered screens (after knc-studio's project wall) ----------
     Pinned for a screen and a half; scrolling turns the ring one card at a time, dragging turns it
     freely and lets go onto the nearest card, focusing a card brings it to the front. */
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const works = document.querySelector(".works");
    if (!works) return;
    const ringEl = works.querySelector(".works__ring");
    const cards = $$(".works__card", works);
    const num = works.querySelector(".works__num"), title = works.querySelector(".works__title");
    works.classList.add("is-ring");

    let angles = [], R = 0, C = 0, scrollRot = 0, drag = 0, front = -1;
    const proxy = { rot: 0 };
    const turnTo = gsap.quickTo(proxy, "rot", { duration: 0.9, ease: "power3.out" });
    const wrap = a => ((a + 540) % 360) - 180;

    const layout = () => {
      const dw = Math.min(innerWidth * (innerWidth < 700 ? 0.62 : 0.4), 540), pw = dw * 0.42, gap = dw * 0.14;
      const widths = cards.map(c => (c.classList.contains("works__card--phone") ? pw : dw));
      C = widths.reduce((s, w) => s + w + gap, 0);
      R = C / (2 * Math.PI);
      let at = 0;
      angles = widths.map(w => { const a = ((at + w / 2) / C) * 360; at += w + gap; return a; });
      cards.forEach((c, i) => { c.style.width = `${widths[i]}px`; });
    };
    const scrollFor = p => -(angles[0] + p * (angles[angles.length - 1] - angles[0]));

    const render = () => {
      let best = 0, bestAbs = 999;
      cards.forEach((c, i) => {
        const a = wrap(angles[i] + proxy.rot), abs = Math.abs(a);
        c.style.transform = `translateZ(${-R}px) rotateY(${a}deg) translateZ(${R}px)`;
        c.style.opacity = abs > 95 ? 0 : 1 - (abs / 95) * 0.55;
        c.style.zIndex = String(1000 - Math.round(abs * 5));
        if (abs < bestAbs) { bestAbs = abs; best = i; }
      });
      if (best !== front) {
        cards[front]?.classList.remove("is-front");
        cards[best].classList.add("is-front");
        front = best;
        num.textContent = `${String(best + 1).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
        title.textContent = `${cards[best].dataset.client} · ${cards[best].dataset.label}`;
      }
    };

    layout();
    proxy.rot = scrollFor(0);
    render();
    gsap.ticker.add(render);

    const st = ScrollTrigger.create({
      trigger: works, start: () => `top ${topbarH()}px`, end: "+=150%", pin: true, invalidateOnRefresh: true,
      onUpdate: self => { scrollRot = scrollFor(self.progress); turnTo(scrollRot + drag); },
    });

    // drag: 1px of pointer travel = 1px along the ring; on release settle onto the nearest card
    let x0 = 0, d0 = 0, moved = false, dragging = false;
    const down = e => { dragging = true; moved = false; x0 = e.clientX; d0 = drag; ringEl.setPointerCapture(e.pointerId); ringEl.classList.add("is-dragging"); };
    const move = e => {
      if (!dragging) return;
      const dx = e.clientX - x0;
      if (Math.abs(dx) > 6) moved = true;
      drag = d0 + (dx / C) * 360;
      turnTo(scrollRot + drag);
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      ringEl.classList.remove("is-dragging");
      const total = scrollRot + drag;
      const nearest = angles.reduce((b, a) => (Math.abs(wrap(a + total)) < Math.abs(wrap(b + total)) ? a : b));
      drag += -wrap(nearest + total);
      turnTo(scrollRot + drag);
    };
    const stopClickAfterDrag = e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } };
    const focusCard = e => {
      const i = cards.indexOf(e.target.closest(".works__card"));
      if (i < 0) return;
      drag = -wrap(angles[i] + scrollRot);
      turnTo(scrollRot + drag);
    };
    ringEl.addEventListener("pointerdown", down);
    ringEl.addEventListener("pointermove", move);
    ringEl.addEventListener("pointerup", up);
    ringEl.addEventListener("pointercancel", up);
    ringEl.addEventListener("click", stopClickAfterDrag, true);
    ringEl.addEventListener("focusin", focusCard);
    const onResize = () => { layout(); st.refresh(); };
    window.addEventListener("resize", onResize);

    return () => {
      gsap.ticker.remove(render);
      window.removeEventListener("resize", onResize);
      ["pointerdown", "pointermove", "pointerup", "pointercancel"].forEach((t, i) => ringEl.removeEventListener(t, [down, move, up, up][i]));
      ringEl.removeEventListener("click", stopClickAfterDrag, true);
      ringEl.removeEventListener("focusin", focusCard);
      works.classList.remove("is-ring");
      cards.forEach(c => { c.style.cssText = ""; c.classList.remove("is-front"); });
    };
  });

  /* ---------- One quiet fade-up per block as it enters ---------- */
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const items = $$(".section__head, .case__head, .showcase, .skill, .why > *, .why__items article, .steps li, .faq__list, .cta__inner > *");
    gsap.set(items, { opacity: 0, y: 24 });
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 }),
    });
  });
})();
