import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { renderToString } from "react-dom/server";
import { FaTruckFront, FaLocationDot } from "react-icons/fa6";
import { PiBuildingApartmentDuotone } from "react-icons/pi";
import { useParams } from "react-router-dom";

// ===== Icons =====
const buildingIcon = new L.DivIcon({
  html: renderToString(
    <div style={{ textAlign: "center", color: "#14559a" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "6px",
          padding: "2px 6px",
          fontWeight: "bold",
          fontSize: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          marginBottom: "3px",
        }}
      >
        Envirocool Company
      </div>
      <PiBuildingApartmentDuotone style={{ fontSize: "36px" }} />
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const customerIcon = new L.DivIcon({
  html: renderToString(
    <div style={{ textAlign: "center", color: "#dc2626" }}>
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "6px",
          padding: "2px 6px",
          fontWeight: "bold",
          fontSize: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          marginBottom: "3px",
        }}
      >
        Customer Location
      </div>
      <FaLocationDot style={{ fontSize: "36px" }} />
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const createTruckIcon = (deviceId, status) => {
  const colorMap = {
    Moving: "#1e5a04",
    Stopped: "#dc2626",
    Traffic: "#f59e0b",
    Completed: "#53a967",
    Inactive: "#6b7280",
  };
  return new L.DivIcon({
    html: renderToString(
      <div
        style={{ textAlign: "center", color: colorMap[status] || "#1e5a04" }}
      >
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "6px",
            padding: "2px 6px",
            fontWeight: "bold",
            fontSize: "12px",
            marginBottom: "3px",
          }}
        >
          {deviceId.replace(/device[-_]?/i, "Truck ")}
        </div>
        <FaTruckFront style={{ fontSize: "36px" }} />
      </div>
    ),
    iconSize: [30, 30],
    iconAnchor: [-5, 50],
  });
};

// ===== Helper Functions =====
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

// ===== Recenter Hook =====
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 14);
  }, [position]);
  return null;
};

// ===== Main Component =====
const DeliveryMap = () => {
  const { trackingNumber } = useParams();
  const companyLoc = [14.2091835, 121.1368418];

  const [delivery, setDelivery] = useState(null);
  const [truckPos, setTruckPos] = useState(null);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState("Calculating...");
  const [status, setStatus] = useState("Loading...");

  // Fetch delivery info by tracking number
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_delivery_by_tracking.php?tracking_number=${trackingNumber}`
        );
        setDelivery(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDelivery();
  }, [trackingNumber]);

  // Track assigned truck
  useEffect(() => {
    if (!delivery?.assigned_device_id) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_current_location.php?device_id=${delivery.assigned_device_id}`
        );

        const gps = res.data.data;
        if (!gps) return;

        const newPos = [parseFloat(gps.lat), parseFloat(gps.lng)];
        setTruckPos(newPos);
        setRoute((prev) => [...prev, newPos]);

        const distanceKm = getDistanceKm(
          newPos[0],
          newPos[1],
          delivery.latitude,
          delivery.longitude
        );

        const etaRes = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_eta.php`,
          {
            params: {
              device_id: delivery.assigned_device_id,
              distance_km: distanceKm,
            },
          }
        );
        setEta(etaRes.data?.eta || "N/A");
        setStatus(distanceKm < 0.05 ? "Arriving Soon" : "On the Way");
      } catch (err) {
        console.error("Tracking error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [delivery]);

  if (!delivery) return <div>Loading your delivery...</div>;

  return (
    <div className="p-3">
      <h4 className="fw-bold mb-3 text-success">
        Tracking No: {delivery.tracking_number}
      </h4>
      <MapContainer
        center={companyLoc}
        zoom={13}
        style={{ height: "500px", borderRadius: "12px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <RecenterMap position={truckPos || companyLoc} />

        {/* Company */}
        <Marker position={companyLoc} icon={buildingIcon}>
          <Popup>Envirocool Company</Popup>
        </Marker>

        {/* Customer */}
        {delivery.latitude && delivery.longitude && (
          <Marker
            position={[delivery.latitude, delivery.longitude]}
            icon={customerIcon}
          >
            <Popup>
              <strong>{delivery.customer_name}</strong>
              <br />
              {delivery.customer_address}
              <br />
              Tracking No: {delivery.tracking_number}
            </Popup>
          </Marker>
        )}

        {/* Truck */}
        {truckPos && (
          <>
            <Marker
              position={truckPos}
              icon={createTruckIcon(delivery.assigned_device_id, status)}
            >
              <Popup>
                <b>Truck:</b>{" "}
                {delivery.assigned_device_id.replace(/device[-_]?/i, "Truck ")}
                <br />
                <b>Status:</b> {status}
                <br />
                <b>ETA:</b> {eta}
              </Popup>
            </Marker>
            {route.length > 1 && (
              <Polyline positions={route} color="#1e5a04" weight={3} />
            )}
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
