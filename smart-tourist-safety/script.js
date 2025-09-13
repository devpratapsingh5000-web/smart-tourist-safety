// Common functionality

let currentOTP = null;
let currentAuthority = null;

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Authority registration
if (document.getElementById('authorityRegisterForm')) {
    document.getElementById('authorityRegisterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('authName').value;
        const email = document.getElementById('authEmail').value;
        const aadhaar = document.getElementById('authAadhaar').value;
        const pan = document.getElementById('authPAN').value;

        let authorities = JSON.parse(localStorage.getItem('authorities')) || [];
        if (authorities.find(a => a.aadhaar === aadhaar)) {
            document.getElementById('authRegisterStatus').innerText = 'Authority with this Aadhaar already registered.';
            return;
        }

        authorities.push({name, email, aadhaar, pan});
        localStorage.setItem('authorities', JSON.stringify(authorities));
        document.getElementById('authRegisterStatus').innerText = 'Registration successful!';
        this.reset();
    });
}

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
    const zonesData = JSON.parse(localStorage.getItem('safeZones')) || [];
    return zonesData.some(coords => {
        // Check if point is inside polygon
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
            if (((coords[i][1] > lng) !== (coords[j][1] > lng)) &&
                (lat < (coords[j][0] - coords[i][0]) * (lng - coords[i][1]) / (coords[j][1] - coords[i][1]) + coords[i][0])) {
                inside = !inside;
            }
        }
        return inside;
    });
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
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChat');
    const chatMessages = document.getElementById('chatMessages');

    function processUserInput() {
        const input = chatInput.value.trim().toLowerCase();
        if (!input) return;

        // Display user message
        chatMessages.innerHTML += `<p><strong>You:</strong> ${chatInput.value}</p>`;

        // Real-time AI response without delay
        let response = 'I\'m here to help. Can you provide more details about your situation?';
        for (let key in aiResponses) {
            if (input.includes(key)) {
                response = aiResponses[key];
                break;
            }
        }
        chatMessages.innerHTML += `<p><strong>AI:</strong> ${response}</p>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        chatInput.value = '';
    }

    sendChatBtn.addEventListener('click', processUserInput);

    // Allow Enter key to send
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processUserInput();
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

if (document.getElementById('registerAadhaar')) {
    document.getElementById('registerAadhaar').addEventListener('input', function() {
        const aadhaar = this.value;
        if (aadhaar.length === 12 && /^\d{12}$/.test(aadhaar)) {
            document.getElementById('generateUserOTP').disabled = false;
        } else {
            document.getElementById('generateUserOTP').disabled = true;
        }
    });
}

if (document.getElementById('generateUserOTP')) {
    document.getElementById('generateUserOTP').addEventListener('click', function() {
        const aadhaar = document.getElementById('registerAadhaar').value;
        userCurrentOTP = generateUserOTP();
        userCurrentAadhaar = aadhaar;
        document.getElementById('userOTPDisplay').innerText = `OTP: ${userCurrentOTP} (In real app, this would be sent via SMS)`;
        document.getElementById('userOTPDisplay').style.display = 'block';
        document.getElementById('userRegisterStatus').innerText = 'OTP generated. Enter it below to complete registration.';
        document.getElementById('userOTPSection').style.display = 'block';
    });
}

if (document.getElementById('userRegisterForm')) {
    document.getElementById('userRegisterForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const otp = document.getElementById('userOTP').value;
        if (otp === userCurrentOTP && userCurrentAadhaar) {
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.aadhaar === userCurrentAadhaar)) {
                document.getElementById('userRegisterStatus').innerText = 'User with this Aadhaar already registered.';
                return;
            }

            // Generate unique ID for user
            const uniqueID = 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();

            users.push({name, email, aadhaar: userCurrentAadhaar, password, uniqueID});
            localStorage.setItem('users', JSON.stringify(users));
            document.getElementById('userRegisterStatus').innerText = `Registration successful! Your Unique ID: ${uniqueID}`;
            this.reset();
            document.getElementById('userOTPSection').style.display = 'none';
            userCurrentOTP = null;
            userCurrentAadhaar = null;
        } else {
            document.getElementById('userRegisterStatus').innerText = 'Invalid OTP. Please try again.';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Authority login
    if (document.getElementById('generateOTP')) {
        document.getElementById('generateOTP').addEventListener('click', function() {
            const aadhaar = document.getElementById('loginAadhaar').value;
            let authorities = JSON.parse(localStorage.getItem('authorities')) || [];
            const authority = authorities.find(a => a.aadhaar === aadhaar);
            if (authority) {
                currentOTP = generateOTP();
                currentAuthority = authority;
                document.getElementById('otpDisplay').innerText = `OTP: ${currentOTP} (In real app, this would be sent via SMS)`;
                document.getElementById('otpDisplay').style.display = 'block';
                document.getElementById('authLoginStatus').innerText = 'OTP generated. Enter it below.';
            } else {
                document.getElementById('authLoginStatus').innerText = 'Aadhaar not found. Please register first.';
            }
        });
    }
});

if (document.getElementById('authorityLoginForm')) {
    document.getElementById('authorityLoginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const otp = document.getElementById('otp').value;
        if (otp === currentOTP && currentAuthority) {
            localStorage.setItem('loggedAuthority', JSON.stringify(currentAuthority));
            document.getElementById('authStatus').innerText = `Logged in as ${currentAuthority.name}`;
            document.getElementById('authLoginStatus').innerText = 'Login successful!';
            showTab('zones'); // Switch to zones tab
        } else {
            document.getElementById('authLoginStatus').innerText = 'Invalid OTP.';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    function showTab(tabName, event) {
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.style.display = 'none');
        document.getElementById(tabName + '-tab').style.display = 'block';
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => btn.classList.remove('active'));
        if(event) {
            event.target.classList.add('active');
        }
    }

    // Fix tab button event handlers to pass event object
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function(event) {
            const tabName = this.textContent.toLowerCase().split(' ').join('');
            showTab(tabName, event);
        });
    });

    // Initialize authority dashboard
    if (document.getElementById('authorities-dashboard')) {
        const loggedAuthority = JSON.parse(localStorage.getItem('loggedAuthority'));
        if (loggedAuthority) {
            document.getElementById('authStatus').innerText = `Logged in as ${loggedAuthority.name}`;
            showTab('zones');
        }
    }
});

// Initialize authority dashboard
if (document.getElementById('authorities-dashboard')) {
    const loggedAuthority = JSON.parse(localStorage.getItem('loggedAuthority'));
    if (loggedAuthority) {
        document.getElementById('authStatus').innerText = `Logged in as ${loggedAuthority.name}`;
        showTab('zones');
    }
}

// Safe zone management
let currentPolygon = null;
let polygonPoints = [];

if (document.getElementById('saveZone')) {
    document.getElementById('saveZone').addEventListener('click', function() {
        if (polygonPoints.length > 2) {
            let zonesData = JSON.parse(localStorage.getItem('safeZones')) || [];
            zonesData.push(polygonPoints);
            localStorage.setItem('safeZones', JSON.stringify(zonesData));
            document.getElementById('zoneStatus').innerText = 'Safe zone saved!';
            // Reload zones
            if (window.loadSafeZones) window.loadSafeZones();
            polygonPoints = [];
            if (currentPolygon) {
                map.removeLayer(currentPolygon);
                currentPolygon = null;
            }
        } else {
            document.getElementById('zoneStatus').innerText = 'Need at least 3 points to save a zone.';
        }
    });
}

if (document.getElementById('clearZones')) {
    document.getElementById('clearZones').addEventListener('click', function() {
        localStorage.removeItem('safeZones');
        document.getElementById('zoneStatus').innerText = 'All safe zones cleared!';
        // Reload zones
        if (window.loadSafeZones) window.loadSafeZones();
    });
}
