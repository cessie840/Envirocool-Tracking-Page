<?php
require 'config.php';

// --- CORS HEADERS (must be before anything else) ---
header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight OPTIONS request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- API Key Validation ---
$EXPECTED_API_KEY = 'SecretToBawalMabuksan';
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? ($_GET['key'] ?? '');

if ($apiKey !== $EXPECTED_API_KEY) {
    http_response_code(401);
    echo json_encode(["error" => "Unauthorized access."]);
    exit();
}

// --- Database Query ---
$sql = "SELECT device_id, lat, lng, updated_at FROM current_positions";
$result = $db->query($sql);

if (!$result) {
    echo json_encode(["error" => $db->error]);
    exit;
}

// --- Output ---
$devices = [];
while ($row = $result->fetch_assoc()) {
    $devices[] = [
        "device_id" => $row["device_id"],
        "lat"       => (float)$row["lat"],
        "lng"       => (float)$row["lng"],
        "updated_at"=> $row["updated_at"]
    ];
}

echo json_encode($devices);
?>
