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
import "./DeliveryMap.css";
import "leaflet/dist/leaflet.css";

// ========= ICONS =========

// 🏢 Envirocool Company
const companyIcon = new L.DivIcon({
  html: renderToString(
    <div style={{ textAlign: "center", color: "#14559a", lineHeight: "1.2" }}>
      <div
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "bold",
          fontSize: "12px",
          marginBottom: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      >
        Envirocool Company
      </div>
      <PiBuildingApartmentDuotone style={{ fontSize: "42px" }} />
    </div>
  ),
  iconSize: [42, 60],
  iconAnchor: [21, 52],
  popupAnchor: [0, -50],
});

// 🏠 Customer Location
const customerIcon = new L.DivIcon({
  html: renderToString(
    <div style={{ textAlign: "center", color: "#dc2626", lineHeight: "1.2" }}>
      <div
        style={{
          background: "white",
          borderRadius: "6px",
          padding: "4px 8px",
          fontWeight: "bold",
          fontSize: "12px",
          marginBottom: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          display: "inline-block",
        }}
      >
        Customer Location
      </div>
      <FaLocationDot style={{ fontSize: "40px" }} />
    </div>
  ),
  iconSize: [40, 60],
  iconAnchor: [20, 52],
  popupAnchor: [0, -50],
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
      <div style={{ textAlign: "center", color, lineHeight: "1.2" }}>
        <div
          style={{
            background: "white",
            borderRadius: "6px",
            padding: "4px 8px",
            fontWeight: "bold",
            fontSize: "12px",
            marginBottom: "8px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            display: "inline-block",
          }}
        >
          {deviceId.replace(/device[-_]?/i, "Truck ")}
        </div>
        <FaTruckFront style={{ fontSize: "42px" }} />
      </div>
    ),
    iconSize: [42, 60],
    iconAnchor: [21, 52],
    popupAnchor: [0, -50],
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

// ========= FOLLOW LOGIC =========
const MapFollowTruck = ({ truckPosition, isFollowing }) => {
  const map = useMap();
  useEffect(() => {
    if (isFollowing && truckPosition) {
      map.flyTo(truckPosition, 18, { animate: true, duration: 1.2 });
    }
  }, [truckPosition, isFollowing, map]);
  return null;
};

// ========= MAIN COMPONENT =========
export default function DeliveryMapLive() {
  const companyLocation = [14.2091835, 121.1368418];
  const [customerLocation] = useState([14.205, 121.14]);
  const [truck, setTruck] = useState({
    deviceId: "device_001",
    position: [14.207, 121.138],
    status: "Moving",
    eta: "Calculating...",
  });
  const [route, setRoute] = useState([companyLocation]);
  const [isFollowing, setIsFollowing] = useState(true); // ✅ Start following automatically

  // ========= FETCH LIVE LOCATION =========
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://delivery-api.mooo.info/DeliveryTrackingSystem/get_current_location.php`,
          { params: { device_id: truck.deviceId } }
        );
        const gps = res.data.data;
        if (!gps) return;

        const newPos = [parseFloat(gps.lat), parseFloat(gps.lng)];
        const lastRecorded = new Date(gps.recorded_at);
        const now = new Date();
        const diffMinutes = (now - lastRecorded) / 60000;

        const moved =
          getDistanceKm(
            truck.position[0],
            truck.position[1],
            newPos[0],
            newPos[1]
          ) * 1000;

        let newStatus = "Moving";
        if (diffMinutes >= 20) newStatus = "Inactive";
        else if (moved < 2 && diffMinutes > 5) newStatus = "Stopped";
        else if (moved < 10) newStatus = "Traffic";

        const distKm = getDistanceKm(
          newPos[0],
          newPos[1],
          customerLocation[0],
          customerLocation[1]
        );
        const etaRes = await axios.get(
          `https://delivery-api.mooo.info/DeliveryTrackingSystem/get_eta.php`,
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
    <div
      className="border rounded shadow-sm position-relative"
      style={{ height: "600px" }}
    >
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

        {/* 🧭 Auto-follow logic */}
        <MapFollowTruck
          truckPosition={truck.position}
          isFollowing={isFollowing}
        />

        {/* 🏢 Company Marker */}
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

        {/* 🚚 Route Line */}
        <Polyline positions={route} color="#1e5a04" weight={4} opacity={0.9} />

        {/* 🚛 Truck Marker */}
        <Marker
          position={truck.position}
          icon={createTruckIcon(truck.deviceId, truck.status)}
          eventHandlers={{
            click: () => setIsFollowing((prev) => !prev), // ✅ Toggle follow on click
          }}
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

      {/* 🟢 Floating follow status indicator */}
      <div
        className="position-absolute top-0 end-0 m-3 px-3 py-1 rounded-pill text-white shadow"
        style={{
          backgroundColor: isFollowing ? "#198754" : "#6c757d",
          fontSize: "0.9rem",
          fontWeight: "500",
        }}
      >
        {isFollowing ? "Following Truck" : "Free View"}
      </div>
    </div>
  );
}
