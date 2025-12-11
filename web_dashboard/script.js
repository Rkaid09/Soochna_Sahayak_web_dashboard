// Global variables
let currentPage = 'dashboard';
let selectedFiles = [];
let wavesurfer = null;
let currentUser = null;

// Session management functions
function checkUserSession() {
  const session = localStorage.getItem('soochna_sahayak_session');
  if (!session) {
    return false;
  }
  
  try {
    const sessionData = JSON.parse(session);
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    // If session is older than 24 hours, clear it
    if (hoursDiff > 24) {
      localStorage.removeItem('soochna_sahayak_session');
      localStorage.removeItem('supabase_session');
      return false;
    }
    
    // Set current user for dashboard personalization
    currentUser = sessionData;
    return true;
  } catch (e) {
    // Clear corrupted session data
    localStorage.removeItem('soochna_sahayak_session');
    localStorage.removeItem('supabase_session');
    return false;
  }
}

// Personalize dashboard UI with user info
function personalizeUI() {
  if (currentUser) {
    // Update user info in header
    const userInfoElement = document.querySelector('.user-info span');
    if (userInfoElement) {
      userInfoElement.textContent = currentUser.name || currentUser.email;
    }
    
    // Update welcome messages if they exist
    const welcomeElements = document.querySelectorAll('.welcome-user');
    welcomeElements.forEach(element => {
      element.textContent = `Welcome, ${currentUser.name}`;
    });
    
    // Update profile images if they exist
    const profileImages = document.querySelectorAll('.user-profile-image');
    profileImages.forEach(img => {
      img.src = currentUser.profileImage;
      img.alt = currentUser.name;
    });
    
    console.log('Current User:', {
      name: currentUser.name,
      email: currentUser.email,
      station: currentUser.stationName,
      designation: currentUser.designation
    });
  }
}

// Logout functionality
function logout() {
  // Clear all session data
  localStorage.removeItem('soochna_sahayak_session');
  localStorage.removeItem('supabase_session');
  
  // Sign out from Supabase (if supabase client is available)
  if (typeof supabase !== 'undefined') {
    supabase.auth.signOut();
  }
  
  // Redirect to login
  window.location.href = 'login.html';
}

// Show user profile modal
function showUserProfileModal() {
  if (!currentUser) return;
  
  const modalHTML = `
    <div class="modal" id="userProfileModal" style="display: block;">
      <div class="modal-content account-modal">
        <div class="modal-header">
          <h2><i class="fas fa-user"></i> User Profile</h2>
          <span class="close-modal" onclick="closeUserProfileModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div class="account-profile">
            <div class="profile-image">
              <img src="${currentUser.profileImage}" alt="${currentUser.name}" />
            </div>
            <div class="profile-info">
              <h3>${currentUser.name}</h3>
              <p><strong>Designation:</strong> ${currentUser.designation}</p>
              <p><strong>Station:</strong> ${currentUser.stationName}</p>
              <p><strong>Email:</strong> ${currentUser.email}</p>
            </div>
          </div>
          
          <div class="account-details">
            <div class="detail-section">
              <h4><i class="fas fa-info-circle"></i> Contact Information</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Phone</label>
                  <span>${currentUser.phone || 'Not provided'}</span>
                </div>
                <div class="detail-item">
                  <label>Email</label>
                  <span>${currentUser.email}</span>
                </div>
              </div>
            </div>
            
            <div class="detail-section">
              <h4><i class="fas fa-building"></i> Station Details</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <label>Station</label>
                  <span>${currentUser.stationName}</span>
                </div>
                <div class="detail-item">
                  <label>Designation</label>
                  <span>${currentUser.designation}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="account-actions">
            <button class="btn btn-secondary" onclick="closeUserProfileModal()">
              <i class="fas fa-times"></i> Close
            </button>
            <button class="btn btn-danger" onclick="confirmLogout()">
              <i class="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Close user profile modal
function closeUserProfileModal() {
  const modal = document.getElementById('userProfileModal');
  if (modal) {
    modal.remove();
  }
}

// Confirm logout
function confirmLogout() {
  if (confirm('Are you sure you want to logout?')) {
    logout();
  }
}

// API call functions (replace mock data with real API calls)
async function fetchDashboardData() {
  if (!currentUser || !currentUser.accessToken) {
    console.error('No access token available');
    return null;
  }

  try {
    // TODO: Replace with your actual backend URL
    const response = await fetch('YOUR_BACKEND_URL/api/dashboard', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

async function fetchCases() {
  if (!currentUser || !currentUser.accessToken) {
    console.error('No access token available');
    return [];
  }

  try {
    const response = await fetch('YOUR_BACKEND_URL/api/fir', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentUser.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cases');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching cases:', error);
    return [];
  }
}

// Navigation functionality
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');
  const pageTitle = document.getElementById('page-title');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetPage = this.dataset.page;

      // Update active navigation
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');

      // Update page visibility
      pages.forEach(page => page.classList.remove('active'));
      const targetPageElement = document.getElementById(targetPage + '-page');
      if (targetPageElement) {
        targetPageElement.classList.add('active');
      }

      // Update page title
      const titles = {
        'dashboard': 'Dashboard',
        'cases': 'FIR Cases',
        'transcriptions': 'Audio Transcriptions',
        'police-stations': 'Police Stations',
        'analytics': 'Analytics & Reports',
        'file-manager': 'File Manager',
        'audio-editor': 'Transcription Editor'
      };
      
      if (pageTitle) {
        pageTitle.textContent = titles[targetPage] || 'Dashboard';
      }
      
      currentPage = targetPage;

      // Load page-specific data
      loadPageData(targetPage);
    });
  });
}

// Load data based on current page
async function loadPageData(page) {
  switch(page) {
    case 'dashboard':
      await initializeDashboard();
      break;
    case 'cases':
      await initializeCases();
      break;
    // Add other cases as needed
    default:
      console.log(`Loading data for ${page}`);
  }
}

// Dashboard initialization
async function initializeDashboard() {
  // TODO: Fetch real data from your backend
  const dashboardData = await fetchDashboardData();
  
  if (dashboardData) {
    // Update dashboard with real data
    updateDashboardStats(dashboardData);
  } else {
    // Fallback to showing loading or error state
    console.log('Using fallback dashboard data');
  }
  
  // Initialize charts (you can update these with real data too)
  initializeMonthlyChart();
  initializeStatusChart();
}

// Update dashboard statistics
function updateDashboardStats(data) {
  // Update stat cards with real data
  const statCards = {
    'total-firs': data.totalFirs || 0,
    'pending-cases': data.pendingCases || 0,
    'closed-cases': data.closedCases || 0,
    'in-progress': data.inProgressCases || 0
  };

  Object.keys(statCards).forEach(key => {
    const element = document.querySelector(`[data-stat="${key}"] h3`);
    if (element) {
      element.textContent = statCards[key];
    }
  });
}

// Cases functionality
async function initializeCases() {
  const cases = await fetchCases();
  renderCases(cases);
  setupCaseFilters();
}

function renderCases(cases) {
  const casesGrid = document.getElementById('cases-grid');
  if (!casesGrid) return;
  
  casesGrid.innerHTML = '';
  
  if (cases.length === 0) {
    casesGrid.innerHTML = '<p>No cases found.</p>';
    return;
  }

  cases.forEach(caseItem => {
    const caseCard = document.createElement('div');
    caseCard.className = 'case-card';
    caseCard.onclick = () => openCaseModal(caseItem);
    
    caseCard.innerHTML = `
      <div class="case-header">
        <span class="case-id">${caseItem.id}</span>
        <span class="case-status ${caseItem.status}">${caseItem.status}</span>
      </div>
      <div class="case-info">
        <p><strong>Complainant:</strong> ${caseItem.complainant}</p>
        <p><strong>Type:</strong> ${caseItem.type}</p>
        <p><strong>Location:</strong> ${caseItem.location}</p>
        <p><strong>Officer:</strong> ${caseItem.officer}</p>
      </div>
      <div class="case-meta">
        <span>${caseItem.date} ${caseItem.time}</span>
        <span>${caseItem.stationName}</span>
      </div>
    `;
    
    casesGrid.appendChild(caseCard);
  });
}

function setupCaseFilters() {
  // TODO: Implement case filtering functionality
  console.log('Setting up case filters');
}

function openCaseModal(caseItem) {
  // TODO: Implement case modal functionality
  console.log('Opening case modal for:', caseItem);
}

// Chart initialization functions
function initializeMonthlyChart() {
  const ctx = document.getElementById('monthlyChart');
  if (!ctx) return;
  
  new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Cases Registered',
        data: [45, 52, 38, 64, 47, 58], // TODO: Replace with real data
        borderColor: '#3498db',
        backgroundColor: 'rgba(52, 152, 219, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function initializeStatusChart() {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  
  new Chart(ctx.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Pending', 'In Progress', 'Closed'],
      datasets: [{
        data: [89, 16, 142], // TODO: Replace with real data
        backgroundColor: ['#f39c12', '#e74c3c', '#27ae60']
      }]
    },
    options: {
      responsive: true
    }
  });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
  // Check for valid session
  if (!checkUserSession()) {
    window.location.href = 'login.html';
    return;
  }

  // Initialize all components
  initializeNavigation();
  personalizeUI();
  
  // Load initial dashboard data
  initializeDashboard();

  // Add logout button handler
  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('Are you sure you want to logout?')) {
        logout();
      }
    });
  }

  // Add user info click handler for profile modal
  const userInfo = document.querySelector('.user-info');
  if (userInfo) {
    userInfo.addEventListener('click', function() {
      showUserProfileModal();
    });
  }

  console.log('Dashboard initialized with authenticated user:', currentUser.name);
});

// TODO: Add other initialization functions as needed
function initializePoliceStations() {
  console.log('Police stations functionality - TODO: Implement with real data');
}

function initializeTranscriptions() {
  console.log('Transcriptions functionality - TODO: Implement with real data');
}

function initializeFileManager() {
  console.log('File manager functionality - TODO: Implement with real data');
}

function initializeAudioEditor() {
  console.log('Audio editor functionality - TODO: Implement with real data');
}

function initializeAnalytics() {
  console.log('Analytics functionality - TODO: Implement with real data');
}

function setupModal() {
  console.log('Modal functionality - TODO: Implement');
}
