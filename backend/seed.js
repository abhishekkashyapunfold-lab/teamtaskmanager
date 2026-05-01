const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// 1. Connection URI - HARDCODED TO RAILWAY TO FORCE THE CLOUD CONNECTION
const MONGO_URI = 'mongodb://mongo:LOnXwQseHlGWMkxjEWPTInpGGrTjeATH@switchyard.proxy.rlwy.net:40590/team_task_manager?authSource=admin';

// 2. Schemas (Standalone for the script)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'MEMBER'], default: 'MEMBER' }
});

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const TaskSchema = new mongoose.Schema({
  projectId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  assignedTo: { type: String, required: true },
  status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: 'PENDING' },
  dueDate: { type: String, required: true },
  comments: [{ userId: String, text: String, timestamp: String }],
  activity: [{ text: String, timestamp: String }]
});

const AttendanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  status: { type: String, enum: ['PRESENT', 'ABSENT', 'LEAVE'], default: 'PRESENT' }
});

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Task = mongoose.model('Task', TaskSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// 3. Seed Logic
async function seedDB() {
  try {
    // This will now strictly connect to Railway
    await mongoose.connect(MONGO_URI);
    console.log('🔌 Connected to Railway MongoDB. Clearing old data...');

    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Attendance.deleteMany({});

    console.log('🧹 Old data cleared. Seeding 10 users, 13 projects, and 45+ tasks directly to the cloud...');

    const salt = await bcrypt.genSalt(10);
    const hp = await bcrypt.hash('password123', salt);

    // --- USERS (10) ---
    const usersData = [
      { name: 'Abhishek Admin', email: 'admin@ethara.ai', password: hp, role: 'ADMIN' },
      { name: 'John Developer', email: 'john@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Jane Designer', email: 'jane@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Mike DevOps', email: 'mike@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Sarah QA', email: 'sarah@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'David Backend', email: 'david@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Emma Frontend', email: 'emma@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Alex Manager', email: 'alex@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Sophia Security', email: 'sophia@ethara.ai', password: hp, role: 'MEMBER' },
      { name: 'Ryan Mobile', email: 'ryan@ethara.ai', password: hp, role: 'MEMBER' },
    ];
    const createdUsers = await User.insertMany(usersData);
    const userMap = createdUsers.reduce((acc, u) => ({ ...acc, [u.name.split(' ')[0].toLowerCase()]: u._id }), {});

    // --- PROJECTS (13) ---
    const projectsData = [
      { name: 'Website Redesign', description: 'Modernizing the corporate landing page with Next.js and Tailwind CSS.' },
      { name: 'AI Chatbot', description: 'Implementing a RAG-based support bot using Gemini API.' },
      { name: 'Cloud Migration', description: 'Moving legacy on-premise servers to AWS Lambda and S3.' },
      { name: 'Mobile App v2', description: 'Flutter-based cross-platform app for customer loyalty program.' },
      { name: 'Cybersecurity Audit', description: 'Bi-annual penetration testing and vulnerability assessment.' },
      { name: 'HR Payroll System', description: 'Internal tool to automate salary disbursements and tax filings.' },
      { name: 'Data Analytics', description: 'Building a real-time dashboard for sales performance tracking.' },
      { name: 'API Gateway', description: 'Centralizing microservices communication through a secure gateway.' },
      { name: 'E-commerce Launch', description: 'Scaling the marketplace for the upcoming holiday season.' },
      { name: 'Marketing Automation', description: 'Integrating HubSpot with internal lead generation workflows.' },
      { name: 'Blockchain R&D', description: 'Exploring smart contracts for supply chain transparency.' },
      { name: 'Customer CRM', description: 'Rebuilding the sales pipeline management system.' },
      { name: 'Docs Portal', description: 'New documentation site using Docusaurus for external developers.' }
    ];
    const createdProjects = await Project.insertMany(projectsData);

    // --- TASKS (45+) ---
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const tasks = [];

    // Project 0: Website Redesign
    tasks.push(
      { projectId: createdProjects[0]._id, title: 'Hero Section Design', description: 'Design high-fidelity hero section in Figma.', assignedTo: userMap.jane, status: 'COMPLETED', dueDate: '2026-04-25' },
      { projectId: createdProjects[0]._id, title: 'Fix Navbar Responsiveness', description: 'Hamburger menu is broken on iOS Safari.', assignedTo: userMap.emma, status: 'IN_PROGRESS', dueDate: today },
      { projectId: createdProjects[0]._id, title: 'SEO Optimization', description: 'Meta tags and sitemap generation.', assignedTo: userMap.john, status: 'PENDING', dueDate: nextWeek }
    );

    // Project 1: AI Chatbot
    tasks.push(
      { projectId: createdProjects[1]._id, title: 'Gemini Integration', description: 'Setup API keys and vertex AI endpoint.', assignedTo: userMap.david, status: 'COMPLETED', dueDate: '2026-04-20' },
      { projectId: createdProjects[1]._id, title: 'Vector DB Setup', description: 'Configure Pinecone for document embeddings.', assignedTo: userMap.david, status: 'IN_PROGRESS', dueDate: today },
      { projectId: createdProjects[1]._id, title: 'UI Chat Widget', description: 'Develop the floating chat bubble component.', assignedTo: userMap.emma, status: 'PENDING', dueDate: nextWeek },
      { projectId: createdProjects[1]._id, title: 'Knowledge Base PDF Upload', description: 'Create parser for support PDFs.', assignedTo: userMap.alex, status: 'PENDING', dueDate: nextWeek }
    );

    // Project 2: Cloud Migration
    tasks.push(
      { projectId: createdProjects[2]._id, title: 'S3 Bucket Policy', description: 'Strict IAM roles for public assets.', assignedTo: userMap.mike, status: 'COMPLETED', dueDate: '2026-04-15' },
      { projectId: createdProjects[2]._id, title: 'Database Migration', description: 'Migrate SQL data to Aurora RDS.', assignedTo: userMap.mike, status: 'IN_PROGRESS', dueDate: today },
      { projectId: createdProjects[2]._id, title: 'Setup CloudWatch Alarms', description: 'Alerts for high CPU usage.', assignedTo: userMap.mike, status: 'PENDING', dueDate: nextWeek }
    );

    // Project 3: Mobile App
    tasks.push(
      { projectId: createdProjects[3]._id, title: 'Push Notifications', description: 'Integrate Firebase Messaging.', assignedTo: userMap.ryan, status: 'IN_PROGRESS', dueDate: today },
      { projectId: createdProjects[3]._id, title: 'Profile Screen', description: 'User edit and photo upload.', assignedTo: userMap.ryan, status: 'PENDING', dueDate: nextWeek },
      { projectId: createdProjects[3]._id, title: 'App Store Submission', description: 'Prepare screenshots and metadata.', assignedTo: userMap.alex, status: 'PENDING', dueDate: '2026-05-15' }
    );

    // Project 4: Cybersecurity
    tasks.push(
      { projectId: createdProjects[4]._id, title: 'Password Policy Update', description: 'Enforce 12 chars and MFA.', assignedTo: userMap.sophia, status: 'COMPLETED', dueDate: '2026-04-28' },
      { projectId: createdProjects[4]._id, title: 'Firewall Config', description: 'Close unused ports on dev staging.', assignedTo: userMap.sophia, status: 'IN_PROGRESS', dueDate: today },
      { projectId: createdProjects[4]._id, title: 'User Access Review', description: 'Remove inactive accounts.', assignedTo: userMap.alex, status: 'PENDING', dueDate: nextWeek }
    );

    // Add random tasks for remaining projects to reach 45+
    for (let i = 5; i < 13; i++) {
      const pId = createdProjects[i]._id;
      tasks.push(
        { projectId: pId, title: `${createdProjects[i].name} Initial Setup`, description: 'Environment config and repo setup.', assignedTo: userMap.john, status: 'COMPLETED', dueDate: '2026-04-01' },
        { projectId: pId, title: `${createdProjects[i].name} Component Dev`, description: 'Primary feature development phase.', assignedTo: userMap.emma, status: 'IN_PROGRESS', dueDate: today },
        { projectId: pId, title: `${createdProjects[i].name} Unit Testing`, description: 'Ensuring 80% code coverage.', assignedTo: userMap.sarah, status: 'PENDING', dueDate: nextWeek },
        { projectId: pId, title: `${createdProjects[i].name} Final Review`, description: 'Review with stakeholders.', assignedTo: userMap.alex, status: 'PENDING', dueDate: nextWeek }
      );
    }

    await Task.insertMany(tasks);

    // --- ATTENDANCE ---
    const attendanceRecords = createdUsers.map((u, idx) => ({
      userId: u._id,
      date: today,
      status: idx % 4 === 0 ? 'LEAVE' : idx % 7 === 0 ? 'ABSENT' : 'PRESENT'
    }));
    await Attendance.insertMany(attendanceRecords);

    console.log('✅ Railway Database populated successfully with 10 users, 13 projects, and 48 tasks!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding Railway database:', err);
    process.exit(1);
  }
}

seedDB();