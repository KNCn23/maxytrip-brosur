(() => {
  "use strict";

  const CONTACT_EMAIL = "kaancanolcay@gmail.com";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Departure board ---------- */
  const FLAP_CHARS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ0123456789&";
  const board = $("#board");

  function makeFlaps(text, width, cls) {
    const wrap = document.createElement("span");
    wrap.className = `flaps ${cls}`;
    const padded = text.padEnd(width, " ");
    for (const ch of padded) {
      const cell = document.createElement("span");
      cell.className = "flap" + (ch === " " ? " is-space" : "");
      cell.dataset.target = ch;
      cell.textContent = ch === " " ? "" : ch;
      wrap.appendChild(cell);
    }
    return wrap;
  }

  function spin(cells, baseDelay = 0) {
    if (reduceMotion) return;
    cells.forEach((cell, i) => {
      const target = cell.dataset.target;
      if (target === " ") return;
      let turns = 5 + Math.floor(Math.random() * 9);
      setTimeout(function tick() {
        cell.classList.remove("is-turning");
        void cell.offsetWidth;
        cell.classList.add("is-turning");
        if (turns-- > 0) {
          cell.textContent = FLAP_CHARS[Math.floor(Math.random() * FLAP_CHARS.length)];
          setTimeout(tick, 55);
        } else {
          cell.textContent = target;
        }
      }, baseDelay + i * 18);
    });
  }

  if (board) {
    const rows = $$("li", board);
    const nameWidth = Math.max(...rows.map(r => r.dataset.name.length));
    const statusWidth = Math.max(...rows.map(r => r.dataset.status.length));
    rows.forEach((row, r) => {
      const live = row.dataset.status === "YAYINDA";
      row.setAttribute("aria-label", `${row.dataset.code}: ${row.dataset.name}, ${live ? "yayında" : "sırada"}`);
      row.append(
        makeFlaps(row.dataset.code, 4, "code"),
        makeFlaps(row.dataset.name, nameWidth, "name"),
        makeFlaps(row.dataset.status, statusWidth, "status" + (live ? " status--live" : ""))
      );
      $$(".flaps", row).forEach(f => f.setAttribute("aria-hidden", "true"));
      spin($$(".flap", row), 350 + r * 120);
      row.addEventListener("mouseenter", () => spin($$(".flap", row)));
    });
  }

  const clock = $("#clock");
  if (clock) {
    const fmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });
    const tickClock = () => { clock.textContent = fmt.format(new Date()); };
    tickClock();
    setInterval(tickClock, 15000);
  }

  /* ---------- Planner ---------- */
  const GROUPS = [
    { label: "Görünürlük ve satış", ids: ["seo", "popup", "account"] },
    { label: "Operasyon ve rapor", ids: ["supplier", "analytics", "transfer"] },
    { label: "Yeni pazarlar", ids: ["lang"] },
    { label: "Kapsamı görüşmede netleşecekler", ids: ["whatsapp", "cyrillic", "cart"] },
  ];

  const ITEMS = {
    seo: {
      title: "İçeriğin arama motorunda görünmesi (prerender)",
      desc: "Google tur sayfalarınızın içeriğini eksiksiz okur. Mevcut teknik SEO temelinin üzerine kurulur.",
      days: [5, 9],
    },
    popup: {
      title: "Kampanya popup + çapraz satış önerileri",
      desc: "Kampanyayı doğru anda duyurun; tur seçen misafire uygun ek tur ve araç önerilsin.",
      days: [3, 6],
      lite: { label: "Yalnızca kampanya popup", days: null },
    },
    account: {
      title: "Kişisel hesap + üyelik/sadakat indirimi + favoriler",
      desc: "Tekrar gelen misafire özel indirim, geçmiş rezervasyonlar ve favori turlar tek hesapta.",
      days: [7, 11],
      lite: { label: "Yalnızca favoriler (hesapsız)", days: null },
    },
    supplier: {
      title: "Tedarikçi / acente sistemi + maliyet-kâr + gelir/gider raporu",
      desc: "Hangi turun hangi tedarikçiden geldiğini, tur başına maliyeti, kârı ve gelir/gider tablosunu tek ekranda görün.",
      days: [10, 16],
    },
    analytics: {
      title: "Derin analitik",
      desc: "Misafirlerin ülke/uyruk dağılımı, rezervasyonu yarıda bırakma oranı ve en çok satan paketler.",
      days: [5, 8],
      lite: { label: "Yalnızca en çok satan paket", days: null },
    },
    transfer: {
      title: "Araç/transfer teklifi maili + tur sonrası memnuniyet anketi",
      desc: "Rezervasyondan sonra misafire araç kiralama veya transfer teklifi gider; tur bitince kısa bir anket.",
      days: [4, 7],
    },
    lang: {
      title: "Yeni dil ekleme",
      desc: "AI destekli çeviri + redaksiyon ve o dile özel kontrol turu. Çeviri altyapısı hazır olduğu için her yeni dil kısa sürer.",
      days: [1.5, 3], perUnit: "dil", qty: { min: 1, max: 6, start: 1 },
    },
    whatsapp: {
      title: "WhatsApp otomatik bilgilendirme",
      desc: "E-postayla giden rezervasyon detayı ve alış saati hatırlatması WhatsApp'tan da gider. WhatsApp Business hesabı gerekir.",
      days: null,
    },
    cyrillic: {
      title: "Kiril alfabesi desteği",
      desc: "Rusça gibi Kiril alfabeli diller için yazı tipi ve karakter desteği.",
      days: null,
    },
    cart: {
      title: "Sepette tarih çakışma kontrolü + paket turlar",
      desc: "Aynı saate denk gelen iki tur sepete eklenemez; birkaç tur paket olarak satılabilir.",
      days: null,
    },
  };

  const state = {}; // id -> { on, lite, qty }
  Object.keys(ITEMS).forEach(id => { state[id] = { on: false, lite: false, qty: ITEMS[id].qty?.start ?? 1 }; });

  const num = n => n.toLocaleString("tr-TR", { maximumFractionDigits: 1 });
  const range = ([a, b], unit) => (a === b ? `${num(a)}` : `${num(a)}–${num(b)}`) + (unit ? ` ${unit}` : "");

  function effective(id) {
    const item = ITEMS[id], s = state[id];
    if (s.lite && item.lite) return { days: item.lite.days, name: `${item.title.split(" + ")[0]}: ${item.lite.label.toLocaleLowerCase("tr")}` };
    const k = item.qty ? s.qty : 1;
    return {
      days: item.days && [item.days[0] * k, item.days[1] * k],
      name: item.title + (item.qty ? ` (${s.qty} dil)` : ""),
    };
  }

  function metaHTML(id) {
    const item = ITEMS[id];
    if (!item.days) return `<span class="tbd">Süre görüşmede</span>`;
    const unit = item.perUnit ? ` / ${item.perUnit}` : "";
    return `${range(item.days)} gün${unit}<small>tahmini süre</small>`;
  }

  const form = $("#planner");
  const minibar = { count: 0, inPlanner: false, ticketVisible: false };
  function updateMinibar() {
    $("#minibar").classList.toggle("is-on", minibar.count > 0 && minibar.inPlanner && !minibar.ticketVisible);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => { minibar.inPlanner = en.isIntersecting; updateMinibar(); }).observe($("#planner"));
    new IntersectionObserver(([en]) => { minibar.ticketVisible = en.isIntersecting; updateMinibar(); }).observe($("#ozet"));
  }

  function render() {
    const html = GROUPS.map(g => {
      const rows = g.ids.map(id => {
        const item = ITEMS[id];
        let opts = "";
        if (item.lite) {
          opts = `<div class="route__opts"><div class="seg" role="radiogroup" aria-label="${item.title} kapsamı">
            <label><input type="radio" name="${id}-v" value="full" checked><span>Tam paket</span></label>
            <label><input type="radio" name="${id}-v" value="lite"><span>${item.lite.label}</span></label>
          </div></div>`;
        } else if (item.qty) {
          opts = `<div class="route__opts"><div class="stepper" aria-label="Dil sayısı">
            <button type="button" data-step="-1" aria-label="Bir dil azalt">−</button>
            <output aria-live="polite">1 dil</output>
            <button type="button" data-step="1" aria-label="Bir dil ekle">+</button>
          </div></div>`;
        }
        return `<div class="route" data-id="${id}">
          <input class="route__check" type="checkbox" id="r-${id}" aria-describedby="d-${id}">
          <label class="route__title" for="r-${id}">${item.title}</label>
          <div class="route__meta">${metaHTML(id)}</div>
          <p class="route__desc" id="d-${id}">${item.desc}</p>
          ${opts}
        </div>`;
      }).join("");
      return `<p class="routes__group-label">${g.label}</p>${rows}`;
    }).join("");
    form.insertAdjacentHTML("beforeend", html);
  }

  function sync() {
    let dMin = 0, dMax = 0, count = 0, noDays = false;
    const lines = [];
    Object.keys(ITEMS).forEach(id => {
      const s = state[id];
      const row = $(`.route[data-id="${id}"]`, form);
      row.classList.toggle("is-on", s.on);
      $(".route__check", row).checked = s.on;
      const lite = $(`input[value="lite"]`, row);
      if (lite) { lite.checked = s.lite; $(`input[value="full"]`, row).checked = !s.lite; }
      const out = $("output", row);
      if (out) {
        out.textContent = `${s.qty} dil`;
        $('[data-step="-1"]', row).disabled = s.qty <= ITEMS[id].qty.min;
        $('[data-step="1"]', row).disabled = s.qty >= ITEMS[id].qty.max;
      }
      if (!s.on) return;
      count++;
      const e = effective(id);
      if (e.days) { dMin += e.days[0]; dMax += e.days[1]; }
      if (!e.days) noDays = true;
      lines.push({ name: e.name, days: e.days ? `${range(e.days)} gün` : "görüşmede" });
    });

    $("#sel-count").textContent = count;
    $("#sum-days").textContent = dMax ? `${range([dMin, dMax])} gün` : "—";
    $("#sel-note").hidden = !noDays;
    $("#sel-list").innerHTML = lines.length
      ? lines.map(l => `<li><span>${l.name}</span><span>${l.days}</span></li>`).join("")
      : `<li class="ticket__empty">Soldan bir iş seçerek başlayın.</li>`;

    $("#mini-text").textContent = count ? `${count} iş · ${dMax ? range([dMin, dMax]) + " gün" : "süre görüşmede"}` : "";
    minibar.count = count;
    updateMinibar();

    const hash = encodeState();
    if (hash) history.replaceState(null, "", `#secim=${hash}`);
    else if (location.hash.startsWith("#secim=")) history.replaceState(null, "", location.pathname + location.search);

    const body = lines.length
      ? [
          "Merhaba,",
          "",
          "MaxyTrip için şu işlerle ilgileniyoruz:",
          ...lines.map(l => `• ${l.name} — ${l.days}`),
          "",
          dMax ? `Tahmini toplam süre: ${range([dMin, dMax])} iş günü` : "",
          "Ücret teklifini görüşmede konuşmak istiyoruz.",
          "",
          `Seçim bağlantısı: ${shareURL()}`,
        ].join("\n")
      : "Merhaba,\n\nMaxyTrip için bir sonraki adımları konuşmak istiyoruz.";
    $("#send-mail").href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("MaxyTrip — seçtiğimiz işler")}&body=${encodeURIComponent(body)}`;
  }

  function encodeState() {
    return Object.keys(ITEMS).filter(id => state[id].on).map(id => {
      const s = state[id];
      if (s.lite) return `${id}.lite`;
      if (ITEMS[id].qty) return `${id}.${s.qty}`;
      return id;
    }).join(",");
  }

  function decodeState(str) {
    str.split(",").forEach(tok => {
      const [id, mod] = tok.split(".");
      if (!ITEMS[id]) return;
      state[id].on = true;
      if (mod === "lite" && ITEMS[id].lite) state[id].lite = true;
      const q = parseInt(mod, 10);
      if (ITEMS[id].qty && q) state[id].qty = Math.min(ITEMS[id].qty.max, Math.max(ITEMS[id].qty.min, q));
    });
  }

  function shareURL() {
    const h = encodeState();
    return location.origin + location.pathname + (h ? `#secim=${h}` : "");
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove("is-on"), 2200);
  }

  if (form) {
    render();
    const initial = decodeURIComponent(location.hash).match(/^#secim=(.+)$/);
    if (initial) decodeState(initial[1]);
    sync();
    if (initial) requestAnimationFrame(() => $("#siradaki").scrollIntoView());

    form.addEventListener("change", e => {
      const row = e.target.closest(".route");
      if (!row) return;
      const id = row.dataset.id;
      if (e.target.classList.contains("route__check")) state[id].on = e.target.checked;
      if (e.target.type === "radio") { state[id].lite = e.target.value === "lite"; state[id].on = true; }
      sync();
    });
    form.addEventListener("click", e => {
      const btn = e.target.closest("[data-step]");
      const row = e.target.closest(".route");
      if (btn) {
        const id = row.dataset.id, q = ITEMS[id].qty;
        state[id].qty = Math.min(q.max, Math.max(q.min, state[id].qty + Number(btn.dataset.step)));
        state[id].on = true;
        sync();
        return;
      }
      // Clicking anywhere on the card (but not on a control) toggles it.
      if (row && !e.target.closest("input, label, button, .route__opts")) {
        state[row.dataset.id].on = !state[row.dataset.id].on;
        sync();
      }
    });
    form.addEventListener("submit", e => e.preventDefault());

    $("#copy-link").addEventListener("click", async () => {
      const url = shareURL();
      try {
        await navigator.clipboard.writeText(url);
        toast("Bağlantı kopyalandı");
      } catch {
        window.prompt("Bağlantıyı kopyalayın:", url);
      }
    });
  }

  /* ---------- Nav ---------- */
  const nav = $(".nav");
  const toggle = $(".nav__toggle");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$(".nav a").forEach(a => a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  }));

  if ("IntersectionObserver" in window) {
    const links = new Map($$(".nav a").map(a => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.removeAttribute("aria-current"));
        links.get(en.target.id)?.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

    const map = $(".route-map");
    if (map) new IntersectionObserver(([en]) => map.classList.toggle("is-visible", en.isIntersecting)).observe(map);
  }

  // Hero entrance: every .reveal sits above the fold, so stagger them in on the first frame.
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = `${i * 90}ms`; });
  requestAnimationFrame(() => requestAnimationFrame(() => $$(".reveal").forEach(el => el.classList.add("is-in"))));
})();
