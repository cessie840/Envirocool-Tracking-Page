import React, { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "./DeliveryMap.css"; // <-- add this for spinner styles

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

export default function DeliveryMap({ trackingNumber }) {
  const [delivery, setDelivery] = useState(null);
  const [customerCoords, setCustomerCoords] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trackingNumber) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `https://13.239.143.31/customer/map/get_delivery_by_tracking.php?tracking_number=${trackingNumber}`
        );
        const data = res.data;
        setDelivery(data);

        // --- Geocode customer address ---
        const geo = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            data.customer_address
          )}`
        );

        if (geo.data && geo.data.length > 0) {
          setCustomerCoords({
            lat: parseFloat(geo.data[0].lat),
            lng: parseFloat(geo.data[0].lon),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching delivery:", err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [trackingNumber]);

  useEffect(() => {
    if (delivery && customerCoords) {
      // --- Calculate ETA (using haversine distance + avg speed 40 km/h) ---
      const R = 6371;
      const dLat = ((customerCoords.lat - delivery.truck_lat) * Math.PI) / 180;
      const dLon = ((customerCoords.lng - delivery.truck_lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((delivery.truck_lat * Math.PI) / 180) *
          Math.cos((customerCoords.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const avgSpeed = 40;
      const etaMinutes = Math.round((distance / avgSpeed) * 60);
      setEta(etaMinutes);
    }
  }, [delivery, customerCoords]);

  // --- Loading Spinner ---
  if (loading)
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Fetching delivery details...</p>
      </div>
    );

  if (!delivery || !customerCoords)
    return (
      <div className="loading-container">
        <p>Unable to load map data.</p>
      </div>
    );

  return (
    <MapContainer
      center={[delivery.truck_lat, delivery.truck_lng]}
      zoom={12}
      style={{ height: "80vh", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Company Marker */}
      <Marker
        position={[delivery.company_lat, delivery.company_lng]}
        icon={companyIcon}
      >
        <Popup>🏢 Envirocool Company</Popup>
      </Marker>

      {/* Truck Marker */}
      <Marker
        position={[delivery.truck_lat, delivery.truck_lng]}
        icon={truckIcon}
      >
        <Popup>
          🚚 Truck Location <br />
          Status: {delivery.status} <br />
          ETA: {eta ? `${eta} mins` : "Calculating..."}
        </Popup>
      </Marker>

      {/* Customer Marker */}
      <Marker
        position={[customerCoords.lat, customerCoords.lng]}
        icon={customerIcon}
      >
        <Popup>
          🏠 {delivery.customer_name} <br />
          {delivery.customer_address}
        </Popup>
      </Marker>

      {/* Route Line */}
      <Polyline
        positions={[
          [delivery.truck_lat, delivery.truck_lng],
          [customerCoords.lat, customerCoords.lng],
        ]}
        color="green"
      />
    </MapContainer>
  );
}
