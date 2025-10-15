<?php

header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../database.php';
ini_set('log_errors', 1);
error_log(__DIR__ . '/php-error.log');
error_reporting(E_ALL);

$input = json_decode(file_get_contents("php://input"), true);
$trackingNumber = $input['tracking_number'] ?? '';

if (empty($trackingNumber)) {
    echo json_encode(["success" => false, "message" => "Missing tracking number."]);
    exit();
}

try {
    // --- Truck current location ---
    $truckStmt = $conn->prepare("
        SELECT gc.lat, gc.lng, gc.recorded_at
        FROM gps_coordinates gc
        INNER JOIN transactions t ON gc.device_id = t.device_id
        WHERE t.tracking_number = ?
        ORDER BY gc.recorded_at DESC
        LIMIT 1
    ");
    $truckStmt->bind_param("s", $trackingNumber);
    $truckStmt->execute();
    $truckResult = $truckStmt->get_result();
    $truck = $truckResult->fetch_assoc();

    // --- Customer location ---
    $custStmt = $conn->prepare("
        SELECT latitude AS lat, longitude AS lng, address
        FROM transactions
        WHERE tracking_number = ?
        LIMIT 1
    ");
    $custStmt->bind_param("s", $trackingNumber);
    $custStmt->execute();
    $custResult = $custStmt->get_result();
    $customer = $custResult->fetch_assoc();

    // --- Company (fixed HQ location) ---
    $company = [
        "lat" => 14.2821,
        "lng" => 121.1257,
        "name" => "Envirocool Headquarters"
    ];

    if (!$truck || !$customer) {
        echo json_encode([
            "success" => false,
            "message" => "Could not find truck or customer data for this tracking number."
        ]);
        exit();
    }

    echo json_encode([
        "success" => true,
        "company" => $company,
        "truck" => $truck,
        "customer" => $customer
    ]);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Internal server error.",
        "error" => $e->getMessage()
    ]);
}
?>
