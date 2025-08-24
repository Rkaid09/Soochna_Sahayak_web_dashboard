const supabase = require('./supabaseClient');

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Missing access token' });
        }

        // Verify token with Supabase - FIXED API CALL
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

module.exports = { protect };
