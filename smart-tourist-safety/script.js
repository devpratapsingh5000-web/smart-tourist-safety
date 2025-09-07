// Common functionality

function generateUniqueID() {
    return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

... (existing registration code above) ...

// Login form handler
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const uniqueID = document.getElementById('uniqueID').value;
        const password = document.getElementById('password').value;

        let users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.uniqueID === uniqueID && u.password === password);

        if (user) {
            document.getElementById('loginStatus').innerText = `Login successful! Welcome, ${user.name}.`;
            // Store logged in user ID for session (simple mock)
            localStorage.setItem('loggedInUser', uniqueID);
            // Redirect to dashboard or other page
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('loginStatus').innerText = 'Invalid Unique ID or password.';
        }
    });
}

function initDashboard() {
    const userID = blockchain.getUserID();
    document.getElementById('userID').innerText = userID ? `Digital ID: ${userID}` : 'Digital ID: Not registered';

    // Remove the old getCurrentPosition call to avoid conflict with map.js real-time tracking
    // navigator.geolocation.getCurrentPosition(showPosition, showError);

    // Instead, rely on map.js real-time location tracking and update safety status accordingly
}



function checkGeoFence(lat, lng) {
    // Define safe zones (example: around major tourist areas)
    const safeZones = [
        { latMin: 40.7, latMax: 40.8, lngMin: -74.1, lngMax: -74.0 }, // Example: NYC
        { latMin: 51.5, latMax: 51.6, lngMin: -0.1, lngMax: 0.0 }   // Example: London
    ];
    return safeZones.some(zone => lat >= zone.latMin && lat <= zone.latMax && lng >= zone.lngMin && lng <= zone.lngMax);
}

// Define dangerous zones
const dangerousZones = [
    { latMin: 40.75, latMax: 40.76, lngMin: -74.02, lngMax: -74.01 }, // Example dangerous zone in NYC
    { latMin: 51.51, latMax: 51.52, lngMin: -0.09, lngMax: -0.08 }    // Example dangerous zone in London
];

function checkDangerZone(lat, lng) {
    return dangerousZones.some(zone => lat >= zone.latMin && lat <= zone.latMax && lng >= zone.lngMin && lng <= zone.lngMax);
}

// Modify showPosition to include danger zone check and alert
function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    document.getElementById('locationStatus').innerText = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const isSafe = checkGeoFence(lat, lng);
    const isDanger = checkDangerZone(lat, lng);
    const safetyStatusEl = document.getElementById('safetyStatus');
    if (isDanger) {
        safetyStatusEl.innerText = 'Safety Status: WARNING - You are in a dangerous zone!';
        safetyStatusEl.style.color = 'orange';
        alert('Warning! You have entered a dangerous zone. Authorities have been notified.');
        // Simulate alerting police/security
        console.log(`Alert: User entered dangerous zone at ${lat.toFixed(4)}, ${lng.toFixed(4)}. Notifying police/security.`);
        // TODO: Implement real alerting mechanism
    } else if (!isSafe) {
        safetyStatusEl.innerText = 'Safety Status: Alert - Outside safe zone';
        safetyStatusEl.style.color = 'red';
        if (Notification.permission === 'granted') {
            new Notification('Safety Alert', {body: 'You are outside a safe zone. Please be cautious.'});
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    } else {
        safetyStatusEl.innerText = 'Safety Status: Safe';
        safetyStatusEl.style.color = 'green';
    }
}

function showError(error) {
    document.getElementById('locationStatus').innerText = 'Unable to retrieve location';
    document.getElementById('safetyStatus').innerText = 'Safety Status: Unable to check';
}

if (document.getElementById('dashboard')) {
    initDashboard();
}

// Incident form handler
if (document.getElementById('incidentForm')) {
    document.getElementById('incidentForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('incidentType').value;
        const description = document.getElementById('description').value;
        const location = document.getElementById('location').value;
        const incidents = JSON.parse(localStorage.getItem('incidents')) || [];
        incidents.push({type, description, location, timestamp: Date.now()});
        localStorage.setItem('incidents', JSON.stringify(incidents));
        document.getElementById('reportStatus').innerText = 'Incident reported successfully. Authorities have been notified.';
        this.reset();
    });
}

// AI Chatbot
const aiResponses = {
    'help': 'I\'m here to assist you. What do you need help with?',
    'emergency': 'This is an emergency! Please call local emergency services immediately (e.g., 911 in US).',
    'theft': 'For theft, contact local police and your embassy or consulate. Keep your digital ID safe.',
    'medical': 'Seek immediate medical attention. Contact your travel insurance provider.',
    'lost': 'Stay calm. Share your location via the dashboard and contact local authorities.',
    'safe': 'Great! Continue monitoring your location and report any changes.',
    'unsafe': 'If you feel unsafe, move to a public area and contact authorities.'
};

if (document.getElementById('sendChat')) {
    document.getElementById('sendChat').addEventListener('click', function() {
        const input = document.getElementById('chatInput').value.toLowerCase();
        let response = 'I\'m here to help. Can you provide more details about your situation?';
        for (let key in aiResponses) {
            if (input.includes(key)) {
                response = aiResponses[key];
                break;
            }
        }
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML += `<p><strong>You:</strong> ${document.getElementById('chatInput').value}</p>`;
        chatMessages.innerHTML += `<p><strong>AI:</strong> ${response}</p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        document.getElementById('chatInput').value = '';
    });

    // Allow Enter key to send
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('sendChat').click();
        }
    });
}

// Incident History
if (document.getElementById('incidentList')) {
    const incidents = JSON.parse(localStorage.getItem('incidents')) || [];
    const list = document.getElementById('incidentList');
    if (incidents.length === 0) {
        list.innerHTML = '<p>No incidents reported yet.</p>';
    } else {
        list.innerHTML = incidents.map(inc => `<div class="incident-item"><h3>${inc.type}</h3><p>${inc.description}</p><p>Location: ${inc.location}</p><p>Time: ${new Date(inc.timestamp).toLocaleString()}</p></div>`).join('');
    }
}

// Enhanced AI responses
Object.assign(aiResponses, {
    'police': 'Contact local police immediately.',
    'ambulance': 'Call emergency medical services.',
    'fire': 'Call fire department.',
    'where': 'Please share your current location for better assistance.',
    'how': 'I can help with safety tips, emergency contacts, or reporting incidents.',
    'tips': 'Safety tips: Stay aware of your surroundings, keep valuables secure, and share your location with trusted contacts.'
});

// Notifications in showPosition
function showPosition(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    document.getElementById('locationStatus').innerText = `Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const isSafe = checkGeoFence(lat, lng);
    document.getElementById('safetyStatus').innerText = isSafe ? 'Safety Status: Safe' : 'Safety Status: Alert - Outside safe zone';
    document.getElementById('safetyStatus').style.color = isSafe ? 'green' : 'red';
    if (!isSafe) {
        if (Notification.permission === 'granted') {
            new Notification('Safety Alert', {body: 'You are outside a safe zone. Please be cautious.'});
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }
}

// Emergency button
if (document.getElementById('emergency')) {
    document.getElementById('emergency').addEventListener('click', () => {
        alert('Emergency! Calling 911... (In real app, this would dial)');
    });
}
