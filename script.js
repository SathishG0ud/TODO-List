// Authentication and Todo App JavaScript

class TodoApp {
    constructor() {
        this.currentUser = null;
        this.todos = [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // Authentication events
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });

        document.getElementById('showLogin').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.handleLogout();
        });

        // Todo app events
        document.getElementById('todoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTodo();
        });

        // Filter events
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setFilter(btn.dataset.filter);
            });
        });

        // Search event
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTodos(e.target.value);
        });
    }

    // Authentication Methods
    showRegisterForm() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('register-form').classList.add('active');
    }

    showLoginForm() {
        document.getElementById('register-form').classList.remove('active');
        document.getElementById('login-form').classList.add('active');
    }

    handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem('todoUsers') || '[]');
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showApp();
            this.showAlert('Welcome back!', 'success');
        } else {
            this.showAlert('Invalid username or password', 'error');
        }
    }

    handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validation
        if (password !== confirmPassword) {
            this.showAlert('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            this.showAlert('Password must be at least 6 characters', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('todoUsers') || '[]');
        
        if (users.find(u => u.username === username)) {
            this.showAlert('Username already exists', 'error');
            return;
        }

        if (users.find(u => u.email === email)) {
            this.showAlert('Email already registered', 'error');
            return;
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('todoUsers', JSON.stringify(users));

        this.showAlert('Account created successfully!', 'success');
        this.showLoginForm();
        
        // Clear form
        document.getElementById('registerForm').reset();
    }

    handleLogout() {
        this.currentUser = null;
        this.todos = [];
        localStorage.removeItem('currentUser');
        this.showAuth();
        this.showAlert('Logged out successfully', 'info');
    }

    checkAuthStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showApp();
        } else {
            this.showAuth();
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
        
        // Clear forms
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
        
        document.getElementById('currentUser').textContent = this.currentUser.username;
        this.loadTodos();
        this.renderTodos();
        this.updateStats();
    }

    // Todo Methods
    loadTodos() {
        const userTodos = localStorage.getItem(`todos_${this.currentUser.id}`);
        this.todos = userTodos ? JSON.parse(userTodos) : [];
    }

    saveTodos() {
        localStorage.setItem(`todos_${this.currentUser.id}`, JSON.stringify(this.todos));
    }

    addTodo() {
        const text = document.getElementById('todoInput').value.trim();
        const priority = document.getElementById('prioritySelect').value;

        if (!text) {
            this.showAlert('Please enter a task', 'error');
            return;
        }

        const todo = {
            id: Date.now(),
            text,
            priority,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.unshift(todo);
        this.saveTodos();
        this.renderTodos();
        this.updateStats();

        // Clear form
        document.getElementById('todoInput').value = '';
        document.getElementById('prioritySelect').value = 'medium';

        this.showAlert('Task added successfully!', 'success');
    }

    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            
            const message = todo.completed ? 'Task completed!' : 'Task marked as pending';
            this.showAlert(message, 'success');
        }
    }

    editTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            const newText = prompt('Edit task:', todo.text);
            if (newText && newText.trim()) {
                todo.text = newText.trim();
                this.saveTodos();
                this.renderTodos();
                this.showAlert('Task updated!', 'success');
            }
        }
    }

    deleteTodo(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.todos = this.todos.filter(t => t.id !== id);
            this.saveTodos();
            this.renderTodos();
            this.updateStats();
            this.showAlert('Task deleted!', 'info');
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTodos();
    }

    searchTodos(query) {
        this.renderTodos(query);
    }

    getFilteredTodos(searchQuery = '') {
        let filtered = this.todos;

        // Apply status filter
        if (this.currentFilter === 'completed') {
            filtered = filtered.filter(todo => todo.completed);
        } else if (this.currentFilter === 'pending') {
            filtered = filtered.filter(todo => !todo.completed);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(todo => 
                todo.text.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    }

    renderTodos(searchQuery = '') {
        const todoList = document.getElementById('todoList');
        const emptyState = document.getElementById('emptyState');
        const filteredTodos = this.getFilteredTodos(searchQuery);

        if (filteredTodos.length === 0) {
            todoList.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        todoList.innerHTML = filteredTodos.map(todo => `
            <div class="todo-item ${todo.completed ? 'completed' : ''}">
                <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" 
                     onclick="app.toggleTodo(${todo.id})">
                    ${todo.completed ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="todo-content">
                    <div class="todo-text">${this.escapeHtml(todo.text)}</div>
                    <div class="todo-meta">
                        <span class="priority-badge priority-${todo.priority}">
                            ${todo.priority} priority
                        </span>
                        <span>${this.formatDate(todo.createdAt)}</span>
                    </div>
                </div>
                <div class="todo-actions">
                    <button class="action-btn edit-btn" onclick="app.editTodo(${todo.id})" 
                            title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteTodo(${todo.id})" 
                            title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        alertContainer.appendChild(alert);

        // Auto remove after 3 seconds
        setTimeout(() => {
            alert.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const app = new TodoApp();