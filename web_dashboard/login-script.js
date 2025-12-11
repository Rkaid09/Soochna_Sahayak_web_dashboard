// Wait for everything to load before initializing
window.addEventListener('load', function() {
    console.log('Page loaded, initializing authentication...');
    
    const supabaseUrl = 'https://oxhiauhjqvrcwyzevktu.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94aGlhdWhqcXZyY3d5emV2a3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODMwMzYsImV4cCI6MjA3MTI1OTAzNn0.Oci6TcmW0lEIjm3n6zcAvbecDJ3crmyW_-y8KbABSCc';
    
    // Check if Supabase loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase CDN failed to load');
        showMessage('Authentication system unavailable. Please refresh the page.', 'error');
        return;
    }
    
    console.log('Supabase CDN loaded successfully');
    
    // Initialize Supabase client
    const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    
    // Show message function
    function showMessage(message, type = 'error') {
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message show`;
        messageDiv.textContent = message;

        const form = document.getElementById('loginForm');
        form.parentNode.insertBefore(messageDiv, form);

        setTimeout(() => {
            messageDiv.classList.remove('show');
            setTimeout(() => messageDiv.remove(), 300);
        }, 5000);
    }

    // Handle login form submission
    async function handleLogin(event) {
        event.preventDefault();
        console.log('Login form submitted');
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('.login-btn');
        
        if (!email || !password) {
            showMessage('Please enter both email and password.', 'error');
            return;
        }

        loginBtn.classList.add('loading');
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        
        try {
            console.log('Attempting to authenticate with Supabase...');
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('Authentication error:', error);
                showMessage(error.message, 'error');
                resetLoginButton(loginBtn);
                return;
            }

            if (data.session && data.user) {
                console.log('Authentication successful');
                localStorage.setItem('supabase_session', JSON.stringify(data.session));
                
                const userData = {
                    id: data.user.id,
                    email: data.user.email,
                    name: data.user.user_metadata?.full_name || data.user.email.split('@')[0],
                    designation: data.user.user_metadata?.designation || 'Officer',
                    station: data.user.user_metadata?.station || 'main',
                    loginTime: new Date().toISOString(),
                    sessionId: generateSessionId(),
                    accessToken: data.session.access_token
                };

                localStorage.setItem('soochna_sahayak_session', JSON.stringify(userData));
                showMessage('Login successful! Redirecting to dashboard...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (err) {
            console.error('Login error:', err);
            showMessage('An unexpected error occurred. Please try again.', 'error');
            resetLoginButton(loginBtn);
        }
    }

    // Reset login button
    function resetLoginButton(button) {
        button.classList.remove('loading');
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
    }

    // Generate session ID
    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

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

    // Make togglePassword available globally
    window.togglePassword = togglePassword;

    // Add form submit handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add forgot password functionality
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('Password reset functionality will be available soon. Please contact your administrator.', 'error');
        });
    }
});
