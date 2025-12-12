// ==================== //
// CV BUILDER PAGE - ENHANCED WITH RECORDING
// ==================== //

const transcriptionTextarea = document.getElementById('transcription-text');
const enhanceBtn = document.querySelector('.enhance-btn');
const generateBtn = document.querySelector('.generate-btn');
const logoutButton = document.querySelector('.logout-button');

// New elements for recording functionality
const recordMoreBtn = document.getElementById('record-more-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const builderLanguageSelect = document.getElementById('builder-language-select');
const builderRecordingStatus = document.getElementById('builder-recording-status');
const builderStatusText = document.getElementById('builder-status-text');

// Recording state
let isRecording = false;
let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let selectedLanguage = null; // null means auto-detect
let useAutoDetect = true; // Default to auto-detection

// Check for recorded audio and transcription from session
window.addEventListener('load', () => {
    const recordedAudio = sessionStorage.getItem('recordedAudio');
    const transcription = sessionStorage.getItem('transcription');
    const transcriptionLanguage = sessionStorage.getItem('transcriptionLanguage');
    const transcriptionLanguageName = sessionStorage.getItem('transcriptionLanguageName');

    if (recordedAudio) {
        console.log('Recorded audio found in session');
    }

    if (transcription) {
        console.log('Transcription found:', transcription);
        console.log('Language:', transcriptionLanguageName || transcriptionLanguage);

        // Display transcription in textarea
        updateTranscription(transcription);

        // Set language selector to match
        if (transcriptionLanguage) {
            builderLanguageSelect.value = transcriptionLanguage;
            selectedLanguage = transcriptionLanguage;
        }

        // Add language indicator
        if (transcriptionLanguageName) {
            const transcriptionSection = document.querySelector('.builder-section');
            if (transcriptionSection) {
                const langBadge = document.createElement('span');
                langBadge.className = 'badge badge-language';
                langBadge.textContent = transcriptionLanguageName;
                langBadge.style.marginLeft = '10px';

                const header = transcriptionSection.querySelector('.section-header h3');
                if (header && !header.querySelector('.badge-language')) {
                    header.appendChild(langBadge);
                }
            }
        }

        // Try to extract basic CV information from transcription
        extractBasicInfo(transcription);
    } else {
        console.log('No transcription found in session');
    }
});

// Language selector change handler
builderLanguageSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'auto') {
        selectedLanguage = null;
        useAutoDetect = true;
        console.log('Auto-detect mode enabled');
    } else {
        selectedLanguage = value;
        useAutoDetect = false;
        console.log('Manual language selected:', selectedLanguage);
    }
});

// ==================== //
// RECORDING FUNCTIONALITY
// ==================== //

// Record More button - add more details
recordMoreBtn.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

// Start recording
async function startRecording() {
    try {
        // Check if Bhashini is configured
        if (!bhashiniASR.isConfigured) {
            showBuilderError('Bhashini ASR is not configured. Please update bhashini-config.js');
            return;
        }

        // Request microphone access
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        // Create media recorder
        const options = { mimeType: 'audio/webm' };
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            options.mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options.mimeType = 'audio/webm;codecs=opus';
        }

        mediaRecorder = new MediaRecorder(audioStream, options);
        audioChunks = [];

        // Handle data available
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // Handle recording stop
        mediaRecorder.onstop = async () => {
            const mimeType = mediaRecorder.mimeType || 'audio/webm';
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            console.log('Audio recorded:', audioBlob);

            // Process with Bhashini ASR
            await processBuilderAudio(audioBlob);
        };

        // Start recording
        mediaRecorder.start();
        isRecording = true;

        // Update UI
        recordMoreBtn.classList.add('recording');
        recordMoreBtn.querySelector('.btn-text').textContent = 'Stop Recording';
        builderRecordingStatus.classList.remove('hidden');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        showBuilderError('Could not access microphone. Please grant permission.');
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

        // Stop all audio tracks
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }

        isRecording = false;

        // Update UI
        recordMoreBtn.classList.remove('recording');
        recordMoreBtn.querySelector('.btn-text').textContent = 'Add More Details';
        builderRecordingStatus.classList.add('hidden');
    }
}

// Process audio with Bhashini ASR
async function processBuilderAudio(audioBlob) {
    try {
        builderStatusText.textContent = 'Processing audio...';
        builderRecordingStatus.classList.remove('hidden');

        // Call Bhashini ASR API with auto-detection
        const result = await bhashiniASR.transcribe(
            audioBlob,
            selectedLanguage,  // null for auto-detect, or specific language code
            (progressMessage) => {
                builderStatusText.textContent = progressMessage;
                console.log('Progress:', progressMessage);
            },
            useAutoDetect  // Explicitly enable auto-detection
        );

        builderRecordingStatus.classList.add('hidden');

        if (result.success) {
            // Append new transcription to existing text
            const currentText = transcriptionTextarea.value;
            const separator = currentText && !currentText.endsWith('\n') ? ' ' : '';
            const newText = currentText + separator + result.transcription;

            transcriptionTextarea.value = newText;

            // Update session storage
            sessionStorage.setItem('transcription', newText);
            sessionStorage.setItem('transcriptionLanguage', result.language);
            sessionStorage.setItem('transcriptionLanguageName', result.languageName);

            // Re-extract CV info from updated transcription
            extractBasicInfo(newText);

            // Show success briefly
            builderStatusText.textContent = 'Transcription added!';
            builderRecordingStatus.classList.remove('hidden');
            setTimeout(() => {
                builderRecordingStatus.classList.add('hidden');
            }, 2000);
        } else {
            showBuilderError(`Transcription failed: ${result.error}`);
        }

    } catch (error) {
        console.error('Error processing audio:', error);
        showBuilderError(`Error: ${error.message}`);
    }
}

// Show error message
function showBuilderError(message) {
    builderStatusText.textContent = message;
    builderStatusText.style.color = 'var(--error)';
    builderRecordingStatus.classList.remove('hidden');

    setTimeout(() => {
        builderRecordingStatus.classList.add('hidden');
        builderStatusText.style.color = '';
    }, 3000);
}

// ==================== //
// CLEAR ALL FUNCTIONALITY
// ==================== //

clearAllBtn.addEventListener('click', () => {
    // Confirm before clearing
    const confirmed = confirm('Are you sure you want to clear all transcription data? This cannot be undone.');

    if (confirmed) {
        // Clear textarea
        transcriptionTextarea.value = '';

        // Clear session storage
        sessionStorage.removeItem('transcription');
        sessionStorage.removeItem('transcriptionLanguage');
        sessionStorage.removeItem('transcriptionLanguageName');
        sessionStorage.removeItem('recordedAudio');

        // Clear NER data
        const categories = document.querySelectorAll('.ner-category');
        categories.forEach(category => {
            const valueElement = category.querySelector('.category-value');
            if (valueElement) {
                valueElement.textContent = '-';
            }
        });

        // Remove language badge
        const langBadge = document.querySelector('.badge-language');
        if (langBadge) {
            langBadge.remove();
        }

        console.log('All transcription data cleared');

        // Show confirmation
        builderStatusText.textContent = 'All data cleared';
        builderRecordingStatus.classList.remove('hidden');
        setTimeout(() => {
            builderRecordingStatus.classList.add('hidden');
        }, 2000);
    }
});

// ==================== //
// MANUAL EDITING
// ==================== //

// Auto-save edited text to session storage
let saveTimeout;
transcriptionTextarea.addEventListener('input', () => {
    // Debounce saving
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        const editedText = transcriptionTextarea.value;
        sessionStorage.setItem('transcription', editedText);

        // Re-extract CV info when user edits
        if (editedText.trim()) {
            extractBasicInfo(editedText);
        }

        console.log('Transcription auto-saved');
    }, 1000); // Save 1 second after user stops typing
});

// ==================== //
// ORIGINAL FUNCTIONALITY
// ==================== //

// Logout functionality
logoutButton.addEventListener('click', () => {
    // Ask if user wants to save data
    const hasData = transcriptionTextarea.value.trim().length > 0;
    if (hasData) {
        const saveData = confirm('You have unsaved CV data. Keep it for next time?');
        if (!saveData) {
            sessionStorage.clear();
        }
    } else {
        sessionStorage.clear();
    }

    // Navigate back to landing page
    window.location.href = 'index.html';
});

// Enhance with AI button
enhanceBtn.addEventListener('click', () => {
    console.log('Enhance with AI clicked');

    const originalText = enhanceBtn.innerHTML;
    enhanceBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        </svg>
        Enhancing...
    `;
    enhanceBtn.disabled = true;

    setTimeout(() => {
        enhanceBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Enhanced!
        `;

        setTimeout(() => {
            enhanceBtn.innerHTML = originalText;
            enhanceBtn.disabled = false;
        }, 2000);
    }, 2000);
});

// Generate CV button
generateBtn.addEventListener('click', () => {
    console.log('Generate CV clicked');

    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        </svg>
        Generating...
    `;
    generateBtn.disabled = true;

    setTimeout(() => {
        generateBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            CV Generated!
        `;

        // Simulate download
        alert('CV would be downloaded here (functionality to be implemented)');

        setTimeout(() => {
            generateBtn.innerHTML = originalText;
            generateBtn.disabled = false;
        }, 2000);
    }, 2000);
});

// Admin override for builder page
document.getElementById('admin-override').addEventListener('click', () => {
    // Navigate back to landing page
    console.log('Admin override from builder page');
    window.location.href = 'index.html';
});

// ==================== //
// UTILITY FUNCTIONS
// ==================== //

// Function to update transcription (to be called by Bhashini integration)
function updateTranscription(text) {
    transcriptionTextarea.value = text;
}

// Function to update NER data (to be called by Bhashini integration)
function updateNER(data) {
    // data should be an object like:
    // { name: "John Doe", skills: ["JavaScript", "Python"], experience: "5 years", education: "BS Computer Science" }

    const categories = document.querySelectorAll('.ner-category');

    if (data.name && categories[0]) {
        categories[0].querySelector('.category-value').textContent = data.name;
    }
    if (data.skills && categories[1]) {
        categories[1].querySelector('.category-value').textContent =
            Array.isArray(data.skills) ? data.skills.join(', ') : data.skills;
    }
    if (data.experience && categories[2]) {
        categories[2].querySelector('.category-value').textContent = data.experience;
    }
    if (data.education && categories[3]) {
        categories[3].querySelector('.category-value').textContent = data.education;
    }
}

// Extract basic CV information from transcription
function extractBasicInfo(text) {
    if (!text) return;

    const data = {};
    const lowerText = text.toLowerCase();

    // Try to extract name (simple heuristic)
    const namePatterns = [
        /my name is ([A-Za-z\s]+)/i,
        /i am ([A-Za-z\s]+)/i,
        /this is ([A-Za-z\s]+)/i
    ];

    for (const pattern of namePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            data.name = match[1].trim();
            break;
        }
    }

    // Try to extract skills
    const skillKeywords = ['skill', 'proficient', 'experience in', 'knowledge of', 'expert in'];
    const skillMatch = skillKeywords.some(keyword => lowerText.includes(keyword));
    if (skillMatch) {
        // Extract common technical terms
        const commonSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'html', 'css', 'leadership', 'communication'];
        const foundSkills = commonSkills.filter(skill => lowerText.includes(skill));
        if (foundSkills.length > 0) {
            data.skills = foundSkills;
        }
    }

    // Try to extract years of experience
    const expPatterns = [
        /(\d+)\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
        /experience\s*(?:of)?\s*(\d+)\s*(?:years?|yrs?)/i
    ];

    for (const pattern of expPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            data.experience = `${match[1]} years`;
            break;
        }
    }

    // Try to extract education
    const educationKeywords = ['degree', 'university', 'college', 'bachelor', 'master', 'phd', 'graduate', 'diploma'];
    const eduMatch = educationKeywords.some(keyword => lowerText.includes(keyword));
    if (eduMatch) {
        // Extract the sentence containing education keywords
        const sentences = text.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (educationKeywords.some(keyword => sentence.toLowerCase().includes(keyword))) {
                data.education = sentence.trim();
                break;
            }
        }
    }

    // Update NER data if we found anything
    if (Object.keys(data).length > 0) {
        console.log('Extracted CV data:', data);
        updateNER(data);
    }
}

// Export functions for Bhashini integration
window.cvBuilder = {
    updateTranscription,
    updateNER,
    extractBasicInfo
};

console.log('CV Builder initialized with recording functionality.');
