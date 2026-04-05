// ==================== //
// BHASHINI ASR MODULE WITH AUTOMATIC LANGUAGE DETECTION
// ==================== //

/**
 * Bhashini Automatic Speech Recognition (ASR) Integration
 * with Audio Language Detection (ALD)
 * Handles audio transcription using Bhashini API
 */

class BhashiniASR {
    constructor() {
        this.config = BHASHINI_CONFIG;
        this.pipelineConfig = null;
        this.isConfigured = validateBhashiniConfig();
    }

    /**
     * Get pipeline configuration for ASR task
     * @param {string} sourceLanguage - Language code (e.g., 'en', 'hi', 'ta')
     * @returns {Promise<Object>} Pipeline configuration
     */
    async getPipelineConfig(sourceLanguage) {
        const requestBody = {
            pipelineTasks: [
                {
                    taskType: "asr",
                    config: {
                        language: {
                            sourceLanguage: sourceLanguage
                        }
                    }
                }
            ],
            pipelineRequestConfig: {
                pipelineId: "64392f96daac500b55c543cd"
            }
        };

        try {
            const response = await fetch(this.config.endpoints.pipeline, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'userID': this.config.userId,
                    'ulcaApiKey': this.config.ulcaApiKey
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`Pipeline config failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.pipelineConfig = data;

            // Extract service ID and callback URL
            if (data.pipelineResponseConfig && data.pipelineResponseConfig.length > 0) {
                const asrConfig = data.pipelineResponseConfig[0];
                return {
                    serviceId: asrConfig.config[0].serviceId,
                    callbackUrl: asrConfig.config[0].callbackUrl || this.config.endpoints.compute,
                    inferenceApiKey: asrConfig.config[0].inferenceApiKey?.value || this.config.inferenceApiKey
                };
            }

            throw new Error('Invalid pipeline configuration response');
        } catch (error) {
            console.error('Error getting pipeline config:', error);
            throw error;
        }
    }

    /**
     * Detect language from audio using Bhashini ALD (DIRECT COMPUTE CALL)
     * @param {Blob} audioBlob - Audio blob to analyze
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Detection result with language code
     */
    async detectLanguage(audioBlob, onProgress = null) {
        if (!this.isConfigured) {
            throw new Error('Bhashini ASR is not configured. Please update bhashini-config.js with your API credentials.');
        }

        try {
            // Step 1: Convert audio to WAV format
            if (onProgress) onProgress('🎵 Preparing audio for language detection...');
            const wavBlob = await this.convertToWav(audioBlob);

            // Step 2: Convert to base64
            if (onProgress) onProgress('📦 Encoding audio...');
            const base64Audio = await this.audioToBase64(wavBlob);

            // Step 3: Prepare ALD compute request (NO pipeline config needed!)
            const aldRequest = {
                pipelineTasks: [
                    {
                        taskType: "audio-lang-detection",
                        config: {
                            serviceId: "bhashini/iitmandi/audio-lang-detection/gpu"
                        }
                    }
                ],
                inputData: {
                    audio: [
                        {
                            audioContent: base64Audio
                        }
                    ]
                }
            };

            console.log('🔍 ALD Request:', {
                taskType: aldRequest.pipelineTasks[0].taskType,
                serviceId: aldRequest.pipelineTasks[0].config.serviceId,
                audioSize: base64Audio.length
            });

            // Step 4: Call ALD compute API DIRECTLY
            if (onProgress) onProgress('🔍 Detecting language...');
            const response = await fetch(this.config.endpoints.compute, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.config.inferenceApiKey
                },
                body: JSON.stringify(aldRequest)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ ALD API Error Response:', errorText);
                throw new Error(`ALD inference failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('✅ ALD Response:', result);

            // Step 5: Extract detected language from response
            // Response format: { pipelineResponse: [{ output: [{ langPrediction: [{ langCode: "hi" }] }] }] }
            if (result.pipelineResponse && result.pipelineResponse.length > 0) {
                const aldOutput = result.pipelineResponse[0].output;
                if (aldOutput && aldOutput.length > 0 && aldOutput[0].langPrediction && aldOutput[0].langPrediction.length > 0) {
                    const detectedLanguage = aldOutput[0].langPrediction[0].langCode;
                    const langScore = aldOutput[0].langPrediction[0].langScore;

                    console.log(`✅ Language detected: ${detectedLanguage} (${this.getLanguageName(detectedLanguage)}) - Score: ${langScore}`);

                    if (onProgress) onProgress(`✅ Detected: ${this.getLanguageName(detectedLanguage)}`);

                    return {
                        success: true,
                        language: detectedLanguage,
                        languageName: this.getLanguageName(detectedLanguage),
                        confidence: langScore,
                        raw: result
                    };
                }
            }

            throw new Error('No language detected in response');
        } catch (error) {
            console.error('❌ Bhashini ALD Error:', error);
            return {
                success: false,
                error: error.message,
                language: null
            };
        }
    }

    /**
     * Convert audio blob to base64
     * @param {Blob} audioBlob - Audio blob to convert
     * @returns {Promise<string>} Base64 encoded audio
     */
    async audioToBase64(audioBlob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remove data URL prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
    }

    /**
     * Convert audio to WAV format if needed
     * @param {Blob} audioBlob - Original audio blob
     * @returns {Promise<Blob>} WAV format audio blob
     */
    async convertToWav(audioBlob) {
        // If already WAV, return as is
        if (audioBlob.type === 'audio/wav' || audioBlob.type === 'audio/wave') {
            return audioBlob;
        }

        try {
            // Create audio context
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Convert blob to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();

            // Decode audio data
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

            // Create WAV blob
            const wavBlob = await this.audioBufferToWav(audioBuffer);

            return wavBlob;
        } catch (error) {
            console.error('Error converting audio to WAV:', error);
            // Return original if conversion fails
            return audioBlob;
        }
    }

    /**
     * Convert AudioBuffer to WAV Blob
     * @param {AudioBuffer} audioBuffer - Audio buffer to convert
     * @returns {Promise<Blob>} WAV format blob
     */
    async audioBufferToWav(audioBuffer) {
        const numberOfChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        let result;
        if (numberOfChannels === 2) {
            result = this.interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
        } else {
            result = audioBuffer.getChannelData(0);
        }

        const buffer = new ArrayBuffer(44 + result.length * 2);
        const view = new DataView(buffer);

        // WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + result.length * 2, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * 2, true);
        view.setUint16(32, numberOfChannels * 2, true);
        view.setUint16(34, bitDepth, true);
        this.writeString(view, 36, 'data');
        view.setUint32(40, result.length * 2, true);

        // Write PCM samples
        this.floatTo16BitPCM(view, 44, result);

        return new Blob([buffer], { type: 'audio/wav' });
    }

    /**
     * Helper function to write string to DataView
     */
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    /**
     * Helper function to interleave stereo channels
     */
    interleave(leftChannel, rightChannel) {
        const length = leftChannel.length + rightChannel.length;
        const result = new Float32Array(length);

        let inputIndex = 0;
        for (let index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    /**
     * Helper function to convert float to 16-bit PCM
     */
    floatTo16BitPCM(view, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    /**
     * Transcribe audio using Bhashini ASR API with automatic language detection
     * @param {Blob} audioBlob - Audio blob to transcribe
     * @param {string} sourceLanguage - Source language code (optional, will auto-detect if not provided)
     * @param {Function} onProgress - Progress callback
     * @param {boolean} autoDetect - Whether to use automatic language detection (default: true)
     * @returns {Promise<Object>} Transcription result
     */
    async transcribe(audioBlob, sourceLanguage = null, onProgress = null, autoDetect = true) {
        if (!this.isConfigured) {
            throw new Error('Bhashini ASR is not configured. Please update bhashini-config.js with your API credentials.');
        }

        try {
            let detectedLanguage = sourceLanguage;
            let languageDetectionResult = null;

            // Step 1: Auto-detect language if not provided or autoDetect is true
            if (autoDetect || !sourceLanguage) {
                console.log('🔍 Starting auto-detection...');
                if (onProgress) onProgress('🔍 Auto-detecting language...');

                languageDetectionResult = await this.detectLanguage(audioBlob, onProgress);

                if (languageDetectionResult.success) {
                    const confidence = languageDetectionResult.confidence || 0;
                    const CONFIDENCE_THRESHOLD = 0.70; // Minimum confidence to trust ALD

                    if (confidence >= CONFIDENCE_THRESHOLD) {
                        detectedLanguage = languageDetectionResult.language;
                        console.log(`✅ ALD trusted: ${detectedLanguage} (confidence: ${(confidence * 100).toFixed(1)}%)`);
                    } else {
                        // Low confidence — ALD is unreliable, use fallback
                        detectedLanguage = sourceLanguage || 'hi';
                        console.warn(`⚠️ ALD confidence too low (${(confidence * 100).toFixed(1)}% < ${CONFIDENCE_THRESHOLD * 100}%). Falling back to: ${detectedLanguage}`);
                        if (onProgress) onProgress(`⚠️ Low confidence detection (${(confidence * 100).toFixed(1)}%), using ${this.getLanguageName(detectedLanguage)}...`);
                    }
                } else {
                    // Fallback to provided language or default to English
                    detectedLanguage = sourceLanguage || 'en';
                    console.warn(`⚠️ Language detection failed, using fallback: ${detectedLanguage}`);
                    if (onProgress) onProgress(`⚠️ Using ${this.getLanguageName(detectedLanguage)} as fallback...`);
                }
            } else {
                console.log(`📌 Using manual language selection: ${detectedLanguage}`);
            }

            // Step 2: Get pipeline configuration for ASR
            if (onProgress) onProgress(`⚙️ Getting ${this.getLanguageName(detectedLanguage)} transcription pipeline...`);
            const pipelineConfig = await this.getPipelineConfig(detectedLanguage);

            // Step 3: Convert audio to WAV format
            if (onProgress) onProgress('🎵 Converting audio to WAV format...');
            const wavBlob = await this.convertToWav(audioBlob);

            // Step 4: Convert to base64
            if (onProgress) onProgress('📦 Encoding audio...');
            const base64Audio = await this.audioToBase64(wavBlob);

            // Step 5: Prepare inference request
            const inferenceRequest = {
                pipelineTasks: [
                    {
                        taskType: "asr",
                        config: {
                            language: {
                                sourceLanguage: detectedLanguage
                            },
                            serviceId: pipelineConfig.serviceId,
                            audioFormat: "wav",
                            samplingRate: this.config.audio.sampleRate
                        }
                    }
                ],
                inputData: {
                    audio: [
                        {
                            audioContent: base64Audio
                        }
                    ]
                }
            };

            // Step 6: Call ASR inference API
            if (onProgress) onProgress(`🎤 Transcribing in ${this.getLanguageName(detectedLanguage)}...`);
            const response = await fetch(pipelineConfig.callbackUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': pipelineConfig.inferenceApiKey
                },
                body: JSON.stringify(inferenceRequest)
            });

            if (!response.ok) {
                throw new Error(`ASR inference failed: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // Step 7: Extract transcription from response
            if (result.pipelineResponse && result.pipelineResponse.length > 0) {
                const asrOutput = result.pipelineResponse[0].output;
                if (asrOutput && asrOutput.length > 0) {
                    const transcription = asrOutput[0].source;

                    if (onProgress) onProgress('✅ Transcription complete!');
                    console.log('✅ Transcription successful:', transcription);

                    return {
                        success: true,
                        transcription: transcription,
                        language: detectedLanguage,
                        languageName: this.getLanguageName(detectedLanguage),
                        detectedLanguage: languageDetectionResult?.language || null,
                        detectionConfidence: languageDetectionResult?.confidence || null,
                        wasAutoDetected: autoDetect || !sourceLanguage,
                        raw: result
                    };
                }
            }

            throw new Error('No transcription found in response');
        } catch (error) {
            console.error('❌ Bhashini ASR Error:', error);
            return {
                success: false,
                error: error.message,
                language: sourceLanguage
            };
        }
    }

    /**
     * Get language name from code
     * @param {string} code - Language code
     * @returns {string} Language name
     */
    getLanguageName(code) {
        const language = this.config.languages.find(lang => lang.code === code);
        return language ? language.name : code;
    }

    /**
     * Get all supported languages
     * @returns {Array} List of supported languages
     */
    getSupportedLanguages() {
        return this.config.languages;
    }
}

// Create global instance
const bhashiniASR = new BhashiniASR();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BhashiniASR;
}
