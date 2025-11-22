const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

// Serve static files from the src directory
app.use(express.static(path.join(__dirname, 'src')));

// Handle all other routes with the index.html file
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`OCAPX server is running on http://localhost:${PORT}`);
});