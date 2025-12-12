// ==================== //
// BHASHINI API CONFIGURATION
// ==================== //

/**
 * TODO: Add your Bhashini API credentials here
 * Get your credentials from: https://bhashini.gov.in/
 */

const BHASHINI_CONFIG = {
    // Your Bhashini User ID
    userId: '21d41f1e0ae54d958d93d8a1c65f96a4',

    // Your ULCA API Key
    ulcaApiKey: '025f6d4ca8-74bc-4847-8bbf-70f1ed42b166',

    // Your Inference API Key (obtained from pipeline config)
    inferenceApiKey: '_YAUfmAYfUNLzxvgSCskYG1SwoyckUG3fUQpED4X8ReBi-5jS-GyaUf-9W9eEplG',

    // API Endpoints
    endpoints: {
        pipeline: 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
        compute: 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'
    },

    // Supported Languages (ISO 639 language codes)
    languages: [
        { code: 'en', name: 'English', serviceId: '' },
        { code: 'hi', name: 'हिंदी (Hindi)', serviceId: '' },
        { code: 'bn', name: 'বাংলা (Bengali)', serviceId: '' },
        { code: 'ta', name: 'தமிழ் (Tamil)', serviceId: '' },
        { code: 'te', name: 'తెలుగు (Telugu)', serviceId: '' },
        { code: 'mr', name: 'मराठी (Marathi)', serviceId: '' },
        { code: 'gu', name: 'ગુજરાતી (Gujarati)', serviceId: '' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', serviceId: '' },
        { code: 'ml', name: 'മലയാളം (Malayalam)', serviceId: '' },
        { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', serviceId: '' },
        { code: 'or', name: 'ଓଡ଼ିଆ (Odia)', serviceId: '' },
        { code: 'as', name: 'অসমীয়া (Assamese)', serviceId: '' },
        { code: 'ur', name: 'اردو (Urdu)', serviceId: '' },
        { code: 'sa', name: 'संस्कृत (Sanskrit)', serviceId: '' },
        { code: 'ne', name: 'नेपाली (Nepali)', serviceId: '' },
        { code: 'sd', name: 'سنڌي (Sindhi)', serviceId: '' },
        { code: 'ks', name: 'कॉशुर (Kashmiri)', serviceId: '' },
        { code: 'mai', name: 'मैथिली (Maithili)', serviceId: '' },
        { code: 'doi', name: 'डोगरी (Dogri)', serviceId: '' },
        { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)', serviceId: '' },
        { code: 'mni', name: 'মৈতৈলোন্ (Manipuri)', serviceId: '' },
        { code: 'kok', name: 'कोंकणी (Konkani)', serviceId: '' }
    ],

    // Audio Configuration
    audio: {
        sampleRate: 16000,
        format: 'wav',
        encoding: 'pcm',
        channels: 1
    },

    // Default settings
    defaults: {
        language: 'en', // Default language
        timeout: 30000, // 30 seconds timeout
        maxRetries: 3
    }
};

// Validate configuration
function validateBhashiniConfig() {
    const required = ['userId', 'ulcaApiKey', 'inferenceApiKey'];
    const missing = required.filter(key =>
        BHASHINI_CONFIG[key] === '' ||
        BHASHINI_CONFIG[key].includes('YOUR_')
    );

    if (missing.length > 0) {
        console.warn('⚠️ Bhashini API Configuration Incomplete!');
        console.warn('Missing or invalid:', missing.join(', '));
        console.warn('Please update bhashini-config.js with your API credentials');
        return false;
    }

    console.log('✅ Bhashini API Configuration Valid');
    return true;
}

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BHASHINI_CONFIG, validateBhashiniConfig };
}
