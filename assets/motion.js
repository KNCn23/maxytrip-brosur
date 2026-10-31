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

  /* ---------- One quiet fade-up per block as it enters ---------- */
  gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
    const items = $$(".section__head, .case__head, .showcase, .skill, .why > *, .why__items article, .steps li, .faq__list, .cta__inner > *");
    gsap.set(items, { opacity: 0, y: 24 });
    ScrollTrigger.batch(items, {
      start: "top 90%",
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.08 }),
    });
  });
})();
