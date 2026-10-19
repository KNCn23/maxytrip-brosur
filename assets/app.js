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
  // Süreler iş günü cinsinden tahmini aralıklardır; null = görüşmede netleşir.
  // open: grup sayfa açılışında açık mı (seçili kalem içeren gruplar her zaman açılır)
  const GROUPS = [
    { label: "Temel: ne tür bir site?", ids: ["site", "booking", "catalog", "platform"], open: true },
    { label: "Müşteri deneyimi", ids: ["rules", "search", "cart", "account", "popup"], open: true },
    { label: "Ödeme", ids: ["pos", "payopts", "refunds"] },
    { label: "Yönetim ve rapor", ids: ["panel", "crm", "reports", "finance", "analytics"] },
    { label: "Otomasyon", ids: ["mail", "reminder", "aftersale", "whatsapp", "excel"] },
    { label: "Görünürlük", ids: ["lang", "seo", "migrate", "ads"] },
    { label: "Özel işler", ids: ["custom"] },
  ];

  const ITEMS = {
    site: {
      title: "Tanıtım sitesi",
      desc: "İşletmenizi anlatan, telefonda düzgün görünen, hızlı bir site. İletişim ve teklif formu dahil.",
      days: [5, 10],
      lite: { label: "Tek sayfa", days: [3, 5] },
    },
    booking: {
      title: "Rezervasyon / randevu sistemi",
      desc: "Tarih, saat, kontenjan ve kişi sayısına göre online yer ayırma; müşteriye onay e-postası.",
      days: [10, 18],
    },
    catalog: {
      title: "Ürün kataloğu + sipariş / teklif formu",
      desc: "Ürünlerinizi fiyatıyla listeleyin; gelen sipariş ve teklif talepleri panelinize düşsün.",
      days: [6, 12],
      lite: { label: "Yalnızca katalog + teklif formu", days: [4, 7] },
    },
    platform: {
      title: "Üyelikli platform (SaaS)",
      desc: "Hizmetinizi başka işletmelere abonelikle satın: her müşteriye ayrı panel, paketler ve üyelik yenileme. Taply gibi.",
      days: null,
    },
    rules: {
      title: "Gelişmiş rezervasyon kuralları",
      desc: "Yetişkin/çocuk ayrımı ve yaşa göre fiyat, “en az X yaş” sınırı, müşterinin alış noktası ya da adresini yazması.",
      days: [3, 5],
    },
    search: {
      title: "Akıllı arama",
      desc: "Yazım hatalarına rağmen doğru sonucu getirir; kategori, bölge ve tarihe göre süzer.",
      days: [1, 2],
    },
    cart: {
      title: "Sepet + paket + artan indirim",
      desc: "Birden fazla ürün ya da hizmet tek ödemede; çakışan tarih kontrolü, paket satış ve çok alana kademeli indirim.",
      days: [10, 16],
    },
    account: {
      title: "Müşteri hesabı + sadakat indirimi + favoriler",
      desc: "Tekrar gelen müşteriye özel indirim, geçmiş siparişler ve favoriler tek hesapta.",
      days: [7, 11],
      lite: { label: "Yalnızca favoriler (hesapsız)", days: [1, 2] },
    },
    popup: {
      title: "Kampanya popup + çapraz satış önerileri",
      desc: "Kampanyayı doğru anda duyurun; seçim yapan müşteriye uygun ek ürün ya da hizmet önerilsin.",
      days: [3, 6],
      lite: { label: "Yalnızca kampanya popup", days: [1, 2] },
    },
    payopts: {
      title: "Ek ödeme seçenekleri",
      desc: "Kapora, yerinde/varışta ödeme, havale-EFT; ödeme durumu panelde takip edilir.",
      days: [3, 5],
    },
    refunds: {
      title: "İptal ve iade takibi",
      desc: "İptal koşuluna göre tam ya da kısmi iade hesabı; gün bazlı filtre ve liste.",
      days: [2, 3],
    },
    finance: {
      title: "Maliyet, kâr ve gelir/gider raporu",
      desc: "Tedarikçi ya da iş ortağı bazında maliyet, satış başına kâr ve aylık gelir/gider tablosu.",
      days: [10, 16],
    },
    analytics: {
      title: "Derin analitik",
      desc: "Müşterilerin ülke/şehir dağılımı, sepeti yarıda bırakma oranı, en çok satanlar.",
      days: [5, 8],
      lite: { label: "Yalnızca en çok satanlar", days: [1, 2] },
    },
    reminder: {
      title: "Randevu öncesi hatırlatma + bilgi toplama",
      desc: "Etkinlikten 1–2 gün önce müşteriye saat hatırlatması ve eksik bilgileri (oda no, adres vb.) dolduracağı bağlantı.",
      days: [3, 5],
    },
    aftersale: {
      title: "Satış sonrası e-postalar + memnuniyet anketi",
      desc: "Alışverişten sonra ek teklif (ör. transfer, aksesuar); hizmet bitince kısa bir memnuniyet anketi.",
      days: [4, 7],
    },
    ads: {
      title: "Reklam / banner alanları",
      desc: "Sayfa kenarlarında panelden değiştirilebilen kampanya ya da sponsor alanları.",
      days: [2, 3],
    },
    panel: {
      title: "Yönetim paneli",
      desc: "Metin, görsel, ürün, fiyat ve talepleri kod bilmeden kendiniz yönetin. Kullanıcı rolleri ve işlem geçmişi dahil.",
      days: [5, 10],
    },
    crm: {
      title: "Müşteri takibi (CRM) + hatırlatmalar",
      desc: "Müşteri kartları, görüşme notları ve “tekrar ara” hatırlatmaları tek yerde.",
      days: [4, 8],
    },
    reports: {
      title: "Rapor ve istatistik ekranları",
      desc: "Satış, doluluk, tahsilat ya da ziyaret grafikleri; Excel'e aktarım.",
      days: [3, 7],
    },
    pos: {
      title: "Sanal POS ile online ödeme",
      desc: "Kartla güvenli online tahsilat; ödeme sonucu sunucuda doğrulanır. POS hesabı işletmeniz adına açılır.",
      days: [3, 6],
    },
    mail: {
      title: "Otomatik e-postalar",
      desc: "Onay, hatırlatma, makbuz ve yenileme e-postaları doğru zamanda kendiliğinden gider.",
      days: [2, 5],
    },
    excel: {
      title: "Excel ile içe / dışa aktarma",
      desc: "Ürün, müşteri ya da rezervasyon listelerini Excel'den yükleyin, Excel'e alın.",
      days: [2, 4],
    },
    whatsapp: {
      title: "WhatsApp bildirimleri",
      desc: "Onay ve hatırlatmalar WhatsApp'tan da gitsin. WhatsApp Business hesabı gerekir.",
      days: null,
    },
    lang: {
      title: "Ek dil",
      desc: "AI destekli çeviri, insan redaksiyonu ve o dile özel kontrol turu. Arapça gibi sağdan sola diller dahil.",
      days: [1.5, 3], perUnit: "dil", qty: { min: 1, max: 6, start: 1 },
    },
    seo: {
      title: "Teknik SEO + Google kurulumu",
      desc: "Temiz adresler, site haritası, Google'ın anladığı yapılandırılmış veri, Search Console ve Analytics kurulumu.",
      days: [3, 4],
    },
    migrate: {
      title: "Mevcut siteden taşıma",
      desc: "Wix ya da başka bir sistemdeki içeriğiniz yeni siteye taşınır; eski adresler yönlendirilir, sıralama korunur.",
      days: [2, 5],
    },
    custom: {
      title: "Özel hesaplama / optimizasyon",
      desc: "Rota planlama, fiyat önerisi, vardiya ya da stok hesabı gibi işinize özel bir problem.",
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
    const html = GROUPS.map((g, gi) => {
      const rows = g.ids.map(id => {
        const item = ITEMS[id];
        let opts = "";
        if (item.lite) {
          opts = `<div class="route__opts"><div class="seg" role="radiogroup" aria-label="${item.title} kapsamı">
            <label><input type="radio" name="${id}-v" value="full" checked><span>Tam kapsam</span></label>
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
      return `<details class="routes__group" data-group="${gi}"${g.open ? " open" : ""}>
        <summary class="routes__group-label"><span>${g.label}</span><span class="routes__group-count"></span></summary>
        <div class="routes__group-body">${rows}</div>
      </details>`;
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

    GROUPS.forEach((g, gi) => {
      const n = g.ids.filter(id => state[id].on).length;
      $(`.routes__group[data-group="${gi}"] .routes__group-count`, form).textContent = n ? `${n} seçili` : "";
    });

    $("#sel-count").textContent = count;
    $("#sum-days").textContent = dMax ? `${range([dMin, dMax])} gün` : "—";
    $("#sel-note").hidden = !noDays;
    $("#sel-list").innerHTML = lines.length
      ? lines.map(l => `<li><span>${l.name}</span><span>${l.days}</span></li>`).join("")
      : `<li class="ticket__empty">Soldan bir parça seçerek başlayın.</li>`;

    $("#mini-text").textContent = count ? `${count} kalem · ${dMax ? range([dMin, dMax]) + " gün" : "süre görüşmede"}` : "";
    minibar.count = count;
    updateMinibar();

    const hash = encodeState();
    if (hash) history.replaceState(null, "", `#plan=${hash}`);
    else if (location.hash.startsWith("#plan=")) history.replaceState(null, "", location.pathname + location.search);

    summary = { lines, dMin, dMax };
    updateMail();
  }

  let summary = { lines: [], dMin: 0, dMax: 0 };
  function updateMail() {
    const { lines, dMin, dMax } = summary;
    const brief = $("#brief").value.trim();
    const body = [
      "Merhaba,",
      "",
      ...(brief ? ["İşimiz kısaca:", brief, ""] : []),
      ...(lines.length
        ? [
            "Şu parçalarla ilgileniyoruz:",
            ...lines.map(l => `• ${l.name} — ${l.days}`),
            "",
            dMax ? `Tahmini toplam süre: ${range([dMin, dMax])} iş günü` : "",
            "",
            `Plan bağlantısı: ${shareURL()}`,
          ]
        : ["Bir proje için görüşmek istiyoruz."]),
      "",
      "İşletme / ad:",
      "Telefon (isteğe bağlı):",
    ].join("\n");
    $("#send-mail").href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("KNC Studio — proje talebi")}&body=${encodeURIComponent(body)}`;
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
    return location.origin + location.pathname + (h ? `#plan=${h}` : "");
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
    const initial = decodeURIComponent(location.hash).match(/^#plan=(.+)$/);
    if (initial) {
      decodeState(initial[1]);
      GROUPS.forEach((g, gi) => {
        if (g.ids.some(id => state[id].on)) $(`.routes__group[data-group="${gi}"]`, form).open = true;
      });
    }
    sync();
    if (initial) requestAnimationFrame(() => $("#planla").scrollIntoView());

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
    $("#brief").addEventListener("input", updateMail);

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

  /* ---------- Case screenshot tabs ---------- */
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const select = tab => {
      tabs.forEach(t => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    };
    list.addEventListener("click", e => { const t = e.target.closest('[role="tab"]'); if (t) select(t); });
    list.addEventListener("keydown", e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0 || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      select(next);
      next.focus();
    });
  });

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
