import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import TodoItem from './TodoItem';
import '../App.css';

const Dashboard = () => {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
    tags: '',
    dueDate: '',
    reminder: ''
  });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showReminders, setShowReminders] = useState(false);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [immediateReminders, setImmediateReminders] = useState([]);
  
  // Sharing states - ADD THESE
  const [sharedTodos, setSharedTodos] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [sharePermission, setSharePermission] = useState('view');
  const [activeTab, setActiveTab] = useState('my-todos'); // 'my-todos' or 'shared'
  
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    checkImmediateReminders();
    const interval = setInterval(checkImmediateReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await API.get('/todos');
      setTodos(res.data.data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  // ADD THIS FUNCTION FOR SHARED TODOS
  const fetchSharedTodos = async () => {
    try {
      const res = await API.get('/sharing/shared-with-me');
      setSharedTodos(res.data.data);
    } catch (error) {
      console.error('Error fetching shared todos:', error);
    }
  };

  const checkImmediateReminders = async () => {
    try {
      const res = await API.get('/reminders/immediate');
      setImmediateReminders(res.data.data);
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      const res = await API.get('/reminders/upcoming');
      setUpcomingReminders(res.data.data);
      setShowReminders(true);
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
    }
  };

  const dismissReminder = async (todoId) => {
    try {
      await API.post(`/reminders/${todoId}/dismiss`);
      setImmediateReminders(prev => prev.filter(todo => todo._id !== todoId));
      setUpcomingReminders(prev => prev.filter(reminder => reminder.id !== todoId));
    } catch (error) {
      console.error('Error dismissing reminder:', error);
    }
  };

  // ADD THESE SHARING FUNCTIONS
  const handleShareTodo = async (todo) => {
    if (!shareEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    try {
      await API.post(`/sharing/${todo._id}/share`, {
        email: shareEmail,
        permission: sharePermission
      });
      
      setShowShareModal(false);
      setShareEmail('');
      setSharePermission('view');
      setSelectedTodo(null);
      
      // Refresh todos
      fetchTodos();
      fetchSharedTodos();
      
      alert(`Todo shared successfully with ${shareEmail}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Error sharing todo');
    }
  };

  const openShareModal = (todo) => {
    setSelectedTodo(todo);
    setShowShareModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a todo title');
      return;
    }

    try {
      setError('');
      
      const processedData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const res = await API.post('/todos', processedData);
      setTodos([res.data.data, ...todos]);
      
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general',
        tags: '',
        dueDate: '',
        reminder: ''
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create todo');
      console.error('Create todo error:', error);
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const res = await API.put(`/todos/${id}`, updates);
      setTodos(todos.map(todo => 
        todo._id === id ? res.data.data : todo
      ));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update todo');
      console.error('Update todo error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this todo?')) {
      try {
        await API.delete(`/todos/${id}`);
        setTodos(todos.filter(todo => todo._id !== id));
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to delete todo');
        console.error('Delete todo error:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Filter todos based on active tab
  const getTodosToDisplay = () => {
    if (activeTab === 'shared') {
      return sharedTodos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = filterCategory === 'all' || todo.category === filterCategory;
        const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'completed' && todo.completed) ||
                             (filterStatus === 'active' && !todo.completed);

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
      });
    } else {
      return todos.filter(todo => {
        const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             todo.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = filterCategory === 'all' || todo.category === filterCategory;
        const matchesPriority = filterPriority === 'all' || todo.priority === filterPriority;
        const matchesStatus = filterStatus === 'all' || 
                             (filterStatus === 'completed' && todo.completed) ||
                             (filterStatus === 'active' && !todo.completed);

        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
      });
    }
  };

  const filteredTodos = getTodosToDisplay();

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTimeUntil = (minutes) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours !== 1 ? 's' : ''}${remainingMinutes > 0 ? ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}` : ''}`;
    }
  };

  const completedTodos = todos.filter(todo => todo.completed).length;
  const totalTodos = todos.length;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Loading your todos...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Theme Toggle Button */}
      <button 
        className="theme-toggle"
        onClick={toggleDarkMode}
        title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>

      <div className="header">
        <div className="user-info">
          <div className="user-avatar">
            {getInitials(user.name)}
          </div>
          <div className="user-details">
            <h1>Welcome, {user.name}!</h1>
            <p>
              {totalTodos === 0 ? 'No todos yet' : 
               `You have ${totalTodos} todos (${completedTodos} completed)`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Reminders Button */}
          <button 
            className="reminders-btn"
            onClick={fetchUpcomingReminders}
            title="View upcoming reminders"
          >
            🔔
            {upcomingReminders.length > 0 && (
              <span className="reminder-badge">{upcomingReminders.length}</span>
            )}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Immediate Reminders Notification */}
      {immediateReminders.length > 0 && (
        <div className="reminder-notification">
          <div className="reminder-header">
            <span>⏰ Upcoming Reminders</span>
            <button 
              onClick={() => setImmediateReminders([])}
              className="reminder-dismiss-all"
            >
              Dismiss All
            </button>
          </div>
          {immediateReminders.map(todo => (
            <div key={todo._id} className="reminder-item">
              <div className="reminder-content">
                <strong>{todo.title}</strong>
                {todo.dueDate && (
                  <span>Due: {formatTimeUntil(Math.floor((new Date(todo.dueDate) - new Date()) / 60000))}</span>
                )}
                {todo.reminder && (
                  <span>Reminder: {formatTimeUntil(Math.floor((new Date(todo.reminder) - new Date()) / 60000))}</span>
                )}
              </div>
              <button 
                onClick={() => dismissReminder(todo._id)}
                className="reminder-dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="error-message" style={{ margin: '0 20px 20px 20px' }}>
          {error}
          <button 
            onClick={() => setError('')}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* ADD THIS TAB SECTION - PUT IT RIGHT AFTER THE ERROR MESSAGE */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'my-todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-todos')}
        >
          My Todos ({todos.filter(t => t.user._id === user.id).length})
        </button>
        <button
          className={`tab ${activeTab === 'shared' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('shared');
            fetchSharedTodos();
          }}
        >
          Shared With Me ({sharedTodos.length})
        </button>
      </div>

      {/* Todo Form - Only show for "My Todos" tab */}
      {activeTab === 'my-todos' && (
        <form className="todo-form" onSubmit={handleSubmit}>
          <h2 style={{ marginBottom: '20px' }}>Add New Todo</h2>
          
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <textarea
              className="form-input"
              placeholder="Add a description (optional)"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ resize: 'vertical' }}
            />
          </div>
          
          <div className="form-row">
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Priority
              </label>
              <select
                className="form-input"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Category
              </label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="shopping">Shopping</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Tags
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="work, urgent, project (comma separated)"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Due Date
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              />
            </div>
          </div>

          <div className="form-row">
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Set Reminder
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={formData.reminder}
                onChange={(e) => setFormData({...formData, reminder: e.target.value})}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Set reminders for important deadlines
              </small>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Add Todo
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setFormData({
                title: '',
                description: '',
                priority: 'medium',
                category: 'general',
                tags: '',
                dueDate: '',
                reminder: ''
              })}
            >
              Clear
            </button>
          </div>
        </form>
      )}

      {/* Search and Filter Section - Show for both tabs */}
      <div className="search-filters">
        <h3>Search & Filter</h3>
        
        <div className="form-group">
          <input
            type="text"
            className="form-input"
            placeholder={`Search ${activeTab === 'my-todos' ? 'my' : 'shared'} todos...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Category
            </label>
            <select
              className="form-input"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="general">General</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Priority
            </label>
            <select
              className="form-input"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Status
            </label>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('all');
              setFilterPriority('all');
              setFilterStatus('all');
            }}
            style={{ padding: '8px 20px', width: 'auto' }}
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div style={{ 
        marginBottom: '15px', 
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        Showing {filteredTodos.length} {activeTab === 'my-todos' ? 'of your' : 'shared'} todos
        {searchTerm && ` for "${searchTerm}"`}
        {filterCategory !== 'all' && ` in ${filterCategory}`}
        {filterPriority !== 'all' && ` with ${filterPriority} priority`}
        {filterStatus !== 'all' && ` that are ${filterStatus}`}
      </div>

      {/* Todo List */}
      <div className="todo-list">
        {filteredTodos.length === 0 ? (
          <div className="empty-state">
            <h3>No {activeTab === 'my-todos' ? 'todos' : 'shared todos'} found!</h3>
            <p>
              {activeTab === 'my-todos' 
                ? (todos.length === 0 
                    ? 'Start by adding a new todo above.' 
                    : 'Try adjusting your search or filters.')
                : 'No one has shared any todos with you yet.'}
            </p>
          </div>
        ) : (
          filteredTodos.map(todo => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onShare={openShareModal} // PASS THE SHARE FUNCTION
              currentUserId={user.id} // PASS CURRENT USER ID
            />
          ))
        )}
      </div>

      {/* ADD THIS SHARE MODAL - PUT IT WITH OTHER MODALS */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Share Todo</h3>
              <button onClick={() => setShowShareModal(false)}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                Share "<strong>{selectedTodo?.title}</strong>" with another user
              </p>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  User Email
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="Enter user's email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Permission
                </label>
                <select
                  className="form-input"
                  value={sharePermission}
                  onChange={(e) => setSharePermission(e.target.value)}
                >
                  <option value="view">Can View</option>
                  <option value="edit">Can Edit</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleShareTodo(selectedTodo)}
                >
                  Share Todo
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowShareModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Reminders Modal */}
      {showReminders && (
        <div className="modal-overlay" onClick={() => setShowReminders(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📅 Upcoming Reminders</h3>
              <button onClick={() => setShowReminders(false)}>×</button>
            </div>
            <div className="reminders-list">
              {upcomingReminders.length === 0 ? (
                <p className="no-reminders">No upcoming reminders</p>
              ) : (
                upcomingReminders.map(reminder => (
                  <div key={reminder.id} className="reminder-modal-item">
                    <div className="reminder-modal-content">
                      <h4>{reminder.title}</h4>
                      <div className="reminder-details">
                        {reminder.dueDate && (
                          <span>Due: {new Date(reminder.dueDate).toLocaleString()} ({formatTimeUntil(reminder.timeUntilDue)})</span>
                        )}
                        {reminder.reminder && (
                          <span>Reminder: {new Date(reminder.reminder).toLocaleString()} ({formatTimeUntil(reminder.timeUntilReminder)})</span>
                        )}
                        <span className={`priority-${reminder.priority}`}>{reminder.priority} priority</span>
                        <span className={`category-${reminder.category}`}>{reminder.category}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => dismissReminder(reminder.id)}
                      className="reminder-dismiss"
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;