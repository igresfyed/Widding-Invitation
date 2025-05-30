const express = require('express');
const admin = require('firebase-admin');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const macVendor = require('node-mac-vendor-lookup');
const app = express();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Function to get visitor IP
function getVisitorIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           req.connection.socket.remoteAddress;
}

// Function to get device info
function getDeviceInfo(req) {
    const ua = new UAParser(req.headers['user-agent']);
    return {
        browser: ua.getBrowser(),
        os: ua.getOS(),
        device: ua.getDevice(),
        cpu: ua.getCPU(),
        engine: ua.getEngine()
    };
}

// Function to get location info
function getLocationInfo(ip) {
    const geo = geoip.lookup(ip);
    if (geo) {
        return {
            country: geo.country,
            region: geo.region,
            city: geo.city,
            ll: geo.ll // [latitude, longitude]
        };
    }
    return null;
}

// Function to log activity with detailed info
async function logActivity(action, req) {
    try {
        const ip = getVisitorIP(req);
        const deviceInfo = getDeviceInfo(req);
        const locationInfo = getLocationInfo(ip);

        await db.collection('activity_log').add({
            action,
            ip,
            deviceInfo,
            locationInfo,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// API endpoints
app.post('/api/stats', async (req, res) => {
    try {
        const { type } = req.body;
        const statsRef = db.collection('stats').doc('website_stats');
        
        await statsRef.set({
            [type]: admin.firestore.FieldValue.increment(1)
        }, { merge: true });

        // Log the activity with detailed info
        await logActivity(`${type} count increased`, req);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { name, message } = req.body;
        const ip = getVisitorIP(req);
        const deviceInfo = getDeviceInfo(req);
        const locationInfo = getLocationInfo(ip);
        
        await db.collection('messages').add({
            name,
            message,
            ip,
            deviceInfo,
            locationInfo,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Log the activity with detailed info
        await logActivity(`New message from ${name}`, req);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// New endpoint to log page views with detailed info
app.post('/api/log-pageview', async (req, res) => {
    try {
        await logActivity('Page viewed', req);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 