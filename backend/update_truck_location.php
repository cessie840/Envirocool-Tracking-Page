<?php
// ✅ Allow requests from your React app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// ✅ Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Database connection
require_once "database.php";

// ✅ Get inputs
$deviceId = $_GET['device_id'] ?? '';
$lat = $_GET['lat'] ?? '';
$lng = $_GET['lng'] ?? '';

if (!$deviceId || !$lat || !$lng) {
    echo json_encode(["success" => false, "error" => "Missing parameters"]);
    exit;
}

// ✅ Update the latest coordinates for all active transactions with this device
$stmt = $conn->prepare("
    UPDATE transaction 
    SET latitude = ?, longitude = ?
    WHERE assigned_device_id = ? 
      AND status IN ('Out for Delivery', 'In Transit')
");
$stmt->bind_param("dds", $lat, $lng, $deviceId);

if ($stmt->execute()) {
    echo json_encode([
        "success" => true,
        "message" => "Truck location updated",
        "data" => [
            "device_id" => $deviceId,
            "lat" => $lat,
            "lng" => $lng,
            "updated_at" => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    echo json_encode(["success" => false, "error" => "Database update failed"]);
}
