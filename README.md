# Team Task Manager

> A production-ready, full-stack Task Management System designed for collaborative teams. Manage high-level projects, track individual task progress, and monitor team performance with secure role-based access control.

### 🔗 Live Demo

| | Link |
|---|---|
| 🌐 **Frontend** | [https://teamtaskmanager-production-e3c7.up.railway.app](https://teamtaskmanager-production-e3c7.up.railway.app) |
| 🔌 **Backend API** | [https://teamtaskmanager-production-32f7.up.railway.app](https://teamtaskmanager-production-32f7.up.railway.app) |

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Railway Managed), Mongoose ODM |
| **Auth** | JWT (JSON Web Tokens), bcrypt |
| **HTTP** | Axios |

---

## ✨ Features

- 🔐 **Authentication** — Secure Login/Signup with persistent session tokens.
- 🛡️ **Role-Based Access (RBAC)** — 
  - **Admin**: Create projects, assign tasks, and view all system data.
  - **Member**: View assigned tasks and update task status.
- 📊 **Dashboard Metrics** — Visual summaries of Pending, In-Progress, and Completed tasks.
- 📁 **Projects** — Dedicated containers for organizing related tasks.
- ✅ **Tasks** — Strict relational mapping linked to ProjectID and AssignedTo (UserID).
- 🕒 **Attendance** — Track daily team availability.
- 📱 **Responsive Design** — Fully optimized user experience for Mobile, Tablet, and Desktop.

---

## 🏁 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB instance)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on environment variables below
node seed.js # (Optional) Populate database with 48 tasks and 13 projects for instant evaluation
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Create a .env file for the frontend variables
npm run dev
```

### 4. Open
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000 # (Or the port specified in your .env)
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/taskmanager
JWT_SECRET=your_secret_key
PORT=5000
```

### Frontend (`frontend/.env` or `.env.local`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 Key API Endpoints

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | User Authentication & JWT retrieval |

### Projects
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/projects` | Private | Fetch all projects (Auth Required) |
| POST | `/api/projects` | Admin | Create new project (Admin Only) |

### Tasks
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/tasks/:projectId` | Private | Fetch tasks for a specific project |
| PATCH | `/api/tasks/:id` | Private | Update task status |

---

## 🌐 Deployment

Both the Frontend and Backend for this project are actively deployed on **Railway**.

| Service | Platform | URL |
|---|---|---|
| **Frontend** | Railway | [https://teamtaskmanager-production-e3c7.up.railway.app](https://teamtaskmanager-production-e3c7.up.railway.app) |
| **Backend API** | Railway | [https://teamtaskmanager-production-32f7.up.railway.app](https://teamtaskmanager-production-32f7.up.railway.app) |

---

## 👤 Assessment Credentials

Use these credentials to evaluate the seeded ecosystem instantly:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@ethara.ai` | `password123` |

---

## 📄 Documentation

*Candidate:* Abhishek Kashyap  
*Submission Date:* May 2, 2026