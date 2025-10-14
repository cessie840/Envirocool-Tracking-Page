<?php
header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
require_once "../database.php"; // adjust path if needed

$trackingNumber = $_GET['tracking_number'] ?? '';

if (!$trackingNumber) {
    echo json_encode(["error" => "Missing tracking number"]);
    exit;
}

$stmt = $conn->prepare("
    SELECT tracking_number, customer_name, customer_address,
           latitude AS truck_lat, longitude AS truck_lng,
           status, target_date_delivery
    FROM transaction
    WHERE tracking_number = ?
");
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["error" => "Delivery not found"]);
    exit;
}

$data = $result->fetch_assoc();

// Company location (static for now)
$data["company_lat"] = 14.2664; // Example: Envirocool Office
$data["company_lng"] = 121.0920;

// Return as JSON
echo json_encode($data);
