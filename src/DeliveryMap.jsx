import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import L from "leaflet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTruckFast } from "@fortawesome/free-solid-svg-icons";
import { renderToString } from "react-dom/server";

const truckIcon = L.divIcon({
  className: "custom-truck-icon",
  html: `<div style="font-size:32px; color:#007bff;">
           ${renderToString(<FontAwesomeIcon icon={faTruckFast} />)}
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

const DeliveryMap = () => {
  const [device, setDevice] = useState(null);
  const [trail, setTrail] = useState([]);
  const targetDeviceId = "DEVICE_004";

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        const response = await fetch("http://13.239.143.31/all_devices.php");
        const data = await response.json();

        if (Array.isArray(data)) {
          const found = data.find((d) => d.device_id === targetDeviceId);
          if (found) {
            setDevice(found);

            // add to trail if new coordinate
            setTrail((prevTrail) => {
              const lastPoint = prevTrail[prevTrail.length - 1];
              const newPoint = [found.lat, found.lng];
              if (
                !lastPoint ||
                lastPoint[0] !== newPoint[0] ||
                lastPoint[1] !== newPoint[1]
              ) {
                return [...prevTrail, newPoint];
              }
              return prevTrail;
            });
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
  }, []);

  if (!device) {
    return (
      <div className="card rounded-4 p-3 border-0 h-100 text-center text-muted py-5">
        No live location for {targetDeviceId} yet.
      </div>
    );
  }

  return (
    <div className="card rounded-4 p-3 border-0 h-100">
      <h5 className="fw-bold text-dark mb-3">
        Live Location – {targetDeviceId}
      </h5>
      <MapContainer
        center={[device.lat, device.lng]}
        zoom={13}
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
