# Walkthrough - Hybrid Face Verification & HRIS Enhancements

I have successfully implemented the backend-side face verification logic and other HRIS compliance enhancements.

## New Feature: Hybrid Face Verification (Free Prototype)

I have moved the face "Identity" verification logic to the backend while keeping the "Active Liveness" behavior on the mobile app.

### 1. AI Engine & Infrastructure
- **Library**: Installed `@vladmandic/face-api` (based on TensorFlow.js) and `canvas` for server-side image processing.
- **Models**: Downloaded pre-trained AI weights (SSD Mobilenet, Landmarks, Face Recognition) to `assets/models`.
- **Database**: Added a `face_descriptor` column to `tr_face_registrations` to store unique face embeddings (vector data).

### 2. Registration Flow
- When a user registers their face, the backend now extracts a **Face Descriptor** from the front photo.
- This descriptor is saved securely in the database for later comparison.

### 3. Attendance Verification
- During **Clock-In** and **Clock-Out**, the backend now:
    1.  Receives the selfie photo from mobile.
    2.  Extracts the descriptor from the live photo.
    3.  Compares it with the stored descriptor using **Euclidean Distance**.
    4.  Rejects the attendance if the face does not match (Distance > 0.6).

---

## Other Completed Enhancements

### 1. Holiday & Workday Automation
- **Sync Holiday**: Added a button to sync official Indonesian holidays for any year via `POST /holiday-calendar/sync`.
- **Auto Workdays**: Payroll now automatically calculates "Effective Work Days" per month (Mon-Fri minus Holidays) for accurate prorate calculations.

### 2. Compliance & Leave
- **Cuti Umroh**: Added 30-day special leave type via SQL seed.
- **Admin Submission**: Enabled Admins/HR to submit leave and time-off requests on behalf of employees.
- **Overtime**: Verified rounding logic (0.5h/1h) is correct and matches requirements.

## Files Modified
- [face-recognition.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/common/services/face-recognition.service.ts)
- [attendance.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/attendance/attendance.service.ts)
- [face-registration.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/face-registration/face-registration.service.ts)
- [payroll.service.ts](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/src/modules/payroll/payroll.service.ts)
- [schema.prisma](file:///c:/Users/ikrarnegaraa/akbar-workspace/samugara/hris/github/hris-backend/prisma/schema.prisma)

## Instructions for User
If you are running this in a new environment, make sure to run:
1. `npm install`
2. `node scripts/download-models.js` (to get the AI weights)
3. `npx prisma generate`
