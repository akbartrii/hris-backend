# Fix Plan: Cuti Khusus / Wajib Pemerintah & Cuti Umroh

## Context

The PDF spec requires two additional leave categories beyond the current annual leave system:

1. **Cuti Khusus / Cuti Wajib Pemerintah** — Government-mandatory special leave (e.g., marriage, bereavement, menstrual leave). Does **not** reduce annual leave balance.
2. **Cuti Umroh** — Up to 1 month (30 days) of unpaid/partially-paid leave for Umroh pilgrimage. Does **not** reduce annual leave balance.

## Problem

Current `ms_leave_types` only has `is_annual` boolean to distinguish leave types. While `is_annual: false` already prevents balance deduction, there is:

- No way to categorize leave types for reporting/admin clarity
- No specific validation rules for Umroh (max 30 days, potentially once-per-year limit)
- No predefined seed data for these leave types

## Solution

Add a `category` enum field to `ms_leave_types` and implement category-specific validations in the leave service.

### Schema Changes

```prisma
model ms_leave_types {
  id                   String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                 String              @db.VarChar(255)
  code                 String?             @unique @db.VarChar(50)
  category             String              @default("other") @db.VarChar(50)  // NEW
  default_days         Int?                @default(0)
  is_annual            Boolean?            @default(false)
  is_paid              Boolean?            @default(true)
  requires_attachment  Boolean?            @default(false)
  max_days_per_request Int?
  created_at           DateTime?           @default(now()) @db.Timestamptz(6)
  tr_leave_balances    tr_leave_balances[]
  tr_leave_requests    tr_leave_requests[]
}
```

### Category Enum Values

- `annual` — Cuti Tahunan (reduces balance, 1-year service requirement)
- `government_mandatory` — Cuti Khusus / Wajib Pemerintah (no balance reduction, typically 2-3 days, paid)
- `umroh` — Cuti Umroh (no balance reduction, max 30 days, unpaid by default)
- `sick` — Cuti Sakit (no balance reduction, may require attachment)
- `personal` — Cuti Pribadi / unpaid leave
- `other` — Default catch-all

### Validation Rules

| Category               | Max Days     | Reduces Balance | Paid         | Special Rules              |
| ---------------------- | ------------ | --------------- | ------------ | -------------------------- |
| `annual`               | Configurable | Yes             | Yes          | 1-year service requirement |
| `government_mandatory` | Configurable | No              | Yes          | None                       |
| `umroh`                | **30**       | No              | Configurable | Max 30 days enforced       |
| `sick`                 | Configurable | No              | Configurable | May require attachment     |
| `personal`             | Configurable | No              | No           | None                       |
| `other`                | Configurable | No              | Yes          | None                       |

## Implementation Steps

1. **Prisma Schema** — Add `category` field to `ms_leave_types`
2. **Migration** — `npx prisma migrate dev --name add_leave_type_category`
3. **DTOs** — Update `CreateLeaveTypeDto` and `UpdateLeaveTypeDto` to include `category`
4. **Leave Service** — Update `createLeave` to enforce category-specific rules (especially Umroh 30-day limit)
5. **Seed SQL** — Insert predefined leave types:
   - Cuti Menikah (government_mandatory)
   - Cuti Keluarga Meninggal (government_mandatory)
   - Cuti Haid (government_mandatory)
   - Cuti Umroh (umroh, max_days=30, is_paid=false)
6. **Build & Lint**

## Files Changed

- `prisma/schema.prisma`
- `prisma/migrations/...`
- `src/modules/leave-types/dto/create-leave-type.dto.ts`
- `src/modules/leave-types/dto/update-leave-type.dto.ts`
- `src/modules/leave/leave.service.ts`
- `docs/SPECIAL_LEAVE_UMROH_FIX_PLAN.md` (this file)
- Seed SQL (optional)

## Testing Checklist

- [ ] Create leave type with category `umroh` and max_days=30
- [ ] Submit Umroh leave for 31 days → rejected
- [ ] Submit Umroh leave for 30 days → approved
- [ ] Submit Government Mandatory leave → does not reduce annual balance
- [ ] Annual leave still reduces balance correctly
