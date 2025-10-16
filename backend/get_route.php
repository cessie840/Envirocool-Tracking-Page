<?php
require_once "database.php";

$allowed_origins = [
    "https://cessie840.github.io",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page"
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}

header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$trackingNumber = isset($data["tracking_number"]) ? trim($data["tracking_number"]) : "";

if (empty($trackingNumber)) {
    echo json_encode(["success" => false, "message" => "Tracking number is required"]);
    exit;
}

// ✅ Example query: fetch GPS trail for this transaction
$sql = "
    SELECT g.lat, g.lng, g.recorded_at
    FROM gps_coordinates g
    INNER JOIN Transactions t ON t.tracking_number = ?
    INNER JOIN current_positions c ON c.device_id = g.device_id
    WHERE t.tracking_number = ?
    ORDER BY g.recorded_at ASC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $trackingNumber, $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

$trail = [];
while ($row = $result->fetch_assoc()) {
    $trail[] = $row;
}

echo json_encode([
    "success" => true,
    "tracking_number" => $trackingNumber,
    "trail" => $trail
]);

$stmt->close();
$conn->close();
