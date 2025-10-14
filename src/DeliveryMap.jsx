import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckFast } from "@fortawesome/free-solid-svg-icons";
import { renderToString } from "react-dom/server";
import axios from "axios";
import "leaflet/dist/leaflet.css";

// ======== Icons ========
const customerIcon = new L.DivIcon({
  html: renderToString(
    <div style={{ textAlign: "center", color: "#dc2626" }}>
      <div
        style={{
          backgroundColor: "white",
          padding: "2px 6px",
          borderRadius: "6px",
          marginBottom: "3px",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        Customer
      </div>
      <i className="fas fa-map-marker-alt" style={{ fontSize: "36px" }}></i>
    </div>
  ),
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ======== Truck Icon Generator ========
const createTruckIcon = (status) => {
  const color =
    status === "Moving"
      ? "#1e5a04"
      : status === "Stopped"
      ? "#dc2626"
      : "#f59e0b";

  return L.divIcon({
    html: renderToString(
      <FontAwesomeIcon icon={faTruckFast} style={{ fontSize: 32, color }} />
    ),
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
  });
};

// ======== Helpers ========
const deg2rad = (deg) => deg * (Math.PI / 180);
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ======== Recenter Hook ========
const RecenterMap = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions?.length > 0) {
      map.fitBounds(positions, { padding: [80, 80] });
    }
  }, [positions]);
  return null;
};

// ======== DeliveryMap Component ========
const DeliveryMap = ({ targetDeviceId, customerLat, customerLng, apiKey }) => {
  const [device, setDevice] = useState(null);
  const [trail, setTrail] = useState([]);
  const [eta, setEta] = useState("Calculating...");
  const previousPositionRef = useRef(null);

  const customerPosition = [customerLat, customerLng];

  // ======== Fetch Device Data ========
  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await axios.get(
          "https://13.239.143.31/all_devices.php",
          { headers: { "X-API-KEY": apiKey } }
        );
        const data = response.data;

        if (Array.isArray(data)) {
          const record = data.find((d) => d.device_id === targetDeviceId);
          if (record) {
            // Infer status based on previous position
            let status = "Moving";
            if (previousPositionRef.current) {
              const distance = getDistanceKm(
                previousPositionRef.current.lat,
                previousPositionRef.current.lng,
                record.lat,
                record.lng
              );
              status = distance < 0.02 ? "Stopped" : "Moving"; // <20m -> Stopped
            }
            previousPositionRef.current = record;

            setDevice({ ...record, status });

            setTrail((prev) => [...prev, [record.lat, record.lng]]);

            // Distance
            const distanceToCustomer = getDistanceKm(
              record.lat,
              record.lng,
              customerLat,
              customerLng
            );

            // Optional ETA calculation (assuming 40 km/h avg)
            const etaMinutes = (distanceToCustomer / 40) * 60;
            setEta(`${Math.round(etaMinutes)} min`);
          }
        } else {
          console.error("Invalid data format", data);
        }
      } catch (error) {
        console.error("Error fetching device position:", error);
      }
    };

    fetchDevice();
    const interval = setInterval(fetchDevice, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [targetDeviceId, customerLat, customerLng, apiKey]);

  if (!device) {
    return (
      <div className="card rounded-4 p-3 border-0 h-100 text-center text-muted py-5">
        No live location for {targetDeviceId} yet.
      </div>
    );
  }

  const boundsPositions = [[device.lat, device.lng], customerPosition];

  return (
    <div className="card rounded-4 p-3 border-0 h-100">
      <h5 className="fw-bold text-dark mb-3">
        Live Delivery – {targetDeviceId}
      </h5>
      <MapContainer
        center={[device.lat, device.lng]}
        zoom={16}
        style={{ height: "500px", borderRadius: "12px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <RecenterMap positions={boundsPositions} />

        {/* Customer Marker */}
        <Marker position={customerPosition} icon={customerIcon}>
          <Popup>
            <b>Customer</b>
            <br />
            Distance:{" "}
            {getDistanceKm(
              device.lat,
              device.lng,
              customerLat,
              customerLng
            ).toFixed(2)}{" "}
            km
            <br />
            ETA: {eta}
          </Popup>
        </Marker>

        {/* Truck Marker */}
        <Marker
          position={[device.lat, device.lng]}
          icon={createTruckIcon(device.status)}
        >
          <Popup>
            <b>Device:</b> {device.device_id}
            <br />
            <b>Status:</b> {device.status}
            <br />
            <b>Updated:</b> {device.updated_at}
            <br />
            <b>Distance:</b>{" "}
            {getDistanceKm(
              device.lat,
              device.lng,
              customerLat,
              customerLng
            ).toFixed(2)}{" "}
            km
            <br />
            <b>ETA:</b> {eta}
          </Popup>
        </Marker>

        {/* Trail Polyline */}
        {trail.length > 1 && (
          <Polyline positions={trail} color="blue" weight={4} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
