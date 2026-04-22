# HappyBirthday MyLove 🎂💖

Website ulang tahun romantis berbasis **HTML, CSS, dan JavaScript** dengan beberapa section interaktif seperti story timeline, gallery lightbox, surat cinta, dan birthday moment.

## ✨ Fitur Utama

- Hero section dengan animasi entrance
- Navigasi titik (dot navigation) antar section
- Floating hearts pada canvas
- Timeline cerita "Our Story"
- Gallery dengan lightbox
- Letter section (surat personal)
- Reason cards interaktif
- Birthday section dengan efek selebrasi

## 🗂️ Struktur Project

```text
.
├── index.html
├── favicon.ico
├── assets/
├── css/
│   └── style.css
└── js/
    ├── app.js
    └── index.js
```

## 🚀 Cara Menjalankan (Local)

Karena ini project statis, kamu bisa buka langsung file `index.html` di browser.

Lebih disarankan pakai local server supaya semua fitur berjalan konsisten:

### Opsi 1: VS Code Live Server
1. Install extension **Live Server**.
2. Klik kanan `index.html` → **Open with Live Server**.

### Opsi 2: Python HTTP Server
```bash
cd "/Users/macbookair/Desktop/Applications/Website/HTML CSS/HappyBirthday MyLove"
python3 -m http.server 5500
```

Lalu buka: `http://localhost:5500`

## 🛠️ Kustomisasi Cepat

Edit konten di `index.html` pada bagian bertanda `[CUSTOMIZE]` untuk:
- Nama pasangan
- Isi timeline
- Foto gallery di folder `assets/`
- Isi surat
- Tanggal ulang tahun

Untuk style dan animasi:
- `css/style.css`

Untuk interaksi JavaScript:
- `js/app.js`
- `js/index.js`

## 📦 Upload ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: HappyBirthday MyLove"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

## 📝 Catatan

Project ini cocok dijadikan hadiah digital personal. Silakan sesuaikan teks, foto, dan detail kecil lainnya biar lebih bermakna.
