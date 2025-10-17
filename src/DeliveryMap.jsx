import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { renderToString } from "react-dom/server";
import { PiBuildingApartmentDuotone } from "react-icons/pi";
import { FaTruckFront, FaLocationDot } from "react-icons/fa6";
import "leaflet/dist/leaflet.css";

// ========= ICONS =========
// 🏢 Envirocool Company
const companyIcon = new L.DivIcon({
  html: renderToString(
    <div
      style={{
        textAlign: "center",
        color: "#14559a",
        lineHeight: "1.2",
        position: "relative",
      }}
    >
      {/* Label */}
      <div
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "bold",
          fontSize: "12px",
          marginBottom: "8px", // ✅ adds enough vertical gap to prevent overlap
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      >
        Envirocool Company
      </div>

      {/* Icon */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PiBuildingApartmentDuotone
          style={{
            fontSize: "42px",
            display: "block",
            marginTop: "2px",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
          }}
        />
      </div>
    </div>
  ),
  iconSize: [42, 60],
  iconAnchor: [21, 52], // ✅ aligns bottom of icon to map point
  popupAnchor: [0, -50],
  className: "custom-company-icon",
});

// 🏠 Customer Location
const customerIcon = new L.DivIcon({
  html: renderToString(
    <div
      style={{
        textAlign: "center",
        color: "#dc2626",
        lineHeight: "1.2",
        position: "relative",
      }}
    >
      {/* Label */}
      <div
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "bold",
          fontSize: "12px",
          marginBottom: "8px", // ✅ consistent spacing
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      >
        Customer Location
      </div>

      {/* Icon */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <FaLocationDot
          style={{
            fontSize: "40px",
            display: "block",
            marginTop: "2px",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
          }}
        />
      </div>
    </div>
  ),
  iconSize: [40, 60],
  iconAnchor: [20, 52],
  popupAnchor: [0, -50],
  className: "custom-customer-icon",
});

// 🚚 Delivery Truck
const createTruckIcon = (deviceId, status) => {
  const colors = {
    Moving: "#1e5a04",
    Stopped: "#dc2626",
    Traffic: "#f59e0b",
    Inactive: "#6b7280",
  };
  const color = colors[status] || "#1e5a04";

  return new L.DivIcon({
    html: renderToString(
      <div
        style={{
          textAlign: "center",
          color,
          lineHeight: "1.2",
          position: "relative",
        }}
      >
        {/* Label */}
        <div
          style={{
            background: "white",
            borderRadius: "6px",
            padding: "4px 8px",
            fontWeight: "bold",
            fontSize: "12px",
            marginBottom: "8px", // ✅ same spacing as others
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            display: "inline-block",
          }}
        >
          {deviceId.replace(/device[-_]?/i, "Truck ")}
        </div>

        {/* Icon */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <FaTruckFront
            style={{
              fontSize: "42px",
              display: "block",
              marginTop: "2px",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.25))",
            }}
          />
        </div>
      </div>
    ),
    iconSize: [42, 60],
    iconAnchor: [21, 52], // ✅ same vertical alignment
    popupAnchor: [0, -50],
    className: "custom-truck-icon",
  });
};

// ========= UTILITIES =========
const deg2rad = (deg) => deg * (Math.PI / 180);
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ========= HELPER: Recenter map =========
const MapRecenter = ({ targetPosition }) => {
  const map = useMap();
  useEffect(() => {
    if (targetPosition) {
      map.flyTo(targetPosition, 18, { animate: true, duration: 1.2 });
    }
  }, [targetPosition, map]);
  return null;
};

// ========= MAIN COMPONENT =========
export default function DeliveryMapLive() {
  const companyLocation = [14.2091835, 121.1368418]; // Envirocool HQ
  const [customerLocation] = useState([14.205, 121.14]); // Replace with actual customer coords
  const [truck, setTruck] = useState({
    deviceId: "device_001",
    position: [14.207, 121.138],
    status: "Moving",
    eta: "Calculating...",
  });
  const [route, setRoute] = useState([companyLocation]);
  const [focusTruck, setFocusTruck] = useState(false);

  // ========= FETCH LIVE LOCATION =========
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_current_location.php`,
          { params: { device_id: truck.deviceId } }
        );
        const gps = res.data.data;
        if (!gps) return;

        const newPos = [parseFloat(gps.lat), parseFloat(gps.lng)];
        const lastRecorded = new Date(gps.recorded_at);
        const now = new Date();
        const diffMinutes = (now - lastRecorded) / 60000;

        // Calculate distance moved in meters
        const moved =
          getDistanceKm(
            truck.position[0],
            truck.position[1],
            newPos[0],
            newPos[1]
          ) * 1000;

        // Determine status
        let newStatus = "Moving";
        if (diffMinutes >= 20) newStatus = "Inactive";
        else if (moved < 2 && diffMinutes > 5) newStatus = "Stopped";
        else if (moved < 10) newStatus = "Traffic";
        else newStatus = "Moving";

        // Fetch ETA
        const distKm = getDistanceKm(
          newPos[0],
          newPos[1],
          customerLocation[0],
          customerLocation[1]
        );
        const etaRes = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_eta.php`,
          { params: { device_id: truck.deviceId, distance_km: distKm } }
        );

        const eta = etaRes.data?.eta || "Calculating...";

        setTruck((prev) => ({
          ...prev,
          position: newPos,
          status: newStatus,
          eta,
        }));

        setRoute((prev) => [...prev, newPos]);
      } catch (err) {
        console.error("Truck tracking error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [truck.deviceId, customerLocation]);

  return (
    <div className="border rounded shadow-sm" style={{ height: "600px" }}>
      <MapContainer
        center={companyLocation}
        zoom={16}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* ✅ Auto Recenter when Truck Clicked */}
        {focusTruck && <MapRecenter targetPosition={truck.position} />}

        {/* 🏢 Envirocool Marker */}
        <Marker position={companyLocation} icon={companyIcon}>
          <Popup>Envirocool Company (HQ)</Popup>
        </Marker>

        {/* 📍 Customer Marker */}
        <Marker position={customerLocation} icon={customerIcon}>
          <Popup>
            <strong>Customer Address</strong>
            <br />
            Distance from Envirocool:{" "}
            {getDistanceKm(
              companyLocation[0],
              companyLocation[1],
              customerLocation[0],
              customerLocation[1]
            ).toFixed(2)}{" "}
            km
          </Popup>
        </Marker>

        {/* 🧭 Polyline (ROUTE) — placed BEFORE truck marker to stay behind */}
        <Polyline
          positions={route}
          color="#1e5a04"
          weight={4}
          opacity={0.9}
          lineJoin="round"
          lineCap="round"
          interactive={false}
        />

        {/* 🚚 Truck Marker — placed AFTER route for correct z-index layering */}
        <Marker
          position={truck.position}
          icon={createTruckIcon(truck.deviceId, truck.status)}
          eventHandlers={{
            click: () => setFocusTruck(true), // 🔥 Auto focus when clicked
          }}
          zIndexOffset={1000} // ensures it renders on top
        >
          <Popup>
            <strong>{truck.deviceId.replace(/device[-_]?/i, "Truck ")}</strong>
            <br />
            <strong>Status:</strong> {truck.status}
            <br />
            <strong>ETA:</strong> {truck.eta}
            <br />
            <strong>Distance to Customer:</strong>{" "}
            {getDistanceKm(
              truck.position[0],
              truck.position[1],
              customerLocation[0],
              customerLocation[1]
            ).toFixed(2)}{" "}
            km
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
