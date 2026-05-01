===========================================================
PROJECT: TEAM TASK MANAGER (FULL-STACK)
CANDIDATE: Abhishek Kashyap
SUBMISSION DATE: May 2, 2026
===========================================================

1. PROJECT DESCRIPTION
----------------------
A production-ready Task Management System designed for collaborative 
teams. The app allows administrators to manage high-level projects 
while allowing members to track and update individual task progress. 
Built with a focus on security (JWT), scalability (MERN), and 
user experience (Framer Motion).

2. LIVE DEPLOYMENT
------------------
Frontend URL: https://teamtaskmanager-production-e3c7.up.railway.app
Backend URL:  https://teamtaskmanager-production-32f7.up.railway.app

3. TECH STACK
-------------
* Frontend: React 19, Tailwind CSS, Lucide Icons, Framer Motion, Axios.
* Backend: Node.js, Express.js.
* Database: MongoDB (Railway Managed) with Mongoose ODM.
* Auth: JWT (JSON Web Tokens) & Bcrypt password hashing.

4. PROJECT FILE STRUCTURE
-------------------------
team-task-manager/
├── backend/
│   ├── models/           # Mongoose Schemas (User, Project, Task, Attendance)
│   ├── routes/           # API Route Definitions
│   ├── middleware/       # JWT Auth & Role-based Access Middleware
│   ├── .env              # Environment Variables (Local)
│   ├── seed.js           # Database Population Script
│   ├── server.js         # Entry Point & Express Configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI Components (Cards, Modals, Nav)
│   │   ├── pages/        # Dashboard, Login, Project View
│   │   ├── App.jsx       # Main Routing & Global State
│   │   └── main.jsx      # Vite Entry Point
│   ├── tailwind.config.js
│   ├── package.json
│   └── vite.config.js
└── README.txt            # Project Documentation

5. CORE FEATURES & FUNCTIONALITY
--------------------------------
* Authentication: Secure Login/Signup with persistent session tokens.
* Role-Based Access (RBAC): 
    - ADMIN: Can create projects, assign tasks, and view all data.
    - MEMBER: Can view assigned tasks and update status.
* Dashboard Metrics: Visual summary of Pending, In-Progress, and Completed tasks.
* Seeded Ecosystem: Populated with 48 tasks and 13 projects for instant evaluation.
* Responsive Design: Fully optimized for Mobile, Tablet, and Desktop.

6. API ENDPOINTS (KEY)
----------------------
* POST /api/auth/login       - User Authentication
* GET  /api/projects         - Fetch all projects (Auth Required)
* POST /api/projects         - Create new project (Admin Only)
* GET  /api/tasks/:projectId - Fetch tasks for a specific project
* PATCH /api/tasks/:id       - Update task status

7. DATABASE ARCHITECTURE
------------------------
* Users: Stores identity and RBAC roles.
* Projects: Acts as a container for related tasks.
* Tasks: Linked to ProjectID and AssignedTo (UserID) for strict relationships.
* Attendance: Tracks daily team availability.

8. SETUP & INSTALLATION
-----------------------
1. Clone the repository.
2. Inside /backend: Run 'npm install', set .env, and 'node server.js'.
3. Inside /frontend: Run 'npm install' and 'npm run dev'.
4. To populate data: Run 'node seed.js' in the backend folder.

9. ASSESSMENT CREDENTIALS
-------------------------
Admin Email: admin@ethara.ai
Password:    password123
===========================================================