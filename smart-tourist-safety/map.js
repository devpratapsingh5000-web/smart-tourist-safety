
document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([40.75, -74.0], 13); // Default to NYC

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let safeZones = [];

    // Load safe zones from localStorage
    function loadSafeZones() {
        safeZones.forEach(zone => map.removeLayer(zone));
        safeZones = [];
        const zonesData = JSON.parse(localStorage.getItem('safeZones')) || [];
        zonesData.forEach(coords => {
            const polygon = L.polygon(coords, {color: "#008000", weight: 1, fillOpacity: 0.2});
            polygon.addTo(map);
            safeZones.push(polygon);
        });
    }

    loadSafeZones();

    let safeZonesVisible = true;

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
        if (confirm("Allow location access to enable accurate map features?")) {
            map.locate({setView: true, maxZoom: 16, watch: true});
        } else {
            alert("Location access denied. Some features may not work properly.");
        }
    });

    map.on('locationfound', e => {
        const radius = e.accuracy / 2;

        // Remove previous marker and circle if any
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        if (accuracyCircle) {
            map.removeLayer(accuracyCircle);
        }

        // Reverse geocoding to get location name
        fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${e.latitude || e.latlng.lat}&lon=${e.longitude || e.latlng.lng}`)
            .then(response => response.json())
            .then(data => {
                // Compose a more detailed location name similar to Google Maps style
                let address = data.address;
                let parts = [];
                if (address.road) parts.push(address.road);
                if (address.neighbourhood) parts.push(address.neighbourhood);
                if (address.suburb) parts.push(address.suburb);
                if (address.city) parts.push(address.city);
                else if (address.town) parts.push(address.town);
                else if (address.village) parts.push(address.village);
                if (address.state) parts.push(address.state);
                if (address.country) parts.push(address.country);
                let displayName = parts.join(', ') || "Unknown location";

                // Enhanced popup content with styled HTML and link to open in external map
                let popupContent = `
                    <div style="font-family: Arial, sans-serif; font-size: 14px;">
                        <strong>You are within ${radius} meters from this point</strong><br/>
                        <span style="color: #555;">Location: <em>${displayName}</em></span><br/>
                        <a href="https://www.openstreetmap.org/?mlat=${e.latlng.lat}&mlon=${e.latlng.lng}#map=18/${e.latlng.lat}/${e.latlng.lng}" target="_blank" style="color: #007bff; text-decoration: none;">View on OpenStreetMap</a>
                    </div>
                `;
                currentMarker = L.marker(e.latlng).addTo(map)
                    .bindPopup(popupContent).openPopup();
            })
            .catch(() => {
                currentMarker = L.marker(e.latlng).addTo(map)
                    .bindPopup("You are within " + radius + " meters from this point").openPopup();
            });

        accuracyCircle = L.circle(e.latlng, radius).addTo(map);
    });

    map.on('locationerror', e => {
        alert("Location access denied.");
    });

    document.getElementById('reportHere').addEventListener('click', () => {
        alert("To report an incident at this location, please go to the Report Incident page and enter the location details.");
    });

    // Drawing variables for authorities
    let drawingPolygon = null;
    let drawingCoords = [];

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

                // Reverse geocoding for location name
                fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
                    .then(response => response.json())
                    .then(data => {
                        let displayName = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || data.address.country || "Unknown location";
                        let popupContent = `Current Location<br><b>Location:</b> ${displayName}<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}<br>Accuracy: ${accuracy.toFixed(0)}m<br>Time: ${timestamp.toLocaleTimeString()}`;

                        if (currentMarker) {
                            currentMarker.setLatLng([lat, lng]);
                            currentMarker.setPopupContent(popupContent);
                        } else {
                            currentMarker = L.marker([lat, lng]).addTo(map)
                                .bindPopup(popupContent).openPopup();
                        }

                        // Update location display
                        const locationElement = document.getElementById('locationStatus');
                        if (locationElement) {
                            locationElement.innerHTML =
                                "<strong>Real-time Location:</strong><br>" +
                                `<b>Location:</b> ${displayName}<br>` +
                                "Latitude: " + lat.toFixed(6) + "<br>" +
                                "Longitude: " + lng.toFixed(6) + "<br>" +
                                "Accuracy: ±" + accuracy.toFixed(0) + " meters<br>" +
                                "Last Update: " + timestamp.toLocaleTimeString();
                        }
                    })
                    .catch(() => {
                        let popupContent = "Current Location<br>Lat: " + lat.toFixed(6) + "<br>Lng: " + lng.toFixed(6) + "<br>Accuracy: " + accuracy.toFixed(0) + "m<br>Time: " + timestamp.toLocaleTimeString();
                        if (currentMarker) {
                            currentMarker.setLatLng([lat, lng]);
                            currentMarker.setPopupContent(popupContent);
                        } else {
                            currentMarker = L.marker([lat, lng]).addTo(map)
                                .bindPopup(popupContent).openPopup();
                        }

                        const locationElement = document.getElementById('locationStatus');
                        if (locationElement) {
                            locationElement.innerHTML =
                                "<strong>Real-time Location:</strong><br>" +
                                "Latitude: " + lat.toFixed(6) + "<br>" +
                                "Longitude: " + lng.toFixed(6) + "<br>" +
                                "Accuracy: ±" + accuracy.toFixed(0) + " meters<br>" +
                                "Last Update: " + timestamp.toLocaleTimeString();
                        }
                    });

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

    // Drawing functionality for authorities
    if (document.getElementById('authorities-dashboard')) {
        let drawingPoints = [];
        let drawingPolygon = null;

        map.on('click', function(e) {
            if (document.getElementById('zones-tab').style.display !== 'none') {
                drawingPoints.push([e.latlng.lat, e.latlng.lng]);
                if (drawingPolygon) {
                    map.removeLayer(drawingPolygon);
                }
                if (drawingPoints.length > 2) {
                    drawingPolygon = L.polygon(drawingPoints, {color: 'blue', weight: 2}).addTo(map);
                }
            }
        });

        map.on('dblclick', function() {
            if (drawingPoints.length > 2) {
                // Finish drawing
                drawingPoints.push(drawingPoints[0]); // Close polygon
                drawingPolygon = L.polygon(drawingPoints, {color: 'blue', weight: 2}).addTo(map);
            }
        });

        document.getElementById('saveZone').addEventListener('click', function() {
            if (drawingPoints.length > 2) {
                let zonesData = JSON.parse(localStorage.getItem('safeZones')) || [];
                zonesData.push(drawingPoints);
                localStorage.setItem('safeZones', JSON.stringify(zonesData));
                loadSafeZones(); // Reload to show saved
                drawingPoints = [];
                if (drawingPolygon) {
                    map.removeLayer(drawingPolygon);
                    drawingPolygon = null;
                }
                document.getElementById('zoneStatus').innerText = 'Safe zone saved!';
            } else {
                document.getElementById('zoneStatus').innerText = 'Draw a polygon first.';
            }
        });

        document.getElementById('clearZones').addEventListener('click', function() {
            localStorage.removeItem('safeZones');
            loadSafeZones();
            drawingPoints = [];
            if (drawingPolygon) {
                map.removeLayer(drawingPolygon);
                drawingPolygon = null;
            }
            document.getElementById('zoneStatus').innerText = 'All zones cleared.';
        });
    }
});
