# Perencanaan Fitur Registrasi Pengguna

Dokumen ini berisi panduan tahap demi tahap untuk mengimplementasikan fitur registrasi pengguna baru. Fitur ini mencakup penambahan tabel ke database, penambahan logika bisnis, dan pembuatan API endpoint menggunakan ElysiaJS.

## Struktur Folder dan File
Struktur kode harus mengikuti aturan berikut di dalam folder `src`:
- **`src/routes/`**: Tempat meletakkan file definisi route ElysiaJS. Format penamaan file: `<nama>-route.ts` (misal: `users-route.ts`).
- **`src/services/`**: Tempat meletakkan file logika bisnis aplikasi. Format penamaan file: `<nama>-service.ts` (misal: `users-service.ts`).

---

## Tahapan Implementasi

### Tahap 1: Membuat Skema Database Tabel `users`
1. Buka file skema database (biasanya `src/db/schema.ts`).
2. Buat skema tabel `users` dengan spesifikasi berikut:
   - `id`: integer, auto increment, primary key
   - `name`: varchar(255), not null
   - `email`: varchar(255), not null, harus unik (unique constraint)
   - `password`: varchar(255), not null (kolom ini akan digunakan untuk menyimpan password yang sudah di-hash)
   - `created_at`: timestamp, default current_timestamp
3. Setelah skema dibuat/diubah, jalankan proses migrasi database (misalnya dengan menjalankan `drizzle-kit generate` dan `drizzle-kit push` atau perintah serupa yang ada di `package.json`).

### Tahap 2: Menyiapkan Dependensi Hashing
1. Instal dependensi `bcrypt` (atau library sejenis seperti `bcryptjs` jika lebih disukai).
   - Perintah: `bun add bcrypt` dan `bun add -d @types/bcrypt`.

### Tahap 3: Membuat Logic Bisnis (Service)
1. Buat direktori `src/services` (jika belum ada).
2. Buat file baru: `src/services/users-service.ts`.
3. Buat sebuah fungsi (contoh: `registerUser`) yang menerima input `name`, `email`, dan `password`.
4. Di dalam fungsi tersebut, implementasikan logika berikut:
   - **Cek Duplikasi Email:** Lakukan query ke database menggunakan Drizzle ORM untuk mengecek apakah `email` yang diinputkan sudah ada di tabel `users`.
   - **Handling Error:** Jika email sudah terdaftar, return (atau throw) sebuah error yang spesifik agar bisa ditangkap oleh router.
   - **Hashing Password:** Lakukan hashing pada input `password` menggunakan fungsi dari library `bcrypt`.
   - **Simpan Data:** Insert data user baru (`name`, `email`, dan `password` **yang sudah di-hash**) ke tabel `users`.

### Tahap 4: Membuat API Endpoint (Route)
1. Buat direktori `src/routes` (jika belum ada).
2. Buat file baru: `src/routes/users-route.ts`.
3. Definisikan route baru pada ElysiaJS untuk menangani HTTP POST (misal di endpoint `/users/register`).
4. Panggil fungsi `registerUser` dari `users-service.ts` di dalam handler route tersebut.
5. Tangkap kemungkinan error dari service (misalnya jika email sudah terdaftar) dan kembalikan response JSON yang sesuai.
6. Kembalikan response JSON sukses jika tidak ada error.

**Format Request Body (Input):**
```json
{
    "name": "depi",
    "email": "depi@gmail.com",
    "password": "rahasia"
}
```

**Format Response Body (Sukses):**
```json
{
    "data": "OK"    
}
```

**Format Response Body (Error - Email Terdaftar):**
```json
{
    "error": "email sudah terdaftar"
}
```

### Tahap 5: Mendaftarkan Route ke Aplikasi Utama
1. Buka file utama aplikasi (`src/index.ts`).
2. Import instance route yang telah dibuat di `src/routes/users-route.ts`.
3. Gunakan plugin `.use()` dari Elysia untuk memasang route tersebut agar bisa diakses.

---

## Kriteria Penerimaan (Acceptance Criteria)
- [ ] Tersedia file `users-route.ts` dan `users-service.ts` di folder yang benar.
- [ ] Tabel `users` terbuat di database dengan tipe data yang sesuai.
- [ ] Password yang tersimpan di database adalah hasil hash, BUKAN plain text.
- [ ] Endpoint registrasi dapat memproses request dengan sukses dan mengembalikan format JSON `{"data": "OK"}`.
- [ ] Endpoint menolak registrasi jika email sudah ada dan mengembalikan format JSON `{"error": "email sudah terdaftar"}`.
