require('dotenv').config();

const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static('public')); // Serve static files

// Health check route
app.get('/', (req, res) => {
    res.send('API backend with Supabase is running');
});

// Serve login page (GET)
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// Handle login POST requests
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ 
                error: error.message 
            });
        }

        // Return session data
        res.json({ 
            session: data.session, 
            user: data.user,
            success: true
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
});

// Your existing protect middleware and FIR route...
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Missing access token' });
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token or unauthenticated' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Authorization failed' });
    }
};

// Protected FIR route
app.post('/api/fir', protect, async (req, res) => {
    try {
        const firData = req.body;
        const { data, error } = await supabase
            .from('firs')
            .insert([{ ...firData, user_id: req.user.id }]);

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ message: 'FIR created successfully', data });
    } catch (err) {
        console.error('Error creating FIR:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
