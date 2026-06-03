# 🌍 Odyssey Travel Planner (MERN + Gemini AI)
> Let AI organize your travel details. Upload hotel vouchers, flights, or write custom prompts to compile a cohesive day-by-day travel itinerary with packing checklist, expensing profiles, and collaborative feedback channels.

Odyssey is an advanced intelligence-driven Travel Organizer built as a robust full-stack solution. By coupling the cognitive power of the **@google/genai** framework with a highly fortified security middleware layer, Odyssey accepts both raw booking confirmations (PDF, PNG, JPEG, WEBP) and free-form prompts to instantly synthesize comprehensive, beautiful travel dossiers. 

---

## 🚀 Core Product Features

- 📑 **Multimodal Document Parsing**: Secure base64 file buffer parser. Upload raw confirmation flight schedules or accommodation receipts to let Gemini extract destinations, timestamps, and estimated budgets.
- 🗓️ **Intellectual Day-Wise Timelines**: Renders collapsed, beautiful day-wise accordion menus depicting categorized daily themes (Morning, Afternoon, Evening) with integrated pricing tags and contextual icons.
- 🧳 **Automated Packing Engine**: Compoles a customized vacation checklist matching your destination weather profiles, duration length, and travel requirements.
- 📊 **Dynamic Interactive Expense Profiler**: Instant cost distribution bars dividing calculated rates (Lodging, Transport, Food, Excursions) with proportional percentage trackers.
- 💬 **Collaborative Public Sharing & Feedback**: Unique shareable page URLs with high-contrast UI allowing families or team members to post structured reviews and comment logs.

---

## 🛠️ Advanced Tech Stack List

### Frontend (Client Tier)
- **Framework**: React 18 & TypeScript (Vite bundler) for sub-millisecond hot refresh and rigid type safety.
- **Styling**: Tailwind CSS for responsive typography pairings and high-contrast color balances.
- **Animations**: Framer Motion (`motion/react`) for smooth staggered entrance fades.
- **Icons**: Lucide React.

### Backend (Server Tier)
- **Runtime**: Node.js & Express.
- **Security Protocols**: Helmet (custom CSP), Express Rate Limiter, and custom CORS origin filter.
- **Validation**: Strict primitive-type validation guards securing inputs from parameters tampering.

### Database (Persistence Tier)
- **Primary Data Store**: MongoDB Atlas (live-cloud clustering schema) mapping User and Trip schemas.
- **Graceful Fallback**: Native local `db.json` filesystem-backed flat-file database, enabling standalone operations with self-healing background replication when migrating onto MongoDB.

### AI Integration
- **Engine**: `@google/genai` TypeScript SDK deploying the lightning-fast, high-context `gemini-3.5-flash` model.
- **Constraint Handling**: Enforced structural JSON responses through strict typing declarations.

---

## 🛡️ Security & Guardrails Architecture

The system is engineered following modern DevSecOps standards, incorporating a multi-tier security filter chain:

1. **NoSQL Injection Blockers**: All controllers validate request entities (Params and Request Body). Input sanitizers verify that parameters (IDs, emails, passwords, custom notes) are strictly primitive strings. This renders standard MongoDB injection attacks (e.g. passing advanced operators like `{ $gt: "" }`) impossible.
2. **Defensive Session Management**: High-entropy JSON Web Tokens (JWT) using `HMAC-SHA256` signatures regulate access. JWT secrets enforce a strict production presence rule, falling back to a securely-generated cryptographic 256-bit key in local workspaces.
3. **CORS Ingress Control**: Domain whitelisting utilizes the `CLIENT_URL` environment variables. Multi-origin arrays can be specified, allowing strict origin reflection in production while supporting developer previews.
4. **Resilient Rate Limiting**: Intelligent brute-force protection rejects high-velocity crawlers or login attempts, securing standard server threads.
5. **Generic Error Cloaking**: An expressive custom universal error middleware logs developer stack details safely on the server console while sending sanitized JSON payloads to the web browser. No internal paths or raw file errors are leaked.

---

## 📂 Repository Folder Directory Map

```text
├── server.ts                  # Dedicated Express-Vite entrypoint & middleware orchestrator
├── backend/                   # Encapsulated backend storage and controller engines
│   ├── config/
│   │   ├── db.ts              # Double-engine persistence layer (Mongoose Atlas & local db.json fallback)
│   │   └── gemini.ts          # Structured google-genai schema configurations
│   ├── controllers/
│   │   ├── authController.ts   # Secure register/login handlers with sanitization checks
│   │   └── tripController.ts   # AI trip compilation and public comment controllers
│   ├── middlewares/
│   │   ├── authMiddleware.ts   # JSON Web Token session verify guards
│   │   ├── rateLimiter.ts      # Anti-DDoS brute-force limiter
│   │   └── errorMiddleware.ts  # Generic non-leaking express error-handling middleware
│   └── routes/
│       ├── authRoutes.ts      # Authentication entry endpoints
│       └── tripRoutes.ts      # Travel compilation and sharing endpoints
├── src/                       # Frontend application workspace (React 18 + Vite)
│   ├── main.tsx               # Main DOM anchor node
│   ├── App.tsx                # Master client route switchboard
│   ├── index.css              # Custom styling definitions & Tailwind imports
│   ├── types.ts               # Shared robust TS definitions
│   ├── components/
│   │   ├── BentoGrid.tsx      # Landing page high-density visuals
│   │   └── ItineraryViewer.tsx# Detailed agenda timeline panels, checklists & gauges
│   ├── pages/
│   │   ├── Landing.tsx        # High-impact introduction page
│   │   ├── Login.tsx          # Dynamic responsive user gateway
│   │   ├── Dashboard.tsx      # Main workstation hub with drag-and-drop uploads
│   │   └── SharedView.tsx     # Public collaborative feedback interface
│   └── utils/
│       └── ...                # Client-side helpers
├── .env.example               # Environment baseline blueprint
├── tsconfig.json              # Typings configurations
└── package.json               # Dependency manifests and script definitions
```

---

## ⚙️ Local Installation & Environment Setup

Follow these streamlined instructions to operate Odyssey on your physical hardware or clean host environment.

### 1. Retrieve the Repository
Clone your project directory onto your terminal:
```bash
git clone <repository_url> odyssey-travel
cd odyssey-travel
```

### 2. Configure Local Settings
Duplicate the baseline configurations file to create your credentials workspace:
```bash
cp .env.example .env
```

Populate the `.env` parameters:
- **`GEMINI_API_KEY`**: Acquire an official secret key from Google AI Studio.
- **`MONGODB_URI`**: (Optional) Specify your live Mongo cluster string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/odyssey`). Leave blank to automatically utilize the lightweight `db.json` local file fallback.
- **`JWT_SECRET`**: Give a custom private key for signing credentials tokens.
- **`CLIENT_URL`**: (Optional) Provide your domain string for origin restrictions.

### 3. Install Dependencies
Run npm installations to load module caches:
```bash
npm install
```

### 4. Execute the Application
Launch the real-time full-stack local server:
```bash
npm run dev
```
The server will boot, connect standard databases, and map the frontend applet automatically onto **`http://localhost:3000`**.

### 5. Build for Production
To package static bundles and bundle production servers:
```bash
npm run build
npm start
```
