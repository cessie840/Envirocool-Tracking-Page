<?php
require_once "database.php";

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

// Read tracking number (for JSON or form data)
$input = json_decode(file_get_contents("php://input"), true);
$trackingNumber = $input["tracking_number"] ?? ($_POST["tracking_number"] ?? "");

if (empty($trackingNumber)) {
    echo json_encode([
        "success" => false,
        "message" => "Tracking number is required."
    ]);
    exit;
}

$sql = "SELECT 
            transaction_id,
            tracking_number,
            status,
            customer_name,
            customer_address,
            latitude,
            longitude,
            company_lat,
            company_lng,
            customer_rating,
            customer_feedback
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
        "Transactions" => [
            "transaction_id" => $row["transaction_id"],
            "tracking_number" => $row["tracking_number"],
            "status" => $row["status"],
            "customer_name" => $row["customer_name"],
            "customer_address" => $row["customer_address"],
            "latitude" => $row["latitude"],
            "longitude" => $row["longitude"],
            "company_lat" => $row["company_lat"],
            "company_lng" => $row["company_lng"],
            "customer_rating" => $row["customer_rating"],
            "customer_feedback" => $row["customer_feedback"]
        ],
        "items" => [] // You can replace this with actual delivery items if available
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "Invalid tracking number."
    ]);
}

$stmt->close();
$conn->close();
