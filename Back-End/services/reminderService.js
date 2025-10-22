const Todo = require('../models/Todo');

// Simple in-app reminder system (no email setup required)
class ReminderService {
  constructor() {
    this.reminderCheckInterval = null;
    this.init();
  }

  init() {
    // Check for due reminders every minute
    this.reminderCheckInterval = setInterval(() => {
      this.checkReminders();
    }, 60000);

    console.log('🔔 Reminder service started - checking every minute');
  }

  async checkReminders() {
    try {
      const now = new Date();
      const upcomingThreshold = new Date(now.getTime() + 30 * 60000); // 30 minutes from now

      const todosNeedingReminder = await Todo.find({
        $or: [
          { 
            dueDate: { 
              $lte: upcomingThreshold,
              $gte: now 
            },
            completed: false
          },
          {
            reminder: {
              $lte: upcomingThreshold,
              $gte: now
            },
            completed: false
          }
        ]
      }).populate('user');

      for (const todo of todosNeedingReminder) {
        await this.handleReminder(todo);
      }

      if (todosNeedingReminder.length > 0) {
        console.log(`⏰ Found ${todosNeedingReminder.length} todos needing reminders`);
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  async handleReminder(todo) {
    try {
      const now = new Date();
      const dueDate = new Date(todo.dueDate);
      const reminderTime = new Date(todo.reminder);
      
      let reminderMessage = '';
      let reminderType = '';

      // Check if it's a due date reminder
      if (todo.dueDate && dueDate <= new Date(now.getTime() + 30 * 60000) && dueDate >= now) {
        reminderType = 'due_date';
        const timeUntilDue = Math.floor((dueDate - now) / 60000); // minutes
        reminderMessage = `Due in ${timeUntilDue} minutes`;
      }

      // Check if it's a custom reminder
      if (todo.reminder && reminderTime <= new Date(now.getTime() + 30 * 60000) && reminderTime >= now) {
        reminderType = 'custom_reminder';
        const timeUntilReminder = Math.floor((reminderTime - now) / 60000); // minutes
        reminderMessage = `Reminder: ${timeUntilReminder} minutes until your todo`;
      }

      if (reminderMessage && !todo.remindersSent.includes(reminderType)) {
        // Store reminder in todo for frontend display
        await Todo.findByIdAndUpdate(todo._id, {
          $addToSet: { remindersSent: reminderType }
        });

        console.log(`🔔 Reminder for: "${todo.title}" - ${reminderMessage}`);
        
        // In a real app, you could send:
        // - Browser notifications
        // - Email (with nodemailer)
        // - Push notifications
        // - SMS alerts
      }
    } catch (error) {
      console.error('Error handling reminder:', error);
    }
  }

  // Manual reminder check (can be called from frontend)
  async manualReminderCheck(userId) {
    try {
      const todos = await Todo.find({
        user: userId,
        completed: false,
        $or: [
          { dueDate: { $exists: true } },
          { reminder: { $exists: true } }
        ]
      });

      const now = new Date();
      const upcomingTodos = todos.filter(todo => {
        const dueDate = new Date(todo.dueDate);
        const reminderTime = new Date(todo.reminder);
        return (
          (todo.dueDate && dueDate > now) ||
          (todo.reminder && reminderTime > now)
        );
      });

      return upcomingTodos;
    } catch (error) {
      console.error('Error in manual reminder check:', error);
      throw error;
    }
  }

  stop() {
    if (this.reminderCheckInterval) {
      clearInterval(this.reminderCheckInterval);
      console.log('🔔 Reminder service stopped');
    }
  }
}

module.exports = new ReminderService();