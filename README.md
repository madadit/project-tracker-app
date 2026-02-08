# Project Tracker

Aplikasi Project Tracker modern untuk mengelola proyek dan tugas dengan fitur-fitur advanced seperti dependency management, hierarchical tasks, dan schedule validation.

## 🚀 Cara Memulai

1. Buka [index.html](index.html) di browser Anda
2. Aplikasi siap digunakan tanpa instalasi tambahan

## ✨ Fitur Utama

### Manajemen Proyek
- **Tambah Proyek**: Klik tombol "Tambah Proyek" untuk membuat proyek baru
- **Edit Proyek**: Klik tombol "Edit" untuk mengubah nama, deskripsi, jadwal, dan dependensi
- **Hapus Proyek**: Klik tombol "Hapus" untuk menghapus proyek (dengan konfirmasi)
- **Status & Progress**: Otomatis dihitung dari tugas-tugas di proyek
  - Status: Draft → In Progress → Done
  - Progress: Persentase berdasarkan bobot tugas yang sudah selesai
- **Project Dependencies**: Tentukan dependensi antar proyek
- **Project Schedule**: Tetapkan tanggal mulai dan akhir untuk setiap proyek

### Manajemen Tugas
- **Tambah Tugas Cepat**: Klik tombol "+" di card proyek untuk langsung tambah tugas
- **Edit Tugas**: Klik "Edit" pada tugas untuk mengubah semua properti
- **Hapus Tugas**: Klik "Hapus" untuk menghapus tugas (dengan konfirmasi)
- **Task Dependencies**: Tentukan tugas mana yang harus diselesaikan lebih dulu
- **Subtasks/Hierarchy**: Buat tugas dengan parent-child relationships
- **Bobot Tugas**: Nilai integer untuk menentukan kontribusi terhadap progress proyek

## 🎯 Fitur Advanced

### 1. Task Dependency
- Setiap task dapat memiliki satu atau lebih dependency ke task lain
- **Validasi Status**: Task tidak dapat berubah ke status "Done" jika ada dependency yang belum "Done"
- **Circular Dependency Prevention**: Sistem otomatis mencegah direct/indirect circular dependencies
- **Cascading Validation**: Saat status dependency berubah, dependent tasks divalidasi ulang otomatis
- **Visual Indicators**: Tampilkan list dependencies pada setiap task

**Contoh Use Case:**
- Task "Code Backend" bergantung pada "Design Database" harus selesai dulu
- Jika mencoba tandai "Code Backend" sebagai Done saat "Design Database" masih Draft, sistem akan menolak

### 2. Project Dependency
- Project dapat memiliki dependency ke project lain
- **Status Constraints**: Project tidak bisa In Progress atau Done jika dependency project belum Done
- **Cascading Status Changes**: Jika project dependency berubah status (misal dari Done ke In Progress), project yang bergantung otomatis kembali ke Draft
- **Circular Prevention**: Sistem menolak circular dependencies antar project
- **Visual Indicators**: Tampilkan dependencies pada project cards

**Contoh Use Case:**
- Project "Mobile App" bergantung pada "Backend API"
- Jika Backend API belum selesai, Mobile App tetap di status Draft
- Saat Backend API status berubah jadi In Progress, Mobile App otomatis menjadi Draft

### 3. Task Hierarchy (Subtasks)
- Task dapat memiliki parent task dan mehrere child tasks
- **Hierarchical Status**: Status ditentukan oleh task itu sendiri dan semua subtask-nya
  - All Done = semua parent dan subtask selesai
  - In Progress = ada subtask atau parent yang sedang dikerjakan
  - Draft = sisanya
- **Filtering with Hierarchy**: 
  - Jika subtask match filter, parent tetap ditampilkan
  - Jika parent match, semua child ditampilkan
  - Hasil selalu konsisten secara hierarki
- **Visual Indentation**: Subtask ditampilkan dengan indentasi untuk clarity

**Contoh Use Case:**
- Task "Project Planning" dengan subtask:
  - "Research User Needs" (subtask)
  - "Create Mockups" (subtask)
  - "Get Approval" (subtask)
- Status "Project Planning" dihitung dari semua subtask-nya

### 4. Project Schedule (Non-Intersecting)
- Setiap project memiliki optional start_date dan end_date
- **Non-Intersection Validation**: 
  - Tidak boleh ada 2 project dengan jadwal yang saling overlap
  - Validasi berlaku saat create maupun update
- **Conflict Detection**: Jika ada konflik, sistem menunjukkan project mana yang menyebabkan konflik
- **Date Display**: Jadwal ditampilkan pada project cards untuk reference

**Contoh Use Case:**
- Project A: 2024-01-01 to 2024-02-28
- Project B: 2024-02-15 to 2024-03-31 ❌ (Overlap dengan A)
- Sistem akan reject dengan pesan: "Schedule conflict with project 'A' (2024-01-01 - 2024-02-28)"

## 🎯 Cara Menggunakan

### Membuat Proyek dengan Schedule dan Dependencies
1. Klik tombol **"Tambah Proyek"**
2. Isi nama, deskripsi, tanggal mulai, tanggal akhir
3. Pilih proyek lain yang menjadi dependency (jika ada)
4. Klik **"Simpan"**

Sistem akan otomatis:
- Validasi tidak ada overlap jadwal
- Validasi tidak ada circular dependency
- Reject jika ada masalah dan tampilkan error message

### Menambah Task dengan Dependencies
1. Pilih proyek dari list
2. Klik tombol **"+"** pada project card
3. Isi nama, status, bobot
4. Tentukan parent task (jika ingin membuat subtask)
5. Pilih task lain sebagai dependencies (Ctrl+Click untuk multiple)
6. Klik **"Simpan"**

Sistem akan:
- Validasi circular dependency
- Mencegah perubahan status ke Done jika ada dependency yang belum selesai
- Menampilkan hierarchical status berdasarkan semua subtask

### Filtering Tasks Termasuk Subtasks
- Search otomatis match di parent OR subtask
- Jika subtask match filter, parent tetap ditampilkan
- Keseluruhan hasil tetap menampilkan full hierarchy

**Contoh:**
- Cari "Database" 
- Akan menampilkan:
  - Parent: "Backend Development"
  - Child: "Design Database" ✓ (match)
  - Child: "Implement ORM" (tidak match tapi ditampilkan karena parent hierarchy)

## 📊 Data Storage
- Semua data tersimpan di browser's localStorage
- Key untuk projects: `project-tracker:projects`
- Key untuk tasks: `project-tracker:tasks`
- Data structure mendukung nested dependencies dan parent-child relationships

## ⚠️ Important Notes
- Hapus project akan juga menghapus semua tasknya
- Task status tidak bisa diubah ke Done jika ada dependency yang belum Done
- Project status otomatis cascade down saat dependency berubah
- Jadwal project tidak boleh overlap dengan project lain


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
