import React, { useState } from 'react';
import '../App.css';

const TodoItem = ({ todo, onUpdate, onDelete, onShare, currentUserId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority,
    category: todo.category,
    tags: todo.tags?.join(', ') || '',
    dueDate: todo.dueDate ? todo.dueDate.split('T')[0] : '',
    reminder: todo.reminder ? todo.reminder.split('T')[0] : ''
  });

  const handleSave = () => {
    if (editData.title.trim()) {
      const processedData = {
        ...editData,
        tags: editData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      onUpdate(todo._id, processedData);
      setIsEditing(false);
    }
  };

  const handleComplete = () => {
    onUpdate(todo._id, { completed: !todo.completed });
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-medium';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'work': return { background: '#dbeafe', color: '#1e40af' };
      case 'personal': return { background: '#f3e8ff', color: '#7e22ce' };
      case 'shopping': return { background: '#dcfce7', color: '#166534' };
      case 'health': return { background: '#fef3c7', color: '#92400e' };
      case 'education': return { background: '#ffe4e6', color: '#be123c' };
      default: return { background: '#f3f4f6', color: '#374151' };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString();
  };

  const categoryStyle = getCategoryColor(todo.category);

  // Check if current user has edit permission
  const hasEditPermission = todo.user._id === currentUserId || 
    (todo.sharedWith && todo.sharedWith.some(share => 
      share.user._id === currentUserId && share.permission === 'edit'
    ));

  // Check if current user is the owner
  const isOwner = todo.user._id === currentUserId;

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.isShared ? 'shared-todo' : ''}`}>
      {isEditing ? (
        <div className="edit-form">
          <input
            type="text"
            className="form-input"
            value={editData.title}
            onChange={(e) => setEditData({...editData, title: e.target.value})}
            placeholder="Todo title"
          />
          <textarea
            className="form-input"
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            placeholder="Description (optional)"
            rows="3"
            style={{ margin: '10px 0', resize: 'vertical' }}
          />
          <div className="form-row">
            <select
              className="form-input"
              value={editData.priority}
              onChange={(e) => setEditData({...editData, priority: e.target.value})}
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
            <select
              className="form-input"
              value={editData.category}
              onChange={(e) => setEditData({...editData, category: e.target.value})}
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="shopping">Shopping</option>
              <option value="health">Health</option>
              <option value="education">Education</option>
              <option value="general">General</option>
            </select>
          </div>
          <input
            type="text"
            className="form-input"
            value={editData.tags}
            onChange={(e) => setEditData({...editData, tags: e.target.value})}
            placeholder="Tags (comma separated)"
            style={{ marginBottom: '10px' }}
          />
          <div className="form-row">
            <input
              type="date"
              className="form-input"
              value={editData.dueDate}
              onChange={(e) => setEditData({...editData, dueDate: e.target.value})}
              style={{ marginBottom: '10px' }}
            />
            <input
              type="date"
              className="form-input"
              value={editData.reminder}
              onChange={(e) => setEditData({...editData, reminder: e.target.value})}
              style={{ marginBottom: '10px' }}
            />
          </div>
          <div className="edit-actions">
            <button className="btn btn-success" onClick={handleSave}>
              Save
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="todo-header">
            <div style={{ flex: 1 }}>
              <h3 className="todo-title">{todo.title}</h3>
              {todo.description && (
                <p className="todo-description">{todo.description}</p>
              )}
            </div>
            <div className="todo-actions">
              {/* Share Button - Only show for todo owner */}
              {isOwner && (
                <button 
                  className="icon-btn btn-share"
                  onClick={() => onShare(todo)}
                  title="Share todo with other users"
                >
                  🔗
                </button>
              )}
              
              {/* Complete/Incomplete Button - Show for all with access */}
              <button 
                className="icon-btn btn-complete"
                onClick={handleComplete}
                title={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                {todo.completed ? '↶' : '✓'}
              </button>
              
              {/* Edit Button - Only show for owners or users with edit permission */}
              {hasEditPermission && (
                <button 
                  className="icon-btn btn-edit"
                  onClick={() => setIsEditing(true)}
                  title="Edit todo"
                >
                  ✏️
                </button>
              )}
              
              {/* Delete Button - Only show for owners */}
              {isOwner && (
                <button 
                  className="icon-btn btn-delete"
                  onClick={() => onDelete(todo._id)}
                  title="Delete todo"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
          
          {/* Sharing Indicators */}
          <div style={{ marginBottom: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {todo.isShared && (
              <span style={{ 
                color: '#8b5cf6',
                fontSize: '0.8rem',
                background: 'rgba(139, 92, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                🔗 Shared
              </span>
            )}
            
            {todo.createdBy && todo.createdBy._id !== currentUserId && (
              <span style={{ 
                color: '#10b981',
                fontSize: '0.8rem',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                Shared by {todo.createdBy.name}
              </span>
            )}

            {/* Show permission level for shared todos */}
            {todo.sharedWith && todo.sharedWith.some(share => share.user._id === currentUserId) && (
              <span style={{ 
                color: '#f59e0b',
                fontSize: '0.8rem',
                background: 'rgba(245, 158, 11, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                {todo.sharedWith.find(share => share.user._id === currentUserId)?.permission === 'edit' 
                  ? 'Can Edit' 
                  : 'View Only'}
              </span>
            )}
          </div>
          
          <div className="todo-meta">
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`todo-priority ${getPriorityClass(todo.priority)}`}>
                {todo.priority} priority
              </span>
              <span style={{ 
                background: categoryStyle.background,
                color: categoryStyle.color,
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '500',
                border: `1px solid ${categoryStyle.color}20`
              }}>
                {todo.category}
              </span>
              {todo.tags && todo.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {todo.tags.map((tag, index) => (
                    <span key={index} style={{
                      background: 'var(--input-bg)',
                      color: 'var(--text-secondary)',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      border: '1px solid var(--input-border)'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {todo.dueDate && (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  📅 {formatDate(todo.dueDate)}
                </span>
              )}
              {todo.reminder && (
                <span style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
                  ⏰ {formatDateTime(todo.reminder)}
                </span>
              )}
              <span style={{ 
                color: todo.completed ? '#10b981' : 'var(--text-secondary)', 
                fontSize: '0.9rem',
                fontWeight: '500'
              }}>
                {todo.completed ? '✅ Completed' : '🟡 Active'}
              </span>
            </div>
          </div>

          {/* Show owner info for shared todos */}
          {todo.user && todo.user._id !== currentUserId && (
            <div style={{ 
              marginTop: '10px',
              padding: '8px',
              background: 'rgba(139, 92, 246, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                👤 Owned by: {todo.user.name} ({todo.user.email})
              </small>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TodoItem;