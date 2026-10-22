# KNC Studio — tanıtım sitesi

İki kişilik yazılım stüdyosu KNC Studio'nun müşteri bulmak için kullandığı tanıtım sitesi: yaptığımız işler, sunduğumuz hizmetler ve ziyaretçinin kendi projesini planlayıp bize gönderebildiği planlayıcı.

**Canlı:** https://kncn23.github.io/maxytrip-brosur/

## İçerik

- **Yayındaki işler panosu**: yayındaki projeleri havalimanı panosu gibi gösteren açılış bölümü; son satır “Sizin projeniz”
- **İşlerimiz**: iki örnek proje
  - **MaxyTrip**: tur ve araç kiralama rezervasyon sitesi (ekran görüntüsü üzerinde işaretli, teslim edilen 21 özellik açılır listede)
  - **Taply**: NFC/QR dijital menü platformu; tanıtım sitesi, kafe paneli ve yönetim paneli (sekmeli ekran görüntüleri, telefonda menü)
- **Neler yapıyoruz**: hizmetler (tanıtım sitesi, online satış, yönetim paneli, SaaS, otomasyon, taşıma, optimizasyon)
- **Planlayıcı**: ziyaretçi ihtiyacı olan parçaları seçer, tahmini süreyi anında görür (ücret görüşmede verilir), işini birkaç cümleyle yazar, planı e-postayla gönderir veya bağlantı olarak paylaşır (`#plan=...`)
- **Biz**, süreç, SSS ve iletişim

## Düzenleme

Build adımı yok: saf HTML, CSS ve JavaScript. Animasyonlar için GSAP (ScrollTrigger, SplitText) ve Lenis CDN üzerinden yüklenir; yüklenemezlerse site animasyonsuz çalışmaya devam eder.

| Ne | Nerede |
| --- | --- |
| Metinler, projeler, hizmetler, SSS | `index.html` |
| Planlayıcıdaki parçalar ve süreler | `assets/app.js` → `ITEMS` ve `GROUPS` |
| İletişim e-postası | `assets/app.js` → `CONTACT_EMAIL` ve `index.html` iletişim bölümü |
| Renkler ve yazı tipleri | `assets/styles.css` → `:root` |
| Animasyonlar (yumuşak kaydırma, başlık ve kart girişleri, sayaçlar) | `assets/motion.js` |
| Ekran görüntüleri | `assets/img/` (Taply görüntüleri yerel demo verisiyle alındı) |

## Yerelde çalıştırma

```bash
python3 -m http.server 4173
```

Ardından http://localhost:4173 adresini açın.
