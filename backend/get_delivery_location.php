<?php
require_once "database.php";

// --- CORS + Headers ---
header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight (OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Get device_id from GET parameter
$deviceId = isset($_GET["device_id"]) ? trim($_GET["device_id"]) : "";

if (empty($deviceId)) {
    echo json_encode(["success" => false, "message" => "Device ID is required"]);
    exit;
}

// ✅ Step 1: Get the latest location from current_positions
$locSql = "
    SELECT lat, lng, updated_at 
    FROM current_positions 
    WHERE device_id = ? 
    ORDER BY updated_at DESC 
    LIMIT 1
";
$locStmt = $conn->prepare($locSql);
if (!$locStmt) {
    echo json_encode(["success" => false, "message" => "SQL error: " . $conn->error]);
    exit;
}
$locStmt->bind_param("s", $deviceId);
$locStmt->execute();
$locResult = $locStmt->get_result();

if ($location = $locResult->fetch_assoc()) {
    echo json_encode([
        "success" => true,
        "data" => [
            "lat" => (float)$location["lat"],
            "lng" => (float)$location["lng"],
            "updated_at" => $location["updated_at"]
        ]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "No location found for this device"
    ]);
}

$locStmt->close();
$conn->close();
?>
