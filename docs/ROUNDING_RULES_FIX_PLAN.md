# Fix Plan: Overtime Rounding Rules

## Context

The current overtime rounding logic uses a generic `Math.ceil(totalMinutes / 30) * 0.5` formula (parameter `overtime_rounding_minutes` defaults to 30). This produces results that **do not match** the company's business rules documented in the PDF spec.

## Problem

Examples of current vs. required behavior:

| Raw Minutes  | Current (generic 30m ceiling) | PDF Requirement |
| ------------ | ----------------------------- | --------------- |
| 15m          | 0.5h                          | 0.5h            |
| 45m          | 1.0h                          | 1.0h            |
| 75m (1h15m)  | **1.5h**                      | **1.0h**        |
| 90m (1h30m)  | 1.5h                          | 1.5h            |
| 105m (1h45m) | **2.0h**                      | **1.5h**        |
| 106m (1h46m) | **2.0h**                      | **2.0h**        |

The generic 30-minute ceiling overcounts overtime for remainders of 15-45 minutes after a full hour.

## Solution

Replace the generic `roundUpHours` method with a **fixed ruleset** that matches the PDF specification exactly.

### Algorithm

```
if totalMinutes <= 30  -> 0.5h
if totalMinutes <= 60  -> 1.0h

fullHours = floor(totalMinutes / 60)
remainder = totalMinutes % 60

if remainder == 0      -> fullHours
if remainder <= 15     -> fullHours           (rounded down)
if remainder <= 45     -> fullHours + 0.5h
else                   -> fullHours + 1.0h    (rounded up)
```

### Rationale

- The PDF gives specific examples (1h15m = 1h, 1h45m = 1.5h, 1h46m = 2h).
- The pattern is: **every 30-minute block counts as 0.5h, but if the final remainder is 15 minutes or less, it is discarded rather than rounded up.**
- This is a common Indonesian overtime rounding policy.

## Implementation

1. **Update `src/modules/overtime/overtime.service.ts`**
   - Rewrite `roundUpHours()` to implement the fixed ruleset above.
   - Remove dependency on `parameterService.getNumber('overtime_rounding_minutes')`.
2. **Update Postman collection** (if overtime response examples exist).
3. **Build & lint** to verify no regressions.

## Files Changed

- `src/modules/overtime/overtime.service.ts`
- `docs/ROUNDING_RULES_FIX_PLAN.md` (this file)

## Testing Checklist

- [ ] 15m -> 0.5h
- [ ] 45m -> 1.0h
- [ ] 75m -> 1.0h
- [ ] 90m -> 1.5h
- [ ] 105m -> 1.5h
- [ ] 106m -> 2.0h
- [ ] 120m -> 2.0h
- [ ] 135m -> 2.0h
- [ ] 136m -> 2.5h
