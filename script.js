// Mock Data
const mockCases = [
    {
        id: "FIR-2024-001247",
        complainant: "Priya Sharma",
        type: "Theft",
        status: "pending",
        station: "cp",
        stationName: "Connaught Place",
        date: "2024-01-15",
        time: "14:30",
        description: "Mobile phone and wallet stolen from auto-rickshaw",
        location: "Connaught Place, Block A",
        officer: "Sub-Inspector Amit Kumar",
        contact: "+91-9876543210",
        address: "B-45, Karol Bagh, New Delhi - 110005",
        evidenceFiles: [
            { type: "audio", name: "complaint_recording.mp3", size: "2.3 MB" },
            { type: "video", name: "cctv_footage.mp4", size: "15.7 MB" },
            { type: "image", name: "stolen_items.jpg", size: "1.8 MB" }
        ]
    },
    {
        id: "FIR-2024-001246",
        complainant: "Rajesh Gupta",
        type: "Domestic Violence",
        status: "progress",
        station: "kb",
        stationName: "Karol Bagh",
        date: "2024-01-14",
        time: "09:15",
        description: "Domestic violence case reported by neighbor",
        location: "Karol Bagh, WEA",
        officer: "Inspector Sunita Devi",
        contact: "+91-9876543211",
        address: "C-23, WEA, Karol Bagh, New Delhi - 110005",
        evidenceFiles: [
            { type: "audio", name: "witness_statement.mp3", size: "3.1 MB" },
            { type: "image", name: "medical_report.pdf", size: "0.9 MB" }
        ]
    },
    {
        id: "FIR-2024-001245",
        complainant: "Anita Singh",
        type: "Fraud",
        status: "closed",
        station: "rh",
        stationName: "Rohini",
        date: "2024-01-13",
        time: "16:45",
        description: "Online banking fraud - unauthorized transactions",
        location: "Rohini Sector 15",
        officer: "Inspector Vikram Yadav",
        contact: "+91-9876543212",
        address: "A-101, Sector 15, Rohini, New Delhi - 110085",
        evidenceFiles: [
            { type: "audio", name: "complaint_call.mp3", size: "4.2 MB" },
            { type: "document", name: "bank_statement.pdf", size: "0.5 MB" },
            { type: "document", name: "transaction_details.pdf", size: "0.3 MB" }
        ]
    },
    {
        id: "FIR-2024-001244",
        complainant: "Sunil Agarwal",
        type: "Vehicle Theft",
        status: "progress",
        station: "dl",
        stationName: "Delhi Gate",
        date: "2024-01-12",
        time: "20:30",
        description: "Motorcycle theft from parking area",
        location: "Delhi Gate Market",
        officer: "Sub-Inspector Pooja Sharma",
        contact: "+91-9876543213",
        address: "D-67, Old Delhi, Delhi Gate - 110006",
        evidenceFiles: [
            { type: "audio", name: "fir_recording.mp3", size: "2.8 MB" },
            { type: "video", name: "parking_cctv.mp4", size: "22.1 MB" }
        ]
    },
    {
        id: "FIR-2024-001243",
        complainant: "Kavita Mehta",
        type: "Harassment",
        status: "pending",
        station: "cp",
        stationName: "Connaught Place",
        date: "2024-01-11",
        time: "11:20",
        description: "Workplace harassment complaint",
        location: "Connaught Place Office Complex",
        officer: "Inspector Rahul Verma",
        contact: "+91-9876543214",
        address: "E-12, Lajpat Nagar, New Delhi - 110024",
        evidenceFiles: [
            { type: "audio", name: "harassment_complaint.mp3", size: "5.1 MB" },
            { type: "document", name: "email_evidence.pdf", size: "1.2 MB" }
        ]
    },
    {
        id: "FIR-2024-001242",
        complainant: "Deepak Joshi",
        type: "Burglary",
        status: "closed",
        station: "kb",
        stationName: "Karol Bagh",
        date: "2024-01-10",
        time: "07:45",
        description: "House burglary - jewelry and cash stolen",
        location: "Karol Bagh Extension",
        officer: "Inspector Meera Saxena",
        contact: "+91-9876543215",
        address: "F-89, Karol Bagh Extension, New Delhi - 110005",
        evidenceFiles: [
            { type: "audio", name: "burglary_report.mp3", size: "3.7 MB" },
            { type: "image", name: "crime_scene.jpg", size: "2.4 MB" },
            { type: "video", name: "neighbor_statement.mp4", size: "8.9 MB" }
        ]
    }
];

const mockPoliceStations = [
    {
        id: "cp",
        name: "Connaught Place Police Station",
        address: "Connaught Place, New Delhi - 110001",
        phone: "+91-11-23414444",
        totalOfficers: 45,
        activeCases: 23,
        personnel: [
            { name: "Inspector Rajesh Kumar", rank: "Station Inspector", id: "001" },
            { name: "Sub-Inspector Amit Kumar", rank: "Sub-Inspector", id: "002" },
            { name: "Inspector Rahul Verma", rank: "Inspector", id: "003" },
            { name: "Constable Ravi Sharma", rank: "Head Constable", id: "004" },
            { name: "Constable Sita Devi", rank: "Constable", id: "005" },
            { name: "Constable Mohan Lal", rank: "Constable", id: "006" }
        ]
    },
    {
        id: "kb",
        name: "Karol Bagh Police Station",
        address: "Karol Bagh, New Delhi - 110005",
        phone: "+91-11-25782222",
        totalOfficers: 38,
        activeCases: 19,
        personnel: [
            { name: "Inspector Sunita Devi", rank: "Station Inspector", id: "007" },
            { name: "Inspector Meera Saxena", rank: "Inspector", id: "008" },
            { name: "Sub-Inspector Pradeep Singh", rank: "Sub-Inspector", id: "009" },
            { name: "Constable Vinod Kumar", rank: "Head Constable", id: "010" },
            { name: "Constable Geeta Sharma", rank: "Constable", id: "011" }
        ]
    },
    {
        id: "rh",
        name: "Rohini Police Station",
        address: "Sector 14, Rohini, New Delhi - 110085",
        phone: "+91-11-27891111",
        totalOfficers: 42,
        activeCases: 17,
        personnel: [
            { name: "Inspector Vikram Yadav", rank: "Station Inspector", id: "012" },
            { name: "Sub-Inspector Rekha Gupta", rank: "Sub-Inspector", id: "013" },
            { name: "Sub-Inspector Manoj Tiwari", rank: "Sub-Inspector", id: "014" },
            { name: "Constable Ashok Verma", rank: "Head Constable", id: "015" },
            { name: "Constable Pushpa Devi", rank: "Constable", id: "016" }
        ]
    },
    {
        id: "dl",
        name: "Delhi Gate Police Station",
        address: "Delhi Gate, Old Delhi - 110006",
        phone: "+91-11-23456789",
        totalOfficers: 35,
        activeCases: 14,
        personnel: [
            { name: "Inspector Arun Tripathi", rank: "Station Inspector", id: "017" },
            { name: "Sub-Inspector Pooja Sharma", rank: "Sub-Inspector", id: "018" },
            { name: "Sub-Inspector Ramesh Chandra", rank: "Sub-Inspector", id: "019" },
            { name: "Constable Krishan Kumar", rank: "Head Constable", id: "020" },
            { name: "Constable Lata Joshi", rank: "Constable", id: "021" }
        ]
    }
];

const mockTranscriptions = [
    {
        id: "TRANS-001",
        caseId: "FIR-2024-001247",
        status: "completed",
        content: "मैं प्रिया शर्मा हूं और मैं यहां चोरी की शिकायत दर्ज कराने आई हूं। आज दोपहर में जब मैं ऑटो से उतर रही थी तो किसी ने मेरा मोबाइल फोन और बटुआ चुरा लिया। फोन iPhone 13 है और बटुए में 5000 रुपये नकद थे। यह घटना कनॉट प्लेस के ब्लॉक A में हुई है।",
        audioFile: "complaint_recording.mp3",
        duration: "2:15"
    },
    {
        id: "TRANS-002",
        caseId: "FIR-2024-001246",
        status: "completed",
        content: "मैंने अपने पड़ोसी के घर से चीखने-चिल्लाने की आवाज सुनी। देखा तो वह अपनी पत्नी को मार रहा था। यह रोज़ाना की बात है। मैं गवाही देने को तैयार हूं। महिला को तुरंत सुरक्षा की जरूरत है।",
        audioFile: "witness_statement.mp3",
        duration: "3:42"
    },
    {
        id: "TRANS-003",
        caseId: "FIR-2024-001245",
        status: "completed",
        content: "मेरे बैंक अकाउंट से बिना अनुमति के 50,000 रुपये की निकासी हुई है। मुझे कोई SMS या ईमेल notification नहीं मिली। यह ऑनलाइन फ्रॉड का केस है। मैंने तुरंत बैंक को सूचित किया है।",
        audioFile: "complaint_call.mp3",
        duration: "4:28"
    }
];

const mockFiles = [
    { name: "FIR_Reports", type: "folder", size: "-", modified: "2024-01-15" },
    { name: "Audio_Recordings", type: "folder", size: "-", modified: "2024-01-15" },
    { name: "Video_Evidence", type: "folder", size: "-", modified: "2024-01-14" },
    { name: "complaint_recording.mp3", type: "audio", size: "2.3 MB", modified: "2024-01-15" },
    { name: "cctv_footage.mp4", type: "video", size: "15.7 MB", modified: "2024-01-15" },
    { name: "stolen_items.jpg", type: "image", size: "1.8 MB", modified: "2024-01-15" },
    { name: "witness_statement.mp3", type: "audio", size: "3.1 MB", modified: "2024-01-14" },
    { name: "medical_report.pdf", type: "document", size: "0.9 MB", modified: "2024-01-14" },
    { name: "bank_statement.pdf", type: "document", size: "0.5 MB", modified: "2024-01-13" },
    { name: "parking_cctv.mp4", type: "video", size: "22.1 MB", modified: "2024-01-12" },
    { name: "harassment_complaint.mp3", type: "audio", size: "5.1 MB", modified: "2024-01-11" },
    { name: "crime_scene.jpg", type: "image", size: "2.4 MB", modified: "2024-01-10" }
];

// Global variables
let currentPage = 'dashboard';
let selectedFiles = [];
let wavesurfer = null;
let currentUser = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Check for valid session
    if (!checkUserSession()) {
        window.location.href = 'login.html';
        return;
    }
    
    initializeNavigation();
    initializeDashboard();
    initializeCases();
    initializePoliceStations();
    initializeTranscriptions();
    initializeFileManager();
    initializeAudioEditor();
    initializeAnalytics();
    setupModal();
});

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
            document.getElementById(targetPage + '-page').classList.add('active');
            
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
            pageTitle.textContent = titles[targetPage];
            
            currentPage = targetPage;
        });
    });
}

// Dashboard initialization
function initializeDashboard() {
    // Initialize charts
    initializeMonthlyChart();
    initializeStatusChart();
}

function initializeMonthlyChart() {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Cases Registered',
                data: [45, 52, 38, 64, 47, 58],
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
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'In Progress', 'Closed'],
            datasets: [{
                data: [89, 16, 142],
                backgroundColor: ['#f39c12', '#e74c3c', '#27ae60']
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Cases functionality
function initializeCases() {
    renderCases(mockCases);
    setupCaseFilters();
}

function renderCases(cases) {
    const casesGrid = document.getElementById('cases-grid');
    casesGrid.innerHTML = '';

    cases.forEach(caseItem => {
        const caseCard = document.createElement('div');
        caseCard.className = 'case-card';
        caseCard.onclick = () => openCaseModal(caseItem);
        
        caseCard.innerHTML = `
            <div class="case-header">
                <div class="case-id">${caseItem.id}</div>
                <div class="case-status ${caseItem.status}">${getStatusText(caseItem.status)}</div>
            </div>
            <div class="case-info">
                <p><strong>Complainant:</strong> ${caseItem.complainant}</p>
                <p><strong>Type:</strong> ${caseItem.type}</p>
                <p><strong>Location:</strong> ${caseItem.location}</p>
                <p><strong>Officer:</strong> ${caseItem.officer}</p>
            </div>
            <div class="case-meta">
                <span>${caseItem.stationName}</span>
                <span>${formatDate(caseItem.date)} ${caseItem.time}</span>
            </div>
        `;
        
        casesGrid.appendChild(caseCard);
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'progress': 'In Progress',
        'closed': 'Closed'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN');
}

function setupCaseFilters() {
    const searchInput = document.getElementById('case-search');
    const statusFilter = document.getElementById('status-filter');
    const stationFilter = document.getElementById('station-filter');

    function filterCases() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value;
        const stationValue = stationFilter.value;

        const filteredCases = mockCases.filter(caseItem => {
            const matchesSearch = caseItem.id.toLowerCase().includes(searchTerm) ||
                                caseItem.complainant.toLowerCase().includes(searchTerm) ||
                                caseItem.type.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusValue || caseItem.status === statusValue;
            const matchesStation = !stationValue || caseItem.station === stationValue;

            return matchesSearch && matchesStatus && matchesStation;
        });

        renderCases(filteredCases);
    }

    searchInput.addEventListener('input', filterCases);
    statusFilter.addEventListener('change', filterCases);
    stationFilter.addEventListener('change', filterCases);
}

// Modal functionality
function setupModal() {
    const modal = document.getElementById('case-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

function openCaseModal(caseItem) {
    const modal = document.getElementById('case-modal');
    const modalTitle = document.getElementById('modal-case-id');
    const caseDetails = document.getElementById('case-details');

    modalTitle.textContent = caseItem.id + ' - Details';

    caseDetails.innerHTML = `
        <div class="case-detail-section">
            <h4>Case Information</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>FIR Number</label>
                    <span>${caseItem.id}</span>
                </div>
                <div class="detail-item">
                    <label>Status</label>
                    <span class="case-status ${caseItem.status}">${getStatusText(caseItem.status)}</span>
                </div>
                <div class="detail-item">
                    <label>Case Type</label>
                    <span>${caseItem.type}</span>
                </div>
                <div class="detail-item">
                    <label>Date & Time</label>
                    <span>${formatDate(caseItem.date)} at ${caseItem.time}</span>
                </div>
                <div class="detail-item">
                    <label>Police Station</label>
                    <span>${caseItem.stationName}</span>
                </div>
                <div class="detail-item">
                    <label>Investigating Officer</label>
                    <span>${caseItem.officer}</span>
                </div>
            </div>
        </div>

        <div class="case-detail-section">
            <h4>Complainant Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Name</label>
                    <span>${caseItem.complainant}</span>
                </div>
                <div class="detail-item">
                    <label>Contact</label>
                    <span>${caseItem.contact}</span>
                </div>
                <div class="detail-item" style="grid-column: 1 / -1;">
                    <label>Address</label>
                    <span>${caseItem.address}</span>
                </div>
            </div>
        </div>

        <div class="case-detail-section">
            <h4>Incident Details</h4>
            <div class="detail-item">
                <label>Location</label>
                <span>${caseItem.location}</span>
            </div>
            <div class="detail-item">
                <label>Description</label>
                <span>${caseItem.description}</span>
            </div>
        </div>

        <div class="case-detail-section">
            <h4>Evidence Files</h4>
            <div class="media-files">
                ${caseItem.evidenceFiles.map(file => `
                    <div class="media-file">
                        <i class="fas ${getFileIcon(file.type)}"></i>
                        <p>${file.name}</p>
                        <p>${file.size}</p>
                        <button onclick="playMedia('${file.name}')">Open</button>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="case-detail-section">
            <h4>Actions</h4>
            <div style="display: flex; gap: 10px;">
                <button class="btn btn-primary" onclick="updateCaseStatus('${caseItem.id}', 'progress')">
                    <i class="fas fa-play"></i> Mark In Progress
                </button>
                <button class="btn btn-success" onclick="updateCaseStatus('${caseItem.id}', 'closed')">
                    <i class="fas fa-check"></i> Close Case
                </button>
                <button class="btn btn-secondary" onclick="editCase('${caseItem.id}')">
                    <i class="fas fa-edit"></i> Edit Details
                </button>
            </div>
        </div>
    `;

    modal.style.display = 'block';
}

function getFileIcon(type) {
    const iconMap = {
        'audio': 'fa-file-audio',
        'video': 'fa-file-video',
        'image': 'fa-file-image',
        'document': 'fa-file-pdf'
    };
    return iconMap[type] || 'fa-file';
}

function playMedia(filename) {
    alert(`Opening ${filename}...`);
    // In a real application, this would open the media file
}

function updateCaseStatus(caseId, newStatus) {
    const caseIndex = mockCases.findIndex(c => c.id === caseId);
    if (caseIndex !== -1) {
        mockCases[caseIndex].status = newStatus;
        alert(`Case ${caseId} status updated to ${getStatusText(newStatus)}`);
        document.getElementById('case-modal').style.display = 'none';
        renderCases(mockCases);
    }
}

function editCase(caseId) {
    alert(`Edit functionality for case ${caseId} would open here`);
    // In a real application, this would open an edit form
}

// Police Stations functionality
function initializePoliceStations() {
    const stationsGrid = document.getElementById('stations-grid');
    
    mockPoliceStations.forEach(station => {
        const stationCard = document.createElement('div');
        stationCard.className = 'station-card';
        
        stationCard.innerHTML = `
            <div class="station-header">
                <div class="station-icon">
                    <i class="fas fa-building"></i>
                </div>
                <div class="station-info">
                    <h3>${station.name}</h3>
                    <p>${station.address}</p>
                    <p><i class="fas fa-phone"></i> ${station.phone}</p>
                </div>
            </div>
            <div class="station-stats">
                <div class="station-stat">
                    <h4>${station.totalOfficers}</h4>
                    <p>Total Officers</p>
                </div>
                <div class="station-stat">
                    <h4>${station.activeCases}</h4>
                    <p>Active Cases</p>
                </div>
            </div>
            <div class="personnel-list">
                <h4 style="margin-bottom: 10px; color: #2c3e50;">Personnel</h4>
                ${station.personnel.map(person => `
                    <div class="personnel-item">
                        <span class="personnel-name">${person.name}</span>
                        <span class="personnel-rank">${person.rank}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        stationsGrid.appendChild(stationCard);
    });
}

// Transcriptions functionality
function initializeTranscriptions() {
    const transcriptionList = document.getElementById('transcription-list');
    
    mockTranscriptions.forEach(transcription => {
        const transcriptionItem = document.createElement('div');
        transcriptionItem.className = 'transcription-item';
        
        transcriptionItem.innerHTML = `
            <div class="transcription-header">
                <div class="transcription-id">${transcription.id} - ${transcription.caseId}</div>
                <div class="transcription-status">${transcription.status}</div>
            </div>
            <div class="transcription-content">${transcription.content}</div>
            <div class="transcription-actions">
                <button class="btn btn-primary" onclick="editTranscription('${transcription.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-secondary" onclick="playAudio('${transcription.audioFile}')">
                    <i class="fas fa-play"></i> Play Audio (${transcription.duration})
                </button>
                <button class="btn btn-success" onclick="saveTranscription('${transcription.id}')">
                    <i class="fas fa-save"></i> Save
                </button>
            </div>
        `;
        
        transcriptionList.appendChild(transcriptionItem);
    });
}

function editTranscription(id) {
    alert(`Edit transcription ${id}`);
    // In a real application, this would make the transcription content editable
}

function playAudio(filename) {
    alert(`Playing audio: ${filename}`);
    // In a real application, this would play the audio file
}

function saveTranscription(id) {
    alert(`Transcription ${id} saved successfully`);
}

// Analytics functionality
function initializeAnalytics() {
    initializeCrimeTypesChart();
    initializeStationChart();
    initializeTrendChart();
}

function initializeCrimeTypesChart() {
    const ctx = document.getElementById('crimeTypesChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Theft', 'Fraud', 'Domestic Violence', 'Vehicle Theft', 'Harassment', 'Burglary'],
            datasets: [{
                data: [45, 32, 28, 25, 18, 15],
                backgroundColor: [
                    '#3498db', '#e74c3c', '#f39c12', 
                    '#27ae60', '#9b59b6', '#1abc9c'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

function initializeStationChart() {
    const ctx = document.getElementById('stationChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Connaught Place', 'Karol Bagh', 'Rohini', 'Delhi Gate'],
            datasets: [{
                label: 'Cases',
                data: [23, 19, 17, 14],
                backgroundColor: '#3498db'
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

function initializeTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Cases Registered',
                    data: [45, 52, 38, 64, 47, 58],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)'
                },
                {
                    label: 'Cases Closed',
                    data: [32, 41, 29, 48, 35, 42],
                    borderColor: '#27ae60',
                    backgroundColor: 'rgba(39, 174, 96, 0.1)'
                }
            ]
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

// File Manager functionality
function initializeFileManager() {
    renderFiles();
}

function renderFiles() {
    const fileGrid = document.getElementById('file-grid');
    fileGrid.innerHTML = '';

    mockFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.onclick = () => toggleFileSelection(fileItem, file);
        
        fileItem.innerHTML = `
            <div class="file-icon">
                <i class="fas ${getFileTypeIcon(file.type)}"></i>
            </div>
            <div class="file-name">${file.name}</div>
            <div class="file-size">${file.size}</div>
        `;
        
        fileGrid.appendChild(fileItem);
    });
}

function getFileTypeIcon(type) {
    const iconMap = {
        'folder': 'fa-folder',
        'audio': 'fa-file-audio',
        'video': 'fa-file-video',
        'image': 'fa-file-image',
        'document': 'fa-file-pdf'
    };
    return iconMap[type] || 'fa-file';
}

function toggleFileSelection(element, file) {
    element.classList.toggle('selected');
    const index = selectedFiles.findIndex(f => f.name === file.name);
    
    if (index === -1) {
        selectedFiles.push(file);
    } else {
        selectedFiles.splice(index, 1);
    }
}

function uploadFile() {
    alert('File upload functionality would open here');
}

function createFolder() {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
        mockFiles.unshift({
            name: folderName,
            type: 'folder',
            size: '-',
            modified: new Date().toISOString().split('T')[0]
        });
        renderFiles();
        alert(`Folder "${folderName}" created successfully`);
    }
}

function deleteSelected() {
    if (selectedFiles.length === 0) {
        alert('Please select files to delete');
        return;
    }
    
    if (confirm(`Delete ${selectedFiles.length} selected item(s)?`)) {
        selectedFiles.forEach(selectedFile => {
            const index = mockFiles.findIndex(f => f.name === selectedFile.name);
            if (index !== -1) {
                mockFiles.splice(index, 1);
            }
        });
        
        selectedFiles = [];
        renderFiles();
        alert('Selected files deleted successfully');
    }
}

// Audio Editor functionality
function initializeAudioEditor() {
    // Initialize WaveSurfer
    try {
        if (typeof WaveSurfer !== 'undefined') {
            wavesurfer = WaveSurfer.create({
                container: '#waveform',
                waveColor: '#3498db',
                progressColor: '#2980b9',
                height: 150,
                responsive: true
            });
        }
    } catch (error) {
        console.log('WaveSurfer not available');
    }
    
    setupAudioControls();
}

function setupAudioControls() {
    const volumeSlider = document.getElementById('volume-slider');
    const speedSlider = document.getElementById('speed-slider');
    
    volumeSlider.addEventListener('input', function() {
        if (wavesurfer) {
            wavesurfer.setVolume(this.value / 100);
        }
    });
    
    speedSlider.addEventListener('input', function() {
        if (wavesurfer) {
            wavesurfer.setPlaybackRate(this.value);
        }
    });
}

function loadAudioFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            if (wavesurfer) {
                const url = URL.createObjectURL(file);
                wavesurfer.load(url);
            }
            alert(`Loaded audio file: ${file.name}`);
        }
    };
    input.click();
}

function playPause() {
    if (wavesurfer) {
        wavesurfer.playPause();
    } else {
        alert('Audio player functionality - Play/Pause toggled');
    }
}

function cropAudio() {
    alert('Audio crop functionality would work here - select region and crop');
}

function reduceNoise() {
    alert('Noise reduction applied to audio');
}

function saveAudio() {
    alert('Audio saved successfully with applied effects');
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 3000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Search functionality
function searchGlobal(query) {
    query = query.toLowerCase();
    const results = [];
    
    // Search in cases
    mockCases.forEach(caseItem => {
        if (caseItem.id.toLowerCase().includes(query) ||
            caseItem.complainant.toLowerCase().includes(query) ||
            caseItem.type.toLowerCase().includes(query)) {
            results.push({
                type: 'case',
                item: caseItem,
                title: caseItem.id,
                description: `${caseItem.type} - ${caseItem.complainant}`
            });
        }
    });
    
    // Search in stations
    mockPoliceStations.forEach(station => {
        if (station.name.toLowerCase().includes(query)) {
            results.push({
                type: 'station',
                item: station,
                title: station.name,
                description: station.address
            });
        }
    });
    
    return results;
}

// Session Management Functions
function checkUserSession() {
    const sessionData = localStorage.getItem('soochna_sahayak_session');
    
    if (!sessionData) {
        return false;
    }
    
    try {
        const user = JSON.parse(sessionData);
        const loginTime = new Date(user.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // Check if session is expired (24 hours)
        if (hoursDiff >= 24) {
            localStorage.removeItem('soochna_sahayak_session');
            return false;
        }
        
        // Session is valid
        currentUser = user;
        updateUserDisplay();
        return true;
        
    } catch (error) {
        localStorage.removeItem('soochna_sahayak_session');
        return false;
    }
}

function updateUserDisplay() {
    if (!currentUser) return;
    
    const userNameDisplay = document.getElementById('user-name-display');
    if (userNameDisplay) {
        userNameDisplay.textContent = `${currentUser.designation} ${currentUser.name}`;
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('soochna_sahayak_session');
        window.location.href = 'login.html';
    }
}

// Account Modal Functions
function openAccountModal() {
    if (!currentUser) return;
    
    const modal = document.getElementById('account-modal');
    
    // Update profile information
    document.getElementById('profile-image').src = currentUser.profileImage;
    document.getElementById('profile-name').textContent = currentUser.name;
    document.getElementById('profile-designation').textContent = currentUser.designation;
    document.getElementById('profile-station').textContent = currentUser.stationName;
    document.getElementById('profile-employee-id').textContent = currentUser.employeeId;
    document.getElementById('profile-phone').textContent = currentUser.phone;
    document.getElementById('profile-email').textContent = currentUser.email;
    document.getElementById('profile-joining').textContent = formatJoiningDate(currentUser.joiningDate);
    document.getElementById('profile-address').textContent = currentUser.address;
    document.getElementById('profile-last-login').textContent = formatLastLogin(currentUser.lastLogin);
    document.getElementById('profile-session-time').textContent = calculateSessionTime();
    
    modal.style.display = 'block';
}

function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    modal.style.display = 'none';
}

function formatJoiningDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function formatLastLogin(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ', ' + date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function calculateSessionTime() {
    if (!currentUser) return '0 minutes';
    
    const loginTime = new Date(currentUser.loginTime);
    const now = new Date();
    const diffMs = now - loginTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
        return `${diffHours} hours ${diffMinutes} minutes`;
    } else {
        return `${diffMinutes} minutes`;
    }
}

function changePassword() {
    alert('Change password functionality would open here. In a real application, this would show a secure password change form.');
}

function editProfile() {
    alert('Edit profile functionality would open here. In a real application, this would allow editing of personal information.');
}

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const accountModal = document.getElementById('account-modal');
    if (event.target === accountModal) {
        closeAccountModal();
    }
});

// Export functionality (for testing)
window.dashboardFunctions = {
    updateCaseStatus,
    editCase,
    playMedia,
    editTranscription,
    playAudio,
    saveTranscription,
    uploadFile,
    createFolder,
    deleteSelected,
    loadAudioFile,
    playPause,
    cropAudio,
    reduceNoise,
    saveAudio,
    showNotification,
    searchGlobal,
    logout,
    openAccountModal,
    closeAccountModal,
    changePassword,
    editProfile
};
