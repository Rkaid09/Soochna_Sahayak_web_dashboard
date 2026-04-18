require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const { put, del } = require('@vercel/blob');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// ─── MongoDB Connection (Serverless Optimized) ────────────────────────────────
mongoose.set('strictQuery', false);

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return mongoose.connection;
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 30000,
            family: 4
        });
        console.log('✅ Connected to MongoDB Atlas');
        return mongoose.connection;
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err);
        throw err;
    }
};

// ─── Note: session store is set up after schemas — uses mongoose.connection directly
// ─── Mongoose Schemas ─────────────────────────────────────────────────────────

const caseSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    title: String,
    complainant: Object,
    accused: Object,
    incident: Object,
    sections: [String],
    status: { type: String, default: 'pending' },
    assignedOfficer: Object,
    stationCode: String,
    evidenceFiles: { type: Array, default: [] },
    transcription: String,
    sourceApp: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const transcriptionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    audioFile: String,
    audioUrl: String,
    transcription: String,
    language: String,
    status: { type: String, default: 'pending' },
    caseId: String,
    duration: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { strict: false });

const fileSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    filename: String,
    type: String,
    size: String,
    sizeBytes: Number,
    url: String,       // Vercel Blob URL
    blobKey: String,   // Vercel Blob pathname (for deletion)
    folder: String,
    caseId: String,
    uploadedAt: { type: Date, default: Date.now }
}, { strict: false });

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    password: String,
    designation: String,
    station: String,
    badgeNumber: String,
    createdAt: { type: Date, default: Date.now }
});

const Case = mongoose.model('Case', caseSchema);
const Transcription = mongoose.model('Transcription', transcriptionSchema);
const FileRecord = mongoose.model('FileRecord', fileSchema);
const User = mongoose.model('User', userSchema);

// ─── Bhashini API Configuration ───────────────────────────────────────────────
const BHASHINI_CONFIG = {
    userId: process.env.BHASHINI_USER_ID || '21d41f1e0ae54d958d93d8a1c65f96a4',
    ulcaApiKey: process.env.BHASHINI_API_KEY || '55f53d25d7-50b9-47ec-87e5-f2fe3be4e164',
    baseURL: 'https://meity-auth.ulcacontrib.org',
    pipelineURL: 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline',
    computeURL: 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'
};

// Cache for pipeline configurations (in-memory per instance)
const pipelineConfigCache = new Map();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        res.status(503).json({ error: 'Database connection is currently unavailable. Please try again in a few seconds.', details: error.message });
    }
});

// Session store — uses Mongoose connection client (connect-mongo v4+/v6)
// Falls back to in-memory store if MONGODB_URI is not configured
const sessionOptions = {
    secret: process.env.SESSION_SECRET || 'soochna-sahayak-dev-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
};

if (process.env.MONGODB_URI) {
    // Get native MongoDB client from Mongoose after connecting
    const sessionClientPromise = connectDB()
        .then(conn => conn.getClient())
        .catch(err => {
            console.error('⚠️ Session store client unavailable:', err.message);
            return null;
        });
    try {
        sessionOptions.store = MongoStore.create({
            clientPromise: sessionClientPromise,
            collectionName: 'sessions',
            ttl: 7 * 24 * 60 * 60,
            touchAfter: 24 * 3600
        });
    } catch (e) {
        console.error('⚠️ MongoStore.create failed, using memory store:', e.message);
    }
} else {
    console.warn('⚠️ MONGODB_URI not set — sessions will use in-memory store (not persistent)');
}

app.use(session(sessionOptions));

// Cache control — prevent caching of JavaScript files
app.use((req, res, next) => {
    if (req.url.endsWith('.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    index: 'index.html',
    extensions: ['html', 'htm']
}));

// ─── Multer — Memory Storage (for Vercel Blob) ────────────────────────────────
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: function (req, file, cb) { cb(null, true); }
});

// ─── Helper Functions ─────────────────────────────────────────────────────────
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

// ─── Inverse Text Normalization ───────────────────────────────────────────────
// Convert spoken numbers to digits (Hindi/Hinglish + डबल/ट्रिपल multipliers)
function normalizeNumbers(text) {
    if (!text || typeof text !== 'string') return text;

    const DIGIT_WORDS = {
        'शून्य':'0','जीरो':'0','ज़ीरो':'0','जिरो':'0','ज़िरो':'0','ज़ेरो':'0',
        'एक':'1','वन':'1','वॉन':'1',
        'दो':'2','टू':'2',
        'तीन':'3','थ्री':'3','थ्रि':'3',
        'चार':'4','फोर':'4','फ़ोर':'4',
        'पाँच':'5','पांच':'5','फाइव':'5','फ़ाइव':'5',
        'छह':'6','छः':'6','सिक्स':'6',
        'सात':'7','सेवन':'7',
        'आठ':'8','एट':'8',
        'नौ':'9','नाइन':'9','नाइँ':'9',
    };

    const MULTIPLIERS = {
        'डबल':2,'दोहरा':2,'double':2,
        'ट्रिपल':3,'तिहरा':3,'triple':3,
    };

    function clean(w) {
        return w.toLowerCase().replace(/[\u0964\u0965।॥,\.?!;:"'()\[\]]/g, '');
    }

    const words = text.split(/\s+/);
    let buf = [];
    let digits = '';
    const out = [];
    let seqHasMult = false;

    function flush(nextWord) {
        if (digits.length > 0) {
            if (seqHasMult || digits.length >= 2) {
                out.push(digits);
            } else {
                out.push(...buf);
            }
        }
        buf = [];
        digits = '';
        seqHasMult = false;
        if (nextWord !== undefined) out.push(nextWord);
    }

    let i = 0;
    while (i < words.length) {
        const w = words[i];
        const k = clean(w);
        const digit = DIGIT_WORDS[k];
        const mult  = MULTIPLIERS[k];

        if (digit !== undefined) {
            buf.push(w);
            digits += digit;
            i++;
        } else if (mult !== undefined) {
            const nw = words[i + 1];
            const nd = nw ? DIGIT_WORDS[clean(nw)] : undefined;
            if (nd !== undefined) {
                buf.push(w, nw);
                digits += nd.repeat(mult);
                seqHasMult = true;
                i += 2;
            } else {
                flush(w);
                i++;
            }
        } else {
            flush(w);
            i++;
        }
    }
    flush();
    return out.join(' ').replace(/\s+/g, ' ').trim();
}

// ─── API Key Auth (for friend's external app) ─────────────────────────────────
const VALID_API_KEYS = new Set(
    (process.env.EXTERNAL_API_KEYS || '').split(',').filter(Boolean)
);

function requireApiKey(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing API key' });
    }
    const key = authHeader.split(' ')[1];
    if (VALID_API_KEYS.size > 0 && !VALID_API_KEYS.has(key)) {
        return res.status(403).json({ error: 'Invalid API key' });
    }
    next();
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, designation, station, badgeNumber } = req.body;
        if (!name || !email || !password || !designation || !station) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'User with this email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            id: uuidv4(), name, email,
            password: hashedPassword, designation, station,
            badgeNumber: badgeNumber || 'N/A'
        });
        await newUser.save();

        req.session.userId = newUser.id;
        req.session.user = {
            id: newUser.id, name, email, designation, station,
            badgeNumber: newUser.badgeNumber
        };
        res.json({ success: true, message: 'Registration successful', user: req.session.user });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Registration failed', details: error.message, stack: error.stack });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password' });

        req.session.userId = user.id;
        req.session.user = {
            id: user.id, name: user.name, email: user.email,
            designation: user.designation, station: user.station,
            badgeNumber: user.badgeNumber
        };
        res.json({ success: true, message: 'Login successful', user: req.session.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message, stack: error.stack });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.get('/api/auth/session', (req, res) => {
    if (req.session && req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.put('/api/auth/update-profile', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { name, email, designation, badgeNumber } = req.body;
        if (!name || !email || !designation) return res.status(400).json({ error: 'Name, email, and designation are required' });

        const existingUser = await User.findOne({ email, id: { $ne: req.session.userId } });
        if (existingUser) return res.status(400).json({ error: 'Email already in use by another user' });

        const user = await User.findOneAndUpdate(
            { id: req.session.userId },
            { name, email, designation, badgeNumber: badgeNumber || undefined, updatedAt: new Date() },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });

        req.session.user = {
            id: user.id, name: user.name, email: user.email,
            designation: user.designation, station: user.station,
            badgeNumber: user.badgeNumber
        };
        res.json({ success: true, message: 'Profile updated successfully', user: req.session.user });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

app.post('/api/auth/change-password', async (req, res) => {
    try {
        if (!req.session || !req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new passwords are required' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters long' });

        const user = await User.findOne({ id: req.session.userId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Current password is incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findOneAndUpdate({ id: req.session.userId }, { password: hashedPassword, updatedAt: new Date() });
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// ─── CASES API ────────────────────────────────────────────────────────────────

app.get('/api/cases', async (req, res) => {
    try {
        const cases = await Case.find().sort({ createdAt: -1 }).lean();
        res.json(cases);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load cases' });
    }
});

app.post('/api/cases', async (req, res) => {
    try {
        const count = await Case.countDocuments();
        const caseId = `FIR-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
        const newCase = new Case({
            id: caseId,
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            evidenceFiles: req.body.evidenceFiles || []
        });
        await newCase.save();
        res.json(newCase.toObject());
    } catch (error) {
        console.error('Create case error:', error);
        res.status(500).json({ error: 'Failed to create case' });
    }
});

app.put('/api/cases/:id', async (req, res) => {
    try {
        const updated = await Case.findOneAndUpdate(
            { id: req.params.id },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Case not found' });
        res.json(updated.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to update case' });
    }
});

app.delete('/api/cases/:id', async (req, res) => {
    try {
        const deleted = await Case.findOneAndDelete({ id: req.params.id });
        if (!deleted) return res.status(404).json({ error: 'Case not found' });
        res.json({ message: 'Case deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete case' });
    }
});

// ─── TRANSCRIPTIONS API ───────────────────────────────────────────────────────

app.get('/api/transcriptions', async (req, res) => {
    try {
        const transcriptions = await Transcription.find().sort({ createdAt: -1 }).lean();
        res.json(transcriptions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load transcriptions' });
    }
});

app.post('/api/transcriptions', async (req, res) => {
    try {
        const count = await Transcription.countDocuments();
        const newTranscription = new Transcription({
            id: `TRANS-${String(count + 1).padStart(3, '0')}`,
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: req.body.status || 'pending'
        });
        await newTranscription.save();
        res.json(newTranscription.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to create transcription' });
    }
});

app.put('/api/transcriptions/:id', async (req, res) => {
    try {
        const updated = await Transcription.findOneAndUpdate(
            { id: req.params.id },
            { ...req.body, updatedAt: new Date() },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: 'Transcription not found' });
        res.json(updated.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transcription' });
    }
});

app.delete('/api/transcriptions/:id', async (req, res) => {
    try {
        const deleted = await Transcription.findOneAndDelete({ id: req.params.id });
        if (!deleted) return res.status(404).json({ error: 'Transcription not found' });
        res.json({ message: 'Transcription deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete transcription' });
    }
});

// ─── FILES API ────────────────────────────────────────────────────────────────

app.get('/api/files', async (req, res) => {
    try {
        const files = await FileRecord.find().sort({ uploadedAt: -1 }).lean();
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load files' });
    }
});

app.post('/api/files/upload', upload.array('files', 10), async (req, res) => {
    try {
        const uploadedFiles = [];
        const caseId = req.body.caseId || null;
        // When a caseId is provided, use it as the folder so files appear
        // under the case folder in the File Manager rather than at root
        const folder = req.body.folder || (caseId ? caseId : null);

        for (const file of req.files) {
            const blobPath = `uploads/${caseId ? `cases/${caseId}` : folder || 'general'}/${Date.now()}_${file.originalname}`;

            const blob = await put(blobPath, file.buffer, {
                access: 'private',
                contentType: file.mimetype
            });

            const fileRecord = new FileRecord({
                id: uuidv4(),
                name: file.originalname,
                filename: file.originalname,
                type: getFileType(file.originalname),
                size: formatFileSize(file.size),
                sizeBytes: file.size,
                url: blob.url,
                blobKey: blob.pathname,
                caseId,
                folder
            });
            await fileRecord.save();
            
            // Add file to the Case's evidence array so it appears in the dashboard
            if (caseId) {
                await Case.findOneAndUpdate(
                    { id: caseId },
                    { $push: { evidenceFiles: fileRecord.filename } }
                );
            }
            
            uploadedFiles.push(fileRecord.toObject());
        }
        res.json({ message: 'Files uploaded successfully', files: uploadedFiles });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

app.post('/api/files/folder', async (req, res) => {
    try {
        const newFolder = new FileRecord({
            id: uuidv4(),
            name: req.body.name,
            type: 'folder',
            size: '-',
            sizeBytes: 0,
            folder: req.body.parentFolder || null
        });
        await newFolder.save();
        res.json(newFolder.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to create folder' });
    }
});

app.delete('/api/files/:id', async (req, res) => {
    try {
        const file = await FileRecord.findOne({ id: req.params.id });
        if (!file) return res.status(404).json({ error: 'File not found' });

        if (file.url && file.type !== 'folder') {
            try { await del(file.url); } catch (err) {
                console.log('Blob delete warning:', err.message);
            }
        }
        await FileRecord.findOneAndDelete({ id: req.params.id });
        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

app.delete('/api/files', async (req, res) => {
    try {
        const fileIds = req.body.fileIds || [];
        for (const fileId of fileIds) {
            const file = await FileRecord.findOne({ id: fileId });
            if (file) {
                if (file.url && file.type !== 'folder') {
                    try { await del(file.url); } catch (e) { /* ignore */ }
                }
                await FileRecord.findOneAndDelete({ id: fileId });
            }
        }
        res.json({ message: `${fileIds.length} files deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete files' });
    }
});

app.put('/api/files/move', async (req, res) => {
    try {
        const { fileIds, targetFolder } = req.body;
        for (const fileId of fileIds) {
            await FileRecord.findOneAndUpdate(
                { id: fileId },
                { folder: targetFolder || null, updatedAt: new Date() }
            );
        }
        res.json({ message: 'Files moved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to move files' });
    }
});

app.put('/api/files/:id/move', async (req, res) => {
    try {
        const { targetFolder } = req.body;
        const file = await FileRecord.findOneAndUpdate(
            { id: req.params.id },
            { folder: targetFolder || null, updatedAt: new Date() },
            { new: true }
        );
        if (!file) return res.status(404).json({ error: 'File not found' });
        res.json(file.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to move file' });
    }
});

app.put('/api/files/:id/rename', async (req, res) => {
    try {
        const { newName } = req.body;
        const file = await FileRecord.findOneAndUpdate(
            { id: req.params.id },
            { name: newName, updatedAt: new Date() },
            { new: true }
        );
        if (!file) return res.status(404).json({ error: 'File not found' });
        res.json(file.toObject());
    } catch (error) {
        res.status(500).json({ error: 'Failed to rename file' });
    }
});

// ─── File Serving — Proxy Private Blobs Through Server ───────────────────────

app.get('/file/:fileId', async (req, res) => {
    try {
        const file = await FileRecord.findOne({ id: req.params.fileId });
        if (!file || file.type === 'folder') {
            return res.status(404).json({ error: 'File not found' });
        }
        if (!file.url) {
            return res.status(404).json({ error: 'File has no stored URL' });
        }

        const ext = path.extname(file.name).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
            '.webm': 'audio/webm', '.mp4': 'video/mp4', '.txt': 'text/plain',
            '.json': 'application/json', '.html': 'text/html',
        };
        if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
        res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);

        // Fetch private blob using server token and pipe to browser
        const blobResponse = await fetch(file.url, {
            headers: { 'Authorization': `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        });
        if (!blobResponse.ok) return res.status(404).json({ error: 'File not found in blob storage' });
        blobResponse.body.pipe(res);
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Legacy /uploads/* routes — redirect via fileId lookup won't work, return 404 gracefully
app.get('/uploads/:folder/:filename', (req, res) => {
    res.status(404).json({ error: 'Direct upload paths are no longer served. Use /file/:fileId instead.' });
});
app.get('/uploads/:filename', (req, res) => {
    res.status(404).json({ error: 'Direct upload paths are no longer served. Use /file/:fileId instead.' });
});

// ─── Bhashini ASR Pipeline Configuration ─────────────────────────────────────
async function getBhashiniPipeline(language = 'hi') {
    console.log(`Getting pipeline config for language: ${language}`);

    if (pipelineConfigCache.has(language)) {
        console.log(`Using cached config for ${language}`);
        return pipelineConfigCache.get(language);
    }

    try {
        const payload = {
            pipelineTasks: [{
                taskType: "asr",
                config: { language: { sourceLanguage: language } }
            }],
            pipelineRequestConfig: { pipelineId: "64392f96daac500b55c543cd" }
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

        if (data.pipelineResponseConfig &&
            data.pipelineResponseConfig[0] &&
            data.pipelineResponseConfig[0].config &&
            data.pipelineResponseConfig[0].config[0] &&
            data.pipelineInferenceAPIEndPoint) {

            const authName = (data.pipelineInferenceAPIEndPoint.inferenceApiKey &&
                (data.pipelineInferenceAPIEndPoint.inferenceApiKey.name ||
                 data.pipelineInferenceAPIEndPoint.inferenceApiKey.key)) || 'Authorization';
            const authValue = data.pipelineInferenceAPIEndPoint.inferenceApiKey &&
                data.pipelineInferenceAPIEndPoint.inferenceApiKey.value;
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
            setTimeout(() => {
                pipelineConfigCache.delete(language);
                console.log(`🔄 Pipeline config cache expired for language: ${language}`);
            }, 30 * 60 * 1000); // 30 minutes
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

// ─── ASR Transcription Endpoint ───────────────────────────────────────────────
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file provided' });
        }

        let language = req.body.language || 'auto';
        console.log(`Requested language: ${language}`);
        console.log(`Audio file: ${req.file.originalname}, size: ${req.file.size} bytes`);

        // Use buffer directly from memory storage — no disk read needed
        const audioData = req.file.buffer;
        const base64Audio = audioData.toString('base64');

        if (language === 'auto' || language === '') {
            console.log('🔍 Running server-side ALD...');
            try {
                const aldPayload = {
                    pipelineTasks: [{ taskType: 'audio-lang-detection', config: { serviceId: 'bhashini/iitmandi/audio-lang-detection/gpu' } }],
                    inputData: { audio: [{ audioContent: base64Audio }] }
                };
                const aldResponse = await fetch(BHASHINI_CONFIG.computeURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': BHASHINI_CONFIG.ulcaApiKey },
                    body: JSON.stringify(aldPayload)
                });
                if (aldResponse.ok) {
                    const aldResult = await aldResponse.json();
                    const aldOutput = aldResult?.pipelineResponse?.[0]?.output;
                    if (aldOutput?.[0]?.langPrediction?.[0]) {
                        const detectedLang = aldOutput[0].langPrediction[0].langCode;
                        const confidence = aldOutput[0].langPrediction[0].langScore || 0;
                        console.log(`✅ Server ALD: ${detectedLang} (confidence: ${(confidence * 100).toFixed(1)}%)`);
                        language = (confidence >= 0.70) ? detectedLang : 'hi';
                        if (confidence < 0.70) console.warn(`⚠️ ALD confidence too low, defaulting to 'hi'`);
                    } else { language = 'hi'; }
                } else { language = 'hi'; }
            } catch (aldErr) {
                console.warn('⚠️ Server ALD failed, defaulting to hi:', aldErr.message);
                language = 'hi';
            }
        }
        console.log(`Final transcription language: ${language}`);

        // Determine audio format
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

        // Detect sampling rate for WAV from buffer header
        let samplingRate = 16000;
        try {
            if (audioFormat === 'wav' && audioData.length > 28) {
                samplingRate = audioData.readUInt32LE(24);
            }
        } catch (e) {
            console.warn('Failed to detect sampling rate, using default 16000');
        }

        console.log(`Audio format: ${audioFormat}, samplingRate: ${samplingRate}, size: ${audioData.length} bytes`);

        const config = await getBhashiniPipeline(language);
        console.log('Using Bhashini ASR service:', config.serviceId);

        const payload = {
            pipelineTasks: [{
                taskType: "asr",
                config: {
                    language: { sourceLanguage: language },
                    serviceId: config.serviceId,
                    audioFormat: audioFormat,
                    samplingRate: samplingRate
                }
            }],
            inputData: { audio: [{ audioContent: base64Audio }] }
        };

        console.log('ASR compute payload (audio truncated for logging):', JSON.stringify({
            ...payload,
            inputData: { ...payload.inputData, audio: [{ audioContent: `[BASE64_DATA_${base64Audio.length}_CHARS]` }] }
        }, null, 2));

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

        if (result.pipelineResponse &&
            result.pipelineResponse[0] &&
            result.pipelineResponse[0].output &&
            result.pipelineResponse[0].output[0]) {

            const rawTranscription = result.pipelineResponse[0].output[0].source;
            const transcription = normalizeNumbers(rawTranscription);
            if (rawTranscription !== transcription) {
                console.log(`ITN applied:  "${rawTranscription}" → "${transcription}"`);
            } else {
                console.log(`Transcription result: ${transcription}`);
            }

            const transcriptionData = {
                id: `ASR-${uuidv4().substring(0, 8)}`,
                audioFile: req.file.originalname,
                transcription: transcription || 'No transcription available',
                language: language,
                timestamp: new Date().toISOString(),
                duration: req.body.duration || null,
                caseId: req.body.caseId || null
            };

            res.json({
                success: true,
                transcription: transcription || 'No transcription available',
                audioFile: req.file.originalname,
                language: language,
                data: transcriptionData
            });
        } else {
            throw new Error('Invalid ASR response format');
        }

    } catch (error) {
        console.error('ASR Error:', error);
        res.status(502).json({ error: 'Transcription failed', details: error.message });
    }
});

// ─── Test Bhashini Connectivity ───────────────────────────────────────────────
app.get('/api/test-bhashini', async (req, res) => {
    try {
        console.log('Testing Bhashini connectivity...');
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

// ─── Analytics ────────────────────────────────────────────────────────────────
app.get('/api/analytics/dashboard', async (req, res) => {
    try {
        const [totalFirs, pendingCases, closedCases, inProgressCases] = await Promise.all([
            Case.countDocuments(),
            Case.countDocuments({ status: 'pending' }),
            Case.countDocuments({ status: 'closed' }),
            Case.countDocuments({ status: 'progress' })
        ]);
        res.json({ totalFirs, pendingCases, closedCases, inProgressCases });
    } catch (error) {
        res.status(500).json({ error: 'Failed to load analytics' });
    }
});

// ─── External FIR Intake (for friend's recording app) ────────────────────────
app.post('/api/external/fir', requireApiKey, async (req, res) => {
    try {
        const count = await Case.countDocuments();
        const caseId = req.body.firNumber ||
            `FIR-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
            
        // 1. Create the Case
        const newCase = new Case({
            id: caseId,
            ...req.body,
            status: 'received',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await newCase.save();
        
        // 2. If the payload contains transcription text, create a matching Transcription entry
        if (req.body.transcription) {
            const transCount = await Transcription.countDocuments();
            const newTranscription = new Transcription({
                id: `TR-${new Date().getFullYear()}-${String(transCount + 1).padStart(6, '0')}`,
                caseId: caseId,
                transcription: req.body.transcription,
                language: req.body.language || 'en',
                status: 'completed',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await newTranscription.save();
        }

        res.status(201).json({ success: true, id: newCase.id, message: 'FIR and transcription received successfully' });
    } catch (error) {
        console.error('External FIR intake error:', error);
        res.status(500).json({ error: 'Failed to record FIR' });
    }
});

// ─── External Transcription Intake (for friend's recording app) ────────────────────────
app.post('/api/external/transcription', requireApiKey, async (req, res) => {
    try {
        if (!req.body.transcription) {
            return res.status(400).json({ error: 'Missing transcription text' });
        }
        const transCount = await Transcription.countDocuments();
        const transcriptionId = req.body.id || `TR-${new Date().getFullYear()}-${String(transCount + 1).padStart(6, '0')}`;
        
        const newTranscription = new Transcription({
            id: transcriptionId,
            caseId: req.body.caseId || null,
            transcription: req.body.transcription,
            language: req.body.language || 'en',
            audioFile: req.body.audioFile || 'iOS Application Recording',
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        await newTranscription.save();
        res.status(201).json({ success: true, id: newTranscription.id, message: 'Transcription saved successfully' });
    } catch (error) {
        console.error('External Transcription intake error:', error);
        res.status(500).json({ error: 'Failed to record transcription' });
    }
});

// ─── Default Route ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server (local dev only — Vercel uses module.exports) ───────────────
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Soochna Sahayak running on http://localhost:${PORT}`);
        console.log('✅ Server ready and fully operational!');
    });
}

module.exports = app;