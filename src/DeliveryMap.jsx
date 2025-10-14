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
  const [transactions, setTransactions] = useState([]);
  const [devices, setDevices] = useState([]);
  const [assignedDeviceId, setAssignedDeviceId] = useState(null);
  const [device, setDevice] = useState(null);
  const [trail, setTrail] = useState([]);

  // ✅ URLs
  const DEVICES_URL = "https://13.239.143.31/all_devices.php";
  const TRANSACTIONS_URL =
    "https://13.239.143.31/customer/get_transactions.php";
  const API_KEY = "SecretToBawalMabuksan";

  // ✅ Step 1: Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axios.get(`${TRANSACTIONS_URL}?type=daily`);
        if (Array.isArray(response.data)) {
          setTransactions(response.data);
        } else {
          console.error("Invalid transactions response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchTransactions();
  }, []);

  // ✅ Step 2: Fetch devices
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${DEVICES_URL}?key=${API_KEY}`);
        if (Array.isArray(response.data)) {
          setDevices(response.data);
        } else {
          console.error("Invalid devices response:", response.data);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
    const interval = setInterval(fetchDevices, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Step 3: Match assigned_device_id from transaction with device_id
  useEffect(() => {
    if (!transactions.length || !devices.length) return;

    const currentTransaction = transactions.find(
      (t) => t.tracking_number.trim() === trackingNumber.trim()
    );

    if (!currentTransaction) {
      console.warn(
        `No transaction found for tracking number ${trackingNumber}`
      );
      return;
    }

    const match = devices.find(
      (d) => d.device_id.trim() === currentTransaction.assigned_device_id.trim()
    );

    if (!match) {
      console.warn(
        `⚠️ No matching assigned_device_id found for tracking number ${trackingNumber}`
      );
    } else {
      console.log(`✅ Found match for ${trackingNumber}: ${match.device_id}`);
      setAssignedDeviceId(match.device_id);
      setDevice(match);
      setTrail([[match.lat, match.lng]]);
    }
  }, [transactions, devices, trackingNumber]);

  // ✅ UI Rendering
  if (!transactions.length || !devices.length) {
    return (
      <div className="card rounded-4 p-3 border-0 h-100 text-center text-muted py-5">
        Loading data for <b>{trackingNumber}</b>...
      </div>
    );
  }

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
