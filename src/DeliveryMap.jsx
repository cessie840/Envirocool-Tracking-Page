import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckFast } from "@fortawesome/free-solid-svg-icons";
import { renderToString } from "react-dom/server";

// ✅ Truck Icon
const truckIcon = L.divIcon({
  className: "custom-truck-icon",
  html: `<div style="font-size:32px; color:#007bff;">
           ${renderToString(<FontAwesomeIcon icon={faTruckFast} />)}
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const DeliveryMap = ({ trackingNumber }) => {
  const [assignedDeviceId, setAssignedDeviceId] = useState(null);
  const [device, setDevice] = useState(null);
  const [trail, setTrail] = useState([]);

  // ✅ URLs
  const API_URL = "https://13.239.143.31/all_devices.php";
  const TRANSACTIONS_URL = "https://13.239.143.31/get_transactions.php";
  const API_KEY = "SecretToBawalMabuksan";

  // ✅ Step 1: Fetch the assigned device from existing transactions
  useEffect(() => {
    const fetchAssignedDevice = async () => {
      try {
        // Example: get all transactions (could be filtered by type/date if needed)
        const response = await axios.get(`${TRANSACTIONS_URL}?type=daily`);
        const transactions = response.data;

        if (Array.isArray(transactions)) {
          // Try to find the one matching the tracking number
          const match = transactions.find(
            (t) => t.tracking_number === trackingNumber
          );

          if (match && match.assigned_device_id) {
            setAssignedDeviceId(match.assigned_device_id);
          } else {
            console.warn(
              "No matching assigned_device_id found for tracking number"
            );
          }
        } else {
          console.error("Invalid response format:", transactions);
        }
      } catch (error) {
        console.error("Error fetching transaction info:", error);
      }
    };

    fetchAssignedDevice();
  }, [trackingNumber]);

  // ✅ Step 2: Fetch live GPS data from all_devices.php
  useEffect(() => {
    if (!assignedDeviceId) return;

    const fetchDevice = async () => {
      try {
        const response = await axios.get(`${API_URL}?key=${API_KEY}`);
        const data = response.data;

        if (Array.isArray(data)) {
          const records = data.filter((d) => d.device_id === assignedDeviceId);

          if (records.length > 0) {
            const latest = records[records.length - 1];
            setDevice(latest);
            const historyTrail = records.map((r) => [r.lat, r.lng]);
            setTrail(historyTrail);
          } else {
            console.warn(`No records found for ${assignedDeviceId}`);
          }
        } else {
          console.error("Invalid response:", data);
        }
      } catch (error) {
        console.error("Error fetching device position:", error);
      }
    };

    fetchDevice();
    const interval = setInterval(fetchDevice, 5000);
    return () => clearInterval(interval);
  }, [assignedDeviceId]);

  // ✅ Step 3: Render map UI
  if (!assignedDeviceId) {
    return (
      <div className="card rounded-4 p-3 border-0 h-100 text-center text-muted py-5">
        Fetching assigned device for <b>{trackingNumber}</b>...
      </div>
    );
  }

  if (!device) {
    return (
      <div className="card rounded-4 p-3 border-0 h-100 text-center text-muted py-5">
        No live location available for <b>{assignedDeviceId}</b>.
      </div>
    );
  }

  return (
    <div className="card rounded-4 p-3 border-0 h-100">
      <h5 className="fw-bold text-dark mb-3">
        Live Location – {assignedDeviceId}
      </h5>
      <MapContainer
        center={[device.lat, device.lng]}
        zoom={16}
        style={{ height: "500px", borderRadius: "12px" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[device.lat, device.lng]} icon={truckIcon}>
          <Popup>
            <b>Device:</b> {device.device_id}
            <br />
            <b>Updated:</b> {device.updated_at}
          </Popup>
        </Marker>

        {trail.length > 1 && (
          <Polyline positions={trail} color="blue" weight={4} opacity={0.7} />
        )}
      </MapContainer>
    </div>
  );
};

export default DeliveryMap;
