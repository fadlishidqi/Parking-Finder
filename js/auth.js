class Auth {
    constructor() {
        this.maxAttempts = 3;
        this.attempts = 0;
        this.logoutHandler = this.handleLogout.bind(this);
        this.initializeAuth();
    }

    initializeAuth() {
        // Toggle between login and register forms
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (showRegister) {
            showRegister.addEventListener('click', () => {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
                document.getElementById('welcomeText').textContent = 'Welcome!';
                document.getElementById('welcomeDescription').textContent = 'Create an account to access the parking management system';
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', () => {
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
                document.getElementById('welcomeText').textContent = 'Welcome Back!';
                document.getElementById('welcomeDescription').textContent = 'Enter your PIN to access the parking management system';
            });
        }

        // Login form handler
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form handler
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // PIN input validation
        const pinInputs = document.querySelectorAll('input[type="password"]');
        pinInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '');
                if (e.target.value.length > 6) {
                    e.target.value = e.target.value.slice(0, 6);
                }
            });
        });

        // Logout handler - support both button and custom event
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logoutHandler);
        }
        window.addEventListener('logout', this.logoutHandler);

        this.checkAuthStatus();
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const pin = document.getElementById('regPin').value;
        const pinConfirm = document.getElementById('regPinConfirm').value;

        // Validation
        if (!name || !pin || !pinConfirm) {
            this.showError('All fields are required');
            return;
        }

        if (pin.length !== 6) {
            this.showError('PIN must be 6 digits');
            return;
        }

        if (pin !== pinConfirm) {
            this.showError('PINs do not match');
            return;
        }

        // Get existing users or initialize empty array
        const users = JSON.parse(localStorage.getItem('users') || '[]');

        // Check if PIN already exists
        if (users.some(user => user.pin === pin)) {
            this.showError('This PIN is already registered');
            return;
        }

        // Add new user
        users.push({
            name: name,
            pin: pin
        });

        // Save updated users array
        localStorage.setItem('users', JSON.stringify(users));

        // Show success message
        this.showSuccess('Registration successful! Please login.');

        // Reset form and switch to login
        document.getElementById('registerForm').reset();
        setTimeout(() => {
            document.getElementById('showLogin').click();
        }, 1500);
    }

    handleLogin(e) {
        e.preventDefault();
        const pin = document.getElementById('pin').value;

        if (!pin) {
            this.showError('Please enter your PIN');
            return;
        }

        if (this.attempts >= this.maxAttempts) {
            this.showError('Too many failed attempts. Please try again later.');
            return;
        }

        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.pin === pin);

        if (user) {
            this.attempts = 0;
            this.hideError();
            
            // Store auth state
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('loginTime', new Date().toISOString());
            
            // Redirect to home
            window.location.href = 'home.html';
        } else {
            this.attempts++;
            const remainingAttempts = this.maxAttempts - this.attempts;
            
            if (remainingAttempts > 0) {
                this.showError(`Invalid PIN. ${remainingAttempts} attempts remaining.`);
            } else {
                this.showError('Account locked. Please try again later.');
            }
        }
    }

    handleLogout() {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('loginTime');
        this.attempts = 0;
        window.location.href = 'login.html';
    }

    static logout() {
        window.dispatchEvent(new Event('logout'));
    }

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            errorMessage.classList.remove('bg-green-100', 'border-green-500', 'text-green-700');
            errorMessage.classList.add('bg-red-100', 'border-red-500', 'text-red-700');
        }
    }

    showSuccess(message) {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            errorMessage.classList.remove('bg-red-100', 'border-red-500', 'text-red-700');
            errorMessage.classList.add('bg-green-100', 'border-green-500', 'text-green-700');
        }
    }

    hideError() {
        const errorMessage = document.getElementById('errorMessage');
        if (errorMessage) {
            errorMessage.classList.add('hidden');
        }
    }

    checkAuthStatus() {
        const currentPage = window.location.pathname;
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

        // Redirect logic
        if (currentPage.includes('login.html')) {
            if (isAuthenticated) {
                window.location.href = 'home.html';
            }
        } else {
            if (!isAuthenticated) {
                window.location.href = 'login.html';
            }
        }
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});