// Mock user database with Indian police officers
const mockUsers = {
    'rajesh.kumar': {
        password: 'demo123',
        name: 'Rajesh Kumar',
        designation: 'Inspector',
        employeeId: 'CP001',
        station: 'cp',
        stationName: 'Connaught Place Police Station',
        phone: '+91-9876543201',
        email: 'rajesh.kumar@delhipolice.gov.in',
        joiningDate: '2018-03-15',
        address: 'A-45, Police Quarters, Connaught Place, New Delhi - 110001',
        profileImage: 'https://via.placeholder.com/150/3498db/white?text=RK',
        lastLogin: '2024-01-15 14:30:00'
    },
    'sunita.devi': {
        password: 'demo123',
        name: 'Sunita Devi',
        designation: 'Station Inspector',
        employeeId: 'KB007',
        station: 'kb',
        stationName: 'Karol Bagh Police Station',
        phone: '+91-9876543202',
        email: 'sunita.devi@delhipolice.gov.in',
        joiningDate: '2016-07-22',
        address: 'B-23, Police Colony, Karol Bagh, New Delhi - 110005',
        profileImage: 'https://via.placeholder.com/150/e74c3c/white?text=SD',
        lastLogin: '2024-01-15 09:15:00'
    },
    'vikram.yadav': {
        password: 'demo123',
        name: 'Vikram Yadav',
        designation: 'Station Inspector',
        employeeId: 'RH012',
        station: 'rh',
        stationName: 'Rohini Police Station',
        phone: '+91-9876543203',
        email: 'vikram.yadav@delhipolice.gov.in',
        joiningDate: '2017-11-08',
        address: 'C-78, Sector 14, Rohini, New Delhi - 110085',
        profileImage: 'https://via.placeholder.com/150/27ae60/white?text=VY',
        lastLogin: '2024-01-15 16:45:00'
    },
    'amit.kumar': {
        password: 'demo123',
        name: 'Amit Kumar',
        designation: 'Sub-Inspector',
        employeeId: 'CP002',
        station: 'cp',
        stationName: 'Connaught Place Police Station',
        phone: '+91-9876543204',
        email: 'amit.kumar@delhipolice.gov.in',
        joiningDate: '2019-05-12',
        address: 'D-12, Police Quarters, Connaught Place, New Delhi - 110001',
        profileImage: 'https://via.placeholder.com/150/f39c12/white?text=AK',
        lastLogin: '2024-01-15 11:20:00'
    },
    'pooja.sharma': {
        password: 'demo123',
        name: 'Pooja Sharma',
        designation: 'Sub-Inspector',
        employeeId: 'DL018',
        station: 'dl',
        stationName: 'Delhi Gate Police Station',
        phone: '+91-9876543205',
        email: 'pooja.sharma@delhipolice.gov.in',
        joiningDate: '2020-01-18',
        address: 'E-67, Old Delhi, Delhi Gate - 110006',
        profileImage: 'https://via.placeholder.com/150/9b59b6/white?text=PS',
        lastLogin: '2024-01-15 20:30:00'
    }
};

// Password toggle functionality
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('passwordToggleIcon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Show message function
function showMessage(message, type = 'error') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.error-message, .success-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message show`;
    messageDiv.textContent = message;
    
    // Insert before the form
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(messageDiv, form);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.classList.remove('show');
        setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const station = document.getElementById('station').value;
    const loginBtn = document.querySelector('.login-btn');
    
    // Add loading state
    loginBtn.classList.add('loading');
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    
    // Simulate API call delay
    setTimeout(() => {
        // Validate credentials
        const user = mockUsers[username];
        
        if (!user) {
            showMessage('Invalid username. Please check your credentials.', 'error');
            resetLoginButton(loginBtn);
            return;
        }
        
        if (user.password !== password) {
            showMessage('Incorrect password. Please try again.', 'error');
            resetLoginButton(loginBtn);
            return;
        }
        
        if (user.station !== station) {
            showMessage('Selected station does not match your assigned station.', 'error');
            resetLoginButton(loginBtn);
            return;
        }
        
        // Success - store user session and redirect
        storeUserSession(user);
        showMessage('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    }, 2000); // 2 second delay to simulate server response
}

// Reset login button to original state
function resetLoginButton(button) {
    button.classList.remove('loading');
    button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
}

// Store user session in localStorage
function storeUserSession(user) {
    const sessionData = {
        ...user,
        loginTime: new Date().toISOString(),
        sessionId: generateSessionId()
    };
    
    localStorage.setItem('soochna_sahayak_session', JSON.stringify(sessionData));
}

// Generate random session ID
function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Auto-fill demo credentials functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for demo credentials
    const demoUsers = document.querySelectorAll('.demo-user');
    
    demoUsers.forEach((demoUser, index) => {
        demoUser.style.cursor = 'pointer';
        demoUser.addEventListener('click', function() {
            const usernames = ['rajesh.kumar', 'sunita.devi', 'vikram.yadav'];
            const stations = ['cp', 'kb', 'rh'];
            
            document.getElementById('username').value = usernames[index];
            document.getElementById('password').value = 'demo123';
            document.getElementById('station').value = stations[index];
            
            // Add visual feedback
            this.style.background = '#e8f5e8';
            setTimeout(() => {
                this.style.background = 'white';
            }, 500);
        });
    });
    
    // Check if user is already logged in
    const existingSession = localStorage.getItem('soochna_sahayak_session');
    if (existingSession) {
        try {
            const sessionData = JSON.parse(existingSession);
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            // If session is less than 24 hours old, redirect to dashboard
            if (hoursDiff < 24) {
                showMessage('You are already logged in. Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                return;
            } else {
                // Clear expired session
                localStorage.removeItem('soochna_sahayak_session');
            }
        } catch (e) {
            // Clear corrupted session data
            localStorage.removeItem('soochna_sahayak_session');
        }
    }
    
    // Add keyboard shortcut for demo login
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            // Auto-fill with first demo user
            document.getElementById('username').value = 'rajesh.kumar';
            document.getElementById('password').value = 'demo123';
            document.getElementById('station').value = 'cp';
            document.getElementById('loginForm').requestSubmit();
        }
    });
    
    // Add forgot password functionality
    document.querySelector('.forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        alert('For demo purposes, use any of the provided demo credentials.\n\nIn a real application, this would open a password reset form.');
    });
    
    // Add form validation styling
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
});

// Field validation
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    
    // Remove existing error styling
    field.style.borderColor = '';
    
    if (!value && field.hasAttribute('required')) {
        field.style.borderColor = '#e74c3c';
        return false;
    }
    
    // Specific validations
    if (field.type === 'text' && field.name === 'username') {
        if (value.length < 3) {
            field.style.borderColor = '#e74c3c';
            return false;
        }
    }
    
    if (field.type === 'password') {
        if (value.length < 6) {
            field.style.borderColor = '#e74c3c';
            return false;
        }
    }
    
    // Valid field
    field.style.borderColor = '#27ae60';
    return true;
}

// Clear field error styling
function clearFieldError(event) {
    const field = event.target;
    if (field.style.borderColor === 'rgb(231, 76, 60)') { // #e74c3c in rgb
        field.style.borderColor = '';
    }
}

// Export functions for testing
window.loginFunctions = {
    handleLogin,
    togglePassword,
    showMessage,
    storeUserSession,
    mockUsers
};
