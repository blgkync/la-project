const { getDB } = require('./database');

function seed() {
  const db = getDB();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  function d(day, hour = 9, min = 0) {
    return new Date(year, month, day, hour, min).toISOString().slice(0, 16);
  }
  function dateOnly(day) {
    const dt = new Date(year, month, day);
    return dt.toISOString().slice(0, 10);
  }

  // --- Projects ---
  const insertProject = db.prepare(`
    INSERT INTO projects (name, code, type, description, status, start_date, end_date, budget, spent, pi_name, institution, program, tags, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projects = [
    {
      name: 'Ileri Kompozit Malzeme Gelistirme',
      code: 'TUBITAK-1001-2024',
      type: 'tubitak',
      description: 'Karbon fiber ve cam fiber takviyeli ileri kompozit malzemelerin gelistirilmesi, mekanik ozelliklerinin optimizasyonu ve endustriyel uygulama potansiyelinin arastirilmasi.',
      status: 'active',
      start_date: dateOnly(-90),
      end_date: dateOnly(270),
      budget: 850000,
      spent: 215000,
      pi_name: 'Prof. Dr. Ahmet Yilmaz',
      institution: 'DeepTech ArGe Merkezi',
      program: '1001',
      tags: JSON.stringify(['kompozit', 'karbon-fiber', 'mekanik-test']),
      color: '#06b6d4'
    },
    {
      name: 'Akilli Nanolif Uretim Teknolojileri',
      code: 'TUBITAK-1501-2025',
      type: 'tubitak',
      description: 'Elektroegirim yontemiyle akilli nanolif membranlarinin uretilmesi ve filtrasyon, biyomedikal ve enerji depolama uygulamalarinin gelistirilmesi.',
      status: 'active',
      start_date: dateOnly(-30),
      end_date: dateOnly(330),
      budget: 1200000,
      spent: 85000,
      pi_name: 'Doc. Dr. Elif Yilmaz',
      institution: 'DeepTech ArGe Merkezi',
      program: '1501',
      tags: JSON.stringify(['nanolif', 'elektroegirim', 'membran']),
      color: '#8b5cf6'
    },
    {
      name: 'Termal Yonetim Sistemleri',
      code: 'LAB-TERM-01',
      type: 'lab',
      description: 'Grafen ve karbon nanotup katkili polimer kompozitlerin termal iletkenlik optimizasyonu ve elektronik cihazlar icin termal yonetim cozumleri.',
      status: 'active',
      start_date: dateOnly(-60),
      end_date: dateOnly(120),
      budget: 180000,
      spent: 62000,
      pi_name: 'Dr. Elif Yilmaz',
      institution: 'DeepTech ArGe Merkezi',
      program: null,
      tags: JSON.stringify(['termal', 'grafen', 'iletkenlik']),
      color: '#f59e0b'
    },
    {
      name: 'Biyobozunur Polimer Arastirmalari',
      code: 'LAB-BIO-01',
      type: 'lab',
      description: 'PLA, PCL ve diger biyobozunur polimerlerin harmanlanmasi, islenmesi ve biyobozunma kinetiklerinin incelenmesi.',
      status: 'on_hold',
      start_date: dateOnly(-45),
      end_date: dateOnly(180),
      budget: 120000,
      spent: 28000,
      pi_name: 'Burak Kaya',
      institution: 'DeepTech ArGe Merkezi',
      program: null,
      tags: JSON.stringify(['biyopolimer', 'PLA', 'PCL', 'surdurulebilirlik']),
      color: '#10b981'
    }
  ];

  const insertProjectTx = db.transaction(() => {
    for (const p of projects) {
      insertProject.run(p.name, p.code, p.type, p.description, p.status, p.start_date, p.end_date, p.budget, p.spent, p.pi_name, p.institution, p.program, p.tags, p.color);
    }
  });
  insertProjectTx();

  // --- Experiments (with project_id) ---
  const insertExp = db.prepare(`
    INSERT INTO experiments (project_id, title, hypothesis, methodology, parameters, status, priority, start_date, end_date, researcher, results, observations, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const experiments = [
    {
      project_id: 1,
      title: 'Kompozit Malzeme Dayanklilik Testi',
      hypothesis: 'Karbon fiber takviyeli epoksi kompozitlerin darbe dayanimi, cam fiber takviyeli olanlara gore %40 daha yuksek olacaktir.',
      methodology: 'ASTM D7136 standardina uygun dusuk hizli darbe testi. 3 farkli enerji seviyesinde (10J, 20J, 30J) testler yapilacak.',
      parameters: JSON.stringify([{ key: 'Darbe Enerjisi', value: '10J, 20J, 30J' }, { key: 'Numune Boyutu', value: '150x100x4 mm' }, { key: 'Sicaklik', value: '23 +/- 2 C' }]),
      status: 'in_progress', priority: 'high',
      start_date: dateOnly(1), end_date: dateOnly(28),
      researcher: 'Dr. Elif Yilmaz',
      results: 'Ilk sonuclar hipotezi destekler yonde. 10J testleri tamamlandi.',
      observations: 'Karbon fiber numunelerde delaminasyon gozlenmedi.',
      tags: JSON.stringify(['kompozit', 'darbe', 'mekanik-test'])
    },
    {
      project_id: 3,
      title: 'Termal Iletkenlik Optimizasyonu',
      hypothesis: 'Grafen katkili polimer kompozitlerin termal iletkenligi, agirlikca %2 grafen ile 5 kat arttirilabilir.',
      methodology: 'Hot disk yontemi ile termal iletkenlik olcumu. Farkli grafen oranlari (%0.5, %1, %2, %5) test edilecek.',
      parameters: JSON.stringify([{ key: 'Grafen Orani', value: '%0.5, %1, %2, %5' }, { key: 'Matris Malzeme', value: 'Epoksi (Araldite LY 1564)' }, { key: 'Olcum Metodu', value: 'Hot Disk TPS 2500S' }]),
      status: 'planned', priority: 'medium',
      start_date: dateOnly(10), end_date: dateOnly(25),
      researcher: 'Burak Kaya',
      results: null,
      observations: 'Grafen dispersiyon kalitesi kritik parametre olarak belirlendi.',
      tags: JSON.stringify(['termal', 'grafen', 'polimer'])
    },
    {
      project_id: 1,
      title: 'Yuzey Isleme Prosesi Gelistirme',
      hypothesis: 'Plazma yuzey islemi, yapistirma mukavemetini en az %60 arttiracaktir.',
      methodology: 'Atmosferik plazma islemi sonrasi lap-shear testi ile yapistirma mukavemeti olcumu.',
      parameters: JSON.stringify([{ key: 'Plazma Gucu', value: '200W, 400W, 600W' }, { key: 'Isleme Suresi', value: '30s, 60s, 120s' }, { key: 'Gaz', value: 'Argon + O2' }]),
      status: 'completed', priority: 'high',
      start_date: dateOnly(-20), end_date: dateOnly(-2),
      researcher: 'Dr. Elif Yilmaz',
      results: '400W/60s kombinasyonu en iyi sonucu verdi. Yapistirma mukavemeti %78 artti.',
      observations: 'Yuksek gucte yuzey hasari goruldu. Optimum araligi daraltmak gerekiyor.',
      tags: JSON.stringify(['plazma', 'yuzey-isleme', 'yapistirma'])
    },
    {
      project_id: 2,
      title: 'Nanolif Uretim Parametreleri',
      hypothesis: 'Elektroegirim voltajinin 15kV den 25kV ye arttirilmasi fiber capini %30 azaltacaktir.',
      methodology: 'Elektroegirim ile nanolif uretimi, SEM ile morfoloji analizi.',
      parameters: JSON.stringify([{ key: 'Voltaj', value: '15kV, 20kV, 25kV' }, { key: 'Besleme Hizi', value: '0.5 ml/h' }, { key: 'Mesafe', value: '15 cm' }, { key: 'Cozucu', value: 'DMF/THF (1:1)' }]),
      status: 'in_progress', priority: 'critical',
      start_date: dateOnly(3), end_date: dateOnly(20),
      researcher: 'Ayse Demir',
      results: '15kV ve 20kV ornekleri uretildi. SEM goruntulemesi bekleniyor.',
      observations: 'Nem oraninin %40 uzerinde kaliteli fiber elde edilemedi.',
      tags: JSON.stringify(['nanolif', 'elektroegirim', 'SEM'])
    },
    {
      project_id: 4,
      title: 'Biyobozunur Polimer Sentezi',
      hypothesis: 'PLA/PCL harmaninin biyobozunma suresi saf PLA ya gore kontrol edilebilir sekilde ayarlanabilir.',
      methodology: 'Cift vidali ekstruder ile harman hazirlanmasi, kompost ortaminda bozunma testi.',
      parameters: JSON.stringify([{ key: 'PLA/PCL Orani', value: '80/20, 60/40, 50/50' }, { key: 'Ekstruzyon Sicaklik', value: '180-200 C' }, { key: 'Vida Hizi', value: '100 rpm' }]),
      status: 'on_hold', priority: 'medium',
      start_date: dateOnly(-5), end_date: dateOnly(30),
      researcher: 'Burak Kaya',
      results: null,
      observations: 'PCL tedarikcisi degisikligi nedeniyle beklemede. Yeni parti bekleniyor.',
      tags: JSON.stringify(['biyopolimer', 'PLA', 'surdurulebilirlik'])
    },
    {
      project_id: 1,
      title: 'Akustik Yalitim Malzemesi Karakterizasyonu',
      hypothesis: 'Geri donusturulmus tekstil liflerinden uretilen kecelerin ses yutma katsayisi ticari urunlerle rekabet edebilir.',
      methodology: 'Empedans tupu ile ses yutma katsayisi olcumu (ISO 10534-2).',
      parameters: JSON.stringify([{ key: 'Numune Kalinligi', value: '20mm, 40mm, 60mm' }, { key: 'Yogunluk', value: '80, 120, 160 kg/m3' }, { key: 'Frekans Araligi', value: '100-6300 Hz' }]),
      status: 'failed', priority: 'low',
      start_date: dateOnly(-30), end_date: dateOnly(-10),
      researcher: 'Ayse Demir',
      results: 'Dusuk frekanslarda yetersiz performans. 500 Hz altinda alfa < 0.3.',
      observations: 'Malzeme yogunlugunu artirmak veya cok katmanli yapi denemek gerekli.',
      tags: JSON.stringify(['akustik', 'geri-donusum', 'tekstil'])
    }
  ];

  const insertExpTx = db.transaction(() => {
    for (const e of experiments) {
      insertExp.run(e.project_id, e.title, e.hypothesis, e.methodology, e.parameters, e.status, e.priority, e.start_date, e.end_date, e.researcher, e.results, e.observations, e.tags);
    }
  });
  insertExpTx();

  // --- Work Packages (with project_id) ---
  const insertWP = db.prepare(`
    INSERT INTO work_packages (project_id, number, title, description, start_date, end_date, deliverables, progress, budget, status, dependencies, milestones)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const workPackages = [
    { project_id: 1, number: 'IP-1', title: 'Literatur Taramasi ve Konsept Tasarim', description: 'Mevcut literaturun kapsamli taranmasi, patent arastirmasi ve konsept tasarim calismalari.', start_date: dateOnly(-60), end_date: dateOnly(-15), deliverables: JSON.stringify(['Literatur tarama raporu', 'Patent haritasi', 'Konsept tasarim dokumani']), progress: 100, budget: 45000, status: 'completed', dependencies: '[]', milestones: JSON.stringify([{ title: 'Literatur raporu teslimi', date: dateOnly(-30), completed: true }]) },
    { project_id: 1, number: 'IP-2', title: 'Malzeme Sentezi ve Karakterizasyon', description: 'Hedef malzemelerin sentezlenmesi, temel mekanik ve termal karakterizasyon.', start_date: dateOnly(-10), end_date: dateOnly(45), deliverables: JSON.stringify(['Sentez protokolu', 'Karakterizasyon raporu', 'Malzeme veri tabani']), progress: 35, budget: 120000, status: 'in_progress', dependencies: JSON.stringify(['IP-1']), milestones: JSON.stringify([{ title: 'Ilk numune seti hazir', date: dateOnly(10), completed: false }, { title: 'Karakterizasyon tamamlandi', date: dateOnly(40), completed: false }]) },
    { project_id: 1, number: 'IP-3', title: 'Proses Optimizasyonu', description: 'Uretim proseslerinin optimize edilmesi, pilot olcek denemeleri.', start_date: dateOnly(30), end_date: dateOnly(90), deliverables: JSON.stringify(['Optimizasyon raporu', 'Pilot uretim verileri', 'Maliyet analizi']), progress: 0, budget: 85000, status: 'planned', dependencies: JSON.stringify(['IP-2']), milestones: JSON.stringify([{ title: 'Pilot uretim baslangici', date: dateOnly(50), completed: false }]) },
    { project_id: 1, number: 'IP-4', title: 'Test ve Validasyon', description: 'Nihai urunlerin kapsamli test ve validasyonu, standart uyumluluk.', start_date: dateOnly(75), end_date: dateOnly(120), deliverables: JSON.stringify(['Test raporu', 'Standart uyumluluk belgesi', 'Proje final raporu']), progress: 0, budget: 65000, status: 'planned', dependencies: JSON.stringify(['IP-2', 'IP-3']), milestones: JSON.stringify([{ title: 'Sertifikasyon basvurusu', date: dateOnly(110), completed: false }]) },
    { project_id: 2, number: 'IP-1', title: 'Nanolif Uretim Platformu Kurulumu', description: 'Elektroegirim sisteminin optimizasyonu ve uretim parametrelerinin belirlenmesi.', start_date: dateOnly(-20), end_date: dateOnly(20), deliverables: JSON.stringify(['Sistem kurulum raporu', 'Parametre optimizasyon raporu']), progress: 60, budget: 200000, status: 'in_progress', dependencies: '[]', milestones: JSON.stringify([{ title: 'Sistem kurulumu', date: dateOnly(-5), completed: true }]) },
    { project_id: 2, number: 'IP-2', title: 'Fonksiyonel Membran Gelistirme', description: 'Hedef uygulamalara yonelik fonksiyonel nanolif membranlarin gelistirilmesi.', start_date: dateOnly(15), end_date: dateOnly(90), deliverables: JSON.stringify(['Membran prototipleri', 'Performans raporu']), progress: 0, budget: 350000, status: 'planned', dependencies: JSON.stringify(['IP-1']), milestones: JSON.stringify([{ title: 'Ilk membran prototipi', date: dateOnly(45), completed: false }]) }
  ];

  const insertWPTx = db.transaction(() => {
    for (const wp of workPackages) {
      insertWP.run(wp.project_id, wp.number, wp.title, wp.description, wp.start_date, wp.end_date, wp.deliverables, wp.progress, wp.budget, wp.status, wp.dependencies, wp.milestones);
    }
  });
  insertWPTx();

  // --- Calendar Events (with project_id) ---
  const insertEvent = db.prepare(`
    INSERT INTO calendar_events (project_id, title, description, event_type, start_datetime, end_datetime, all_day, color, related_experiment_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const events = [
    { pid: 1, title: 'Darbe Testi - Seri 2', desc: '20J enerji seviyesinde darbe testleri', type: 'experiment', start: d(5, 9, 0), end: d(5, 12, 0), color: '#3b82f6', exp: 1 },
    { pid: null, title: 'Haftalik Lab Toplantisi', desc: 'Ilerleme raporu ve sonraki hafta planlama', type: 'meeting', start: d(6, 14, 0), end: d(6, 15, 30), color: '#8b5cf6', exp: null },
    { pid: 1, title: 'TUBITAK Ara Rapor Teslimi', desc: 'IP-2 ara donem raporu', type: 'deadline', start: d(15, 17, 0), end: d(15, 17, 0), color: '#ef4444', exp: null },
    { pid: null, title: 'SEM Bakim', desc: 'Yillik bakim ve kalibrasyon', type: 'maintenance', start: d(8, 8, 0), end: d(8, 17, 0), color: '#f97316', exp: null },
    { pid: 2, title: 'Nanolif SEM Goruntulemesi', desc: '15kV ve 20kV numuneleri goruntulenecek', type: 'experiment', start: d(10, 10, 0), end: d(10, 13, 0), color: '#3b82f6', exp: 4 },
    { pid: 3, title: 'Grafen Dispersiyon Hazirlama', desc: 'Ultrasonik dispersiyon islemi', type: 'experiment', start: d(12, 9, 0), end: d(12, 16, 0), color: '#3b82f6', exp: 2 },
    { pid: null, title: 'Proje Degerlendirme Toplantisi', desc: 'Yonetimle birlikte 6 aylik degerlendirme', type: 'review', start: d(18, 10, 0), end: d(18, 12, 0), color: '#22c55e', exp: null },
    { pid: null, title: 'Ekstruder Bakim', desc: 'Vida ve kovan temizligi', type: 'maintenance', start: d(20, 8, 0), end: d(20, 12, 0), color: '#f97316', exp: null },
    { pid: null, title: 'Haftalik Lab Toplantisi', desc: 'Haftalik rutin toplanti', type: 'meeting', start: d(13, 14, 0), end: d(13, 15, 30), color: '#8b5cf6', exp: null },
    { pid: 3, title: 'Termal Iletkenlik Olcumu', desc: 'Hot Disk ile ilk olcum serisi', type: 'experiment', start: d(16, 9, 0), end: d(16, 17, 0), color: '#3b82f6', exp: 2 },
    { pid: 1, title: 'Makale Yazim Toplantisi', desc: 'Plazma isleme makalesi taslagi degerlendirme', type: 'meeting', start: d(22, 13, 0), end: d(22, 15, 0), color: '#8b5cf6', exp: 3 },
    { pid: null, title: 'Malzeme Siparisi Son Gun', desc: 'PCL ve grafen siparisi icin son tarih', type: 'deadline', start: d(7, 17, 0), end: d(7, 17, 0), color: '#ef4444', exp: null },
    { pid: 1, title: 'Lap-Shear Testi', desc: 'Yapistirma mukavemeti dogrulama testleri', type: 'experiment', start: d(25, 9, 0), end: d(25, 15, 0), color: '#3b82f6', exp: 3 },
    { pid: 1, title: 'IP-2 Milestone Toplantisi', desc: 'Ilk numune seti degerlendirme', type: 'review', start: d(11, 10, 0), end: d(11, 11, 30), color: '#22c55e', exp: null }
  ];

  const insertEventTx = db.transaction(() => {
    for (const e of events) {
      insertEvent.run(e.pid, e.title, e.desc, e.type, e.start, e.end, 0, e.color, e.exp);
    }
  });
  insertEventTx();

  // --- Lab Entries (with project_id) ---
  const insertEntry = db.prepare(`
    INSERT INTO lab_entries (project_id, author, category, content, related_experiment_id, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const entries = [
    { pid: 1, author: 'Dr. Elif Yilmaz', cat: 'observation', content: 'Karbon fiber numunelerin darbe sonrasi C-scan goruntulerinde belirgin hasar alani gozlemlendi. 10J seviyesinde hasar alani ortalama 12mm2.', exp: 1, tags: '["darbe","C-scan"]', date: d(2, 14, 30) },
    { pid: 3, author: 'Burak Kaya', cat: 'note', content: 'Grafen tedarikci firmayla gorusuldu. Yeni parti grafenin BET yuzey alani onceki partiden farkli olabilir. Karakterizasyon yapilmasi gerekiyor.', exp: 2, tags: '["grafen","tedarik"]', date: d(3, 10, 0) },
    { pid: 2, author: 'Ayse Demir', cat: 'measurement', content: 'Elektroegirim parametreleri: 15kV, 0.5ml/h, 15cm mesafe. Ortam sicakligi: 24C, Nem: %38. Toplam uretim suresi: 4 saat. Fiber toplama alani: homojen dagilim.', exp: 4, tags: '["elektroegirim","olcum"]', date: d(4, 16, 45) },
    { pid: 1, author: 'Dr. Elif Yilmaz', cat: 'idea', content: 'Plazma isleme sonrasi yuzey enerjisinin zamanla nasil degistigini incelemek icin aging testi planlayabiliriz. 1, 7, 14, 30 gun sonra temas acisi olcumu.', exp: 3, tags: '["plazma","fikir"]', date: d(1, 11, 20) },
    { pid: 4, author: 'Burak Kaya', cat: 'issue', content: 'Ekstruder besleme bogazinda tikama yasandi. PCL pelletlerinin nem almis olmasi muhtemel. Vakumlu kurutma firini kullanilmali.', exp: 5, tags: '["ekstruder","sorun"]', date: d(3, 15, 0) },
    { pid: 1, author: 'Ayse Demir', cat: 'observation', content: 'Empedans tupu olcumlerinde dusuk frekanslarda (100-500 Hz) tekrarlanabilirlik sorunu var. Numune yerlesiminin siki kontrol edilmesi gerekiyor.', exp: 6, tags: '["akustik","olcum"]', date: d(2, 9, 30) },
    { pid: 1, author: 'Dr. Elif Yilmaz', cat: 'measurement', content: 'Plazma islenmis numunelerin temas acisi olcumleri: Islemsiz: 78deg, 200W/30s: 42deg, 400W/60s: 18deg, 600W/120s: 12deg (yuzey hasari mevcut).', exp: 3, tags: '["plazma","temas-acisi"]', date: d(1, 15, 0) },
    { pid: 1, author: 'Burak Kaya', cat: 'note', content: 'TUBITAK gelisme raporu icin IP-1 ve IP-2 verilerinin derlenmesi gerekiyor. Deadline: Bu ayin 15 i. Elif Hoca ile koordineli calisilacak.', exp: null, tags: '["tubitak","rapor"]', date: d(4, 11, 0) },
    { pid: 2, author: 'Ayse Demir', cat: 'idea', content: 'Nanolif membranlar filtrasyon uygulamasi icin de degerlendirilmeli. Hava filtrasyonunda PM2.5 tutma verimi olculebilir.', exp: 4, tags: '["nanolif","filtrasyon","fikir"]', date: d(5, 10, 30) },
    { pid: 1, author: 'Dr. Elif Yilmaz', cat: 'observation', content: 'Cam fiber numunelerde 20J darbe sonrasi matris catlagi ve fiber kirilmasi gozlemlendi. Karbon fiber numunelere kiyasla hasar modu farkli.', exp: 1, tags: '["darbe","hasar-analizi"]', date: d(5, 16, 0) }
  ];

  const insertEntryTx = db.transaction(() => {
    for (const e of entries) {
      insertEntry.run(e.pid, e.author, e.cat, e.content, e.exp, e.tags, e.date);
    }
  });
  insertEntryTx();

  // --- Equipment (mostly shared/null project_id) ---
  const insertEquip = db.prepare(`
    INSERT INTO equipment (project_id, name, model, serial_no, location, status, last_calibration, next_maintenance, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const equipment = [
    { pid: 1, name: 'Darbe Test Cihazi', model: 'Instron CEAST 9350', serial: 'IC9350-2021-045', loc: 'Mekanik Test Lab', status: 'in_use', cal: dateOnly(-60), maint: dateOnly(30), notes: 'Max enerji: 405J. Dusurucu kutle seti mevcut.' },
    { pid: null, name: 'Taramali Elektron Mikroskobu (SEM)', model: 'ZEISS EVO MA10', serial: 'ZE-MA10-19-0234', loc: 'Mikroskopi Lab', status: 'maintenance', cal: dateOnly(-90), maint: dateOnly(8), notes: 'Yillik bakim icin randevu alindi.' },
    { pid: 3, name: 'Hot Disk Termal Analiz', model: 'Hot Disk TPS 2500S', serial: 'HD-TPS-2022-112', loc: 'Termal Analiz Lab', status: 'available', cal: dateOnly(-30), maint: dateOnly(60), notes: 'Kapton ve Nikel sensorler mevcut.' },
    { pid: 2, name: 'Elektroegirim Sistemi', model: 'Inovenso NE300', serial: 'INV-NE300-20-067', loc: 'Nanoteknoloji Lab', status: 'in_use', cal: dateOnly(-45), maint: dateOnly(45), notes: 'Tek nozellli konfigurasyonda. Coaksiyel nozel siparis edildi.' },
    { pid: 4, name: 'Cift Vidali Ekstruder', model: 'Thermo Haake MiniLab', serial: 'TH-ML3-18-0891', loc: 'Polimer Isleme Lab', status: 'out_of_order', cal: dateOnly(-120), maint: dateOnly(-10), notes: 'Besleme bogazinda tikama. Bakim bekleniyor.' },
    { pid: null, name: 'Empedans Tupu', model: 'Bruel & Kjaer Type 4206', serial: 'BK-4206-2020-334', loc: 'Akustik Lab', status: 'available', cal: dateOnly(-20), maint: dateOnly(70), notes: '29mm ve 100mm tupler mevcut.' }
  ];

  const insertEquipTx = db.transaction(() => {
    for (const e of equipment) {
      insertEquip.run(e.pid, e.name, e.model, e.serial, e.loc, e.status, e.cal, e.maint, e.notes);
    }
  });
  insertEquipTx();

  // --- Materials ---
  const insertMat = db.prepare(`
    INSERT INTO materials (project_id, name, quantity, unit, min_threshold, supplier, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const materials = [
    { pid: 1, name: 'Karbon Fiber Prepreg', qty: 12, unit: 'm2', min: 5, supplier: 'Hexcel', loc: 'Sogutucu Depo', notes: 'T700/Epoksi, -18C de saklanmali' },
    { pid: 1, name: 'Cam Fiber Kumas', qty: 25, unit: 'm2', min: 10, supplier: 'Metyx', loc: 'Malzeme Deposu', notes: '200 g/m2 duz orgu' },
    { pid: 1, name: 'Epoksi Recine (Araldite LY 1564)', qty: 4.5, unit: 'kg', min: 2, supplier: 'Huntsman', loc: 'Kimyasal Dolap', notes: 'Sertlestirici: Aradur 3487, karisim orani 100:34' },
    { pid: 3, name: 'Grafen Nanoplaka', qty: 50, unit: 'g', min: 20, supplier: 'Nanografi', loc: 'Nanomateryal Dolabi', notes: 'Kalinlik: 5-8nm, Cap: 5-10um' },
    { pid: 4, name: 'PLA Pellet', qty: 3, unit: 'kg', min: 1, supplier: 'NatureWorks', loc: 'Polimer Deposu', notes: 'Ingeo 4043D, kurutma gerekli' },
    { pid: 4, name: 'PCL Pellet', qty: 0.5, unit: 'kg', min: 1, supplier: 'Perstorp', loc: 'Polimer Deposu', notes: 'CAPA 6800, yeni siparis bekleniyor' },
    { pid: 2, name: 'DMF (Dimetilformamid)', qty: 2, unit: 'L', min: 1, supplier: 'Merck', loc: 'Ceker Ocak Dolabi', notes: 'ACS grade, ceker ocak altinda saklanmali' },
    { pid: 2, name: 'THF (Tetrahidrofuran)', qty: 1.5, unit: 'L', min: 1, supplier: 'Sigma-Aldrich', loc: 'Ceker Ocak Dolabi', notes: 'Inhibitorlu, kuru ortamda saklanmali' },
    { pid: 2, name: 'PVA (Polivinil Alkol)', qty: 200, unit: 'g', min: 100, supplier: 'Sigma-Aldrich', loc: 'Kimyasal Dolap', notes: 'Mw: 89000-98000, %99 hidrolize' },
    { pid: 1, name: 'Geri Donusturulmus Tekstil Lifi', qty: 8, unit: 'kg', min: 3, supplier: 'EcoFiber TR', loc: 'Malzeme Deposu', notes: 'Karisik pamuk/polyester, keceleştirme icin' }
  ];

  const insertMatTx = db.transaction(() => {
    for (const m of materials) {
      insertMat.run(m.pid, m.name, m.qty, m.unit, m.min, m.supplier, m.loc, m.notes);
    }
  });
  insertMatTx();

  // --- Tasks ---
  const insertTask = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, related_experiment_id, related_wp_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasks = [
    { pid: 2, title: 'SEM numunelerini hazirla', desc: 'Nanolif numunelerini SEM icin altin kapla', status: 'pending', pri: 'high', due: dateOnly(9), exp: 4, wp: 5 },
    { pid: 1, title: 'TUBITAK rapor taslagi', desc: 'Ara donem raporu taslak halinde hazirla', status: 'in_progress', pri: 'critical', due: dateOnly(13), exp: null, wp: 2 },
    { pid: 3, title: 'Grafen dispersiyon protokolu', desc: 'Ultrasonik dispersiyon parametrelerini optimize et', status: 'pending', pri: 'medium', due: dateOnly(11), exp: 2, wp: null },
    { pid: null, title: 'Ekstruder bakim talebi', desc: 'Teknik servise bakim talebi gonder', status: 'completed', pri: 'high', due: dateOnly(5), exp: null, wp: null },
    { pid: 4, title: 'PCL siparis takibi', desc: 'Perstorp dan PCL siparis durumunu sor', status: 'pending', pri: 'medium', due: dateOnly(7), exp: 5, wp: null }
  ];

  const insertTaskTx = db.transaction(() => {
    for (const t of tasks) {
      insertTask.run(t.pid, t.title, t.desc, t.status, t.pri, t.due, t.exp, t.wp);
    }
  });
  insertTaskTx();

  // --- Materials Library ---
  const insertMatLib = db.prepare(`
    INSERT INTO materials_library (name, category, sub_category, unit, supplier, cas_number, description, density, cost_per_unit, is_active, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const materialsLib = [
    { name: 'Aluminyum Oksit (Al2O3)', category: 'toz', sub: 'Seramik toz', unit: 'g', supplier: 'Sigma-Aldrich', cas: '1344-28-1', desc: 'Yuksek saflık alumina tozu, 99.5%', density: 3.95, cost: 285, tags: '["seramik","oksit"]' },
    { name: 'Silisyum Karbur (SiC)', category: 'toz', sub: 'Seramik toz', unit: 'g', supplier: 'Alfa Aesar', cas: '409-21-2', desc: 'Mikron boyut SiC tozu', density: 3.21, cost: 420, tags: '["seramik","karbur"]' },
    { name: 'Demir Tozu', category: 'toz', sub: 'Metal toz', unit: 'g', supplier: 'Hoganas', cas: '7439-89-6', desc: 'Atomize demir tozu, <45um', density: 7.87, cost: 65, tags: '["metal","demir"]' },
    { name: 'Bakir Tozu', category: 'toz', sub: 'Metal toz', unit: 'g', supplier: 'Pometon', cas: '7440-50-8', desc: 'Elektrolitik bakir tozu', density: 8.96, cost: 180, tags: '["metal","bakir"]' },
    { name: 'Tungsten Karbur (WC)', category: 'toz', sub: 'Seramik toz', unit: 'g', supplier: 'H.C. Starck', cas: '12070-12-1', desc: 'Nano boyut WC tozu', density: 15.63, cost: 890, tags: '["seramik","tungsten"]' },
    { name: 'Titanium Dioksit (TiO2)', category: 'toz', sub: 'Oksit toz', unit: 'g', supplier: 'Evonik', cas: '13463-67-7', desc: 'Rutil faz TiO2', density: 4.23, cost: 95, tags: '["oksit","titanyum"]' },
    { name: 'Epoksi Recine (Araldite LY 1564)', category: 'polimer', sub: 'Termoset', unit: 'g', supplier: 'Huntsman', cas: null, desc: 'Dusuk viskoziteli epoksi recine', density: 1.15, cost: 320, tags: '["epoksi","termoset"]' },
    { name: 'PLA Pellet', category: 'polimer', sub: 'Termoplastik', unit: 'g', supplier: 'NatureWorks', cas: '26100-51-6', desc: 'Ingeo 4043D, biyobozunur', density: 1.24, cost: 45, tags: '["biyopolimer","termoplastik"]' },
    { name: 'PCL Pellet', category: 'polimer', sub: 'Termoplastik', unit: 'g', supplier: 'Perstorp', cas: '24980-41-4', desc: 'CAPA 6800, biyobozunur', density: 1.14, cost: 78, tags: '["biyopolimer","termoplastik"]' },
    { name: 'Poliamid 12 (PA12)', category: 'polimer', sub: 'Termoplastik', unit: 'g', supplier: 'Evonik', cas: '24937-16-4', desc: 'Vestamid PA12 tozu', density: 1.02, cost: 120, tags: '["poliamid","termoplastik"]' },
    { name: 'PEEK', category: 'polimer', sub: 'Yuksek performans', unit: 'g', supplier: 'Victrex', cas: '29658-26-2', desc: 'PEEK 450G granul', density: 1.30, cost: 950, tags: '["yuksek-performans","termoplastik"]' },
    { name: 'Sertlestirici (HY 1564)', category: 'kimyasal', sub: 'Kur ajani', unit: 'g', supplier: 'Huntsman', cas: null, desc: 'Amin bazli sertlestirici', density: 0.96, cost: 280, tags: '["sertlestirici","epoksi"]' },
    { name: 'Hizlandirici (DY 070)', category: 'kimyasal', sub: 'Hizlandirici', unit: 'g', supplier: 'Huntsman', cas: null, desc: 'Imidazol bazli hizlandirici', density: 1.03, cost: 350, tags: '["hizlandirici","epoksi"]' },
    { name: 'Dispersiyon Ajani', category: 'kimyasal', sub: 'Yuzey aktif', unit: 'g', supplier: 'BYK', cas: null, desc: 'BYK-180 dispersiyon katkisi', density: 1.01, cost: 420, tags: '["dispersiyon","katki"]' },
    { name: 'DMF (Dimetilformamid)', category: 'cozucu', sub: 'Polar aprotik', unit: 'ml', supplier: 'Merck', cas: '68-12-2', desc: 'ACS grade DMF', density: 0.944, cost: 85, tags: '["cozucu","polar"]' },
    { name: 'THF (Tetrahidrofuran)', category: 'cozucu', sub: 'Eter', unit: 'ml', supplier: 'Sigma-Aldrich', cas: '109-99-9', desc: 'Inhibitorlu, kuru ortam', density: 0.889, cost: 92, tags: '["cozucu","eter"]' },
    { name: 'Aseton', category: 'cozucu', sub: 'Keton', unit: 'ml', supplier: 'Merck', cas: '67-64-1', desc: 'Teknik saflık aseton', density: 0.791, cost: 28, tags: '["cozucu","keton"]' },
    { name: 'Grafen Nano Platelet', category: 'katki', sub: 'Nano katki', unit: 'g', supplier: 'Nanografi', cas: '7782-42-5', desc: 'Kalinlik 5-8nm, Cap 5-10um', density: 2.2, cost: 1200, tags: '["grafen","nano","iletken"]' },
    { name: 'Karbon Nanotup (CNT)', category: 'katki', sub: 'Nano katki', unit: 'g', supplier: 'Nanocyl', cas: '308068-56-6', desc: 'MWCNT, cap 9.5nm, boy 1.5um', density: 1.8, cost: 2500, tags: '["cnt","nano","iletken"]' }
  ];

  const insertMatLibTx = db.transaction(() => {
    for (const m of materialsLib) {
      insertMatLib.run(m.name, m.category, m.sub, m.unit, m.supplier, m.cas, m.desc, m.density, m.cost, m.tags);
    }
  });
  insertMatLibTx();

  // --- Formulations ---
  const insertFormulation = db.prepare(`
    INSERT INTO formulations (project_id, experiment_id, name, code, description, batch_size, batch_unit, total_percentage, status, version, parent_id, mixing_duration, mixing_speed, mixing_temp, mixing_notes, oven_duration, oven_temp, oven_mode, oven_notes, notes, result_notes, result_rating, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertFrmItem = db.prepare(`
    INSERT INTO formulation_items (formulation_id, material_id, material_name, category, percentage, calculated_amount, unit, notes, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, 'g', ?, ?)
  `);

  const formSeedTx = db.transaction(() => {
    // F-001: Kompozit - experiment 1
    const f1 = insertFormulation.run(1, 1, 'Al2O3 Agirlikli Kompozit', 'F-001', 'Alumina agirlikli epoksi kompozit formulasyonu', 100, 'g', 100, 'tested', 1, null, 30, '800 rpm', 25, 'Mekanik karistirici ile homojen karisim', 120, 80, 'Vakum', '2 saat vakum etuvde kur islemi', 'Ilk referans formulasyon', 'Darbe dayanimi iyi, egme mukavemeti beklentinin altinda', 3, '["kompozit","referans"]');
    insertFrmItem.run(f1.lastInsertRowid, 1, 'Aluminyum Oksit (Al2O3)', 'toz', 65, 65.00, null, 0);
    insertFrmItem.run(f1.lastInsertRowid, 7, 'Epoksi Recine (Araldite LY 1564)', 'polimer', 20, 20.00, null, 1);
    insertFrmItem.run(f1.lastInsertRowid, 2, 'Silisyum Karbur (SiC)', 'toz', 10, 10.00, null, 2);
    insertFrmItem.run(f1.lastInsertRowid, 12, 'Sertlestirici (HY 1564)', 'kimyasal', 5, 5.00, null, 3);

    // F-002: Variant of F-001 with more epoxy
    const f2 = insertFormulation.run(1, 1, 'Yuksek Epoksi Varyant', 'F-002', 'Epoksi orani arttirilmis varyant', 100, 'g', 100, 'tested', 2, f1.lastInsertRowid, 45, '1000 rpm', 25, 'Daha uzun karistirma suresi denendi', 120, 80, 'Vakum', 'Ayni kur kosullari', 'F-001 klonu, epoksi arttirildi', 'Egme mukavemeti iyilesti, darbe dayanimi dusuk', 4, '["kompozit","varyant"]');
    insertFrmItem.run(f2.lastInsertRowid, 1, 'Aluminyum Oksit (Al2O3)', 'toz', 60, 60.00, null, 0);
    insertFrmItem.run(f2.lastInsertRowid, 7, 'Epoksi Recine (Araldite LY 1564)', 'polimer', 25, 25.00, null, 1);
    insertFrmItem.run(f2.lastInsertRowid, 2, 'Silisyum Karbur (SiC)', 'toz', 10, 10.00, null, 2);
    insertFrmItem.run(f2.lastInsertRowid, 12, 'Sertlestirici (HY 1564)', 'kimyasal', 5, 5.00, null, 3);

    // F-003: Large batch - more SiC
    const f3 = insertFormulation.run(1, 1, 'SiC Takviyeli Buyuk Batch', 'F-003', '250g batch ile SiC orani arttirilmis', 250, 'g', 100, 'prepared', 1, null, 60, '600 rpm', 30, 'Buyuk batch icin dusuk hiz uzun sure', 180, 100, 'Normal', '3 saat etuvde kurutma', 'SiC orani arttirilarak sertlik artisi hedefleniyor', null, null, '["kompozit","buyuk-batch"]');
    insertFrmItem.run(f3.lastInsertRowid, 1, 'Aluminyum Oksit (Al2O3)', 'toz', 50, 125.00, null, 0);
    insertFrmItem.run(f3.lastInsertRowid, 7, 'Epoksi Recine (Araldite LY 1564)', 'polimer', 30, 75.00, null, 1);
    insertFrmItem.run(f3.lastInsertRowid, 2, 'Silisyum Karbur (SiC)', 'toz', 15, 37.50, null, 2);
    insertFrmItem.run(f3.lastInsertRowid, 12, 'Sertlestirici (HY 1564)', 'kimyasal', 5, 12.50, null, 3);

    // F-004: Thermal - experiment 2, project 3
    const f4 = insertFormulation.run(3, 2, 'PLA-Grafen Termal Kompozit', 'F-004', 'Grafen katkili PLA termal iletken kompozit', 150, 'g', 100, 'draft', 1, null, 20, '500 rpm', 40, 'Ultrasonik banyo sonrasi mekanik karistirma', 90, 60, 'Normal', 'Nem giderme amaçli etüv', 'Termal iletkenlik calismalari icin temel formulasyon', null, null, '["termal","grafen","PLA"]');
    insertFrmItem.run(f4.lastInsertRowid, 8, 'PLA Pellet', 'polimer', 80, 120.00, null, 0);
    insertFrmItem.run(f4.lastInsertRowid, 18, 'Grafen Nano Platelet', 'katki', 15, 22.50, null, 1);
    insertFrmItem.run(f4.lastInsertRowid, 14, 'Dispersiyon Ajani', 'kimyasal', 5, 7.50, null, 2);

    // F-005: CNT variant
    const f5 = insertFormulation.run(3, 2, 'PLA-Grafen-CNT Hibrit', 'F-005', 'Grafen + CNT hibrit katki sistemi', 150, 'g', 100, 'draft', 1, null, 25, '500 rpm', 40, 'CNT aglomera olmasin diye kademeli ekleme', 90, 60, 'Normal', 'F-004 ile ayni kosullar', 'Hibrit nano katki sistemi ile sinerjistik etki beklentisi', null, null, '["termal","grafen","CNT","hibrit"]');
    insertFrmItem.run(f5.lastInsertRowid, 8, 'PLA Pellet', 'polimer', 80, 120.00, null, 0);
    insertFrmItem.run(f5.lastInsertRowid, 18, 'Grafen Nano Platelet', 'katki', 10, 15.00, null, 1);
    insertFrmItem.run(f5.lastInsertRowid, 19, 'Karbon Nanotup (CNT)', 'katki', 5, 7.50, null, 2);
    insertFrmItem.run(f5.lastInsertRowid, 14, 'Dispersiyon Ajani', 'kimyasal', 5, 7.50, null, 3);

    // F-006: High graphene, large batch
    const f6 = insertFormulation.run(3, 2, 'Yuksek Grafen Oranli', 'F-006', '%20 grafen ile maksimum termal iletkenlik', 300, 'g', 100, 'approved', 1, null, 40, '1200 rpm', 45, 'Yuksek hizda dispersiyon, 3 asamali ekleme', 150, 70, 'Vakum', 'Vakum altinda nem ve gaz giderme', 'Yuksek grafen yuklemesi ile termal iletkenlik optimumu', 'Termal iletkenlik 3.2 W/mK olarak olculdu, hedefin uzerinde', 5, '["termal","grafen","onaylandi"]');
    insertFrmItem.run(f6.lastInsertRowid, 8, 'PLA Pellet', 'polimer', 70, 210.00, null, 0);
    insertFrmItem.run(f6.lastInsertRowid, 18, 'Grafen Nano Platelet', 'katki', 20, 60.00, null, 1);
    insertFrmItem.run(f6.lastInsertRowid, 14, 'Dispersiyon Ajani', 'kimyasal', 10, 30.00, null, 2);

    // Create one comparison
    const cmp1 = db.prepare(`INSERT INTO formulation_comparisons (name, project_id, notes) VALUES (?, ?, ?)`).run('Kompozit Formulasyon Karsilastirmasi', 1, 'F-001, F-002, F-003 formulasyonlarinin kiyaslanmasi');
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp1.lastInsertRowid, f1.lastInsertRowid, 0);
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp1.lastInsertRowid, f2.lastInsertRowid, 1);
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp1.lastInsertRowid, f3.lastInsertRowid, 2);

    const cmp2 = db.prepare(`INSERT INTO formulation_comparisons (name, project_id, notes) VALUES (?, ?, ?)`).run('Termal Katki Karsilastirmasi', 3, 'Grafen ve CNT katkili formulasyonlarin kiyasi');
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp2.lastInsertRowid, f4.lastInsertRowid, 0);
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp2.lastInsertRowid, f5.lastInsertRowid, 1);
    db.prepare('INSERT INTO comparison_items (comparison_id, formulation_id, sort_order) VALUES (?, ?, ?)').run(cmp2.lastInsertRowid, f6.lastInsertRowid, 2);
  });

  formSeedTx();

  console.log('  Seed verileri basariyla yuklendi.');
}

seed();
module.exports = seed;
