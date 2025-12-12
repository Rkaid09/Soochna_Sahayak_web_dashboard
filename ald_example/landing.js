// ==================== //
// LANDING PAGE - MICROPHONE RECORDING WITH BHASHINI ASR
// ==================== //

const micButton = document.getElementById('mic-button');
const statusText = document.getElementById('status-text');
const recordingIndicator = document.getElementById('recording-indicator');
const languageSelect = document.getElementById('language-select');
const transcriptionPreview = document.getElementById('transcription-preview');
const previewText = document.getElementById('preview-text');
const retryBtn = document.getElementById('retry-btn');
const continueBtn = document.getElementById('continue-btn');

let isRecording = false;
let audioStream = null;
let mediaRecorder = null;
let audioChunks = [];
let selectedLanguage = null; // null means auto-detect
let useAutoDetect = true; // Default to auto-detection

// Update selected language when changed (for manual override)
languageSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    // Keep null for auto-detection, otherwise use selected language
    selectedLanguage = (value === '' || value === 'auto') ? null : value;
    useAutoDetect = selectedLanguage === null;
    console.log('Language mode:', useAutoDetect ? 'Auto-Detect' : `Manual: ${selectedLanguage}`);
});

// Microphone button click handler
micButton.addEventListener('click', async () => {
    if (!isRecording) {
        await startRecording();
    } else {
        stopRecording();
    }
});

// Start recording function
async function startRecording() {
    try {
        // Check if Bhashini is configured
        if (!bhashiniASR.isConfigured) {
            showError('Bhashini ASR is not configured. Please update bhashini-config.js with your API credentials.');
            return;
        }

        // Hide transcription preview if visible
        transcriptionPreview.classList.add('hidden');

        // Request microphone access
        audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            }
        });

        // Create media recorder with WAV format if supported
        const options = { mimeType: 'audio/webm' };

        // Try to use WAV if supported
        if (MediaRecorder.isTypeSupported('audio/wav')) {
            options.mimeType = 'audio/wav';
        } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options.mimeType = 'audio/webm;codecs=opus';
        }

        mediaRecorder = new MediaRecorder(audioStream, options);

        // Reset audio chunks
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
            await processAudioWithBhashini(audioBlob);
        };

        // Start recording
        mediaRecorder.start();
        isRecording = true;

        // Update UI
        micButton.classList.add('recording');
        statusText.style.display = 'none';
        recordingIndicator.classList.remove('hidden');

    } catch (error) {
        console.error('Error accessing microphone:', error);
        showError('Error: Could not access microphone. Please grant permission and try again.');
    }
}

// Stop recording function
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();

        // Stop all audio tracks
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
        }

        isRecording = false;

        // Update UI
        micButton.classList.remove('recording');
        recordingIndicator.classList.add('hidden');
        statusText.style.display = 'block';
    }
}

// Process audio with Bhashini ASR
async function processAudioWithBhashini(audioBlob) {
    try {
        // Update status
        statusText.textContent = 'Processing audio with Bhashini ASR...';
        statusText.style.color = '';

        // Store audio in session for backup
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
            sessionStorage.setItem('recordedAudio', reader.result);
        };

        // Call Bhashini ASR API with auto-detection
        // Pass null as language to force auto-detection, unless user manually selected a language
        const result = await bhashiniASR.transcribe(
            audioBlob,
            selectedLanguage,  // null for auto-detect, or specific language code
            (progressMessage) => {
                // Update status with progress
                statusText.textContent = progressMessage;
                console.log('Progress:', progressMessage);
            },
            useAutoDetect  // Explicitly enable auto-detection
        );

        if (result.success) {
            // Show transcription result
            showTranscription(result.transcription, result.languageName);

            // Store transcription in session
            sessionStorage.setItem('transcription', result.transcription);
            sessionStorage.setItem('transcriptionLanguage', result.language);
            sessionStorage.setItem('transcriptionLanguageName', result.languageName);
        } else {
            // Show error
            showError(`Transcription failed: ${result.error}`);
        }

    } catch (error) {
        console.error('Error processing audio:', error);
        showError(`Error processing audio: ${error.message}`);
    }
}

// Show transcription in preview
function showTranscription(transcription, languageName) {
    statusText.textContent = 'Transcription complete!';
    statusText.style.color = 'var(--success)';

    previewText.textContent = transcription;
    transcriptionPreview.classList.remove('hidden');

    // Add language badge
    if (!document.getElementById('language-badge')) {
        const badge = document.createElement('span');
        badge.id = 'language-badge';
        badge.className = 'language-badge';
        badge.textContent = languageName;
        document.querySelector('.preview-title').appendChild(badge);
    } else {
        document.getElementById('language-badge').textContent = languageName;
    }

    // Scroll to preview
    transcriptionPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Show error message
function showError(message) {
    statusText.textContent = message;
    statusText.style.color = 'var(--error)';

    // Show retry option
    setTimeout(() => {
        statusText.textContent = 'Click the microphone to try again';
        statusText.style.color = '';
    }, 5000);
}

// Retry button - record again
retryBtn.addEventListener('click', () => {
    transcriptionPreview.classList.add('hidden');
    statusText.textContent = 'Click the microphone to start recording';
    statusText.style.color = '';

    // Clear stored data
    sessionStorage.removeItem('transcription');
    sessionStorage.removeItem('transcriptionLanguage');
    sessionStorage.removeItem('transcriptionLanguageName');
});

// Continue button - proceed to sign in
continueBtn.addEventListener('click', () => {
    window.location.href = 'signin.html';
});

// Admin override for landing page
document.getElementById('admin-override').addEventListener('click', () => {
    window.location.href = 'signin.html';
});

console.log('Landing page initialized with Bhashini ASR integration.');
console.log('Supported languages:', bhashiniASR.getSupportedLanguages().length);
