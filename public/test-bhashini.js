// Test script to verify Bhashini API configuration
const fetch = require('node-fetch');

const BHASHINI_CONFIG = {
    userId: '21d41f1e0ae54d958d93d8a1c65f96a4',
    ulcaApiKey: '55f53d25d7-50b9-47ec-87e5-f2fe3be4e164',
    pipelineURL: 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline'
};

async function testBhashiniAPI() {
    console.log('Testing Bhashini API Configuration...\n');
    console.log('User ID:', BHASHINI_CONFIG.userId);
    console.log('API Key:', BHASHINI_CONFIG.ulcaApiKey.substring(0, 20) + '...\n');

    try {
        const payload = {
            pipelineTasks: [{
                taskType: "asr",
                config: {
                    language: {
                        sourceLanguage: 'hi'
                    }
                }
            }],
            pipelineRequestConfig: {
                pipelineId: "64392f96daac500b55c543cd"
            }
        };

        console.log('Sending pipeline config request...');
        console.log('Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(BHASHINI_CONFIG.pipelineURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'userID': BHASHINI_CONFIG.userId,
                'ulcaApiKey': BHASHINI_CONFIG.ulcaApiKey
            },
            body: JSON.stringify(payload)
        });

        console.log('\nResponse Status:', response.status, response.statusText);

        const data = await response.json();
        console.log('\nResponse Data:');
        console.log(JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.error('\n❌ ERROR: Bhashini API returned error status:', response.status);
            console.error('Error details:', data);
            process.exit(1);
        }

        console.log('\n✅ SUCCESS: Bhashini API configuration retrieved!');

        if (data.pipelineResponseConfig && data.pipelineInferenceAPIEndPoint) {
            console.log('\n✅ Pipeline configuration is valid');
            console.log('Callback URL:', data.pipelineInferenceAPIEndPoint.callbackUrl);
        } else {
            console.log('\n⚠️  WARNING: Response format may be unexpected');
        }

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testBhashiniAPI();
