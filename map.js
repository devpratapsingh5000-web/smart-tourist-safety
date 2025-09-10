document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([40.75, -74.0], 13); // Default to NYC

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const safeZones = [
        L.rectangle([[40.7, -74.1], [40.8, -74.0]], {color: "#008000", weight: 1, fillOpacity: 0.2}),
        L.rectangle([[51.5, -0.1], [51.6, 0.0]], {color: "#008000", weight: 1, fillOpacity: 0.2})
    ];

    let safeZonesVisible = false;

    document.getElementById('showSafeZones').addEventListener('click', () => {
        if (safeZonesVisible) {
            safeZones.forEach(zone => map.removeLayer(zone));
            safeZonesVisible = false;
        } else {
            safeZones.forEach(zone => zone.addTo(map));
            safeZonesVisible = true;
        }
    });

    document.getElementById('locateMe').addEventListener('click', () => {
        map.locate({setView: true, maxZoom: 16});
    });

    map.on('locationfound', e => {
        const radius = e.accuracy / 2;
        L.marker(e.latlng).addTo(map)
            .bindPopup("You are within " + radius + " meters from this point").openPopup();
        L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', e => {
        alert("Location access denied.");
    });

    document.getElementById('reportHere').addEventListener('click', () => {
        alert("To report an incident at this location, please go to the Report Incident page and enter the location details.");
    });

    // Real-time location tracking variables
    let currentMarker;
    let accuracyCircle;
    let pathPolyline;
    let pathCoordinates = [];

    // Start real-time location tracking
    if (navigator.geolocation) {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.watchPosition(
            position => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                const timestamp = new Date(position.timestamp);

                // Add to path
                pathCoordinates.push([lat, lng]);

                // Update or create marker
                if (currentMarker) {
                    currentMarker.setLatLng([lat, lng]);
                    currentMarker.setPopupContent("Current Location<br>Lat: " + lat.toFixed(6) + "<br>Lng: " + lng.toFixed(6) + "<br>Accuracy: " + accuracy.toFixed(0) + "m<br>Time: " + timestamp.toLocaleTimeString());
                } else {
                    currentMarker = L.marker([lat, lng]).addTo(map)
                        .bindPopup("Current Location<br>Lat: " + lat.toFixed(6) + "<br>Lng: " + lng.toFixed(6) + "<br>Accuracy: " + accuracy.toFixed(0) + "m<br>Time: " + timestamp.toLocaleTimeString()).openPopup();
                }

                // Update or create accuracy circle
                if (accuracyCircle) {
                    accuracyCircle.setLatLng([lat, lng]);
                    accuracyCircle.setRadius(accuracy);
                } else {
                    accuracyCircle = L.circle([lat, lng], {
                        color: '#00ffff',
                        fillColor: '#00ffff',
                        fillOpacity: 0.2,
                        radius: accuracy,
                        weight: 2
                    }).addTo(map);
                }

                // Update path polyline
                if (pathPolyline) {
                    pathPolyline.setLatLngs(pathCoordinates);
                } else {
                    pathPolyline = L.polyline(pathCoordinates, {
                        color: '#ff00ff',
                        weight: 3,
                        opacity: 0.7
                    }).addTo(map);
                }

                // Auto-center map on current location
                map.setView([lat, lng], 16);

                // Update location display if element exists
                const locationElement = document.getElementById('locationStatus');
                if (locationElement) {
                    locationElement.innerHTML =
                        "<strong>Real-time Location:</strong><br>" +
                        "Latitude: " + lat.toFixed(6) + "<br>" +
                        "Longitude: " + lng.toFixed(6) + "<br>" +
                        "Accuracy: ±" + accuracy.toFixed(0) + " meters<br>" +
                        "Last Update: " + timestamp.toLocaleTimeString();
                }
            },
            error => {
                let errorMessage = 'Location error: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'User denied the request for Geolocation.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'The request to get user location timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                        break;
                }
                alert(errorMessage);
            },
            options
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
});
