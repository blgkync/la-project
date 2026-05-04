# LA Project - ArGe Lab Yonetim Sistemi

R&D (ArGe) laboratuvar is ajandasi ve deney takip uygulamasi. Modern, karanlik temali, bilimsel/teknolojik estetige sahip profesyonel bir lab yonetim araci.

## Teknoloji Stack

- **Backend:** Node.js + Express.js (MVC pattern)
- **Frontend:** Pure Vanilla JavaScript (framework yok)
- **CSS:** Tailwind CSS (CDN)
- **Database:** SQLite (better-sqlite3)
- **Template Engine:** EJS
- **Charts:** Chart.js

## Hizli Baslangic

### Gereksinimler
- Node.js 18+
- npm

### Kurulum

```bash
cd la-project
npm install
npm run dev
```

Tarayicida `http://localhost:3000` adresini acin. Veritabani ilk calistirmada otomatik olusturulur ve ornek verilerle doldurulur.

### Ortam Degiskenleri

| Degisken | Aciklama | Varsayilan |
|----------|----------|------------|
| PORT | Sunucu portu | 3000 |
| NODE_ENV | Ortam | development |
| DB_PATH | Veritabani dosya yolu | ./db/la-project.db |

## Ozellikler

### Gosterge Paneli
- Aktif deneyler, yaklasan etkinlikler, is paketi ilerlemesi
- Deney durumlari ve aylik aktivite grafikleri (Chart.js)
- Son lab kayitlari, dusuk stok ve bakim uyarilari

### Deneyler (CRUD)
- Liste ve Kanban gorunumu (surukle-birak ile durum degistirme)
- Duruma, oncelike ve anahtar kelimeye gore filtreleme
- Detay sayfasi: hipotez, metodoloji, parametreler, sonuclar, gozlemler
- Durum: Planli / Devam Ediyor / Tamamlandi / Basarisiz / Beklemede
- Oncelik: Dusuk / Orta / Yuksek / Kritik

### Ajanda (Takvim)
- Ay, hafta ve gun gorunumu
- Renk kodlu etkinlik turleri: Deney, Toplanti, Son Tarih, Bakim, Degerlendirme
- Takvim uzerine tiklayarak yeni etkinlik ekleme
- Etkinlik detay, duzenleme, silme

### Is Paketleri
- TUBITAK tarzi is paketi yonetimi (IP-1, IP-2...)
- Gantt cizelgesi zaman gorunumu
- Teslim edilecekler ve kilometre taslari
- Butce takibi ve ilerleme yuzdeleri

### Lab Gunlugu
- Kronolojik zaman cizelgesi gorunumu
- Kategoriler: Gozlem, Olcum, Not, Sorun, Fikir
- Deneylere baglanti, etiketler
- Yazar ve kategoriye gore filtreleme

### Ekipman & Malzeme
- Ekipman envanteri: durum, kalibrasyon, bakim takibi
- Malzeme stok yonetimi, dusuk stok uyarilari
- Tablo gorunumu, filtreleme ve arama

### Raporlar
- Tarih araligina gore ozet rapor
- Deney ve is paketi istatistikleri
- Dusuk stok malzeme listesi
- Yazdir (print-friendly)

## API Endpointleri

### Deneyler
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/experiments | Tum deneyleri listele |
| GET | /api/v1/experiments/stats | Istatistikler |
| GET | /api/v1/experiments/:id | ID ile getir |
| POST | /api/v1/experiments | Yeni deney olustur |
| PUT | /api/v1/experiments/:id | Deney guncelle |
| DELETE | /api/v1/experiments/:id | Deney sil |

### Takvim Etkinlikleri
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/calendar | Etkinlikleri listele |
| GET | /api/v1/calendar/today | Bugunun etkinlikleri |
| GET | /api/v1/calendar/upcoming | Yaklasan etkinlikler |
| GET | /api/v1/calendar/:id | ID ile getir |
| POST | /api/v1/calendar | Yeni etkinlik olustur |
| PUT | /api/v1/calendar/:id | Etkinlik guncelle |
| DELETE | /api/v1/calendar/:id | Etkinlik sil |

### Is Paketleri
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/workpackages | Tum is paketleri |
| GET | /api/v1/workpackages/summary | Ozet bilgi |
| GET | /api/v1/workpackages/:id | ID ile getir |
| POST | /api/v1/workpackages | Yeni is paketi |
| PUT | /api/v1/workpackages/:id | Is paketi guncelle |
| DELETE | /api/v1/workpackages/:id | Is paketi sil |

### Lab Gunlugu
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/notebook | Tum kayitlar |
| GET | /api/v1/notebook/authors | Yazar listesi |
| GET | /api/v1/notebook/recent | Son kayitlar |
| GET | /api/v1/notebook/:id | ID ile getir |
| POST | /api/v1/notebook | Yeni kayit |
| PUT | /api/v1/notebook/:id | Kayit guncelle |
| DELETE | /api/v1/notebook/:id | Kayit sil |

### Ekipman
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/equipment | Tum ekipman |
| GET | /api/v1/equipment/stats | Durum istatistikleri |
| GET | /api/v1/equipment/:id | ID ile getir |
| POST | /api/v1/equipment | Yeni ekipman |
| PUT | /api/v1/equipment/:id | Ekipman guncelle |
| DELETE | /api/v1/equipment/:id | Ekipman sil |

### Malzeme
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/materials | Tum malzemeler |
| GET | /api/v1/materials/low-stock | Dusuk stok |
| GET | /api/v1/materials/:id | ID ile getir |
| POST | /api/v1/materials | Yeni malzeme |
| PUT | /api/v1/materials/:id | Malzeme guncelle |
| DELETE | /api/v1/materials/:id | Malzeme sil |

### Raporlar
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/reports/generate | Rapor olustur |

### Dashboard
| Metod | Endpoint | Aciklama |
|-------|----------|----------|
| GET | /api/v1/dashboard/summary | Ozet bilgileri |

## Proje Yapisi

```
la-project/
├── server.js              # Ana giris noktasi
├── package.json
├── .env                   # Ortam degiskenleri
├── db/
│   ├── database.js        # SQLite baglanti ve tablo olusturma
│   └── seed.js            # Ornek veri yukleme
├── models/
│   ├── Experiment.js      # Deney modeli
│   ├── CalendarEvent.js   # Takvim etkinlik modeli
│   ├── WorkPackage.js     # Is paketi modeli
│   ├── LabEntry.js        # Lab kayit modeli
│   ├── Equipment.js       # Ekipman modeli
│   └── Material.js        # Malzeme modeli
├── routes/
│   ├── dashboard.js       # Sayfa route'lari
│   ├── experiments.js
│   ├── calendar.js
│   ├── workpackages.js
│   ├── notebook.js
│   ├── equipment.js
│   ├── reports.js
│   └── api/               # REST API route'lari
│       ├── experiments.js
│       ├── calendar.js
│       ├── workpackages.js
│       ├── notebook.js
│       ├── equipment.js
│       ├── materials.js
│       ├── dashboard.js
│       └── reports.js
├── views/
│   ├── layout.ejs         # Ana layout
│   ├── partials/
│   │   ├── sidebar.ejs    # Yan menu
│   │   ├── header.ejs     # Ust menu
│   │   ├── 404.ejs
│   │   └── error.ejs
│   ├── dashboard.ejs
│   ├── experiments.ejs
│   ├── experiment-detail.ejs
│   ├── calendar.ejs
│   ├── workpackages.ejs
│   ├── notebook.ejs
│   ├── equipment.ejs
│   └── reports.ejs
└── public/
    ├── css/
    │   └── app.css        # Ozel stiller
    └── js/
        ├── app.js         # Ortak islevler (API client, toast, modal)
        ├── dashboard.js
        ├── experiments.js
        ├── experiment-detail.js
        ├── calendar.js
        ├── workpackages.js
        ├── notebook.js
        ├── equipment.js
        └── reports.js
```

## Komutlar

| Komut | Aciklama |
|-------|----------|
| `npm run dev` | Gelistirme sunucusu (nodemon) |
| `npm start` | Uretim sunucusu |
| `npm run seed` | Veritabanini yeniden doldur |

## Lisans

MIT
