# 🚔 Soochna Sahayak: Smart FIR & Transcription Hub

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-repo)
[![Bhashini Powered](https://img.shields.io/badge/Powered%20By-Bhashini-blue)](https://bhashini.gov.in/)
[![Tech Stack](https://img.shields.io/badge/Stack-Express%20%7C%20MongoDB%20%7C%20Vercel%20%7C%20Bhashini-brightgreen)](#tech-stack)

**Soochna Sahayak** (Meaning: *Information Assistant*) is a centralized, AI-powered platform designed to modernize law enforcement documentation. It acts as a **Central Hub** for multiple client applications (like field recording apps) to ingest FIR data, voice transcriptions, and evidence, providing a unified dashboard for analysis and management.

---

## 🌟 Key Features

### 🎙️ AI-Powered Transcription (Bhashini)
- **Multilingual Support:** Transcribe audio into 22+ Indian languages.
- **Auto-Language Detection (ALD):** Automatically identifies the language being spoken.
- **Smart ITN (Inverse Text Normalization):** Converts spoken digits (e.g., "double nine") into written numerals (99) to accurately record phone numbers and IDs.

### 🏢 The Central Hub (API First)
- **External App Integration:** Connect multiple field apps to a single dashboard.
- **Unified Intake:** Dedicated API endpoints for FIRs and Transcriptions from external sources.
- **Vercel Cloud Deployment:** Scalable, serverless architecture ready for high availability.

### 👮 Officer Dashboard
- **Case Management:** Create, update, and track FIR statuses.
- **Evidence Vault:** Securely store and manage audio/video/image evidence.
- **Advanced Analytics:** Visualize crime statistics and station performance.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JS, CSS3, Google Fonts (Outfit/Roboto).
- **Backend:** Node.js, Express.js (v4.x).
- **Database:** MongoDB Atlas (Mongoose ODM).
- **Cloud Storage:** Vercel Blob / S3.
- **AI/NLP:** Bhashini ULCA API (ASR/ALD).
- **Hosting:** Vercel (Edge Functions).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account
- Bhashini API Credentials ([Request here](https://bhashini.gov.in/))

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Bhashini Credentials
BHASHINI_USER_ID=your_user_id
BHASHINI_ULCA_API_KEY=your_ulca_api_key
BHASHINI_INFERENCE_API_KEY=your_inference_api_key

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/soochna_sahayak

# Security
API_KEY=your_custom_secure_api_key_for_external_apps
SESSION_SECRET=a_long_random_string
```

### 3. Installation
```bash
npm install
npm run dev
```

---

## 🖥️ External App Integration

Other applications (like mobile FIR recorders) can push data to this dashboard using the standard API.

### **Endpoint: POST `/api/external/fir`**
Used to push a full FIR entry with optional transcription.
```json
{
  "complainant": "Rajani Kant Jha",
  "phone": "9966442200",
  "incidentType": "Theft",
  "transcription": "Mobile phone stolen at Central Park..."
}
```

### **Endpoint: POST `/api/external/transcription`**
Used to push standalone transcriptions from field recordings.
```json
{
  "caseId": "FIR-2025-000001",
  "transcription": "Witness statement recorded by Officer X...",
  "language": "hi"
}
```
*Note: Include `x-api-key` in headers for authentication.*

---

## ☁️ Deployment (Vercel)

1. **Connect Repository:** Push your code to GitHub.
2. **Import to Vercel:** Select the project.
3. **Configure Environment Variables:** Add your `.env` keys in Vercel Dashboard Settings.
4. **Deploy:** Vercel will automatically handle the serverless routing via `api/index.js` and `vercel.json`.

---

## 📊 Database Management Options

| Choice | Best For | Connection Link |
|---|---|---|
| **MongoDB Atlas** | Production Scale | `mongodb+srv://...` |
| **Supabase (Postgres)**| Relational Data | Needs `pg` adapter |
| **Direct SQLite** | Local Prototyping | `filename: data.db` |

*Recommendation: Use MongoDB Atlas for seamless object storage and flexible FIR schemas. It's the best choice for free-tier cloud hosting with high reliability.*

---

## 👨‍💻 Development Team
- **Avani Sehgal**
- **Agam Dayal**
- **Aryaman Sharma**
- **Rajani Kant Jha**

---
© 2026 Soochna Sahayak - Modernizing Public Safety.
