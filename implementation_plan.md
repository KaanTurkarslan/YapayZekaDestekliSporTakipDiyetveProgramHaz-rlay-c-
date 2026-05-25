# İnteraktif Egzersiz Gösterimi - Implementation Plan

Kullanıcı bilgilerini girdikten ve AI koç bir antrenman programı oluşturduktan sonra, her hareketi resimli/animasyonlu ve interaktif bir şekilde göstereceğiz.

## Önerilen Değişiklikler

---

### 1. Egzersiz Veritabanı

#### [NEW] `src/data/exercises.js`

Programdaki tüm hareketler için statik bir veri tabanı oluşturulacak. Her egzersiz şunları içerecek:
- `name` – hareket adı (AI'ın yazdığıyla eşleşmesi için)
- `gifUrl` – [ExerciseDB](https://exercisedb.p.rapidapi.com) ya da [wger.de](https://wger.de/en/exercise/overview/) gibi açık kaynak veritabanından animasyonlu GIF bağlantısı
- `muscleGroup` – çalışan kas grubu
- `equipment` – ekipman (belbezi, dumbbell, vb.)
- `tips` – 2-3 önemli teknik ipucu (Türkçe)
- `sets`, `reps` – varsayılan set/tekrar değerleri

Veritabanı tüm programlardaki (Yeni Başlayan, 3-6 ay, PPL, PHAT) egzersizleri kapsayacak (~50 hareket).

---

### 2. Egzersiz Kartı ve Modal Bileşeni

#### [NEW] `src/components/ExerciseCard.jsx`

Her egzersiz için küçük bir kart bileşeni:
- Hareket adı, kas grubu, set/tekrar
- Tıklanınca modal açılır

#### [NEW] `src/components/ExerciseModal.jsx`

Büyük modal:
- Animasyonlu GIF (optimize edilmiş, lazy load)
- Set/Rep tablosu
- Teknik ipuçları
- "Tamamlandı" işaretleme (yeşil tik)

---

### 3. AI Yanıtı Güncelleme

#### [MODIFY] [src/services/ai.js](file:///c:/Users/ahmet/.gemini/antigravity/scratch/src/services/ai.js)

`workoutPlan` dizisindeki hareket isimleri, egzersiz veritabanındaki `name` alanlarıyla eşleşecek şekilde standardize edilecek. Mevcut sistem değişmeyecek; sadece AI'ın kullandığı hareket isimlerinin veritabanındakilerle tutarlı olması açısından prompt'a bir not eklenecek.

---

### 4. Ana Uygulama Güncellemesi

#### [MODIFY] [src/App.jsx](file:///c:/Users/ahmet/.gemini/antigravity/scratch/src/App.jsx)

Chat ekranındaki `workoutPlan` render bloğu (satır 290–296) şu şekilde güncellenir:
- Düz `<li>` listesi yerine `<ExerciseCard>` bileşenleri kullanılır
- Her karta tıklanınca `<ExerciseModal>` açılır
- Modal state (`selectedExercise`, `showModal`) eklenir

---

### 5. Stil Güncellemesi

#### [MODIFY] [src/index.css](file:///c:/Users/ahmet/.gemini/antigravity/scratch/src/index.css)

- Modal backdrop ve animasyon CSS'i eklenir
- Egzersiz kartları için hover efektleri
- GIF yüklenirken iskelet (skeleton) animasyonu

---

## Verification Plan

### Manual Verification

1. Tarayıcıda `http://localhost:5173` adresini aç
2. Kişisel bilgileri (yaş, boy, kilo) doldur → **Kaydet ve Devam Et**
3. "Bana Program Öner (Otomatik)" seçeneğini seç → **Koç İle Görüşmeye Başla**
4. AI yanıtında antrenman planı görünmeli → Her hareket **kart** olarak görünmeli
5. Bir karta tıkla → **Modal açılmalı**, GIF gösterilmeli, teknik ipuçları ve set/rep bilgisi görünmeli
6. "Tamamlandı" butonuna tıkla → Kart yeşil tik ile işaretlenmeli
7. Modal dışına tıkla ya da X'e bas → Modal kapanmalı
