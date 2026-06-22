# Trao AI Travel Planner

Trao AI Travel Planner is a secure, responsive, multi-user web application that allows users to register, log in, and dynamically generate personalized travel itineraries using the Gemini AI agent. Users can modify daily schedules inline, view recommended hotels, consult an itemized budget ledger, and utilize a creative weather-aware packing assistant.

---

## 🚀 Live Demo & Repository
* **GitHub Repository:** [SaitejaReddyy/Trao-AI-Travel-Planner](https://github.com/saitejareddyy/Trao-AI-Travel-Planner)
* **Application Walkthrough Video:** [Watch the Video Walkthrough](https://vimeo.com/your-walkthrough-video-link-here) *(3-4 minute walkthrough)*

---

## 🛠️ Chosen Tech Stack & Justification

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | **React.js (Vite)** | Scaffolded with Vite for extremely fast HMR (Hot Module Replacement) and optimized build times. Uses vanilla CSS styled with Tailwind CSS v4. |
| **Backend** | **Node.js + Express** | High-performance asynchronous runtime for REST API request gateways and AI prompt coordination. |
| **Database** | **MongoDB (Mongoose ODM)** | Document database perfect for storing nested JSON itinerary arrays and dynamic checkable packing subdocuments. |
| **Security** | **JWT & bcryptjs** | Industry standard stateless session authorization (JWT) and secure password hashing. |
| **AI Agent** | **Google Gemini 2.5 Flash** | Chosen for high-speed generation, accuracy, and support for native structured JSON outputs. |

---

## ⚙️ Local Setup Instructions

### Prerequisites
* **Node.js** (Version 18.x or 20.x LTS)
* **MongoDB** (Local instance or an Atlas cloud connection URI)
* **Google AI Studio Key** (Obtained from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Setup Backend
1. Go to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on [.env.example](file:///c:/Users/saite/OneDrive/Desktop/Trao-Assignment/backend/.env.example):
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.bll2lkz.mongodb.net/trao-travel
   JWT_SECRET=your_secure_signing_secret_here
   GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 2. Setup Frontend
1. In a new terminal tab, go to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on [.env.example](file:///c:/Users/saite/OneDrive/Desktop/Trao-Assignment/frontend/.env.example):
   ```env
   VITE_API_URL=http://localhost:5000
   ```
4. Start the Vite React client:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:3000` (or the port specified by Vite on startup).

---

## 📐 High-Level Architecture & Concepts Included

```
┌────────────────────────────────────────────────────────┐
│                    Vite React Client                   │
│   (State-based Router, Forms, Itinerary & Checklist)   │
└───────────┬────────────────────────────────▲───────────┘
            │ JWT in Auth Header             │ JSON Response
┌───────────▼────────────────────────────────┼───────────┐
│               Express.js REST API Server               │
│  - Middleware: JWT authentication & tenant checks      │
│  - Controllers: authController & tripController        │
└───────────┬────────────────────────────────┬───────────┘
            ▼                                ▼
 ┌─────────────────────┐          ┌──────────────────────┐
 │  Google Gemini API  │          │  MongoDB Database    │
 │ (v1beta / JSON Mode)│          │  (Users & Trips collections)
 └─────────────────────┘          └──────────────────────┘
```

### 🔒 1. Authentication & Tenant Data Isolation
* **Stateless Tokens:** Valid registers/logins return a stateless JSON Web Token (JWT) signed by the server's secret.
* **Owner-Scoped Queries:** To prevent horizontal privilege escalation, every database operation explicitly scopes queries:
  `Trip.findOne({ _id: tripId, userId: req.user.id })`
  This ensures User A can never query or manipulate records belonging to User B.

### 🤖 2. Resilient AI Agent Design
* **Exponential Backoff:** If the Gemini API returns temporary `503 Service Unavailable` or `429 Rate Limit` errors, our custom `fetchWithRetry` delays subsequent attempts (1s, 2s, 4s, etc.), preventing request storms.
* **Redundant Models:** The agent iterates through a list of supported models (e.g. `gemini-2.5-flash`, falling back to alternatives) if a model configuration changes.
* **Strict JSON Mode:** Configured with `responseMimeType: "application/json"`. Includes a regex pre-parser to strip out markdown ticks (e.g. ` ```json `) to prevent `JSON.parse` exceptions.

### ⛈️ 3. Creative Feature: Weather-Aware Packing Checklist
* **Why Built:** Travelers struggle to pack appropriately for custom activities (e.g., hiking vs. museums) in varied seasonal climates.
* **Concept:** Cross-references the **travel season** and generated **itinerary activities** to prompt the Gemini API as a packing specialist.
* **Interactivity:** It yields four categories: *Documents, Clothing, Gear, and Other*. Checked items undergo an atomic database update to keep state synchronized across devices, represented by a satisfying progress bar.

---

## ⚖️ Key Design Decisions & Trade-Offs

1. **Vite React.js instead of Next.js**
   * *Trade-off:* We exchanged server-side rendering (SSR) for client-side state efficiency. Vite React provides near-instantaneous page reloads (HMR) and simplifies SPA hosting.
2. **State-Based Router instead of React Router DOM**
   * *Trade-off:* We wrote a lightweight custom state router inside [App.jsx](file:///c:/Users/saite/OneDrive/Desktop/Trao-Assignment/frontend/src/App.jsx). This avoided the need for installing `react-router-dom`, reduced dependencies, and prevented page re-rendering bugs during session transitions.
3. **Mongoose Subdocuments for Itinerary Days**
   * *Trade-off:* Daily activities are stored as nested Mongoose subdocument arrays rather than separate collections. This makes saving and loading a single trip document extremely fast but limits the maximum query size per trip to MongoDB's $16\text{MB}$ document limit (which is more than enough for a 14-day trip).

---

## ⚠️ Known Limitations
* **Gemini Key Availability:** If the Gemini API key is missing or invalid, trip generation will graceful failover and display an error alert to check configurations.
* **No Active Web Sockets:** Updates are requested via HTTP REST endpoints. A fully collaborative travel planner with real-time editing would benefit from WebSockets or Socket.io.
