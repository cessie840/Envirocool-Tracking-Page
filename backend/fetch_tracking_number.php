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
// Read tracking number (for x-www-form-urlencoded)
$trackingNumber = isset($_POST["tracking_number"]) ? trim($_POST["tracking_number"]) : "";

if (empty($trackingNumber)) {
    echo json_encode([
        "success" => false,
        "message" => "Tracking number is required."
    ]);
    exit;
}

$sql = "SELECT transaction_id, tracking_number, status 
        FROM Transactions 
        WHERE tracking_number = ? 
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    echo json_encode([
        "success" => true,
        "tracking_number" => $row["tracking_number"],
        "status" => $row["status"]
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid tracking number."
    ]);
}

$stmt->close();
$conn->close();
