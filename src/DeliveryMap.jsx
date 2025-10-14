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
import { useParams } from "react-router-dom";
import { PiBuildingApartmentDuotone } from "react-icons/pi";
import { FaTruckFront, FaLocationDot } from "react-icons/fa6";
import "leaflet/dist/leaflet.css";

// ===== Icons =====
const companyIcon = new L.DivIcon({
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
      <PiBuildingApartmentDuotone style={{ fontSize: "40px" }} />
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
        Customer
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
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
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

const formatDateTime = (dateTime) => {
  if (!dateTime) return "N/A";
  const date = new Date(dateTime);
  if (isNaN(date.getTime())) return dateTime;
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Manila",
    hour12: true,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

// ===== Hook to recenter map =====
const RecenterMap = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds?.length > 0) map.fitBounds(bounds, { padding: [80, 80] });
  }, [bounds]);
  return null;
};

// ===== Main Component =====
const CustomerDeliveryMap = () => {
  const { trackingNumber } = useParams();
  const companyLocation = [14.2091835, 121.1368418];

  const [delivery, setDelivery] = useState(null);
  const [truckPos, setTruckPos] = useState(null);
  const [route, setRoute] = useState([]);
  const [status, setStatus] = useState("Loading...");
  const [eta, setEta] = useState("Calculating...");
  const [mapBounds, setMapBounds] = useState([]);

  // Fetch delivery info
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await axios.get(
          `https://13.239.143.31/DeliveryTrackingSystem/get_delivery_by_tracking.php?tracking_number=${trackingNumber}`
        );
        setDelivery(res.data);
      } catch (err) {
        console.error("Error fetching delivery info:", err);
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

        // compute ETA + status
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

        const points = [
          companyLocation,
          newPos,
          [delivery.latitude, delivery.longitude],
        ];
        setMapBounds(points);
      } catch (err) {
        console.error("Tracking error:", err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [delivery]);

  if (!delivery) return <div className="p-5 text-center">Loading map...</div>;

  return (
    <div className="p-4">
      <h4 className="fw-bold text-success mb-3">
        Tracking No: {delivery.tracking_number}
      </h4>

      <div
        className="rounded shadow border border-success"
        style={{ height: "600px" }}
      >
        <MapContainer
          center={companyLocation}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <RecenterMap bounds={mapBounds} />

          {/* Company Marker */}
          <Marker position={companyLocation} icon={companyIcon}>
            <Popup>Envirocool Company</Popup>
          </Marker>

          {/* Customer Marker */}
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
                <strong>Status:</strong> {delivery.status}
              </Popup>
            </Marker>
          )}

          {/* Truck Marker */}
          {truckPos && (
            <>
              <Marker
                position={truckPos}
                icon={createTruckIcon(delivery.assigned_device_id, status)}
              >
                <Popup>
                  <strong>Truck:</strong>{" "}
                  {delivery.assigned_device_id.replace(
                    /device[-_]?/i,
                    "Truck "
                  )}
                  <br />
                  <strong>Status:</strong> {status}
                  <br />
                  <strong>ETA:</strong> {eta}
                  <br />
                  <strong>Last Update:</strong> {formatDateTime(new Date())}
                </Popup>
              </Marker>

              {route.length > 1 && (
                <Polyline positions={route} color="#1e5a04" weight={3} />
              )}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default CustomerDeliveryMap;
