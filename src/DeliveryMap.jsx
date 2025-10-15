// ✅ DeliveryMap.jsx
import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- ICONS ---
const companyIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [35, 35],
});

const truckIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1995/1995470.png",
  iconSize: [40, 40],
});

const customerIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/4470/4470312.png",
  iconSize: [40, 40],
});

const DeliveryMap = ({ location, trail, transaction }) => {
  const [eta, setEta] = useState(null);

  // --- ETA Calculation (Haversine Formula) ---
  useEffect(() => {
    if (!location || !transaction?.latitude || !transaction?.longitude) return;

    const R = 6371; // Earth radius in km
    const dLat =
      ((location.lat - parseFloat(transaction.latitude)) * Math.PI) / 180;
    const dLon =
      ((location.lng - parseFloat(transaction.longitude)) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((parseFloat(transaction.latitude) * Math.PI) / 180) *
        Math.cos((location.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in km

    const avgSpeed = 40; // assume 40 km/h
    const etaMinutes = Math.round((distance / avgSpeed) * 60);
    setEta(etaMinutes);
  }, [location, transaction]);

  if (!transaction || !location) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Map data unavailable.</p>
      </div>
    );
  }

  return (
    <div
      className="shadow rounded-3 overflow-hidden"
      style={{ height: "500px", border: "2px solid #e0e0e0" }}
    >
      <MapContainer
        center={[transaction.latitude, transaction.longitude]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        {/* Base Map Layer */}
        <TileLayer
          attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Company Marker */}
        {transaction.company_lat && transaction.company_lng && (
          <Marker
            position={[transaction.company_lat, transaction.company_lng]}
            icon={companyIcon}
          >
            <Popup>🏢 Envirocool Company</Popup>
          </Marker>
        )}

        {/* Truck Marker */}
        <Marker
          position={[transaction.latitude, transaction.longitude]}
          icon={truckIcon}
        >
          <Popup>
            🚚 Truck Location <br />
            Status: {transaction.delivery_status} <br />
            ETA: {eta ? `${eta} mins` : "Calculating..."}
          </Popup>
        </Marker>

        {/* Customer Marker */}
        <Marker position={[location.lat, location.lng]} icon={customerIcon}>
          <Popup>
            🏠 {transaction.customer_name} <br />
            {transaction.customer_address}
          </Popup>
        </Marker>

        {/* Route Trail (from API) */}
        {trail.length > 0 && (
          <Polyline positions={trail} color="green" weight={4} />
        )}

        {/* Optional: Line from truck → customer */}
        <Polyline
          positions={[
            [transaction.latitude, transaction.longitude],
            [location.lat, location.lng],
          ]}
          color="blue"
          dashArray="8"
        />
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
