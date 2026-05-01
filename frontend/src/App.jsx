import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  CheckSquare, 
  LogOut, 
  Plus, 
  Clock, 
  AlertCircle,
  Shield,
  User as UserIcon,
  GripVertical,
  MessageSquare,
  Send,
  History,
  X,
  Search,
  Filter,
  CalendarCheck,
  UserCircle // Added for Profile
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// ==========================================
// 1. REAL REST API CONNECTION WITH JWT
// ==========================================
const BASE_URL = 'http://127.0.0.1:5001/api';

const getAuthHeaders = () => {
  const storedUser = localStorage.getItem('ethara_user');
  if (!storedUser) return { 'Content-Type': 'application/json' };
  
  const user = JSON.parse(storedUser);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${user.token}`
  };
};

const API = {
  auth: {
    login: async (email, password) => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    register: async (name, email, password, role) => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  },
  users: {
    getAll: async () => {
      const res = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    updateProfile: async (name, email) => {
      const res = await fetch(`${BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, email })
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  },
  projects: {
    getAll: async () => {
      const res = await fetch(`${BASE_URL}/projects`, { headers: getAuthHeaders() });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    create: async (data) => {
      const res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  },
  tasks: {
    getAll: async () => {
      const res = await fetch(`${BASE_URL}/tasks`, { headers: getAuthHeaders() });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    getByProject: async (projectId) => {
      const res = await fetch(`${BASE_URL}/tasks/project/${projectId}`, { headers: getAuthHeaders() });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    create: async (data, userName) => {
      const res = await fetch(`${BASE_URL}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...data, userName })
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    updateStatus: async (taskId, status, userName) => {
      const res = await fetch(`${BASE_URL}/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, userName })
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    addComment: async (taskId, text, userId) => {
      const res = await fetch(`${BASE_URL}/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, userId })
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  },
  attendance: {
    getByDate: async (date) => {
      const res = await fetch(`${BASE_URL}/attendance?date=${date}`, { headers: getAuthHeaders() });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    mark: async (userId, date, status) => {
      const res = await fetch(`${BASE_URL}/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, date, status })
      });
      if (res.status === 401) throw new Error('Unauthorized');
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    }
  }
};


// ==========================================
// 2. CONTEXT & STATE MANAGEMENT
// ==========================================
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

// ==========================================
// 3. COMPONENTS & BLACK AESTHETIC STYLING
// ==========================================

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
    blue: 'bg-indigo-900/30 text-indigo-400 border border-indigo-900/50',
    green: 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50',
    yellow: 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
    red: 'bg-red-900/30 text-red-400 border border-red-900/50',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

// --- Auth Views ---
const AuthView = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'MEMBER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Successfully logged in!');
      } else {
        await register(formData.name, formData.email, formData.password, formData.role);
        toast.success('Account created successfully!');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-sm py-2 px-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-indigo-500">
          <FolderKanban size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-zinc-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-300">Full Name</label>
                <input required type="text" className={inputClasses} placeholder="John Doe"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email address</label>
              <input required type="email" className={inputClasses} placeholder="admin@ethara.ai"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Password</label>
              <input required type="password" minLength="6" className={inputClasses} placeholder="••••••••"
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-zinc-300">Role</label>
                <select className={inputClasses}
                  value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <option value="MEMBER">Team Member</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            )}

            {error && <div className="text-red-400 text-sm font-medium bg-red-950/50 p-3 rounded-md border border-red-900/50">{error}</div>}

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-indigo-500 disabled:opacity-50 transition-colors">
              {loading ? 'Processing...' : (isLogin ? 'Sign in' : 'Sign up')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-zinc-400 hover:text-white transition-colors">
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Profile View ---
const ProfileView = () => {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: user.name, email: user.email });
  const [loading, setLoading] = useState(false);

  const inputClasses = "mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-sm py-2 px-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await API.users.updateProfile(formData.name, formData.email);
      // Keep the token but update the user details in context & local storage
      const newUserState = { ...user, name: updatedUser.name, email: updatedUser.email };
      setUser(newUserState);
      localStorage.setItem('ethara_user', JSON.stringify(newUserState));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
        <p className="text-zinc-400 mt-1 text-sm">Manage your personal details and account settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Role */}
        <Card className="p-6 md:col-span-1 flex flex-col items-center text-center space-y-4 h-fit">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.name}</h2>
            <div className="flex items-center justify-center mt-2">
              <Badge color={user.role === 'ADMIN' ? 'blue' : 'gray'}>
                <div className="flex items-center space-x-1 px-1">
                  <Shield size={12} />
                  <span>{user.role === 'ADMIN' ? 'System Administrator' : 'Project Member'}</span>
                </div>
              </Badge>
            </div>
          </div>
        </Card>

        {/* Right Column: Details & Edit Form */}
        <Card className="p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Personal Details</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors font-medium border border-zinc-700"
              >
                Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <p className="text-white font-medium bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-lg">{user.name}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <p className="text-white font-medium bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-lg">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">Designation & Access Level</label>
                <p className="text-zinc-300 font-medium bg-zinc-950/50 border border-zinc-800/50 p-3 rounded-lg">
                  {user.role === 'ADMIN' 
                    ? 'Administrator (Full Access to Projects, Tasks, and Attendance)' 
                    : 'Member (Limited Access to Assigned Tasks)'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Full Name</label>
                <input 
                  required 
                  type="text" 
                  className={inputClasses} 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Email Address</label>
                <input 
                  required 
                  type="email" 
                  className={inputClasses} 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Designation</label>
                <input 
                  disabled
                  type="text" 
                  className={`${inputClasses} opacity-50 cursor-not-allowed`} 
                  value={user.role === 'ADMIN' ? 'System Administrator' : 'Project Member'} 
                  title="Contact your system administrator to change roles."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user.name, email: user.email }); // reset form
                  }} 
                  className="px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

// --- Attendance View ---
const AttendanceView = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Default to today
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const [fetchedUsers, fetchedRecords] = await Promise.all([
          API.users.getAll(),
          API.attendance.getByDate(selectedDate)
        ]);
        setUsers(fetchedUsers);
        setAttendanceRecords(fetchedRecords);
      } catch (err) {
        if(err.message === 'Unauthorized') logout();
        else toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, [selectedDate, logout]);

  const handleMarkAttendance = async (userId, status) => {
    try {
      const updatedRecord = await API.attendance.mark(userId, selectedDate, status);
      // Update local state smoothly
      setAttendanceRecords(prev => {
        const filtered = prev.filter(r => r.userId !== userId);
        return [...filtered, updatedRecord];
      });
      toast.success('Attendance updated!');
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to update attendance.');
    }
  };

  const getStatusBadgeColor = (status) => {
    if (status === 'PRESENT') return 'green';
    if (status === 'ABSENT') return 'red';
    if (status === 'LEAVE') return 'yellow';
    return 'gray'; // Unmarked
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Team Attendance</h1>
          <p className="text-zinc-400 mt-1 text-sm">Monitor and manage daily presence.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
          <CalendarCheck className="text-zinc-500 ml-2" size={18} />
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 cursor-pointer"
            style={{colorScheme: 'dark'}}
          />
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 animate-pulse">Loading attendance records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                  <th className="p-4 font-bold">Team Member</th>
                  <th className="p-4 font-bold">Role</th>
                  <th className="p-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map(u => {
                  const record = attendanceRecords.find(r => r.userId === u.id);
                  const currentStatus = record ? record.status : 'UNMARKED';

                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-indigo-900/50 text-indigo-400 flex items-center justify-center font-bold text-xs mr-3">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{u.name}</p>
                            <p className="text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold tracking-wide text-zinc-400">
                          {u.role === 'ADMIN' ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {user.role === 'ADMIN' ? (
                          <select 
                            value={currentStatus}
                            onChange={(e) => handleMarkAttendance(u.id, e.target.value)}
                            className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            <option value="UNMARKED">Unmarked</option>
                            <option value="PRESENT">Present</option>
                            <option value="ABSENT">Absent</option>
                            <option value="LEAVE">On Leave</option>
                          </select>
                        ) : (
                          <Badge color={getStatusBadgeColor(currentStatus)}>
                            {currentStatus}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};


// --- Dashboard View ---
const DashboardView = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 

  useEffect(() => {
    API.tasks.getAll().then(data => {
      const relevantTasks = user.role === 'ADMIN' ? data : data.filter(t => t.assignedTo === user.id);
      setTasks(relevantTasks);
      setLoading(false);
    }).catch(err => {
      if(err.message === 'Unauthorized') logout(); 
      else toast.error(err.message);
    });
  }, [user, logout]);

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading dashboard...</div>;

  const today = new Date().toISOString().split('T')[0];
  
  const pending = tasks.filter(t => t.status === 'PENDING').length;
  const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completed = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdue = tasks.filter(t => t.status !== 'COMPLETED' && t.dueDate < today).length;

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filterType === 'DUE_TODAY') matchesFilter = task.dueDate === today;
    if (filterType === 'OVERDUE') matchesFilter = task.dueDate < today && task.status !== 'COMPLETED';
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-indigo-500">
          <div className="text-zinc-400 text-sm font-medium tracking-wide uppercase">Total Tasks</div>
          <div className="text-4xl font-black text-white mt-2">{tasks.length}</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="text-zinc-400 text-sm font-medium tracking-wide uppercase">In Progress</div>
          <div className="text-4xl font-black text-white mt-2">{inProgress}</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="text-zinc-400 text-sm font-medium tracking-wide uppercase">Completed</div>
          <div className="text-4xl font-black text-white mt-2">{completed}</div>
        </Card>
        <Card className="p-6 border-l-4 border-l-red-500 bg-red-950/10">
          <div className="text-red-400 text-sm font-medium tracking-wide uppercase flex items-center"><AlertCircle size={16} className="mr-1.5"/> Overdue</div>
          <div className="text-4xl font-black text-red-400 mt-2">{overdue}</div>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-3 pt-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Search your tasks..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full md:w-48 pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
          >
            <option value="ALL">All Tasks</option>
            <option value="DUE_TODAY">Due Today</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center rounded-t-xl">
          <h2 className="text-lg font-bold text-white">Your Tasks</h2>
          <button onClick={() => navigate('projects')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            View All Projects &rarr;
          </button>
        </div>
        <div className="divide-y divide-zinc-800">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div key={task.id} className="p-6 hover:bg-zinc-800/50 transition-colors flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold text-white">{task.title}</h3>
                  <p className="text-sm text-zinc-500 mt-1.5 flex items-center font-medium">
                    <Clock size={14} className="mr-1.5 text-zinc-400"/> Due: {task.dueDate}
                  </p>
                </div>
                <div>
                  <Badge color={task.status === 'COMPLETED' ? 'green' : task.status === 'IN_PROGRESS' ? 'yellow' : 'gray'}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
              <Search size={32} className="mb-3 text-zinc-700" />
              <p>No tasks match your search or filter.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// --- Projects List View ---
const ProjectsView = ({ navigate }) => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    API.projects.getAll().then(data => {
      setProjects(data);
      setLoading(false);
    }).catch(err => {
      if(err.message === 'Unauthorized') logout();
      else toast.error(err.message);
    });
  }, [logout]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await API.projects.create(newProject);
      setProjects([...projects, created]);
      setShowModal(false);
      setNewProject({ name: '', description: '' });
      toast.success('Project created successfully!');
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to create project.');
    }
  };

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClasses = "mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-sm py-2 px-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">Projects</h1>
        
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>

          {user.role === 'ADMIN' && (
            <button onClick={() => setShowModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap">
              <Plus size={18} className="mr-2" /> New Project
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map(project => (
            <Card key={project.id} className="hover:border-zinc-700 transition-colors cursor-pointer group" >
              <div className="p-6" onClick={() => navigate('project-detail', { id: project.id })}>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                <p className="text-sm text-zinc-400 mt-3 line-clamp-2 leading-relaxed">{project.description}</p>
                <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center text-xs font-medium text-zinc-500">
                  <span>Created: {project.createdAt}</span>
                  <span className="text-indigo-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center">Open <span className="ml-1">&rarr;</span></span>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full p-12 text-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
            No projects found matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Project Name</label>
                <input required autoFocus type="text" className={inputClasses} placeholder="e.g. Migration to AWS"
                  value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Description</label>
                <textarea required rows="3" className={inputClasses} placeholder="Brief details about the project..."
                  value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} />
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Project Detail & Kanban View ---
const ProjectDetailView = ({ projectId, navigate }) => {
  const { user, logout } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Drag & Drop State
  const [dragOverCol, setDragOverCol] = useState(null);
  
  // Modals & Interaction State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', dueDate: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allProjects, projectTasks, allUsers] = await Promise.all([
          API.projects.getAll(),
          API.tasks.getByProject(projectId),
          API.users.getAll()
        ]);
        setProject(allProjects.find(p => p.id === projectId));
        setTasks(projectTasks);
        setUsers(allUsers);
        if(allUsers.length > 0) {
          setNewTask(prev => ({...prev, assignedTo: allUsers[0].id}));
        }
        setLoading(false);
      } catch (err) {
        if(err.message === 'Unauthorized') logout();
        else toast.error(err.message);
      }
    };
    fetchData();
  }, [projectId, logout]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const created = await API.tasks.create({ ...newTask, projectId }, user.name);
      setTasks([...tasks, created]);
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', assignedTo: users[0]?.id || '', dueDate: '' });
      toast.success('Task assigned successfully!');
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to create task.');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const updatedTask = await API.tasks.updateStatus(taskId, newStatus, user.name);
      setTasks(tasks.map(t => t.id === taskId ? updatedTask : t));
      toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}`);
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to update task status.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTaskId) return;
    try {
      const updatedTask = await API.tasks.addComment(selectedTaskId, commentText, user.id);
      setTasks(tasks.map(t => t.id === selectedTaskId ? updatedTask : t));
      setCommentText('');
    } catch (err) {
      if (err.message === 'Unauthorized') logout();
      else toast.error(err.message || 'Failed to post comment.');
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDragOverCol(null);
  };

  const handleDragOver = (e, colStatus) => {
    e.preventDefault();
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus);
    }
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus && (user.role === 'ADMIN' || user.id === task.assignedTo)) {
        await handleStatusChange(taskId, newStatus);
      }
    }
  };

  const inputClasses = "mt-1 block w-full bg-zinc-950 border border-zinc-800 rounded-md shadow-sm py-2 px-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent color-scheme-dark";

  if (loading) return <div className="p-8 text-center text-zinc-500 animate-pulse">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center text-red-400 font-bold">Project not found</div>;

  const getUserName = (id) => users.find(u => u.id === id)?.name || 'Unknown User';
  const today = new Date().toISOString().split('T')[0];
  const activeTask = tasks.find(t => t.id === selectedTaskId);

  // Apply filters to tasks before distributing them to columns
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filterType === 'DUE_TODAY') matchesFilter = task.dueDate === today;
    if (filterType === 'OVERDUE') matchesFilter = task.dueDate < today && task.status !== 'COMPLETED';
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-zinc-500 mb-2 font-medium">
        <button onClick={() => navigate('projects')} className="hover:text-white transition-colors">Projects</button>
        <span className="mx-2 text-zinc-700">/</span>
        <span className="text-white">{project.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{project.name}</h1>
          <p className="text-zinc-400 mt-2 max-w-2xl text-sm leading-relaxed">{project.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
          <div className="relative flex-1 lg:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="pl-8 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="ALL">All Tasks</option>
              <option value="DUE_TODAY">Due Today</option>
              <option value="OVERDUE">Overdue</option>
            </select>
          </div>
          {user.role === 'ADMIN' && (
            <button onClick={() => setShowTaskModal(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20 whitespace-nowrap">
              <Plus size={16} className="mr-1.5" /> Add Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Kanban Columns */}
        {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(statusColumn => {
          const columnTasks = filteredTasks.filter(t => t.status === statusColumn);
          const isDraggingOver = dragOverCol === statusColumn;
          
          return (
            <div 
              key={statusColumn} 
              className={`bg-zinc-950 border rounded-2xl p-4 transition-colors duration-200 ${isDraggingOver ? 'border-indigo-500/50 bg-indigo-950/10' : 'border-zinc-800/50'}`}
              onDragOver={(e) => handleDragOver(e, statusColumn)}
              onDragEnter={(e) => e.preventDefault()}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, statusColumn)}
            >
              <h3 className="font-bold text-zinc-300 mb-5 flex items-center justify-between tracking-wide text-sm px-1">
                {statusColumn.replace('_', ' ')}
                <span className="bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full text-xs">{columnTasks.length}</span>
              </h3>
              
              <div className="space-y-4 min-h-[150px]">
                {columnTasks.map(task => {
                  const isOverdue = task.dueDate < today && task.status !== 'COMPLETED';
                  const canEdit = user.role === 'ADMIN' || user.id === task.assignedTo;
                  
                  return (
                    <Card 
                      key={task.id} 
                      draggable={canEdit}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onDragEnd={handleDragEnd}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`p-5 transition-all flex flex-col cursor-pointer hover:border-zinc-600 hover:shadow-md hover:shadow-black/50 ${isOverdue ? 'border-red-900/50 bg-red-950/10' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-md pr-2">{task.title}</h4>
                        {canEdit && (
                          <div 
                            className="text-zinc-600 flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing hover:text-zinc-400 transition-colors"
                            onClick={(e) => e.stopPropagation()} // Prevent modal from opening if they grab here
                            draggable={true} // Allow drag specifically from the icon
                            onDragStart={(e) => handleDragStart(e, task)}
                            onDragEnd={handleDragEnd}
                          >
                            <GripVertical size={16} />
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-zinc-400 mt-2 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                      
                      <div className="flex items-center justify-between text-xs mt-auto pt-4 border-t border-zinc-800/80 font-medium">
                        <div className="flex items-center text-zinc-400 bg-zinc-800 px-2 py-1 rounded-md">
                          <UserIcon size={14} className="mr-1.5 text-indigo-400" />
                          <span title={getUserName(task.assignedTo)} className="truncate max-w-[90px]">
                             {getUserName(task.assignedTo)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {task.comments?.length > 0 && (
                            <div className="flex items-center text-zinc-500" title="Comments">
                              <MessageSquare size={14} className="mr-1" />
                              {task.comments.length}
                            </div>
                          )}
                          <div className={`flex items-center ${isOverdue ? 'text-red-400 bg-red-950/30 px-2 py-1 rounded-md' : 'text-zinc-500'}`}>
                            <Clock size={14} className="mr-1.5" />
                            {task.dueDate}
                          </div>
                        </div>
                      </div>

                      {/* Always Visible Dropdown Fallback */}
                      {canEdit && (
                        <div className="mt-4 pt-3 border-t border-zinc-800/50">
                           <select 
                            value={task.status} 
                            onClick={(e) => e.stopPropagation()} // Stop click from opening modal
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="block w-full text-xs font-medium border border-zinc-700 rounded-lg bg-zinc-900 text-zinc-300 py-1.5 px-2 focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer hover:bg-zinc-800 transition-colors"
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                          </select>
                        </div>
                      )}
                    </Card>
                  )
                })}
                {columnTasks.length === 0 && (
                  <div className="border-2 border-dashed border-zinc-800/50 rounded-xl p-8 text-center text-sm font-medium text-zinc-600 flex items-center justify-center h-full min-h-[100px]">
                    No tasks found
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* =========================================
          TASK COMMENTS & ACTIVITY MODAL 
      ========================================= */}
      {selectedTaskId && activeTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden shadow-2xl relative my-8 min-h-[60vh] max-h-[85vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedTaskId(null)} 
              className="absolute top-4 right-4 text-zinc-500 hover:text-white bg-zinc-900 rounded-full p-1 z-10 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Left Side: Details & Comments */}
            <div className="p-6 md:p-8 md:w-2/3 border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col h-full bg-zinc-900">
               
               <div className="mb-6 pr-8">
                 <div className="flex items-center space-x-3 mb-3">
                   <Badge color={activeTask.status === 'COMPLETED' ? 'green' : activeTask.status === 'IN_PROGRESS' ? 'yellow' : 'gray'}>
                     {activeTask.status.replace('_', ' ')}
                   </Badge>
                   <span className="text-xs font-medium text-zinc-500 flex items-center">
                     <Clock size={12} className="mr-1" /> Due {activeTask.dueDate}
                   </span>
                 </div>
                 <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{activeTask.title}</h2>
                 <p className="text-zinc-400 text-sm leading-relaxed">{activeTask.description}</p>
                 <div className="mt-4 flex items-center text-sm font-medium text-zinc-300">
                    <span className="text-zinc-500 mr-2">Assigned to:</span>
                    <UserIcon size={16} className="text-indigo-400 mr-1.5" />
                    {getUserName(activeTask.assignedTo)}
                 </div>
               </div>

               {/* Comments Section */}
               <div className="flex-1 flex flex-col min-h-[250px] border-t border-zinc-800/80 pt-6">
                 <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-4 flex items-center">
                   <MessageSquare size={16} className="mr-2 text-indigo-400" /> Discussion
                 </h3>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4 custom-scrollbar">
                   {activeTask.comments?.map(comment => (
                     <div key={comment.id} className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800/80">
                        <div className="flex justify-between items-center mb-2">
                           <span className="font-bold text-sm text-indigo-400">{getUserName(comment.userId)}</span>
                           <span className="text-xs text-zinc-500 font-medium">
                             {new Date(comment.timestamp).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                           </span>
                        </div>
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                     </div>
                   ))}
                   {(!activeTask.comments || activeTask.comments.length === 0) && (
                     <div className="text-center text-zinc-500 text-sm mt-10 font-medium">
                       No comments yet. Start the discussion!
                     </div>
                   )}
                 </div>

                 {/* Add Comment Input */}
                 <form onSubmit={handleAddComment} className="relative mt-auto">
                    <input 
                      type="text" 
                      placeholder="Type a comment..." 
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 pr-12 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                    />
                    <button 
                      type="submit" 
                      disabled={!commentText.trim()}
                      className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg px-3 flex items-center justify-center transition-colors"
                    >
                      <Send size={16} />
                    </button>
                 </form>
               </div>
            </div>

            {/* Right Side: Activity Log */}
            <div className="md:w-1/3 bg-black flex flex-col h-full p-6 md:p-8">
               <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wide mb-6 flex items-center">
                 <History size={16} className="mr-2 text-zinc-500" /> Activity Log
               </h3>
               
               <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                 <div className="relative border-l border-zinc-800 ml-3 space-y-6">
                   {activeTask.activity?.slice().reverse().map((act, index) => (
                     <div key={act.id} className="relative pl-6">
                        {/* Timeline Dot */}
                        <div className="absolute w-3 h-3 bg-zinc-800 border-2 border-black rounded-full -left-[7px] top-1.5 z-10"></div>
                        <p className="text-xs font-semibold text-zinc-500 mb-1">
                          {new Date(act.timestamp).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-sm text-zinc-300 font-medium leading-snug">{act.text}</p>
                     </div>
                   ))}
                   {(!activeTask.activity || activeTask.activity.length === 0) && (
                     <p className="pl-6 text-sm text-zinc-600">No activity recorded.</p>
                   )}
                 </div>
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300">Task Title</label>
                <input required autoFocus type="text" className={inputClasses} placeholder="What needs to be done?"
                  value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300">Description</label>
                <textarea required rows="2" className={inputClasses} placeholder="Add some details..."
                  value={newTask.description} onChange={e => setNewTask({ ...newTask, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Assign To</label>
                  <select required className={inputClasses}
                    value={newTask.assignedTo} onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300">Due Date</label>
                  <input required type="date" className={inputClasses} style={{colorScheme: 'dark'}}
                    value={newTask.dueDate} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setShowTaskModal(false)} className="px-4 py-2 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-500 transition-colors">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


// ==========================================
// 4. MAIN LAYOUT & ROUTER APP
// ==========================================
export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('ethara_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [route, setRoute] = useState({ path: 'dashboard', params: {} });

  const login = async (email, password) => {
    const userData = await API.auth.login(email, password);
    setUser(userData);
    localStorage.setItem('ethara_user', JSON.stringify(userData));
    setRoute({ path: 'dashboard', params: {} });
  };

  const register = async (name, email, password, role) => {
    const userData = await API.auth.register(name, email, password, role);
    setUser(userData);
    localStorage.setItem('ethara_user', JSON.stringify(userData));
    setRoute({ path: 'dashboard', params: {} });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ethara_user');
    toast.success('Logged out successfully!');
  };

  const navigate = (path, params = {}) => {
    setRoute({ path, params });
  };

  return (
    <>
      <Toaster 
        position="bottom-right" 
        toastOptions={{
          style: {
            background: '#18181b', // zinc-900
            color: '#fff',
            border: '1px solid #27272a', // zinc-800
          },
          success: {
            iconTheme: {
              primary: '#4f46e5', // indigo-600
              secondary: '#fff',
            },
          },
        }}
      />
      
      {!user ? (
        <AuthContext.Provider value={{ login, register }}>
          <AuthView />
        </AuthContext.Provider>
      ) : (
        <AuthContext.Provider value={{ user, logout, setUser }}>
          <div className="min-h-screen bg-zinc-950 flex font-sans">
            {/* Sidebar */}
            <aside className="w-72 bg-black border-r border-zinc-800 text-white hidden md:flex flex-col">
              <div className="p-6 flex items-center space-x-3 border-b border-zinc-900">
                <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-900/20">
                  <FolderKanban size={24} className="text-white" />
                </div>
                <span className="text-xl font-bold tracking-wider">ethara<span className="text-indigo-500">.ai</span></span>
              </div>
              
              <nav className="flex-1 px-4 py-6 space-y-2">
                <button 
                  onClick={() => navigate('dashboard')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${route.path === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <LayoutDashboard size={20} />
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => navigate('projects')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${route.path === 'projects' || route.path === 'project-detail' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <CheckSquare size={20} />
                  <span>Projects</span>
                </button>
                <button 
                  onClick={() => navigate('attendance')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${route.path === 'attendance' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <CalendarCheck size={20} />
                  <span>Attendance</span>
                </button>
                <button 
                  onClick={() => navigate('profile')}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all font-medium ${route.path === 'profile' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                >
                  <UserCircle size={20} />
                  <span>Profile</span>
                </button>
              </nav>

              <div className="p-4 border-t border-zinc-900">
                <div className="flex items-center px-4 py-3 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-inner">
                    {user.name.charAt(0)}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user.name}</p>
                    <div className="flex items-center text-[11px] font-semibold tracking-wide text-zinc-400 mt-0.5 uppercase">
                      <Shield size={12} className="mr-1 text-indigo-400" />
                      {user.role}
                    </div>
                  </div>
                </div>
                <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-bold text-zinc-400 hover:text-red-400 hover:bg-red-950/30 rounded-xl transition-colors">
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
              {/* Mobile Header */}
              <header className="md:hidden bg-black border-b border-zinc-800 px-5 py-4 flex justify-between items-center shadow-sm">
                 <div className="flex items-center text-white font-bold text-xl tracking-wider">
                   <div className="bg-indigo-600 p-1.5 rounded-lg mr-2">
                     <FolderKanban size={20} className="text-white" />
                   </div>
                   ethara<span className="text-indigo-500">.ai</span>
                 </div>
                 <button onClick={logout} className="text-zinc-400 hover:text-red-400 transition-colors">
                   <LogOut size={24} />
                 </button>
              </header>

              <div className="flex-1 overflow-auto p-5 md:p-10">
                <div className="max-w-6xl mx-auto">
                  {route.path === 'dashboard' && <DashboardView navigate={navigate} />}
                  {route.path === 'projects' && <ProjectsView navigate={navigate} />}
                  {route.path === 'project-detail' && <ProjectDetailView projectId={route.params.id} navigate={navigate} />}
                  {route.path === 'attendance' && <AttendanceView navigate={navigate} />}
                  {route.path === 'profile' && <ProfileView navigate={navigate} />}
                </div>
              </div>
            </main>
          </div>
        </AuthContext.Provider>
      )}
    </>
  );
}