<?php
// ✅ Allow requests from your React app
header("Access-Control-Allow-Origin:  https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// ✅ Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once "database.php";

$device_id = $_GET['device_id'] ?? '';
$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';

if (!$device_id || !$lat || !$lng) {
    echo json_encode(["success" => false, "error" => "Missing parameters"]);
    exit;
}

// --- Log new GPS coordinate ---
$insert = $conn->prepare("INSERT INTO gps_coordinates (device_id, lat, lng) VALUES (?, ?, ?)");
$insert->bind_param("sdd", $device_id, $lat, $lng);
$insert->execute();

// --- Update current position ---
$update = $conn->prepare("
    INSERT INTO current_positions (device_id, lat, lng) 
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), updated_at = CURRENT_TIMESTAMP
");
$update->bind_param("sdd", $device_id, $lat, $lng);
$update->execute();

// --- Optionally update transaction table ---
$conn->query("
    UPDATE transaction 
    SET latitude = $lat, longitude = $lng 
    WHERE assigned_device_id = '$device_id' 
      AND status IN ('Out for Delivery', 'In Transit')
");

echo json_encode([
    "success" => true,
    "message" => "Location updated successfully",
    "device_id" => $device_id,
    "lat" => $lat,
    "lng" => $lng,
    "timestamp" => date('Y-m-d H:i:s')
]);