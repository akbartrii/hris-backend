# Seed Komprehensif - Rencana Pengisian Data Dummy

## Tujuan
Mengisi 11 tabel yang masih kosong dengan data dummy yang realistis dan terintegrasi dengan data existing dari `04_seed_master.sql` dan `05_seed_dummy.sql`.

## File Output
`docs/06_seed_comprehensive.sql` — PostgreSQL script menggunakan `DO $$ DECLARE` block agar bisa SELECT reference ID dari data yang sudah ada.

---

## 1. `ms_teams` — 6 teams

| Team | Code | Department | Head |
|---|---|---|---|
| IT Production | IT-PROD | IT | Admin HRIS |
| IT Development | IT-DEV | IT | (none) |
| HRGA Operations | HRGA-OPS | HRGA | Rudi Hartono |
| Security Unit | SEC-UNIT | Security | Siti Wulandari |
| Finance & Accounting | FIN-ACC | Keuangan | Rina Kusuma |
| Office Administration | OFF-ADM | Tegal Office | Budi Santoso |

## 2. `ms_ter` + `ms_ter_fee` — PPh TER Tax Tables

- **ms_ter**: 10 PTKP statuses (TK/0, TK/1, K/0, TK/2, TK/3, K/1, K/2, K/3, TK, PTKP Nol)
- **ms_ter_fee**: 126 brackets across 4 categories (A, B, C, D) + 1 catch-all (D)

Diambil dari `docs/ms_ter_seed.sql` yang sudah ada.

## 3. `ms_parameters` — 8 system parameters

| Key | Value | Description |
|---|---|---|
| `late_deduction_rate` | 5000 | Potongan per jam terlambat (Rp) |
| `max_late_minutes` | 60 | Maks menit terlambat sebelum SP |
| `attendance_allowance_amount` | 25000 | Tunjangan absensi per hari (Rp) |
| `bpjs_kesehatan_rate` | 0.04 | Rate BPJS Kesehatan (4%) |
| `bpjs_ketenagakerjaan_rate` | 0.054 | Rate BPJS Ketenagakerjaan (5.4%) |
| `max_overtime_hours_per_day` | 4 | Maks jam lembur per hari |
| `annual_leave_carry_over_limit` | 6 | Maks cuti dibawa ke tahun depan |
| `company_professional_allowance` | 5000000 | Tunjangan profesional (Rp) |

## 4. `ms_face_registrations` — 3 employees

Rudi (TG004), Maya (TG005), Siti (TG089) — menggunakan path foto dari `dummyassets/`.

## 5. `tr_leave_balances` — 24 records

8 employees × 3 leave types (annual=12 days, sick=14 days, umrah=30 days) untuk 2026.
- used_days dihitung dari leave requests yang sudah approved di `05_seed_dummy.sql`

Dipilih leave types: annual (is_annual=true), sick (relevant), umrah (relevant).

## 6. `tr_reimbursements` — 6 records

| Employee | Category | Amount | Status |
|---|---|---|---|
| Budi (TG001) | Transportasi | 150000 | pending |
| Budi (TG001) | Makanan | 85000 | approved |
| Budi (TG001) | Bensin | 200000 | approved |
| Maya (TG005) | Alat Tulis | 75000 | pending |
| Dedi (TG006) | BBM Lapangan | 150000 | pending |
| Rina (TG007) | Seminar | 350000 | approved |

## 7. `tr_overnight_requests` — 3 records

Security shift overnight untuk Siti (TG089) — berbagai tanggal di April 2026.

## 8. `tr_remote_work_requests` — 4 records

WFH untuk Maya (TG005), Budi (TG001), Rina (TG007) — berbagai status.

## 9. `tr_user_devices` — 4 records

FCM token dummy untuk admin, rudi, budi, maya.

## 10. `ms_salary_keys` — 2 records

Kunci enkripsi untuk periode Maret 2026 dan April 2026.

## 11. `tr_audit_logs` — 8 records (opsional)

Sample audit entries dari aktivitas seed.

---

## Estimasi
- **Plan file**: ~90 lines markdown
- **SQL file**: ~350-400 lines
- **Waktu eksekusi**: < 1 detik di Supabase SQL Editor
