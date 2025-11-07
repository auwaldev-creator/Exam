const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static frontend files
app.use(express.static('public'));
app.use(bodyParser.json({ limit: '5mb' }));

// Receive and save snapshots
app.post('/api/snapshot', (req, res) => {
    const img = req.body.image;
    // Simple base64 image saving (not for production!)
    const base64Data = img.replace(/^data:image\/jpeg;base64,/, '');
    const filename = `snapshot_${Date.now()}.jpg`;
    fs.writeFile(path.join(__dirname, 'logs', filename), base64Data, 'base64', err => {
        if (err) {
            return res.status(500).send('Failed to save snapshot');
        }
        res.status(200).send('Snapshot saved');
    });
});

// Receive and save event logs
app.post('/api/log', (req, res) => {
    const logData = `${new Date().toISOString()}: ${JSON.stringify(req.body)}\n`;
    fs.appendFile(path.join(__dirname, 'logs', 'events.log'), logData, err => {
        if (err) {
            return res.status(500).send('Failed to save log');
        }
        res.status(200).send('Event logged');
    });
});

if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'));
}

app.listen(PORT, () => {
    console.log(`Proctoring server running at http://localhost:${PORT}/`);
});
