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

  /* ---------- Lenis, driven by GSAP's ticker ---------- */
  if (Lenis) {
    const lenis = new Lenis({ stopInertiaOnNavigate: true });
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
      scrollTrigger: { trigger: intro, start: () => `top ${document.querySelector(".topbar").offsetHeight}px`, end: "+=110%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
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
