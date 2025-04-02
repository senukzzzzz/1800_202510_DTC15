const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Proxy endpoint for News API
app.get('/api/news', async (req, res) => {
    try {
        const { category, page, pageSize } = req.query;
        const apiKey = 'da66b6f1f9f04fe2b99c359a24d3321b';
        
        const url = new URL('https://newsapi.org/v2/top-headlines');
        url.searchParams.append('apiKey', apiKey);
        url.searchParams.append('country', 'us');
        if (category) url.searchParams.append('category', category);
        if (page) url.searchParams.append('page', page);
        if (pageSize) url.searchParams.append('pageSize', pageSize);

        const response = await fetch(url);
        const data = await response.json();
        
        res.json(data);
    } catch (error) {
        console.error('Proxy server error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 