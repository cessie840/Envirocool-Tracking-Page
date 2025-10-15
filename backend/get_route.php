<?php
// ✅ get_route.php

// --- CORS + JSON Headers ---
header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// --- Handle preflight ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Include database ---
require_once __DIR__ . '/../database.php';

// --- Error reporting (for debugging only) ---
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

// --- Read JSON input ---
$input = json_decode(file_get_contents("php://input"), true);
$trackingNumber = $input['tracking_number'] ?? '';

if (empty($trackingNumber)) {
    echo json_encode(["success" => false, "message" => "Missing tracking number."]);
    exit();
}

try {
    // --- STEP 1: Get device_id for this tracking number ---
    $stmt = $conn->prepare("SELECT device_id FROM transaction WHERE tracking_number = ?");
    $stmt->bind_param("s", $trackingNumber);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Tracking number not found."]);
        exit();
    }

    $device = $result->fetch_assoc();
    $deviceId = $device['device_id'];
    $stmt->close();

    // --- STEP 2: Get historical trail from gps_coordinates ---
    $trailQuery = $conn->prepare("
        SELECT lat, lng, recorded_at 
        FROM gps_coordinates 
        WHERE device_id = ?
        ORDER BY recorded_at ASC
    ");
    $trailQuery->bind_param("s", $deviceId);
    $trailQuery->execute();
    $trailResult = $trailQuery->get_result();

    $trail = [];
    while ($row = $trailResult->fetch_assoc()) {
        $trail[] = [
            "lat" => (float)$row['lat'],
            "lng" => (float)$row['lng'],
            "timestamp" => $row['recorded_at']
        ];
    }
    $trailQuery->close();

    // --- STEP 3: Get latest current position ---
    $currentQuery = $conn->prepare("
        SELECT lat, lng, updated_at 
        FROM current_positions 
        WHERE device_id = ?
        LIMIT 1
    ");
    $currentQuery->bind_param("s", $deviceId);
    $currentQuery->execute();
    $currentResult = $currentQuery->get_result();
    $current = $currentResult->fetch_assoc();
    $currentQuery->close();

    echo json_encode([
        "success" => true,
        "device_id" => $deviceId,
        "trail" => $trail,
        "current_position" => [
            "lat" => isset($current['lat']) ? (float)$current['lat'] : null,
            "lng" => isset($current['lng']) ? (float)$current['lng'] : null,
            "updated_at" => $current['updated_at'] ?? null
        ]
    ]);

    $conn->close();

} catch (Exception $e) {
    error_log("get_route.php Error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Internal server error.",
        "error" => $e->getMessage()
    ]);
}
?>
