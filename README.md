📘 Website Manajemen Sekolah — Fullstack Supabase + React

Sebuah sistem manajemen sekolah modern yang dibangun menggunakan React + Vite, Supabase, dan desain UI modern.
Aplikasi ini dirancang untuk memudahkan sekolah dalam mengelola data akademik, absensi, event, dan peran pengguna seperti admin & guru.

🚀 Fitur Utama
🖥️ 1. Dashboard Utama

Card Statistik (Total Siswa, Total Guru, Total Kelas, Event Aktif)

Grafik rata-rata nilai per kelas (Recharts)

Pengumuman terbaru (real-time)

📚 2. Data Akademik

CRUD Siswa

CRUD Guru (tanpa absensi untuk guru)

CRUD Kelas

Import/export data

🧑‍🏫 3. Guru

Form Tambah Guru meliputi:

NIP

First Name

Last Name

Email

Phone

🎓 4. Siswa

Data lengkap siswa

Absensi siswa

Rekap hadir / izin / alfa

Per kelas atau seluruh sekolah

🛡️ 5. Sistem Autentikasi

Menggunakan Supabase Auth dengan role:

admin — Akses penuh pada dashboard dan manajemen sekolah

guru — Akses terbatas sesuai izin

Token dan sesi dikelola melalui Zustand Store.

🏗️ Teknologi Utama
Tools	Fungsi
React + Vite	Frontend modern dan cepat
Supabase	Database, Auth, Storage
Zustand	State management
TailwindCSS	Desain UI
Recharts	Grafik dashboard
React Router	Sistem halaman multi-route
🔧 Cara Menjalankan Project
1️⃣ Clone Repository
git clone https://github.com/fadelcodes/Website-Manajemen-Sekolah.git

2️⃣ Masuk ke folder project
cd Website-Manajemen-Sekolah

3️⃣ Install Dependencies
npm install

4️⃣ Buat file .env

Isi dengan variabel Supabase:

VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-anon-key

5️⃣ Jalankan project
npm run dev

📂 Struktur Folder
/src
 ├── components/       # Reusable UI components
 ├── pages/            # Halaman utama seperti Dashboard, Login, Siswa, Guru
 ├── stores/           # Zustand store (authStore, userStore)
 ├── utils/            # Helper, formatter, fetcher
 ├── services/         # Supabase service
 └── App.jsx           # Router utama

🔐 Roles & Akses

Role disimpan pada tabel users Supabase:

Role	Akses
admin	Full akses dashboard, CRUD, manajemen user
guru	Akses terbatas, hanya data yang diperlukan
🧰 Roadmap Pengembangan

 Sistem pembayaran SPP

 Sistem rapor digital

 Notifikasi WhatsApp otomatis

 Integrasi presensi QR Code

 Mode dark/light

💻 Kontribusi

Pull request sangat diterima!
Jika menemukan bug atau ingin fitur baru, silakan buat issue di repository ini.

📞 Kontak

Developer: Fadel
GitHub: https://github.com/fadelcodes

Email: admin@pgri35.sch.id
