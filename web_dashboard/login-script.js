// Supabase configuration - Replace with your actual values
const supabaseUrl = 'https://oxhiauhjqvrcwyzevktu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94aGlhdWhqcXZyY3d5emV2a3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2ODMwMzYsImV4cCI6MjA3MTI1OTAzNn0.Oci6TcmW0lEIjm3n6zcAvbecDJ3crmyW_-y8KbABSCc';

// Initialize Supabase client
const supabase = supabase.createClient(supabaseUrl, supabaseAnonKey);

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

// Save Supabase session
function saveSession(session) {
  localStorage.setItem('supabase_session', JSON.stringify(session));
}

// Get stored session
function getStoredSession() {
  const session = localStorage.getItem('supabase_session');
  return session ? JSON.parse(session) : null;
}

// Clear session
function clearSession() {
  localStorage.removeItem('supabase_session');
  localStorage.removeItem('soochna_sahayak_session');
}

// Check if user is already logged in
function checkExistingSession() {
  const session = getStoredSession();
  if (session && session.access_token) {
    // Check if session is still valid (not expired)
    const now = Date.now() / 1000;
    if (session.expires_at && session.expires_at > now) {
      showMessage('You are already logged in. Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
      return true;
    } else {
      // Clear expired session
      clearSession();
    }
  }
  return false;
}

// Handle login form submission with Supabase
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const loginBtn = document.querySelector('.login-btn');
  
  if (!email || !password) {
    showMessage('Please enter both email and password.', 'error');
    return;
  }
  
  // Add loading state
  loginBtn.classList.add('loading');
  loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
  
  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      showMessage(error.message, 'error');
      resetLoginButton(loginBtn);
      return;
    }
    
    if (data.session && data.user) {
      // Save session data
      saveSession(data.session);
      
      // Create user session data for compatibility with existing dashboard
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email.split('@')[0],
        designation: data.user.user_metadata?.designation || 'Officer',
        station: data.user.user_metadata?.station || 'main',
        stationName: data.user.user_metadata?.station_name || 'Main Station',
        phone: data.user.user_metadata?.phone || '',
        loginTime: new Date().toISOString(),
        sessionId: generateSessionId(),
        accessToken: data.session.access_token,
        profileImage: data.user.user_metadata?.avatar_url || `https://via.placeholder.com/150/3498db/white?text=${data.user.email[0].toUpperCase()}`
      };
      
      // Store user data for dashboard compatibility
      localStorage.setItem('soochna_sahayak_session', JSON.stringify(userData));
      
      showMessage('Login successful! Redirecting to dashboard...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      showMessage('Login failed. Please try again.', 'error');
      resetLoginButton(loginBtn);
    }
    
  } catch (err) {
    console.error('Login error:', err);
    showMessage('An unexpected error occurred. Please try again.', 'error');
    resetLoginButton(loginBtn);
  }
}

// Reset login button to original state
function resetLoginButton(button) {
  button.classList.remove('loading');
  button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login to Dashboard';
}

// Generate random session ID
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is already logged in
  if (checkExistingSession()) {
    return;
  }
  
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
      showMessage('Password reset functionality will be available soon. For now, please contact your administrator.', 'error');
    });
  }
});
