// FIR Audio Load Modal Functions

// Global variable to store filtered FIR cases
let firCasesForLoad = [];
let selectedFIRForLoad = null;

// Open the FIR Load Modal
function openFIRLoadModal() {
    console.log('Opening FIR Load Modal');
    const modal = document.getElementById('fir-load-modal');
    if (modal) {
        modal.style.display = 'block';
        loadFIRCasesForAudio();
    }
}

// Close the FIR Load Modal
function closeFIRLoadModal() {
    const modal = document.getElementById('fir-load-modal');
    if (modal) {
        modal.style.display = 'none';
        // Reset selections
        selectedFIRForLoad = null;
        document.getElementById('fir-search-input').value = '';
        document.getElementById('fir-audio-files-list').innerHTML = `
            <p style="text-align: center; color: #95a5a6; padding: 40px;">
                <i class="fas fa-hand-pointer" style="font-size: 48px; margin-bottom: 15px; display: block;"></i>
                Select a FIR case to view its audio files
            </p>
        `;
    }
}

// Load FIR cases that have evidence files
async function loadFIRCasesForAudio() {
    const container = document.getElementById('fir-cases-list');

    try {
        // Fetch cases from API
        const response = await fetch('/api/cases');
        const allCases = await response.json();

        // Filter cases that have evidenceFiles
        firCasesForLoad = allCases.filter(c => c.evidenceFiles && c.evidenceFiles.length > 0);

        if (firCasesForLoad.length === 0) {
            container.innerHTML = `
                <p style="text-align: center; color: #95a5a6; padding: 20px;">
                    <i class="fas fa-info-circle"></i><br><br>
                    No FIR cases with audio/video files found
                </p>
            `;
            return;
        }

        renderFIRCasesList(firCasesForLoad);

    } catch (error) {
        console.error('Error loading FIR cases:', error);
        container.innerHTML = `
            <p style="text-align: center; color: #e74c3c; padding: 20px;">
                <i class="fas fa-exclamation-triangle"></i><br><br>
                Failed to load FIR cases
            </p>
        `;
    }
}

// Render FIR cases list
function renderFIRCasesList(cases) {
    const container = document.getElementById('fir-cases-list');

    if (cases.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: #95a5a6; padding: 20px;">
                No cases found
            </p>
        `;
        return;
    }

    container.innerHTML = cases.map(c => `
        <div class="fir-case-item ${selectedFIRForLoad === c.id ? 'active' : ''}" 
             onclick="selectFIRForLoad('${c.id}')"
             style="padding: 12px; margin-bottom: 8px; border: 2px solid ${selectedFIRForLoad === c.id ? '#3498db' : '#ddd'}; 
                    border-radius: 6px; cursor: pointer; transition: all 0.3s; background: ${selectedFIRForLoad === c.id ? '#e3f2fd' : 'white'};">
            <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                <i class="fas fa-gavel"></i> ${c.id}
            </div>
            <div style="font-size: 13px; color: #7f8c8d; margin-bottom: 2px;">
                ${c.bnsSectionName || c.type || 'N/A'}
            </div>
            <div style="font-size: 12px; color: #95a5a6;">
                <i class="fas fa-calendar"></i> ${c.date || 'N/A'}
                <span style="margin-left: 10px;">
                    <i class="fas fa-file-audio"></i> ${c.evidenceFiles.length} file(s)
                </span>
            </div>
        </div>
    `).join('');
}

// Filter FIR cases based on search input
function filterFIRCases() {
    const searchTerm = document.getElementById('fir-search-input').value.toLowerCase();
    const filtered = firCasesForLoad.filter(c =>
        c.id.toLowerCase().includes(searchTerm) ||
        (c.bnsSectionName && c.bnsSectionName.toLowerCase().includes(searchTerm)) ||
        (c.type && c.type.toLowerCase().includes(searchTerm))
    );
    renderFIRCasesList(filtered);
}

// Select a FIR case and show its audio files
function selectFIRForLoad(firId) {
    selectedFIRForLoad = firId;

    // Re-render cases list to show selection
    const searchTerm = document.getElementById('fir-search-input').value.toLowerCase();
    if (searchTerm) {
        filterFIRCases();
    } else {
        renderFIRCasesList(firCasesForLoad);
    }

    // Find the selected case
    const selectedCase = firCasesForLoad.find(c => c.id === firId);
    if (!selectedCase) return;

    const filesContainer = document.getElementById('fir-audio-files-list');

    // Render audio files
    filesContainer.innerHTML = selectedCase.evidenceFiles.map(filename => {
        const ext = filename.split('.').pop().toLowerCase();
        const isAudio = ['wav', 'mp3', 'webm', 'ogg', 'm4a'].includes(ext);
        const isVideo = ['mp4', 'avi', 'mov', 'wmv'].includes(ext);

        const icon = isVideo ? 'fa-file-video' : 'fa-file-audio';
        const color = isVideo ? '#9b59b6' : '#3498db';

        return `
            <div style="padding: 12px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 6px; 
                        background: white; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #2c3e50; margin-bottom: 4px;">
                        <i class="fas ${icon}" style="color: ${color};"></i> ${filename}
                    </div>
                    <div style="font-size: 12px; color: #7f8c8d;">
                        ${ext.toUpperCase()} file
                    </div>
                </div>
                <button class="btn btn-sm btn-primary" onclick="loadAudioFromFIR('${firId}', '${filename}')"
                        style="margin-left: 10px;">
                    <i class="fas fa-download"></i> Load
                </button>
            </div>
        `;
    }).join('');
}

// Load audio file from FIR case into editor
async function loadAudioFromFIR(firId, filename) {
    console.log(`Loading audio file: ${filename} from FIR: ${firId}`);

    try {
        showLoadingMessage('Loading audio file...');

        // Construct the file URL (assuming files are stored in uploads folder)
        const fileUrl = `/uploads/${filename}`;

        // Fetch the audio file
        const response = await fetch(fileUrl);
        if (!response.ok) {
            throw new Error('Failed to load audio file');
        }

        const audioBlob = await response.blob();

        // Create a File object from the blob
        const audioFile = new File([audioBlob], filename, { type: audioBlob.type });

        // Use the existing loadAudioFile function from script.js
        if (typeof loadAudioFile === 'function') {
            loadAudioFile(audioFile);

            // Enable controls
            document.getElementById('play-pause-btn').disabled = false;
            document.getElementById('stop-btn').disabled = false;
            document.getElementById('transcribe-btn').disabled = false;

            // Automatically link to the FIR case
            const caseSelect = document.getElementById('save-case-link');
            if (caseSelect) {
                caseSelect.value = firId;
            }

            // Set filename
            const filenameInput = document.getElementById('save-filename');
            if (filenameInput) {
                filenameInput.value = filename.replace(/\.[^/.]+$/, '') + '_edited';
            }

            closeFIRLoadModal();
            showNotification(`Loaded ${filename} from ${firId}`, 'success');
        } else {
            throw new Error('Audio editor not initialized');
        }

        hideLoadingMessage();

    } catch (error) {
        console.error('Error loading audio:', error);
        showNotification('Failed to load audio file: ' + error.message, 'error');
        hideLoadingMessage();
    }
}
