<?php
// --- Headers ---
header("Access-Control-Allow-Origin:  https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- Handle OPTIONS preflight ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Database connection ---
require_once "database.php";

$device_id = $_GET['device_id'] ?? '';

if (empty($device_id)) {
    echo json_encode(["success" => false, "error" => "Missing device_id"]);
    exit;
}

// --- Get current position ---
$currentQuery = $conn->prepare("
    SELECT lat, lng, updated_at 
    FROM current_positions 
    WHERE device_id = ?
    LIMIT 1
");
$currentQuery->bind_param("s", $device_id);
$currentQuery->execute();
$currentResult = $currentQuery->get_result();

if ($currentResult->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Device not found in current_positions"]);
    exit;
}

$currentData = $currentResult->fetch_assoc();

// --- Get latest GPS record (optional, for last history entry) ---
$historyQuery = $conn->prepare("
    SELECT recorded_at 
    FROM gps_coordinates 
    WHERE device_id = ?
    ORDER BY recorded_at DESC 
    LIMIT 1
");
$historyQuery->bind_param("s", $device_id);
$historyQuery->execute();
$historyResult = $historyQuery->get_result();
$historyData = $historyResult->fetch_assoc();

echo json_encode([
    "success" => true,
    "data" => [
        "device_id"   => $device_id,
        "lat"         => (float)$currentData['lat'],
        "lng"         => (float)$currentData['lng'],
        "recorded_at" => $historyData['recorded_at'] ?? $currentData['updated_at']
    ]
]);
