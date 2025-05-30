// Firebase configuration
const firebaseConfig = {
    // Replace these with your Firebase project configuration
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore instance
const db = firebase.firestore();

// Get Analytics instance
const analytics = firebase.analytics();

// Function to track page views
function trackPageView() {
    analytics.logEvent('page_view');
    updateStats('visits');
}

// Function to track RSVP clicks
function trackRSVPClick() {
    analytics.logEvent('rsvp_click');
    updateStats('rsvpClicks');
}

// Function to track location clicks
function trackLocationClick() {
    analytics.logEvent('location_click');
    updateStats('locationClicks');
}

// Function to update stats in Firestore
async function updateStats(type) {
    try {
        const statsRef = db.collection('stats').doc('website_stats');
        await statsRef.set({
            [type]: firebase.firestore.FieldValue.increment(1)
        }, { merge: true });
    } catch (error) {
        console.error('Error updating stats:', error);
    }
}

// Export everything needed
export { 
    db, 
    analytics, 
    trackPageView, 
    trackRSVPClick, 
    trackLocationClick 
}; 