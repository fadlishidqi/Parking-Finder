class Auth {
    constructor() {
        this.validPin = '123456';
        this.maxAttempts = 3;
        this.attempts = 0;
        this.initializeAuth();
    }

    initializeAuth() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            
            const pinInput = document.getElementById('pin');
            if (pinInput) {
                pinInput.addEventListener('input', (e) => {
                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                });
            }
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        this.checkAuthStatus();
    }

    handleLogin(e) {
        e.preventDefault();
        const pin = document.getElementById('pin').value;
        const errorMessage = document.getElementById('errorMessage');

        if (!pin) {
            this.showError('Please enter your PIN');
            return;
        }

        if (this.attempts >= this.maxAttempts) {
            this.showError('Too many failed attempts. Please try again later.');
            return;
        }

        if (pin === this.validPin) {
            this.attempts = 0;
            
            errorMessage.classList.add('hidden');
            
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('loginTime', new Date().toISOString());
            
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

    showError(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
        
        document.getElementById('pin').value = '';
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {

            localStorage.removeItem('parkingData');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('loginTime');
            sessionStorage.clear();
            
            this.attempts = 0;
            
            window.location.href = 'login.html';
        }
    }

    checkAuthStatus() {
        const currentPage = window.location.pathname;
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

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
}

document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});