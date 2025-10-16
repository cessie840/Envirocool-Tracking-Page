import React from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

const DeliveryMap = ({ location, trail, transaction }) => {
  // 🧠 Defensive check for invalid or missing coordinates
  if (!location || isNaN(location.lat) || isNaN(location.lng)) {
    console.warn("🚫 Invalid location data:", location);
    return (
      <div className="text-center text-danger">
        GPS location data unavailable.
      </div>
    );
  }

  // ✅ Filter invalid trail points
  const validTrail = Array.isArray(trail)
    ? trail.filter(
        (point) =>
          Array.isArray(point) &&
          point.length === 2 &&
          !isNaN(point[0]) &&
          !isNaN(point[1])
      )
    : [];

  const position = [location.lat, location.lng];

  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 🟢 Current Position Marker */}
      <Marker position={position}>
        <Popup>
          <strong>{transaction.tracking_number}</strong>
          <br />
          {transaction.delivery_status}
        </Popup>
      </Marker>

      {/* 🟡 Trail Polyline */}
      {validTrail.length > 1 && (
        <Polyline positions={validTrail} color="blue" />
      )}
    </MapContainer>
  );
};

export default DeliveryMap;
