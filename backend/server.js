const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(cors()); 
app.use(express.json()); 

const JWT_SECRET = process.env.JWT_SECRET || 'ethara_super_secret_key_123';
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ethara-task-manager';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err));

// Schemas
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
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);
const Project = mongoose.model('Project', ProjectSchema);
const Task = mongoose.model('Task', TaskSchema);
const Attendance = mongoose.model('Attendance', AttendanceSchema);

// Middlewares
const authenticate = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).send('Access Denied. No token provided.');
  const token = authHeader.replace('Bearer ', '');
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) { res.status(401).send('Invalid or expired token.'); }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') next();
  else res.status(403).send('Forbidden: Administrator access required.');
};

// API Endpoints
app.post('/api/auth/register', async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) return res.status(400).send('Email already exists');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const user = await User.create({ ...req.body, password: hashedPassword });
    
    // Included email in the token payload for the profile update check
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).send('Invalid email or password');
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) return res.status(400).send('Invalid email or password');
    
    // Included email in the token payload for the profile update check
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/users', authenticate, async (req, res) => {
  const users = await User.find({}, '-password'); 
  res.json(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role })));
});

// PROTECTED: Users can update their own profile
app.put('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if the new email is already taken by someone else
    if (email !== req.user.email) {
      const exists = await User.findOne({ email });
      if (exists) return res.status(400).send('Email is already in use.');
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true } // returns the updated document
    );
    
    res.json({ id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
  } catch (err) { 
    res.status(500).send(err.message); 
  }
});

app.get('/api/projects', authenticate, async (req, res) => {
  const projects = await Project.find();
  res.json(projects.map(p => ({ id: p._id, name: p.name, description: p.description, createdAt: p.createdAt })));
});

app.post('/api/projects', [authenticate, isAdmin], async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.json({ id: project._id, name: project.name, description: project.description, createdAt: project.createdAt });
  } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/projects/:id', [authenticate, isAdmin], async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ message: 'Project and associated tasks deleted successfully' });
  } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/tasks', authenticate, async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks.map(t => ({ ...t.toObject(), id: t._id })));
});

app.get('/api/tasks/project/:projectId', authenticate, async (req, res) => {
  const tasks = await Task.find({ projectId: req.params.projectId });
  res.json(tasks.map(t => ({ ...t.toObject(), id: t._id })));
});

app.post('/api/tasks', [authenticate, isAdmin], async (req, res) => {
  try {
    const newTask = {
      ...req.body,
      activity: [{ text: `${req.body.userName || 'System'} created task`, timestamp: new Date().toISOString() }]
    };
    const task = await Task.create(newTask);
    res.json({ ...task.toObject(), id: task._id });
  } catch (err) { res.status(500).send(err.message); }
});

app.delete('/api/tasks/:id', [authenticate, isAdmin], async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) { res.status(500).send(err.message); }
});

app.patch('/api/tasks/:id/status', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (req.user.role !== 'ADMIN' && task.assignedTo !== req.user.id) {
      return res.status(403).send('Forbidden: You can only move your own assigned tasks.');
    }
    const oldStatus = task.status;
    task.status = req.body.status;
    task.activity.push({
      text: `${req.body.userName || 'Someone'} moved task from ${oldStatus.replace('_', ' ')} to ${task.status.replace('_', ' ')}`,
      timestamp: new Date().toISOString()
    });
    await task.save();
    res.json({ ...task.toObject(), id: task._id });
  } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/tasks/:id/comments', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    task.comments.push({
      userId: req.body.userId,
      text: req.body.text,
      timestamp: new Date().toISOString()
    });
    await task.save();
    res.json({ ...task.toObject(), id: task._id });
  } catch (err) { res.status(500).send(err.message); }
});

// --- ATTENDANCE ENDPOINTS ---
app.get('/api/attendance', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};
    if (date) query.date = date;
    const records = await Attendance.find(query);
    res.json(records);
  } catch (err) { res.status(500).send(err.message); }
});

// PROTECTED: Only Admins can mark/change attendance
app.post('/api/attendance', [authenticate, isAdmin], async (req, res) => {
  try {
    const { userId, date, status } = req.body;
    const record = await Attendance.findOneAndUpdate(
      { userId, date },
      { status },
      { new: true, upsert: true } // Creates it if it doesn't exist, updates if it does
    );
    res.json(record);
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Backend Server running on http://127.0.0.1:${PORT}`));