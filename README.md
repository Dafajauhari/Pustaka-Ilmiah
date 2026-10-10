# Pustaka Ilmiah (versi website)

Aplikasi kumpulan jurnal dan artikel ilmiah: cari per bidang, simpan, bandingkan, dan (opsional) pakai AI untuk merangkum, mencari gagasan, dan membandingkan jurnal.

## Isi folder
- `index.html` : struktur halaman (halaman utama)
- `Jurnalimkom.css`  : tampilan (mendukung mode gelap dan layar HP)
- `data.js`    : 23 artikel pilihan dengan ringkasan bahasa Indonesia
- `koleksi.js` : memuat ±1000 artikel asli dari Crossref (butuh internet saat pertama dibuka, lalu disimpan di browser)
- `app.js`     : logika aplikasi
- `config.js`  : pengaturan alamat AI
- `server.js`  : server kecil opsional untuk fitur AI

## Cara 1: tanpa AI (paling mudah)
Buka `index.html` di browser. Pencarian, filter bidang, simpan, tabel perbandingan, dan tambah artikel sendiri langsung jalan. Tombol AI memakai **mode offline**: jawaban diambil dari data bawaan, bukan dari AI.

## Cara 2: dengan AI
1. Buat API key di Anthropic Console.
2. `config.js` otomatis memakai `/api/ai` saat dibuka lewat localhost, jadi tidak perlu diubah.
3. Jalankan (butuh Node.js 18 atau lebih baru):
   ```
   ANTHROPIC_API_KEY=isi_key_kamu node server.js
   ```
   Di Windows PowerShell: `$env:ANTHROPIC_API_KEY="isi_key_kamu"; node server.js`
4. Buka http://localhost:3000

Model bisa diganti lewat variabel `MODEL` (bawaan: `claude-sonnet-5-5`).

**Penting:** API key hanya boleh ada di server. Jangan menaruhnya di `config.js` atau file frontend lain, karena siapa pun bisa melihatnya. `server.js` sudah membatasi 20 permintaan AI per 10 menit per IP, tetapi kalau situsmu dibuka untuk umum, tambahkan pembatasan dan autentikasi yang lebih ketat agar biaya API tidak membengkak.

## Hosting
- Hanya statis (tanpa AI): unggah `index.html`, `Jurnalimkom.css`, `data.js`, `koleksi.js`, `config.js`, `app.js` ke GitHub Pages, Netlify, atau Vercel.
- Dengan AI: jalankan `server.js` di layanan yang mendukung Node.js, atau pindahkan logika `/api/ai` ke fungsi serverless di layananmu.

## Menambah artikel ke koleksi
Buka `data.js`, lalu tambahkan satu entri `A(...)` di dalam daftar `DATA` dengan urutan: id, bidang, nama singkat penulis, penulis, tahun, judul, jurnal, volume/halaman, tautan, ringkasan, metode, kata kunci, temuan. Gunakan id unik berawalan `a` diikuti angka (contoh `a24`). Tulis ringkasan dengan kata-katamu sendiri dan cek ke artikel aslinya.

Artikel yang ditambahkan lewat tab Simpanan hanya tersimpan di browser pengguna itu sendiri (localStorage).

## Artikel tambahan dari Crossref
Saat pertama dibuka, aplikasi mengambil sekitar 1000 artikel jurnal (143 per bidang, diurutkan dari yang paling banyak dikutip) dari api.crossref.org tanpa API key, lalu menyimpannya di localStorage. Abstraknya asli dari penerbit (umumnya berbahasa Inggris, ditandai EN). Untuk memuat ulang, hapus data situs di browser. Kolom Metode untuk artikel ini diisi otomatis dengan menebak dari kata-kata di abstrak (misalnya "randomized" menjadi uji klinis acak), jadi hanya perkiraan dan perlu dicek ke artikel asli. Pencarian memahami beberapa kata Indonesia umum (mis. "umpan balik" dicocokkan ke "feedback").
