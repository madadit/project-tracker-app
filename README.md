# Project Tracker

Aplikasi Project Tracker modern untuk mengelola proyek dan tugas dengan mudah. Aplikasi ini berjalan sepenuhnya di browser tanpa memerlukan backend, dengan data tersimpan di localStorage.

## 🚀 Cara Memulai

1. Buka [index.html](index.html) di browser Anda
2. Aplikasi siap digunakan tanpa instalasi tambahan

## ✨ Fitur Utama

### Manajemen Proyek
- **Tambah Proyek**: Klik tombol "Tambah Proyek" untuk membuat proyek baru
- **Lihat Deskripsi**: Klik card proyek untuk melihat detail dan deskripsinya
- **Edit Proyek**: Klik tombol "Edit" untuk mengubah nama dan deskripsi
- **Hapus Proyek**: Klik tombol "Hapus" untuk menghapus proyek (dengan konfirmasi)
- **Status & Progress**: Otomatis dihitung dari tugas-tugas di proyek
  - Status: Draft (jika semua tugas draft), In Progress (ada tugas sedang dikerjakan), Done (semua selesai)
  - Progress: Persentase berdasarkan bobot tugas yang sudah selesai

### Manajemen Tugas
- **Tambah Tugas Cepat**: Klik tombol "+" di card proyek untuk langsung tambah tugas
- **Dropdown Project Otomatis**: Ketika tambah tugas dari card proyek, dropdown project sudah ter-isi dan tidak bisa diubah
- **Edit Tugas**: Klik "Edit" pada tugas untuk mengubah nama, status, proyek, atau bobot
- **Hapus Tugas**: Klik "Hapus" untuk menghapus tugas (dengan konfirmasi)
- **Status Tugas**: 
  - Draft: Belum dimulai
  - In Progress: Sedang dikerjakan
  - Done: Selesai
- **Bobot Tugas**: Nilai integer untuk menentukan kontribusi tugas terhadap progress proyek

## 🎯 Cara Menggunakan

### Membuat Proyek
1. Klik tombol **"Tambah Proyek"** di atas
2. Isi nama proyek dan (opsional) deskripsi
3. Klik **"Simpan"**

### Menambah Tugas
**Opsi 1 - Dari Card Proyek:**
- Pilih proyek dengan klik card-nya
- Klik tombol **"+"** pada card proyek
- Isi nama, pilih status, dan masukkan bobot
- Klik **"Simpan"** (project sudah otomatis terpilih)

**Opsi 2 - Dari Tombol Umum:**
- Klik tombol **"Tambah Tugas"** di atas
- Pilih proyek dari dropdown
- Isi nama, status, dan bobot
- Klik **"Simpan"**

### Mengedit Data
- **Proyek**: Klik tombol "Edit" pada card
- **Tugas**: Klik tombol "Edit" pada baris tugas

### Menghapus Data
- Klik tombol "Hapus" pada proyek atau tugas
- Konfirmasi di modal yang muncul
- Data akan dihapus secara permanen

## 🏗️ Teknologi

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Storage**: Browser localStorage
- **Arsitektur**: Single Page Application (SPA)

## 📁 File-File Utama

- [index.html](index.html) - Struktur aplikasi dan form
- [styles.css](styles.css) - Gaya dan desain UI
- [app.js](app.js) - Logika aplikasi

## 💾 Data Storage

Semua data disimpan secara otomatis di localStorage browser:
- `project-tracker:projects` - Data proyek
- `project-tracker:tasks` - Data tugas

Data akan tetap tersimpan meskipun Anda menutup browser dan membukanya lagi.

## 📊 Kalkulasi Otomatis

### Progress Proyek
```
Progress = (Total Bobot Tugas Selesai / Total Bobot Semua Tugas) × 100%
```

### Status Proyek
- Jika semua tugas berstatus "Done" → Status = Done
- Jika ada tugas berstatus "In Progress" → Status = In Progress  
- Selainnya → Status = Draft

## 🎨 Desain

- **Tema**: Modern dan minimalis dengan palet warna kalem
- **Responsive**: Bekerja optimal di desktop dan mobile
- **UI**: Interface yang intuitif dengan modal untuk form

## 📝 Catatan

- Tidak memerlukan koneksi internet (offline-first)
- Data hanya tersimpan di browser lokal
- Hapus browser cache/localStorage akan menghapus semua data
- Gunakan tombol "Hapus" dengan hati-hati karena aksi tidak bisa di-undo

Dikembangkan dengan ♥ oleh [Ahmad Aditiya]
