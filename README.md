# MaxyTrip × KNC Studio — Sıradaki Seferler

maxytrip.com'u geliştiren ekipten MaxyTrip'e özel tanıtım (broşür) sitesi.

**Canlı:** https://kncn23.github.io/maxytrip-brosur/

## İçerik

- **Kalkış panosu** — teslim edilen ve sıradaki işleri havalimanı panosu gibi gösteren açılış bölümü
- **Teslim edilenler** — yayındaki maxytrip.com'da teslim edilen 21 özellik, ekran görüntüsü üzerinde işaretli
- **Rota seçici** — sıradaki işleri seçip tahmini süreyi anında gören (ücret görüşmede verilir), seçimi e-postayla gönderen veya bağlantı olarak paylaşan araç (`#secim=...`)
- **Yetkinlikler** — listede olmayan, ekibin yapabildiği işler (rota optimizasyonu vb.)
- Süreç, SSS ve iletişim

## Düzenleme

Bağımlılık ve build adımı yok: saf HTML, CSS ve JavaScript.

| Ne | Nerede |
| --- | --- |
| Metinler, teslim edilen özellikler | `index.html` |
| Sıradaki işler ve süreler | `assets/app.js` → `ITEMS` ve `GROUPS` |
| İletişim e-postası | `assets/app.js` → `CONTACT_EMAIL` ve `index.html` iletişim bölümü |
| Renkler ve yazı tipleri | `assets/styles.css` → `:root` |

## Yerelde çalıştırma

```bash
python3 -m http.server 4173
```

Ardından http://localhost:4173 adresini açın.

Sayfa `noindex` olarak işaretlidir; arama motorlarında listelenmez.
