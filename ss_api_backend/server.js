require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();

app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.send('API backend with Supabase is running');
});

// Middleware to protect routes by verifying Supabase JWT
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

// Example protected route to create FIR
app.post('/api/fir', protect, async (req, res) => {
  try {
    const firData = req.body;

    // Insert FIR into Supabase 'firs' table, optionally link with req.user.id
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

// Start server on defined port or fallback 4000
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
