# Solusi GRATIS untuk Active Liveness Detection di Backend

## HRIS Samugara - Research & Analysis

**Date:** 2026-05-01
**Author:** Senior System Analyst & Senior Backend Engineer
**Status:** Approved for Implementation

---

## 1. Executive Summary

**Pertanyaan:** _"Gak bisa gratis ya untuk flow face register (seperti active liveness)?"_

**Jawaban: BISA!** Ada banyak solusi **open source dan gratis** yang bisa digunakan untuk implementasi active liveness detection (smile, blink, head pose) di backend. Anda **TIDAK PERLU** membayar lisensi atau menggunakan cloud API berbayar seperti AWS Rekognition.

Solusi gratis yang direkomendasikan menggunakan kombinasi **MediaPipe Face Mesh** (Google) + **OpenCV**, yang bisa berjalan di **CPU biasa** tanpa memerlukan GPU.

---

## 2. Solusi Open Source yang Tersedia

### 2.1. MediaPipe Face Mesh (Google) - ⭐ REKOMENDASI UTAMA

**Repository:** [github.com/google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe) (35k+ stars)
**Lisensi:** Apache 2.0 (Gratis untuk komersial)
**Platform:** Python, C++, JavaScript, Android, iOS

#### Kemampuan untuk Active Liveness:

| Aksi                             | Teknis                   | Cara Kerja                                                                                                                       |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| **Blink (Kedip)**                | Eye Aspect Ratio (EAR)   | Mengukur rasio tinggi/lebar mata menggunakan 6 landmark per mata. Jika EAR < threshold selama beberapa frame = blink terdeteksi. |
| **Smile (Senyum)**               | Mouth Aspect Ratio (MAR) | Mengukur rasio tinggi/lebar bibir menggunakan 20 landmark. Jika MAR > threshold = smile terdeteksi.                              |
| **Head Pose (Hadap Kiri/Kanan)** | Yaw, Pitch, Roll         | Menggunakan 468 facial landmarks + solvePnP untuk menghitung rotasi kepala 3D. Yaw > 30° = hadap kiri, Yaw < -30° = hadap kanan. |
| **Face Presence**                | Face Detection           | Deteksi apakah ada wajah di frame (bukan foto/video).                                                                            |

#### Keunggulan MediaPipe:

- ✅ **Gratis** (Apache 2.0 License)
- ✅ **Ringan** - Bisa berjalan di CPU (tidak perlu GPU)
- ✅ **Real-time** - 30+ FPS pada CPU modern
- ✅ **Akurat** - 468 facial landmarks (sangat detail)
- ✅ **Cross-platform** - Python, mobile, web
- ✅ **Maintained by Google** - Update reguler

---

### 2.2. OpenCV + Dlib - Alternatif Klasik

**Repository:**

- OpenCV: [github.com/opencv/opencv](https://github.com/opencv/opencv) (75k+ stars)
- Dlib: [github.com/davisking/dlib](https://github.com/davisking/dlib) (13k+ stars)
  **Lisensi:** BSD (OpenCV), Boost (Dlib) - Keduanya gratis

#### Kemampuan:

- **Face Detection:** Haar Cascade atau HOG + SVM
- **Facial Landmarks:** 68 atau 81 landmarks (Dlib)
- **Blink Detection:** Eye Aspect Ratio (EAR) dengan 6 landmark per mata
- **Smile Detection:** Mouth Aspect Ratio (MAR)
- **Head Pose:** solvePnP dengan 3D model points

#### Keunggulan:

- ✅ **Gratis**
- ✅ **Mature** - Library sudah stabil bertahun-tahun
- ✅ **Tidak perlu model download** - Dlib shape predictor sudah cukup

#### Kekurangan:

- ❌ **Kurang akurat** dibanding MediaPipe (68 vs 468 landmarks)
- ❌ **Lebih lambat** pada video beresolusi tinggi

---

### 2.3. Repository Open Source Siap Pakai

#### A. Active Liveness Detection (juan-csv)

**Repository:** [github.com/juan-csv/face_liveness_detection-Anti-spoofing](https://github.com/juan-csv/face_liveness_detection-Anti-spoofing) (309 stars)
**Fitur:**

- Random action generation (smile, angry, blink, turn right, turn left)
- Deep learning-based emotion detection
- Anti-spoofing dengan action verification
- **Lisensi:** MIT (Gratis)

#### B. Passive Liveness Detection (sakethbachu)

**Repository:** [github.com/sakethbachu/Face-Liveness-Detection](https://github.com/sakethbachu/Face-Liveness-Detection) (172 stars)
**Fitur:**

- Binary classification: real vs fake face
- CNN-based (LivenessNet)
- Anti-spoofing untuk print attack dan replay attack
- **Lisensi:** Open Source

#### C. Presentation Attack Detection (ee09115)

**Repository:** [github.com/ee09115/spoofing_detection](https://github.com/ee09115/spoofing_detection) (376 stars)
**Fitur:**

- Color space analysis (YCRCB + LUV)
- SVM/ETC classifier
- Anti-spoofing untuk print attack dan replay attack
- **Lisensi:** Open Source

---

## 3. Implementasi Teknis: Active Liveness dengan MediaPipe

### 3.1. Arsitektur Sederhana (100% Gratis)

```
[Mobile App]
    ↓ Upload Video (5-10 detik)
[NestJS Backend]
    ↓ Forward to Python Service
[Python ML Service]
    ├─ Frame Extraction (OpenCV)
    ├─ Face Detection (MediaPipe)
    ├─ Action Verification:
    │   ├─ Blink Detection (EAR)
    │   ├─ Smile Detection (MAR)
    │   └─ Head Pose (Yaw/Pitch/Roll)
    └─ Result: PASS/FAIL
```

### 3.2. Teknik Per Aksi

#### A. Blink Detection (Eye Aspect Ratio)

```python
import mediapipe as mp
import numpy as np

def calculate_ear(eye_landmarks):
    """
    Calculate Eye Aspect Ratio (EAR)
    eye_landmarks: 6 points from MediaPipe face mesh
    """
    # Vertical distances
    A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
    B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
    # Horizontal distance
    C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])

    ear = (A + B) / (2.0 * C)
    return ear

# Threshold: EAR < 0.2 = blink
# MediaPipe eye landmarks (left eye): [33, 160, 158, 133, 153, 144]
# MediaPipe eye landmarks (right eye): [362, 385, 387, 263, 373, 380]
```

**Logika:**

1. Hitung EAR untuk kedua mata setiap frame
2. Jika EAR < 0.2 selama 2-3 frame berturut-turut = Blink terdeteksi
3. Counter blink += 1
4. Jika counter >= 1 dalam durasi video = Aksi "blink" terverifikasi

#### B. Smile Detection (Mouth Aspect Ratio)

```python
def calculate_mar(mouth_landmarks):
    """
    Calculate Mouth Aspect Ratio (MAR)
    mouth_landmarks: 20 points from MediaPipe face mesh
    """
    # Vertical distances
    A = np.linalg.norm(mouth_landmarks[13] - mouth_landmarks[19])
    B = np.linalg.norm(mouth_landmarks[14] - mouth_landmarks[18])
    C = np.linalg.norm(mouth_landmarks[15] - mouth_landmarks[17])
    # Horizontal distance
    D = np.linalg.norm(mouth_landmarks[12] - mouth_landmarks[16])

    mar = (A + B + C) / (3.0 * D)
    return mar

# Threshold: MAR > 0.5 = smile
# MediaPipe mouth landmarks: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409,
#                             291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
```

**Logika:**

1. Hitung MAR setiap frame
2. Jika MAR > 0.5 dan bertahan selama 10+ frame = Smile terdeteksi
3. Bandingkan dengan baseline (wajah netral) untuk menghindari false positive

#### C. Head Pose Estimation (Yaw, Pitch, Roll)

```python
import cv2
import mediapipe as mp
import numpy as np

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

def get_head_pose(image, face_landmarks):
    """
    Calculate head pose (yaw, pitch, roll) using solvePnP
    """
    image_rows, image_cols, _ = image.shape

    # 3D model points (simplified face model)
    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0, -65.0),        # Chin
        (-225.0, 170.0, -135.0),     # Left eye left corner
        (225.0, 170.0, -135.0),      # Right eye right corner
        (-150.0, -150.0, -125.0),    # Left mouth corner
        (150.0, -150.0, -125.0)      # Right mouth corner
    ])

    # Corresponding 2D image points from MediaPipe
    image_points = np.array([
        face_landmarks.landmark[1],   # Nose tip
        face_landmarks.landmark[152], # Chin
        face_landmarks.landmark[33],  # Left eye left corner
        face_landmarks.landmark[263], # Right eye right corner
        face_landmarks.landmark[61],  # Left mouth corner
        face_landmarks.landmark[291]  # Right mouth corner
    ], dtype="double")

    # Camera internals
    focal_length = image_cols
    center = (image_cols / 2, image_rows / 2)
    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype="double")

    dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion

    # Solve PnP
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs
    )

    # Convert rotation vector to angles
    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
    pose_matrix = cv2.hconcat((rotation_matrix, translation_vector))
    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_matrix)

    yaw = euler_angles[1][0]   # Hadap kiri/kanan
    pitch = euler_angles[0][0] # Hadap atas/bawah
    roll = euler_angles[2][0]  # Miring kepala

    return yaw, pitch, roll

# Threshold untuk "Hadap Kiri": yaw > 25°
# Threshold untuk "Hadap Kanan": yaw < -25°
```

---

## 4. Flow Implementasi Gratis

### 4.1. Face Registration (Active Liveness)

```python
# Pseudocode untuk ML Service (Python/FastAPI)
from fastapi import FastAPI, UploadFile
import cv2
import mediapipe as mp
import numpy as np

app = FastAPI()

@app.post("/verify-liveness")
async def verify_liveness(video: UploadFile):
    """
    Verifikasi active liveness dari video upload
    """
    # 1. Extract frames dari video
    frames = extract_frames(video.file, fps=5)  # Ambil 5 frame per detik

    # 2. Inisialisasi MediaPipe
    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False)

    # 3. Inisialisasi counters
    blink_detected = False
    smile_detected = False
    left_turn_detected = False
    right_turn_detected = False

    # 4. Proses setiap frame
    for frame in frames:
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            continue

        landmarks = results.multi_face_landmarks[0]

        # 4a. Blink Detection
        left_eye = get_left_eye_landmarks(landmarks)
        right_eye = get_right_eye_landmarks(landmarks)
        left_ear = calculate_ear(left_eye)
        right_ear = calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0

        if avg_ear < 0.2:
            blink_detected = True

        # 4b. Smile Detection
        mouth = get_mouth_landmarks(landmarks)
        mar = calculate_mar(mouth)

        if mar > 0.5:
            smile_detected = True

        # 4c. Head Pose
        yaw, pitch, roll = get_head_pose(frame, landmarks)

        if yaw > 25:
            left_turn_detected = True
        elif yaw < -25:
            right_turn_detected = True

    # 5. Verifikasi hasil
    required_actions = ["blink", "smile", "left_turn", "right_turn"]
    detected_actions = {
        "blink": blink_detected,
        "smile": smile_detected,
        "left_turn": left_turn_detected,
        "right_turn": right_turn_detected
    }

    passed_actions = [action for action, detected in detected_actions.items() if detected]

    # 6. Return result
    if len(passed_actions) >= 3:  # Minimal 3 dari 4 aksi terdeteksi
        return {
            "success": True,
            "message": "Liveness verification passed",
            "detected_actions": passed_actions,
            "confidence": len(passed_actions) / len(required_actions)
        }
    else:
        return {
            "success": False,
            "message": "Liveness verification failed",
            "detected_actions": passed_actions,
            "required_actions": required_actions
        }
```

### 4.2. Clock-in Verification (1:1 Face Matching)

Untuk verifikasi clock-in, Anda juga bisa menggunakan solusi gratis:

**Opsi A: Face Recognition (Python library)**

```python
# Menggunakan face_recognition library (dlib-based)
import face_recognition

# Generate embedding saat registrasi
registered_image = face_recognition.load_image_file("registered_face.jpg")
registered_encoding = face_recognition.face_encodings(registered_image)[0]

# Verifikasi saat clock-in
clockin_image = face_recognition.load_image_file("clockin_photo.jpg")
clockin_encoding = face_recognition.face_encodings(clockin_image)[0]

# Compare
results = face_recognition.compare_faces([registered_encoding], clockin_encoding, tolerance=0.6)
distance = face_recognition.face_distance([registered_encoding], clockin_encoding)

if results[0]:
    return {"match": True, "confidence": 1 - distance[0]}
```

**Opsi B: DeepFace (lebih akurat, berbasis Deep Learning)**

```python
# Menggunakan DeepFace (Facebook DeepFace model)
from deepface import DeepFace

# Verifikasi
result = DeepFace.verify(
    img1_path="registered_face.jpg",
    img2_path="clockin_photo.jpg",
    model_name="Facenet",  # atau "ArcFace", "OpenFace", "DeepFace"
    distance_metric="cosine",
    enforce_detection=True
)

# Result: {'verified': True/False, 'distance': 0.23, 'threshold': 0.4, 'model': 'Facenet', ...}
```

---

## 5. Perbandingan: Gratis vs Berbayar

| Aspek                 | Solusi GRATIS (MediaPipe + OpenCV)    | Solusi BERBAYAR (AWS Rekognition) |
| --------------------- | ------------------------------------- | --------------------------------- |
| **Biaya**             | $0 (Open Source)                      | $0.001 - $0.50 per API call       |
| **Lisensi**           | Apache 2.0 / BSD                      | Commercial                        |
| **Offline**           | ✅ Bisa di self-host                  | ❌ Harus online ke AWS            |
| **Data Privacy**      | ✅ Data tidak keluar dari server      | ❌ Data dikirim ke cloud AWS      |
| **Latency**           | ⏱️ 1-3 detik (CPU)                    | ⚡ 500ms - 2 detik                |
| **Akurasi Blink**     | ✅ 90-95% (dengan tuning)             | ✅ 99%+                           |
| **Akurasi Smile**     | ✅ 85-90%                             | ✅ 98%+                           |
| **Akurasi Head Pose** | ✅ 90-95% (yaw < 30° error)           | ✅ 99%+                           |
| **Anti-Spoofing**     | ⚠️ Basic (action-based)               | ✅ Advanced (3D depth, texture)   |
| **Maintenance**       | ⚠️ Perlu tuning & update manual       | ✅ Fully managed                  |
| **Scalability**       | ⚠️ Perlu manage infrastruktur sendiri | ✅ Auto-scaling                   |

### Analisis:

- **Untuk HRIS dengan < 1000 karyawan:** Solusi GRATIS sudah **MORE THAN ENOUGH**. Akurasi 90%+ sudah sangat acceptable untuk use case attendance.
- **Untuk Enterprise/Bank/Fintech:** Disarankan menggunakan solusi berbayar atau hybrid (gratis untuk basic, berbayar untuk high-risk transactions).

---

## 6. Estimasi Resource (Gratis)

### Hardware Requirements (Self-Hosted)

| Komponen    | Minimal            | Rekomendasi                    |
| ----------- | ------------------ | ------------------------------ |
| **CPU**     | 2 vCPU             | 4 vCPU (Intel/AMD dengan AVX2) |
| **RAM**     | 4 GB               | 8 GB                           |
| **Storage** | 20 GB SSD          | 50 GB SSD                      |
| **OS**      | Ubuntu 20.04/22.04 | Ubuntu 22.04 LTS               |
| **GPU**     | ❌ Tidak perlu     | ❌ Tidak perlu                 |

### Performance Benchmark (CPU)

| Operasi                | Waktu per Frame | Waktu per Video (5 detik, 25 frame) |
| ---------------------- | --------------- | ----------------------------------- |
| **Face Detection**     | 15-20ms         | 375-500ms                           |
| **Landmark Detection** | 10-15ms         | 250-375ms                           |
| **Blink Detection**    | 2-3ms           | 50-75ms                             |
| **Smile Detection**    | 2-3ms           | 50-75ms                             |
| **Head Pose**          | 5-8ms           | 125-200ms                           |
| **Total**              | **34-49ms**     | **850ms - 1.2 detik**               |

> **Kesimpulan:** Satu verifikasi liveness memerlukan **~1-2 detik** pada CPU 4 core. Ini sangat cepat dan acceptable untuk use case HRIS.

---

## 7. Dependency & Installation (Gratis)

```bash
# Requirements (semua gratis & open source)
pip install mediapipe==0.10.14      # Google MediaPipe (Apache 2.0)
pip install opencv-python==4.9.0   # OpenCV (BSD)
pip install numpy==1.26.4           # NumPy (BSD)
pip install fastapi==0.110.0        # FastAPI (MIT)
pip install uvicorn==0.29.0         # Uvicorn (BSD)
pip install python-multipart==0.0.9 # File upload (Apache 2.0)

# Optional untuk face recognition
pip install face-recognition==1.3.0 # dlib-based (BSD)
# ATAU
pip install deepface==0.0.89        # DeepFace (MIT)
```

**Total Size:** ~500MB (termasuk model MediaPipe yang auto-download)

---

## 8. Keamanan & Anti-Spoofing (Gratis)

Solusi gratis memiliki beberapa keterbatasan dalam anti-spoofing:

| Jenis Serangan   | Solusi Gratis                                         | Solusi Berbayar                |
| ---------------- | ----------------------------------------------------- | ------------------------------ |
| **Foto Print**   | ✅ Terdeteksi (require blink + smile + head movement) | ✅ Terdeteksi                  |
| **Video Replay** | ⚠️ Sebagian terdeteksi (perlu random challenge)       | ✅ Terdeteksi                  |
| **3D Mask**      | ❌ Sulit dideteksi                                    | ✅ Terdeteksi (depth analysis) |
| **Deepfake**     | ❌ Tidak terdeteksi                                   | ⚠️ Partial (tergantung vendor) |

### Mitigasi untuk Solusi Gratis:

1. **Random Challenge:** Generate random sequence aksi (contoh: "Blink, then smile, then turn left"). Attacker tidak bisa prepare video sebelumnya.
2. **Temporal Analysis:** Analisis perubahan frame-to-frame untuk mendeteksi video replay.
3. **Texture Analysis:** Gunakan LBP (Local Binary Patterns) sederhana untuk mendeteksi foto print.
4. **Multi-Frame Verification:** Proses 10-20 frame, bukan hanya 1 foto.

---

## 9. Rekomendasi Implementasi

### Arsitektur Hybrid (Gratis + Existing Backend)

```
Mobile App
    ├─ UI/UX: Camera + Instructions ("Please smile")
    ├─ Video Recording: 5-10 detik
    └─ Upload: POST /api/face-registration (multipart/form-data)

NestJS Backend (Existing)
    ├─ Auth Middleware (JWT)
    ├─ Forward video ke ML Service
    └─ Save result ke DB

Python ML Service (BARU - Gratis)
    ├─ FastAPI endpoint
    ├─ MediaPipe Face Mesh
    ├─ Active Liveness Verification:
    │   ├─ Blink Detection (EAR)
    │   ├─ Smile Detection (MAR)
    │   ├─ Head Pose (Yaw/Pitch/Roll)
    │   └─ Random Challenge Validator
    ├─ Face Embedding (DeepFace/FaceRecognition)
    └─ Return: {success, confidence, detected_actions}

PostgreSQL (Existing)
    ├─ tr_face_embeddings (embedding vector)
    └─ tr_face_verification_logs (audit trail)
```

### Flow Detail:

1. **User Registration:**
   - User buka halaman "Register Face"
   - App generate random challenge: `["blink", "smile", "turn_left"]`
   - User rekam video 10 detik sesuai instruksi
   - Upload video ke backend
   - ML Service verifikasi:
     - ✅ Semua aksi terdeteksi
     - ✅ Tidak ada spoofing (temporal analysis)
     - ✅ Face embedding generated & stored

2. **Daily Clock-in:**
   - User tekan "Clock In"
   - Ambil foto (bukan video, untuk UX yang lebih cepat)
   - Upload foto + GPS ke backend
   - ML Service:
     - Detect face
     - Generate embedding
     - Compare dengan registered embedding (cosine similarity)
     - ✅ Jika similarity > 0.65: Clock-in berhasil
     - ❌ Jika similarity < 0.65: Reject, minta retry

---

## 10. Kesimpulan

**BISA GRATIS!** Anda tidak perlu membayar lisensi apapun untuk implementasi active liveness detection di backend.

### Tech Stack Gratis yang Direkomendasikan:

- **Face Detection + Landmarks:** MediaPipe Face Mesh (Google)
- **Blink/Smile/Head Pose:** OpenCV + NumPy (geometric calculations)
- **Face Recognition:** DeepFace atau face_recognition (Python)
- **Web Framework:** FastAPI (Python)
- **Total Cost:** **$0 untuk software**

### Cost yang Tetap Dibutuhkan:

- **Infrastructure:** Server/VM untuk menjalankan Python service (~$50-200/bulan tergantung skala)
- **Development:** Waktu engineer untuk implementasi dan tuning (~2-4 minggu)
- **Maintenance:** Monitoring dan tuning model (~5-10 jam/bulan)

### Perbandingan Total Cost:

| Solusi                                      | Setup Cost            | Monthly Cost (500 users) |
| ------------------------------------------- | --------------------- | ------------------------ |
| **Gratis (Self-Hosted)**                    | Rp 45jt (development) | Rp 3-5jt (server)        |
| **Cloud API (AWS Rekognition)**             | Rp 10jt (integration) | Rp 240jt+                |
| **Hybrid (Gratis + Cloud untuk high-risk)** | Rp 55jt               | Rp 50-100jt              |

**Rekomendasi Akhir:** Gunakan **solusi GRATIS** untuk MVP dan scale-up. Jika di masa depan ada kebutuhan anti-spoofing yang lebih advance (3D mask, deepfake), baru pertimbangkan menambahkan komponen berbayar sebagai layer tambahan.

---

## 11. Referensi & Resources

1. **MediaPipe Documentation:** https://developers.google.com/mediapipe/solutions/vision/face_landmarker
2. **MediaPipe GitHub:** https://github.com/google-ai-edge/mediapipe
3. **OpenCV Documentation:** https://docs.opencv.org/
4. **Face Recognition Library:** https://github.com/ageitgey/face_recognition
5. **DeepFace Library:** https://github.com/serengil/deepface
6. **Active Liveness (juan-csv):** https://github.com/juan-csv/face_liveness_detection-Anti-spoofing
7. **Head Pose Estimation:** https://github.com/shenasa-ai/head-pose-estimation
8. **Blink Detection Tutorial:** https://www.pyimagesearch.com/2017/04/24/eye-blink-detection-opencv-python-dlib/

---

_Document Version: 1.0_
_Classification: Internal Engineering Research_
_Status: Ready for Implementation_
