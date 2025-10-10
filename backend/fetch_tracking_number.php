<?php
require_once "database.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
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
