# HRIS Samugara — Render Deployment Guide

## Prerequisites

- Akun GitHub dengan repository ini di-push
- Akun Render (https://render.com)

## Step 1: Push ke GitHub

```bash
git add .
git commit -m "feat: complete Day 1-7 implementation"
git push origin main
```

## Step 2: Setup Keep-Alive (Penting untuk Free Tier!)

Render Free Tier akan **sleep setelah 15 menit idle**. Internal cron job di NestJS juga akan mati saat sleep.

### Solusi: External Ping Service (GRATIS)

Daftar ke salah satu service berikut untuk ping endpoint `/api/health` setiap **10 menit**:

#### Opsi A: UptimeRobot (Recommended)

1. Buka https://uptimerobot.com
2. Sign up free
3. Klik **Add New Monitor**
4. Pilih tipe **HTTP(s)**
5. URL: `https://hris-samugara-api.onrender.com/api/health`
6. Interval: **10 menit** (600 detik)
7. Save

#### Opsi B: Cron-job.org

1. Buka https://cron-job.org
2. Sign up free
3. Klik **Create cronjob**
4. URL: `https://hris-samugara-api.onrender.com/api/health`
5. Schedule: Every 10 minutes
6. Save

#### Opsi C: PingMe.io

1. Buka https://pingme.io
2. Setup ping ke URL deploymu

> ⚠️ **Tanpa external ping**, API akan sleep dan request pertama setelah idle akan lambat (~30 detik cold start).

## Step 3: Deploy ke Render

### 3.1 New Web Service

1. Login ke [Render Dashboard](https://dashboard.render.com)
2. Klik **New +** → **Web Service**
3. Connect repository GitHub `hris-samugara-backend`
4. Isi konfigurasi:

| Setting       | Value                                |
| ------------- | ------------------------------------ |
| Name          | `hris-samugara-api`                  |
| Environment   | `Node`                               |
| Region        | `Singapore` (terdekat)               |
| Branch        | `main`                               |
| Build Command | `npm install && npx prisma generate` |
| Start Command | `npm run start:prod`                 |
| Plan          | `Free`                               |

### 3.2 Environment Variables

Tambahkan semua variable dari `.env` ke tab **Environment** di Render:

```bash
NODE_ENV=production
PORT=10000
APP_NAME=HRIS Samugara
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
SUPABASE_STORAGE_BUCKET=attendance-photos
MAX_FILE_SIZE=5242880
```

> ⚠️ **Jangan lupa ganti**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, dan `JWT_SECRET` dengan nilai asli dari project Supabase-mu.

### 3.3 Deploy

Klik **Create Web Service**. Render akan auto-build dan deploy.

## Step 4: Verifikasi

Setelah deploy sukses, cek endpoint:

```bash
curl https://hris-samugara-api.onrender.com/api/health
```

Response yang diharapkan:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-04-25T15:00:00.000Z",
    "uptime": 123.456
  },
  "message": "Operation successful"
}
```

Swagger Docs: `https://hris-samugara-api.onrender.com/api/docs`

## Troubleshooting

### Build Failed

- Pastikan `package.json` dan `package-lock.json` sudah di-commit
- Cek log build di Render Dashboard

### Prisma Error

- Pastikan `DATABASE_URL` valid
- Pastikan Supabase project aktif dan IP tidak diblokir

### 502 Bad Gateway / Timeout

- Ini normal untuk request pertama setelah sleep (cold start ~30 detik)
- Pastikan external ping service sudah aktif

### JWT Error

- Pastikan `JWT_SECRET` di-render tidak kosong dan panjangnya > 32 karakter

## Notes

- **Free Tier Limit**: 512 MB RAM, sleep after 15 min idle
- **Database**: Supabase Free Tier juga sleep setelah 7 hari inactive. Pastikan ada aktivitas database.
- **File Upload**: Supabase Storage bucket `attendance-photos` harus sudah dibuat dan public.
