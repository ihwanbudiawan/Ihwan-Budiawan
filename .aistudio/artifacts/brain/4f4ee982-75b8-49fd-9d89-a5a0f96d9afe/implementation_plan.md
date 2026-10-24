# PLN AMR PowerEye — Peningkatan Fitur Analisis Tingkat Lanjut & Tata Kelola Operasional Lapangan

Sistem pemantauan Automatic Meter Reading (AMR) dan penertiban pemakaian tenaga listrik (P2TL) komprehensif yang dirancang untuk PT PLN (Persero), mengintegrasikan pemrosesan data profil beban hingga 2 GB, diagram fasor 2D/3D & split-view, geospasial rute petugas Google Maps, model prediksi anomali berbasis regresi 12 bulan, standar internasional (IEC/ANSI/IEEE) serta regulasi nasional (Perdir PLN No. 028 tentang P2TL).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Keputusan dan preferensi pengguna yang telah dikonfirmasi pada tahap klarifikasi:
> - **Visualisasi Geospasial & Rute Petugas**: Menggunakan Google Maps terintegrasi dengan pemetaan titik koordinat meter pelanggan, pemantauan armada petugas inspeksi, kalkulasi rute perjalanan optimal, jarak (km), dan estimasi waktu tempuh (ETA).
> - **Format Laporan Lapangan**: Menggunakan format resmi Berita Acara Pemeriksaan P2TL sesuai Peraturan Direksi PT PLN (Persero) No. 028 (Golongan I, II, III, dan IV) yang siap cetak dan ekspor PDF beserta checklist temuan fisik & kelistrikan.
> - **Autentikasi 2-Faktor (2FA)**: Memverifikasi identitas pengguna menggunakan email korporat `@pln.co.id` dan nomor WhatsApp resmi dengan pengiriman simulasi kode OTP 6-digit.

---

### 1. Overview & Core Concept

- **Apa Fungsinya**: Platform analitik mutakhir untuk membaca dan mengevaluasi data AMR (Instant & Load Profile) baik skala berkas kecil maupun berkas masif (hingga 2 GB), menyaring anomali kelistrikan (CT terbalik, loss voltage/current, unbalance beban, cosphi buruk, THD berlebih), memprediksi potensi kegagalan komponen meter hingga 180 hari ke depan menggunakan regresi data 12 bulan, memvalidasi net-metering PLTS Atap, dan menugaskan petugas P2TL dengan panduan rute navigasi.
- **Target Pengguna**: Petugas Pengendalian Susut, Tim P2TL (Penertiban Pemakaian Tenaga Listrik), Petugas Pemeliharaan Meter & Transaksi Energi di tingkat ULP, UP3, dan Unit Induk Distribusi (UID).
- **Nilai Tambah Utama**: Meminimalkan susut non-teknis (kWh curian/rusak), mempercepat tindak lanjut di lapangan dengan Berita Acara terstandarisasi Perdir 028, dan mengidentifikasi anomali cluster secara visual via split-view fasor dan peta geospasial.

---

### 2. User Experience & Visual Design

#### A. Alur Pengguna (User Flows)
1. **Login 2FA Mesin**: Petugas memasukkan email `@pln.co.id` dan nomor WhatsApp -> menerima kode OTP 6-digit -> sesi aman terverifikasi.
2. **Unggah & Pemilihan Sheet Excel (hingga 2 GB)**: Pengguna mengunggah berkas Excel/CSV. Jika terdapat multi-sheet, modal interaktif menampilkan daftar sheet untuk dipilih (atau proses seluruh sheet). Progres pembacaan streaming/chunking ditampilkan secara presisi tanpa membekukan antarmuka browser.
3. **Penyimpanan Database Terpartisi Kode 2-Digit**: Data yang diunggah disimpan di IndexedDB (`amr_powereye_db`) dengan partisi indeks 2 digit awal IDPEL (Unit Induk, misal 52 = Jateng & DIY, 54 = Jabar, 51 = Disjaya, dst).
4. **Tabel Pelanggan AMR Terfilter**: Pengguna memfilter berdasarkan Unit Induk, Customer vs Non-Customer, status PLTS, atau anomali. Setiap kolom memiliki checklist visibilitas, setiap baris memiliki checkbox pemilihan, dan baris menampilkan nilai arus netral $I_N$, ketidakseimbangan arus dan tegangan, stand absolut kWh & kVARh, serta info ULP & UP3.
5. **Dashboard & Prediksi Regresi 12 Bulan**: Kartu metrik operasional, grafik degradasi kesehatan meter, dan model regresi linier/polinomial yang memproyeksikan probabilitas kegagalan komponen meter dalam rentang 30-180 hari.
6. **Split-View Diagram Fasor & Gelombang Sinusoidal**: Tab Fasor memiliki tombol Split-View untuk membandingkan 2 IDPEL secara bersebelahan (Pelanggan A vs Pelanggan B) dalam representasi 2D atau 3D/animasi vektor, dilengkapi visualisasi gelombang sinusoidal tegangan & arus $V(t)$ dan $I(t)$ real-time.
7. **Geospasial Google Maps & Rute Pemeliharaan**: Tab/modal Peta menampilkan pin lokasi pelanggan (berwarna sesuai tingkat keparahan anomali), posisi kendaraan petugas patroli P2TL, serta garis rute jalan dengan kalkulasi jarak kilometer dan perkiraan durasi perjalanan (ETA).
8. **Ekspor Berita Acara P2TL & CSV**: Pengunduhan ringkasan anomali format CSV dan pembuatan Berita Acara P2TL resmi sesuai Perdir 028 (siap cetak PDF / print view langsung).

#### B. Identitas Visual & Bahasa Desain
- **Pembersihan Header**: Menghapus tombol 'Diagram Fasor' dan 'Grafik & Tren' dari bilah navigasi atas (top header) sesuai arahan pengguna agar lebih ringkas, mengganti label "WASIO" menjadi "WASION", serta menghapus tanda kurung pada opsi pemilihan "(1-Phase)" / "(3-Phase)".
- **Penghapusan Kotak Meter Terpilih**: Menghapus kotak ringkasan "Meter Terpilih Saat Ini" yang memakan ruang vertikal, mengintegrasikan informasi pelanggan aktif langsung ke dalam tab analisis yang relevan.
- **Pewarnaan Elemen Kontrol**: Memberikan aksen warna tematik yang khas dan tegas untuk membedakan button aksi (biru/emerald/amber/rose), dropdown selection (berbingkai tegas), dan kolom input pencarian.
- **Teks Berjalan di Footer**: Running text (marquee) di bagian footer aplikasi yang menampilkan daftar pelanggan yang mengalami anomali secara dinamis beserta jenis temuannya (CT terbalik, drop tegangan, unbalance tinggi).
- **Tema Kustom (Theme Customizer)**: Panel pemilih tema visual (pilihan palet warna aksen, warna latar belakang canvas, dan ketebalan/warna border antarmuka).

---

### 3. Standar & Regulasi Teknis (Technical References)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                       KERANGKA STANDAR & REGULASI                             │
├─────────────────────┬─────────────────────────────────────────────────────────┤
│ Perdir PLN No. 028  │ Pedoman Penertiban Pemakaian Tenaga Listrik (P2TL):     │
│                     │ - Gol I   : Pelanggaran mempengaruhi batas daya         │
│                     │ - Gol II  : Pelanggaran mempengaruhi pengukuran energi  │
│                     │ - Gol III : Pelanggaran mempengaruhi daya & energi      │
│                     │ - Gol IV  : Bukan pelanggan yang memakai tenaga listrik │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ IEEE 519-2022       │ Standar Harmonisa (THD Tegangan ≤ 5.0% normal, >8.0%    │
│ & IEC 61000-4-30    │ kritis; THD Arus bergantung pada rasio Isc/IL).         │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ IEEE Std 141 / ANSI │ Ketidakseimbangan Beban & Tegangan:                     │
│ C84.1 / SPLN D3.022 │ Current Unbalance: normal < 10%, warning 10-20%, > 20%  │
│                     │ kritis. Voltage Unbalance: normal < 2%, > 3% kritis.    │
├─────────────────────┼─────────────────────────────────────────────────────────┤
│ IEC 62053-21/22/23  │ Standar Akurasi Meter Statis kWh & kVARh kelas 0.2S-0.5S│
│ & ANSI C12.20       │ Ketentuan pengukuran kuadran Q1-Q4 dan faktor daya.     │
└─────────────────────┴─────────────────────────────────────────────────────────┘
```

---

### 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   ARSITEKTUR APLIKASI                                         │
├───────────────────────────────┬───────────────────────────────┬───────────────────────────────┤
│        PRESENTASI (UI)        │       LOGIKA & ANALITIK       │     PERSISTENSI & ENGINE      │
├───────────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ • Header (Clean, no redundant │ • amrParser (XLSX Multi-Sheet │ • IndexedDB (amr_powereye_db) │
│   phasor/chart links)         │   & Large 2GB Chunk Stream)   │   - Store: records (by UID)   │
│ • CustomerTable:              │ • anomalyDetector (Perdir 028 │   - Store: plts_customers     │
│   - Checkbox per kolom & baris│   Gol I-IV, IEEE 519 THD,     │   - Store: inspections_route  │
│   - Filter 2-digit Unit Induk │   Unbalance Arus & Tegangan)  │   - Store: 2fa_sessions       │
│   - In (Netral), THD, Stand   │ • regressionModel (12-Bulan   │ • Google Maps Service:        │
│   - Deduplikasi Arus Maksimal │   Meter Degradation Predictor)│   - Pins lokasi pelanggan     │
│ • DiagnosticSummary:          │ • reportExporter (Official BA │   - Rute patroli petugas      │
│   - Harmonisa THDv & THDi     │   P2TL Perdir 028 & CSV)      │   - Jarak & estimasi ETA      │
│   - Unbalance current alarm   │ • solarNetMetering (Analisis  │ • Canvas 2D/3D & WebGL:       │
│ • PhasorDiagram (Split-View,  │   Kapasitas kWp, Ekspor/Impor │   - Vector fasor berputar     │
│   2D/3D toggle, Animated)     │   kWh & Stand Absolut kVARh)  │   - Sinusoidal V(t) & I(t)    │
│ • ConsumptionCharts (6-12 bln,│ • auth2faService (@pln.co.id  │                               │
│   kumulatif impor vs ekspor)  │   + WhatsApp OTP simulator)   │                               │
│ • Footer Teks Berjalan Anomali│                               │                               │
└───────────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

#### Komponen dan Modul Kunci yang Dibuat/Diperbarui:
1. `src/utils/amrDatabase.ts`:
   - Mengelola koneksi IndexedDB dengan object stores: `records`, `plts_customers`, `field_inspections`, dan `audit_logs`.
   - Mengindeks records berdasarkan `unitIndukCode` (2-digit prefix IDPEL), `locationCode`, `periode`, `isPlts`, dan `isCustomer`.
   - Batch chunked write untuk menangani ribuan baris/berkas masif secara asinkron tanpa memblokir antarmuka.

2. `src/utils/amrParser.ts` & `src/components/DataUploader.tsx`:
   - Integrasi pemilihan multi-sheet XLSX: mendeteksi daftar worksheet pada workbook Excel yang diunggah dan menyajikan dropdown/modal pemilihan sheet.
   - Penanganan berkas besar berukuran hingga 2 GB dengan pembacaan berbasis chunk/batching dan progress bar persentase nyata.
   - Ekstraksi otomatis kode 2-digit Unit Induk PLN, ULP, UP3, tipe pelanggan (Customer vs Non-Customer), serta data PLTS bila ada.
   - Perhitungan otomatis arus netral $I_N$ dan persentase ketidakseimbangan arus dan tegangan.

3. `src/components/CustomerTable.tsx`:
   - Filter dropdown Unit Induk PLN (2 digit prefix: 52 UID Jateng-DIY, 54 UID Jabar, 53 UID Jatim, 51 UID Disjaya, dll).
   - Checkbox pemilihan di setiap baris dan pengaturan visibilitas kolom.
   - Kolom Arus menampilkan IR, IS, IT, dan IN (Arus Netral).
   - Kolom Tegangan & Arus dilengkapi indikator persentase ketidakseimbangan (unbalance).
   - Menampilkan Stand Absolut kWh (Import/Export) dan Stand Absolut kVARh.
   - Keterangan jumlah temuan anomali IDPEL dan deduplikasi yang mengambil arus terbesar.

4. `src/components/DiagnosticSummary.tsx`:
   - Analisis Keseimbangan Beban Antar Fasa: perhitungan persentase unbalance arus sesuai rumus IEEE/ANSI dengan badge peringatan jika $> 10\%$ atau $> 20\%$.
   - Analisis Harmonisa THD (Total Harmonic Distortion) tegangan (THDv) dan arus (THDi) sesuai standar IEEE 519 / SPLN.
   - Tombol pengunduhan instan: "Unduh CSV Anomali" dan "Cetak / Unduh PDF BA P2TL (Perdir 028)".

5. `src/components/PhasorDiagram.tsx` & Split-View:
   - Dukungan Split-View: pengguna dapat memilih IDPEL Pelanggan 1 dan IDPEL Pelanggan 2 untuk membandingkan bentuk vektor fasor berdampingan.
   - Toggle tampilan 2D vs 3D dan sakelar animasi perputaran vektor dinamis.
   - Gelombang sinusoidal terintegrasi yang memetakan sinyal tegangan dan arus sinusoidal 3 fasa secara proporsional.

6. `src/components/ConsumptionCharts.tsx`:
   - Agregasi data bulanan 6-12 bulan untuk tren health score dan frekuensi anomali.
   - Visualisasi kumulatif kWh Import vs Export untuk memantau neraca energi dan penetrasi PLTS atap.

7. `src/components/DashboardPredictiveModel.tsx` (diintegrasikan ke Dashboard):
   - Model regresi linier/polinomial yang dilatih dari data historis 12 bulan untuk memprediksi probabilitas anomali dan degradasi komponen meter (CT jenuh, pergeseran sudut fasa, kontak termal panas).

8. `src/components/GoogleMapsRouteModal.tsx`:
   - Peta interaktif dengan penanda lokasi pelanggan (warna merah/kuning/hijau sesuai keparahan anomali).
   - Pelacakan petugas pemeliharaan di peta.
   - Perhitungan rute perjalanan, jarak total (km), dan estimasi waktu tempuh (ETA).
   - Input koordinat manual/edit untuk setiap IDPEL.

9. `src/utils/reportExporter.ts`:
   - Generator Berita Acara Pemeriksaan P2TL resmi sesuai Peraturan Direksi PT PLN (Persero) No. 028.P/DIR (Lengkap dengan data pelanggan, meter terpasang, hasil pengukuran instan, temuan fisik/segel, golongan pelanggaran I-IV, dan kolom tanda tangan petugas & saksi).

10. `src/components/Header.tsx`, `src/components/FooterMarquee.tsx`, & `src/components/ThemeCustomizerModal.tsx`:
    - Pembersihan tab header (menghapus tab duplikat), perbaikan penamaan "WASION", dan penghapusan tanda kurung 1 phase / 3 phase.
    - Penghapusan kotak ringkasan meter terpilih saat ini untuk menghemat ruang layar.
    - Footer teks berjalan (marquee) dengan daftar pelanggan teranomali.
    - Modal customizer tema (warna aksen, background canvas, border).
    - Modal autentikasi 2FA dengan validasi email `@pln.co.id` dan kode OTP WhatsApp.

---

### 5. Verification Plan

1. **Verifikasi Kompilasi & Build**:
   - Menjalankan `compile_applet` untuk memastikan seluruh tipe data, komponen React, dan modul utilitas bebas dari error TypeScript.
2. **Pengujian Fungsional**:
   - Uji unggah berkas multi-sheet XLSX dan berkas profil beban besar.
   - Uji penyimpanan dan pengambilan data dari IndexedDB berdasarkan kode 2-digit Unit Induk.
   - Uji filter Unit Induk, checklist baris/kolom, dan kolom arus netral pada CustomerTable.
   - Uji kalkulasi unbalance arus dan harmonisa THD pada DiagnosticSummary.
   - Uji Split-View diagram fasor dan animasi sinusoidal.
   - Uji agregasi tren bulanan dan grafik kumulatif kWh impor vs ekspor pada tab Charts.
   - Uji model prediksi regresi di Dashboard.
   - Uji peta geospasial Google Maps dengan titik koordinat dan rute petugas.
   - Uji pratinjau cetak dan unduh Berita Acara P2TL resmi Perdir 028.
   - Uji alur login 2FA dengan email `@pln.co.id` dan WhatsApp OTP.
