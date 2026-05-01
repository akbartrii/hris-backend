# Face Registration ML Backend Migration Plan

## HRIS Samugara - System Analysis & Engineering Proposal

**Date:** 2026-05-01
**Author:** Senior System Analyst & Senior Backend Engineer
**Status:** Approved for Implementation

---

## 1. Executive Summary

This document outlines the analysis and technical plan for migrating the Face Registration and Verification logic from the **Frontend (Mobile)** to the **Backend**.

**Current State:** The mobile application uses ML Kit for real-time pose detection (smile, blink, left/right face) and TensorFlow for face recognition. The backend (`hris-backend`) currently acts as a "dumb storage," only receiving the final 4 photos and updating a status flag without performing any AI/ML verification.

**Proposal:** Implement a **Hybrid Architecture** where the Mobile App retains the User Interface (UI) and real-time camera guidance using ML Kit, but the **critical security decisions** (Liveness Detection, Face Embedding Generation, and 1:1 Verification) are moved to a dedicated **Python-based ML Microservice** integrated with the backend.

**Verdict:** This migration is **highly recommended** to enhance security, prevent spoofing, and centralize control over biometric data, despite the introduction of infrastructure costs and network latency.

---

## 2. Current State Analysis

### 2.1. Backend Architecture (NestJS)

- **Framework:** NestJS v10 (Node.js/TypeScript).
- **Database:** PostgreSQL via Prisma ORM.
- **Storage:** Supabase Storage (`face-registrations` bucket).
- **Face Registration Endpoint:** `POST /api/face-registration`
  - Accepts 4 multipart photos: `front_photo`, `smile_photo`, `right_photo`, `left_photo`.
  - Uploads photos to Supabase with path: `{employeeId}/face_{timestamp}_{pose}.{ext}`.
  - Upserts record in `tr_face_registrations` (stores public URLs).
  - Updates `tr_employees.face_registration_status` to `'registered'`.
- **Clock-In Endpoint:** `POST /api/attendance/clock-in`
  - Validates `face_registration_status === 'registered'`.
  - **No facial verification is performed.** The backend blindly accepts the clock-in photo and stores it in the `attendance-photos` bucket.

### 2.2. Mobile Application (Frontend)

- **ML Kit:** Handles real-time pose detection (Smile, Blink, Head Euler Angles for Left/Right).
- **TensorFlow Lite:** Runs an on-device model for Face Recognition/Embedding generation.
- **Security Boundary:** The decision of "Is this face valid?" and "Does this match the registered user?" is currently made entirely on the client-side device.

### 2.3. Critical Finding

**There is zero server-side verification.** If the mobile application is tampered with, reverse-engineered, or if a malicious actor sends crafted HTTP requests directly to the API, the backend has no mechanism to detect fraudulent registrations or impersonation during clock-in.

---

## 3. Proposed Architecture: Hybrid Model

### 3.1. High-Level Flow

```text
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Mobile App    │      │  NestJS Backend  │      │  Python ML Service  │
│  (UI + Camera)  │      │   (API Gateway)  │      │   (FastAPI/Flask)   │
└────────┬────────┘      └────────┬─────────┘      └──────────┬──────────┘
         │                        │                           │
         │ 1. Record Video/Frames │                           │
         │    (based on UI Guide) │                           │
         │───────────────────────>│                           │
         │                        │ 2. Forward for Processing │
         │                        │──────────────────────────>│
         │                        │                           │
         │                        │    3. Liveness Detection  │
         │                        │    4. Face Embedding      │
         │                        │    5. 1:1 Verification    │
         │                        │<──────────────────────────│
         │                        │                           │
         │ 6. Success/Fail        │                           │
         │<───────────────────────│                           │
```

### 3.2. Component Responsibilities

| Component                 | Responsibility                                                                                                                                       |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mobile App**            | Provide camera UI/UX, display instructions ("Please smile", "Turn left"), capture video/frames, and upload to backend. **No security decisions.**    |
| **NestJS Backend**        | Handle authentication, receive uploads, validate GPS/Schedule, forward media to ML Service, handle database transactions, and return final response. |
| **Python ML Service**     | Run CPU/GPU intensive tasks: Liveness Detection, Face Detection, Embedding Generation, and Similarity Comparison.                                    |
| **PostgreSQL + pgvector** | Store encrypted face embeddings (vectors) and verification logs.                                                                                     |

---

## 4. Architectural Options Comparison

| Option                      | Description                                                       | Pros                                                           | Cons                                                                                                                 |
| :-------------------------- | :---------------------------------------------------------------- | :------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **A. Hybrid (RECOMMENDED)** | Mobile handles UI, Backend handles security logic via ML Service. | - High Security<br>- Model protection<br>- Maintains decent UX | - Increased bandwidth usage<br>- Server compute costs                                                                |
| **B. Full Server-Side**     | Mobile streams video to backend in real-time.                     | - Ultimate control                                             | - Massive bandwidth/latency<br>- Very poor UX on slow networks                                                       |
| **C. Cloud API (Managed)**  | Use AWS Rekognition, Google Vision, or Azure Face API.            | - Fastest implementation<br>- Zero model maintenance           | - High recurring cost per API call<br>- Data privacy concerns (biometric data leaving infra)<br>- Vendor lock-in     |
| **D. Edge AI (Current)**    | All logic stays on Mobile (ML Kit + TFLite).                      | - Zero latency<br>- Works offline<br>- No server costs         | - Vulnerable to reverse engineering<br>- Model theft risk<br>- Hard to update models<br>- No server-side audit trail |

---

## 5. Trade-off Analysis

### 5.1. Security (PRO: Major Improvement)

- **Anti-Spoofing:** Moving Liveness Detection to the backend prevents attacks using static photos or pre-recorded videos. The server can analyze temporal consistency (frame-to-frame changes) better than a mobile snapshot.
- **Model Protection:** The TensorFlow model (and its weights) will no longer be embedded in the mobile APK/IPA, eliminating the risk of model extraction and intellectual property theft.
- **Data Integrity:** The backend becomes the single source of truth. A tampered mobile client cannot bypass the verification process.

### 5.2. Cost & Infrastructure (CON: Additional Investment)

- **Compute:** Requires a dedicated instance (or container) capable of running ML inference. For 100-500 users, a CPU-optimized instance may suffice. For 1000+ users, GPU inference might be necessary during peak hours (08:00-09:00 AM).
- **Bandwidth:** Uploading a 5-10 second video during registration will consume significantly more data than 4 JPEG photos. This impacts both server egress/ingress costs and employee mobile data quotas.
- **Scalability:** Must implement an auto-scaling policy or a message queue (Redis/Bull) for the ML service to handle "morning burst" traffic when hundreds of employees clock in simultaneously.

### 5.3. User Experience (UX) (CON: Minor Degradation)

- **Latency:** There will be a delay (1-5 seconds depending on network and server load) between clicking "Register" or "Clock In" and receiving a response.
- **Network Dependency:** The process becomes 100% dependent on internet connectivity. In areas with poor signal, the process may fail or timeout.
- **Mitigation:** Implement client-side retry logic with exponential backoff and optimistic UI updates.

### 5.4. Maintainability (PRO: Improved)

- **Model Versioning:** Updating the AI model (e.g., improving accuracy) can be done instantly on the server without requiring users to update the mobile app via the App Store/Play Store (which can take days or weeks).
- **A/B Testing:** The backend can dynamically route users to different model versions or similarity thresholds for testing purposes.

---

## 6. Recommended Implementation Steps

### Phase 1: ML Microservice Setup (Sprint 1-2)

1.  **Create a new repository** for the ML Service (Python 3.10+).
2.  **Framework:** Use **FastAPI** for high-performance async handling.
3.  **Core Libraries:**
    - `opencv-python-headless`: For video frame extraction and image preprocessing.
    - `deepface` or `insightface`: For face detection and embedding generation.
    - `scikit-learn` or `numpy`: For similarity calculation (Cosine/Euclidean).
    - `pgvector` + `SQLAlchemy`: For storing and querying face embeddings in PostgreSQL.
4.  **Endpoints:**
    - `POST /verify-liveness`: Receives a video file, returns `is_live: boolean`.
    - `POST /generate-embedding`: Receives a photo/video, returns a 128d/512d vector.
    - `POST /verify-face`: Receives a photo + `employee_id`, compares embedding with stored vector, returns `match: boolean` and `confidence_score: float`.

### Phase 2: Database Schema Update (Sprint 2)

Update `prisma/schema.prisma` to store embeddings securely.

```prisma
model tr_face_embeddings {
  id            String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  employee_id   String       @unique @db.Uuid
  // If using standard JSON (easiest start)
  embedding     Json
  // If using pgvector (advanced/high-performance search)
  // embedding   Unsupported("vector(512)")?

  model_version String       // e.g., "insightface-resnet100-v1"
  registered_at DateTime     @default(now()) @db.Timestamptz(6)
  updated_at    DateTime     @updatedAt @db.Timestamptz(6)

  tr_employees  tr_employees @relation(fields: [employee_id], references: [id], onDelete: Cascade)
}
```

### Phase 3: Backend (NestJS) Integration (Sprint 3)

1.  **Update `FaceRegistrationService`:**
    - Instead of accepting 4 static photos, accept a **single video file** (e.g., `.mp4`, max 10MB).
    - Forward the video buffer to the ML Service's `/verify-liveness` endpoint.
    - If liveness passes, call `/generate-embedding`.
    - Store the returned embedding in `tr_face_embeddings`.
2.  **Update `AttendanceService`:**
    - In `clockIn()` and `clockOut()`, after GPS validation, send the `photo` buffer to ML Service's `/verify-face`.
    - Only proceed with attendance recording if `match === true` and `confidence_score > 0.65` (threshold to be tuned).
    - Log the `confidence_score` in a new audit table for compliance.

### Phase 4: Mobile App Update (Sprint 3-4)

1.  **Simplify ML Kit usage:** Use ML Kit solely for drawing face contours and guiding the user (UX), but **do not use it to gate the submission**.
2.  **Change Upload Payload:** Instead of 4 images, compile the registration session into a short video (e.g., capture 1 frame every 200ms while the user follows instructions) and upload it as `registration_video`.
3.  **Error Handling:** Implement UI states for "Verifying on server...", "Network error, please retry", and "Verification failed (Spoof detected / Face mismatch)".

### Phase 5: Testing & Tuning (Sprint 5)

1.  **FRR (False Rejection Rate) Testing:** Collect data from 20+ beta users. Tune the similarity threshold so legitimate users are not rejected.
2.  **FAR (False Acceptance Rate) Testing:** Attempt to clock in using printed photos or videos of registered users. The system must reject these 100% of the time.
3.  **Load Testing:** Simulate 500 concurrent clock-in requests at 08:59 AM to ensure the ML service scales correctly.

---

## 7. Risks & Mitigations

| Risk                                | Impact                                                                        | Probability | Mitigation                                                                                                                                                                              |
| :---------------------------------- | :---------------------------------------------------------------------------- | :---------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **High False Rejection Rate**       | Users cannot clock in, leading to HR complaints and manual corrections.       | Medium      | Extensive beta testing; start with a low threshold (e.g., 0.60) and increase gradually; implement a manual override flow for HR.                                                        |
| **Server Overload (Morning Burst)** | ML Service crashes or becomes unresponsive during peak hours.                 | High        | Implement a Redis/Bull message queue for async processing; use auto-scaling groups (e.g., HPA in Kubernetes) based on queue depth.                                                      |
| **Network Instability**             | Users in remote areas with poor signal cannot complete registration/clock-in. | Medium      | Implement robust retry logic on the mobile app; allow a grace period or fallback to supervisor approval if network fails multiple times.                                                |
| **Biometric Data Breach**           | Leakage of face embeddings or photos.                                         | Low         | Store embeddings encrypted at rest; **delete original photos/videos** immediately after embedding generation; enforce TLS 1.3 for all communications; restrict database access via IAM. |
| **Increased Mobile Data Usage**     | Employees complain about high data consumption.                               | Medium      | Compress video on the client before upload (e.g., H.264, 480p resolution, 10-second max duration).                                                                                      |

---

## 8. Final Verdict & Next Steps

**Decision:** **APPROVED** to proceed with the Hybrid Architecture.

**Rationale:** While the current Edge AI approach offers speed and zero infrastructure cost, the **security risks are unacceptable** for an enterprise HRIS system handling payroll and attendance. Biometric data must be verified server-side to prevent fraud.

**Immediate Next Steps:**

1.  **Stakeholder Approval:** Present this plan to the Mobile Lead and DevOps team to align on infrastructure requirements.
2.  **POC Development:** Allocate 1 week to build a Proof-of-Concept (PoC) for the Python ML Service using sample videos.
3.  **Infrastructure Setup:** Provision a staging environment (e.g., Docker container with Python/FastAPI) connected to a clone of the production database.
4.  **Mobile Refinement:** Begin UI/UX redesign for the registration flow to support video upload instead of static photos.

---

_Document Version: 1.0_
_Classification: Internal Engineering Plan_
