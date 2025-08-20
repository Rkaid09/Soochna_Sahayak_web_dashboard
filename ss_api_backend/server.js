require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Health check route
app.get('/', (req, res) => {
  res.send('API backend with Supabase is running');
});

// API endpoint to insert FIR data
app.post('/api/fir', async (req, res) => {
  const firData = req.body;

  try {
    // Insert into Supabase table 'firs' (make sure you created it in Supabase dashboard)
    const { data, error } = await supabase
      .from('firs')
      .insert([firData]);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ message: 'FIR created', data });
  } catch (err) {
    console.error('Supabase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server with port from .env or fallback
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
