const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(session({
    secret: 'soochna-sahayak-secret-key-' + uuidv4(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS with ngrok
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));
app.use(express.static(__dirname, {
    index: 'index.html',
    extensions: ['html', 'htm']
}));

// Create directories if they don't exist
const uploadDir = 'uploads';
const dataDir = 'data';
fs.ensureDirSync(uploadDir);
fs.ensureDirSync(dataDir);
fs.ensureDirSync(path.join(uploadDir, 'cases'));
fs.ensureDirSync(path.join(uploadDir, 'transcriptions'));
fs.ensureDirSync(path.join(uploadDir, 'edited_transcriptions'));

// Bhashini API Configuration
const BHASHINI_CONFIG = {
    userId: '21d41f1e0ae54d958d93d8a1c65f96a4',
    ulcaApiKey: '55f53d25d7-50b9-47ec-87e5-f2fe3be4e164',
    baseURL: 'https://meity-auth.ulcacontrib.org',
    pipelineURL: 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
    computeURL: 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'
};

// Cache for pipeline configurations
const pipelineConfigCache = new Map();

// Data files
const casesFile = path.join(dataDir, 'cases.json');
const transcriptionsFile = path.join(dataDir, 'transcriptions.json');
const filesFile = path.join(dataDir, 'files.json');
const usersFile = path.join(dataDir, 'users.json');

// Initialize data files if they don't exist
const initDataFiles = () => {
    if (!fs.existsSync(casesFile)) {
        fs.writeJsonSync(casesFile, []);
    }
    if (!fs.existsSync(transcriptionsFile)) {
        fs.writeJsonSync(transcriptionsFile, []);
    }
    if (!fs.existsSync(filesFile)) {
        fs.writeJsonSync(filesFile, []);
    }
    if (!fs.existsSync(usersFile)) {
        fs.writeJsonSync(usersFile, []);
    }
};

initDataFiles();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folder = req.body.folder || req.query.folder || 'root';
        const caseId = req.body.caseId || req.query.caseId;

        let destPath = uploadDir;

        console.log('Multer storage - folder:', folder, 'caseId:', caseId);

        if (caseId) {
            destPath = path.join(uploadDir, 'cases', caseId);
        } else if (folder && folder !== 'root' && folder !== '') {
            destPath = path.join(uploadDir, folder);
        }

        console.log('Multer destination path:', destPath);
        fs.ensureDirSync(destPath);
        cb(null, destPath);
    },
    filename: function (req, file, cb) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueName = `${timestamp}_${uuidv4().substring(0, 8)}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow all file types for police evidence
        cb(null, true);
    }
});

// Helper functions
const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (['.mp3', '.wav', '.m4a', '.aac'].includes(ext)) return 'audio';
    if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) return 'video';
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) return 'image';
    if (['.pdf', '.doc', '.docx', '.txt'].includes(ext)) return 'document';
    return 'file';
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// AUTHENTICATION ENDPOINTS
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, designation, station, badgeNumber } = req.body;

        // Validation
        if (!name || !email || !password || !designation || !station) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const users = fs.readJsonSync(usersFile);

        // Check if user already exists
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            designation,
            station,
            badgeNumber: badgeNumber || 'N/A',
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        fs.writeJsonSync(usersFile, users, { spaces: 2 });

        // Set session
        req.session.userId = newUser.id;
        req.session.user = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            designation: newUser.designation,
            station: newUser.station,
            badgeNumber: newUser.badgeNumber
        };

        res.json({
            success: true,
            message: 'Registration successful',
            user: req.session.user
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const users = fs.readJsonSync(usersFile);
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Set session
        req.session.userId = user.id;
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            designation: user.designation,
            station: user.station,
            badgeNumber: user.badgeNumber
        };

        res.json({
            success: true,
            message: 'Login successful',
            user: req.session.user
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/auth/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

app.put('/api/auth/update-profile', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, email, designation, badgeNumber } = req.body;

        if (!name || !email || !designation) {
            return res.status(400).json({ error: 'Name, email, and designation are required' });
        }

        const users = fs.readJsonSync(usersFile);
        const userIndex = users.findIndex(u => u.id === req.session.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if new email is already used by another user
        const existingUser = users.find(u => u.email === email && u.id !== req.session.userId);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use by another user' });
        }

        // Update user
        users[userIndex] = {
            ...users[userIndex],
            name,
            email,
            designation,
            badgeNumber: badgeNumber || users[userIndex].badgeNumber,
            updatedAt: new Date().toISOString()
        };

        fs.writeJsonSync(usersFile, users, { spaces: 2 });

        // Update session
        req.session.user = {
            id: users[userIndex].id,
            name: users[userIndex].name,
            email: users[userIndex].email,
            designation: users[userIndex].designation,
            station: users[userIndex].station,
            badgeNumber: users[userIndex].badgeNumber
        };

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: req.session.user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const users = fs.readJsonSync(usersFile);
        const userIndex = users.findIndex(u => u.id === req.session.userId);

        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, users[userIndex].password);

        if (!passwordMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        users[userIndex].password = hashedPassword;
        users[userIndex].updatedAt = new Date().toISOString();

        fs.writeJsonSync(usersFile, users, { spaces: 2 });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// CASES API ENDPOINTS
app.get('/api/cases', (req, res) => {
    try {
        const cases = fs.readJsonSync(casesFile);
        res.json(cases);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load cases' });
    }
});

app.post('/api/cases', (req, res) => {
    try {
        const cases = fs.readJsonSync(casesFile);
        const newCase = {
            id: `FIR-${new Date().getFullYear()}-${String(cases.length + 1).padStart(6, '0')}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            evidenceFiles: req.body.evidenceFiles || []
        };
        cases.push(newCase);
        fs.writeJsonSync(casesFile, cases, { spaces: 2 });
        res.json(newCase);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create case' });
    }
});

app.put('/api/cases/:id', (req, res) => {
    try {
        const cases = fs.readJsonSync(casesFile);
        const index = cases.findIndex(c => c.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Case not found' });
        }
        cases[index] = { ...cases[index], ...req.body, updatedAt: new Date().toISOString() };
        fs.writeJsonSync(casesFile, cases, { spaces: 2 });
        res.json(cases[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update case' });
    }
});

app.delete('/api/cases/:id', (req, res) => {
    try {
        const cases = fs.readJsonSync(casesFile);
        const index = cases.findIndex(c => c.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Case not found' });
        }
        cases.splice(index, 1);
        fs.writeJsonSync(casesFile, cases, { spaces: 2 });
        res.json({ message: 'Case deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete case' });
    }
});

// TRANSCRIPTIONS API ENDPOINTS
app.get('/api/transcriptions', (req, res) => {
    try {
        const transcriptions = fs.readJsonSync(transcriptionsFile);
        res.json(transcriptions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load transcriptions' });
    }
});

app.post('/api/transcriptions', (req, res) => {
    try {
        const transcriptions = fs.readJsonSync(transcriptionsFile);
        const newTranscription = {
            id: `TRANS-${String(transcriptions.length + 1).padStart(3, '0')}`,
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: req.body.status || 'pending'
        };
        transcriptions.push(newTranscription);
        fs.writeJsonSync(transcriptionsFile, transcriptions, { spaces: 2 });
        res.json(newTranscription);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create transcription' });
    }
});

app.put('/api/transcriptions/:id', (req, res) => {
    try {
        const transcriptions = fs.readJsonSync(transcriptionsFile);
        const index = transcriptions.findIndex(t => t.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Transcription not found' });
        }
        transcriptions[index] = { ...transcriptions[index], ...req.body, updatedAt: new Date().toISOString() };
        fs.writeJsonSync(transcriptionsFile, transcriptions, { spaces: 2 });
        res.json(transcriptions[index]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transcription' });
    }
});

app.delete('/api/transcriptions/:id', (req, res) => {
    try {
        const transcriptions = fs.readJsonSync(transcriptionsFile);
        const index = transcriptions.findIndex(t => t.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'Transcription not found' });
        }
        transcriptions.splice(index, 1);
        fs.writeJsonSync(transcriptionsFile, transcriptions, { spaces: 2 });
        res.json({ message: 'Transcription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transcription' });
    }
});

// FILES API ENDPOINTS
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load files' });
    }
});

app.post('/api/files/upload', upload.array('files', 10), (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const uploadedFiles = [];

        const targetFolder = req.body.folder || 'root';
        console.log(`Uploading ${req.files.length} files to folder: ${targetFolder}`);

        req.files.forEach(file => {
            console.log(`Processing file: ${file.originalname}, saved to: ${file.path}`);

            const fileInfo = {
                id: uuidv4(),
                name: file.originalname,
                filename: file.filename,
                type: getFileType(file.originalname),
                size: formatFileSize(file.size),
                sizeBytes: file.size,
                path: file.path,
                uploadedAt: new Date().toISOString(),
                caseId: req.body.caseId || null,
                folder: targetFolder === 'root' ? null : targetFolder // Set to null for root, folder name for subfolders
            };
            files.push(fileInfo);
            uploadedFiles.push(fileInfo);

            console.log(`File record created:`, {
                name: fileInfo.name,
                folder: fileInfo.folder,
                path: fileInfo.path
            });
        });

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json({ message: 'Files uploaded successfully', files: uploadedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

app.post('/api/files/folder', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const newFolder = {
            id: uuidv4(),
            name: req.body.name,
            type: 'folder',
            size: '-',
            sizeBytes: 0,
            createdAt: new Date().toISOString(),
            parentFolder: req.body.parentFolder || 'root'
        };
        files.push(newFolder);
        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json(newFolder);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

app.delete('/api/files/:id', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const index = files.findIndex(f => f.id === req.params.id);
        if (index === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileToDelete = files[index];

        // Delete physical file if it exists
        if (fileToDelete.path && fileToDelete.type !== 'folder') {
            try {
                fs.removeSync(fileToDelete.path);
            } catch (err) {
                console.log('File already deleted or not found:', err.message);
            }
        }

        files.splice(index, 1);
        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

app.delete('/api/files', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const fileIds = req.body.fileIds || [];

        fileIds.forEach(fileId => {
            const index = files.findIndex(f => f.id === fileId);
            if (index !== -1) {
                const fileToDelete = files[index];

                // Delete physical file if it exists
                if (fileToDelete.path && fileToDelete.type !== 'folder') {
                    try {
                        fs.removeSync(fileToDelete.path);
                    } catch (err) {
                        console.log('File already deleted or not found:', err.message);
                    }
                }

                files.splice(index, 1);
            }
        });

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json({ message: `${fileIds.length} files deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete files' });
    }
});

// Move files to folder
app.put('/api/files/move', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const { fileIds, targetFolder } = req.body;

        fileIds.forEach(fileId => {
            const fileIndex = files.findIndex(f => f.id === fileId);
            if (fileIndex !== -1) {
                const file = files[fileIndex];
                const oldPath = file.path;

                // Create new path
                let newDir = uploadDir;
                if (targetFolder && targetFolder !== 'root') {
                    newDir = path.join(uploadDir, targetFolder);
                    fs.ensureDirSync(newDir);
                }

                const newPath = path.join(newDir, path.basename(oldPath));

                // Move physical file
                if (fs.existsSync(oldPath)) {
                    fs.moveSync(oldPath, newPath);
                }

                // Update file record
                files[fileIndex].path = newPath;
                files[fileIndex].folder = targetFolder || 'root';
            }
        });

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json({ message: 'Files moved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to move files' });
    }
});

// Rename file
app.put('/api/files/:id/rename', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const { newName } = req.body;
        const fileIndex = files.findIndex(f => f.id === req.params.id);

        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[fileIndex];
        const oldPath = file.path;

        if (file.type !== 'folder') {
            const ext = path.extname(file.name);
            const newFileName = newName.endsWith(ext) ? newName : newName + ext;
            const newPath = path.join(path.dirname(oldPath), newFileName);

            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
                files[fileIndex].path = newPath;
            }
            files[fileIndex].name = newFileName;
        } else {
            files[fileIndex].name = newName;
        }

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json(files[fileIndex]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// Serve uploaded files
app.get('/uploads/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Serve files from subfolders
app.get('/uploads/:folder/:filename', (req, res) => {
    const { folder, filename } = req.params;
    const filePath = path.join(uploadDir, folder, filename);

    if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

// Serve files with proper MIME types and headers
app.get('/file/:fileId', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const file = files.find(f => f.id === req.params.fileId);

        if (!file || file.type === 'folder') {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.resolve(file.path);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found at path: ${filePath}`);
            console.log(`Original path from database: ${file.path}`);
            return res.status(404).json({ error: 'Physical file not found', path: file.path, resolvedPath: filePath });
        }

        // Set appropriate MIME type based on file extension
        const ext = path.extname(file.name).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.mp3': 'audio/mpeg',
            '.wav': 'audio/wav',
            '.webm': 'audio/webm',
            '.mp4': 'video/mp4',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript'
        };

        if (mimeTypes[ext]) {
            res.setHeader('Content-Type', mimeTypes[ext]);
        }

        res.sendFile(path.resolve(filePath));
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bhashini ASR Pipeline Configuration
async function getBhashiniPipeline(language = 'hi') {
    console.log(`Getting pipeline config for language: ${language}`);

    // Check cache first
    if (pipelineConfigCache.has(language)) {
        console.log(`Using cached config for ${language}`);
        return pipelineConfigCache.get(language);
    }

    try {
        const payload = {
            pipelineTasks: [{
                taskType: "asr",
                config: {
                    language: {
                        sourceLanguage: language
                    }
                }
            }],
            pipelineRequestConfig: {
                pipelineId: "64392f96daac500b55c543cd"
            }
        };

        console.log('Pipeline request payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(BHASHINI_CONFIG.pipelineURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'userID': BHASHINI_CONFIG.userId,
                'ulcaApiKey': BHASHINI_CONFIG.ulcaApiKey
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Pipeline API error - Status: ${response.status}, Response: ${errorText}`);
            throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
        }

        const data = await response.json();
        console.log('Pipeline config response:', JSON.stringify(data, null, 2));

        // Parse the successful response
        if (data.pipelineResponseConfig &&
            data.pipelineResponseConfig[0] &&
            data.pipelineResponseConfig[0].config &&
            data.pipelineResponseConfig[0].config[0] &&
            data.pipelineInferenceAPIEndPoint) {

            const authName = (data.pipelineInferenceAPIEndPoint.inferenceApiKey && (data.pipelineInferenceAPIEndPoint.inferenceApiKey.name || data.pipelineInferenceAPIEndPoint.inferenceApiKey.key)) || 'Authorization';
            const authValue = data.pipelineInferenceAPIEndPoint.inferenceApiKey && data.pipelineInferenceAPIEndPoint.inferenceApiKey.value;
            if (!authValue) throw new Error('Missing inference API auth token in pipeline response');

            const config = {
                serviceId: data.pipelineResponseConfig[0].config[0].serviceId,
                authHeaderName: authName,
                authToken: authValue,
                callbackUrl: data.pipelineInferenceAPIEndPoint.callbackUrl,
                modelId: data.pipelineResponseConfig[0].config[0].modelId,
                domain: data.pipelineResponseConfig[0].config[0].domain || 'general'
            };

            pipelineConfigCache.set(language, config);
            console.log(`Config cached for ${language}:`, config);
            return config;
        } else {
            throw new Error(`Invalid pipeline configuration response format. Response: ${JSON.stringify(data)}`);
        }
    } catch (error) {
        console.error('Pipeline config error:', error);
        throw error;
    }
}

// ASR Transcription endpoint
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        const language = req.body.language || 'hi'; // Default to Hindi
        console.log(`Transcribing audio for language: ${language}`);
        console.log(`Audio file: ${req.file.originalname}, size: ${req.file.size} bytes, path: ${req.file.path}`);

        // Get Bhashini configuration (no fallback)
        const config = await getBhashiniPipeline(language);
        console.log('Using Bhashini ASR');

        // Read audio file and convert to base64 for Bhashini
        const audioData = fs.readFileSync(req.file.path);
        const base64Audio = audioData.toString('base64');

        // Determine audio format from mimetype first, then extension
        let audioFormat = 'wav';
        if (req.file.mimetype) {
            if (req.file.mimetype.includes('webm')) audioFormat = 'webm';
            else if (req.file.mimetype.includes('ogg')) audioFormat = 'ogg';
            else if (req.file.mimetype.includes('mp4') || req.file.mimetype.includes('m4a')) audioFormat = 'mp4';
            else if (req.file.mimetype.includes('wav')) audioFormat = 'wav';
            else if (req.file.mimetype.includes('mpeg')) audioFormat = 'mp3';
        } else {
            const fileExt = path.extname(req.file.originalname).toLowerCase();
            if (fileExt === '.webm') audioFormat = 'webm';
            else if (fileExt === '.mp4' || fileExt === '.m4a') audioFormat = 'mp4';
            else if (fileExt === '.ogg') audioFormat = 'ogg';
            else if (fileExt === '.mp3') audioFormat = 'mp3';
        }

        // Try to detect sampling rate for WAV
        let samplingRate = 16000;
        try {
            if (audioFormat === 'wav' && audioData.length > 28) {
                samplingRate = audioData.readUInt32LE(24);
            }
        } catch (e) {
            console.warn('Failed to detect sampling rate, using default 16000');
        }

        console.log(`Audio format: ${audioFormat}, samplingRate: ${samplingRate}, size: ${audioData.length} bytes`);

        // Prepare inference request with correct structure
        const payload = {
            pipelineTasks: [{
                taskType: "asr",
                config: {
                    language: {
                        sourceLanguage: language
                    },
                    serviceId: config.serviceId,
                    audioFormat: audioFormat,
                    samplingRate: samplingRate
                }
            }],
            inputData: {
                audio: [{ audioContent: base64Audio }]
            }
        };

        console.log('ASR compute payload (audio truncated for logging):', JSON.stringify({
            ...payload,
            inputData: {
                ...payload.inputData,
                audio: [{ audioContent: `[BASE64_DATA_${base64Audio.length}_CHARS]` }]
            }
        }, null, 2));

        // Call Bhashini compute API
        const headers = { 'Content-Type': 'application/json' };
        headers[config.authHeaderName || 'Authorization'] = config.authToken;

        const response = await fetch(BHASHINI_CONFIG.computeURL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Bhashini API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('ASR compute response:', JSON.stringify(result, null, 2));

        // Extract transcription
        if (result.pipelineResponse &&
            result.pipelineResponse[0] &&
            result.pipelineResponse[0].output &&
            result.pipelineResponse[0].output[0]) {

            const transcription = result.pipelineResponse[0].output[0].source;
            console.log(`Transcription result: ${transcription}`);

            // Save transcription result
            const transcriptionData = {
                id: `ASR-${uuidv4().substring(0, 8)}`,
                audioFile: req.file.filename,
                audioPath: req.file.path,
                transcription: transcription || 'No transcription available',
                language: language,
                timestamp: new Date().toISOString(),
                duration: req.body.duration || null,
                caseId: req.body.caseId || null
            };

            res.json({
                success: true,
                transcription: transcription || 'No transcription available',
                audioFile: req.file.filename,
                language: language,
                data: transcriptionData
            });
        } else {
            throw new Error('Invalid ASR response format');
        }

    } catch (error) {
        console.error('ASR Error:', error);
        res.status(502).json({
            error: 'Transcription failed',
            details: error.message
        });
    }
});

// Test endpoint to check Bhashini connectivity
app.get('/api/test-bhashini', async (req, res) => {
    try {
        console.log('Testing Bhashini connectivity...');

        // Test pipeline configuration
        const config = await getBhashiniPipeline('hi');

        res.json({
            success: true,
            message: 'Bhashini connection successful',
            config: {
                serviceId: config.serviceId,
                modelId: config.modelId,
                domain: config.domain,
                hasAuthToken: !!config.authToken
            }
        });
    } catch (error) {
        console.error('Bhashini test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            details: 'Check your Bhashini API credentials and network connectivity'
        });
    }
});

// File operations endpoints
app.put('/api/files/:id/move', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const fileIndex = files.findIndex(f => f.id === req.params.id);

        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const targetFolder = req.body.targetFolder;
        const file = files[fileIndex];

        console.log(`Moving file: ${file.name} to folder: ${targetFolder || 'root'}`);
        console.log(`Current file path: ${file.path}`);

        // Don't move folders for now, just update their metadata
        if (file.type === 'folder') {
            files[fileIndex] = {
                ...file,
                folder: targetFolder,
                updatedAt: new Date().toISOString()
            };
            fs.writeJsonSync(filesFile, files, { spaces: 2 });
            return res.json(files[fileIndex]);
        }

        // For actual files, move the physical file
        const currentPath = path.resolve(file.path || path.join(uploadDir, file.filename || file.name));

        // Determine new path based on target folder
        let newDir;
        let targetFolderName = null;

        if (targetFolder) {
            // Find the folder name from the folder ID
            const targetFolderObj = files.find(f => f.id === targetFolder && f.type === 'folder');
            if (!targetFolderObj) {
                return res.status(400).json({ error: 'Target folder not found' });
            }
            targetFolderName = targetFolderObj.name;
            newDir = path.join(uploadDir, targetFolderName);
            // Ensure target directory exists
            fs.ensureDirSync(newDir);
            console.log(`Target folder: ${targetFolderName} (ID: ${targetFolder})`);
        } else {
            newDir = uploadDir; // Root directory
        }

        const newPath = path.join(newDir, path.basename(currentPath));

        console.log(`Moving from: ${currentPath} to: ${newPath}`);

        // Check if source file exists
        if (!fs.existsSync(currentPath)) {
            console.error(`Source file not found: ${currentPath}`);
            return res.status(404).json({ error: 'Source file not found' });
        }

        // Move the physical file
        fs.moveSync(currentPath, newPath);

        // Update file record - use folder ID for consistency but ensure physical folder name is used for directory
        files[fileIndex] = {
            ...file,
            folder: targetFolder || null, // Store folder ID for database consistency, null for root
            path: newPath,
            updatedAt: new Date().toISOString()
        };

        console.log(`Updated file metadata:`, {
            id: file.id,
            name: file.name,
            folder: targetFolder,
            path: newPath
        });

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        console.log(`File moved successfully from ${currentPath} to ${newPath}`);

        res.json(files[fileIndex]);
    } catch (error) {
        console.error('Move file error:', error);
        res.status(500).json({ error: `Failed to move file: ${error.message}` });
    }
});

app.put('/api/files/:id/rename', (req, res) => {
    try {
        const files = fs.readJsonSync(filesFile);
        const fileIndex = files.findIndex(f => f.id === req.params.id);

        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const newName = req.body.newName;
        files[fileIndex] = {
            ...files[fileIndex],
            name: newName,
            updatedAt: new Date().toISOString()
        };

        fs.writeJsonSync(filesFile, files, { spaces: 2 });
        res.json(files[fileIndex]);
    } catch (error) {
        console.error('Rename file error:', error);
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// ANALYTICS ENDPOINTS (for charts - keeping mock data for now)
app.get('/api/analytics/dashboard', (req, res) => {
    try {
        const cases = fs.readJsonSync(casesFile);
        const totalFirs = cases.length;
        const pendingCases = cases.filter(c => c.status === 'pending').length;
        const closedCases = cases.filter(c => c.status === 'closed').length;
        const inProgressCases = cases.filter(c => c.status === 'progress').length;

        res.json({
            totalFirs,
            pendingCases,
            closedCases,
            inProgressCases
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load analytics' });
    }
});

// Default route - serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Soochna Sahayak Server running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${path.resolve(uploadDir)}`);
    console.log(`💾 Data directory: ${path.resolve(dataDir)}`);
    console.log('✅ Server ready and fully operational!');
});

module.exports = app;