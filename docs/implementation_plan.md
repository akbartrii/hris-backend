# Implementation Plan - Special Leave & Admin Submissions

The goal is to address the remaining requirements for the HRIS backend: adding "Umroh" leave type and enabling administrative submission for leave and time-off requests.

## User Review Required

> [!IMPORTANT]
> Admin submission will allow users with 'admin', 'hrd', 'manager_hrga', or 'super_admin' roles to submit requests on behalf of any employee by providing an `employee_id`.

## Proposed Changes

### Leave Module

#### [MODIFY] [create-leave.dto.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/leave/dto/create-leave.dto.ts)
- Add optional `employee_id` field with UUID validation.

#### [MODIFY] [leave.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/leave/leave.service.ts)
- Update `createLeave` to accept `userRole` (from controller).
- Logic: If `employee_id` is provided in DTO AND user is admin/HR, use that `employee_id`. Otherwise, use the logged-in user's `employee_id`.

#### [MODIFY] [leave.controller.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/leave/leave.controller.ts)
- Pass `user.role` to `leaveService.createLeave`.

### Time Off Module

#### [MODIFY] [create-time-off.dto.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/time-off/dto/create-time-off.dto.ts)
- Add optional `employee_id` field.

#### [MODIFY] [time-off.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/time-off/time-off.service.ts)
- Update `createTimeOff` to handle admin submission logic similar to Leave.

#### [MODIFY] [time-off.controller.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/time-off/time-off.controller.ts)
- Pass `user.role` to `timeOffService.createTimeOff`.

### Data / Seeds

#### [NEW] [add_umroh_leave.sql](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/prisma/add_umroh_leave.sql)
- SQL script to insert "Cuti Umroh" into `ms_leave_types`.
- Category: `special`, Default Days: `30`, Is Paid: `true`.

### Holiday & Workday Automation

#### [MODIFY] [holiday-calendar.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/holiday-calendar/holiday-calendar.service.ts)
- Implement `syncHolidays(year: number)` to fetch data from `api-hari-libur.vercel.app`.
- Automatic upsert into `ms_holiday_calendars`.

#### [MODIFY] [holiday-calendar.controller.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/holiday-calendar/holiday-calendar.controller.ts)
- Add `POST /sync` endpoint for admin.

#### [MODIFY] [payroll.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/payroll/payroll.service.ts)
- Implement `calculateEffectiveWorkDays(month, year, companyId)` helper.
- Update `calculateProrate` to use dynamic effective days instead of fixed parameter.

## Verification Plan

### Automated Tests
- I will verify the logic by checking the updated services and controllers.

### Manual Verification
- Confirm that regular employees cannot specify an `employee_id` for others.
- Confirm that admins can successfully create requests for subordinates/other employees.
