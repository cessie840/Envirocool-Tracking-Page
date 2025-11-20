<?php
require_once "database.php";

$allowed_origins = [
    "https://envirocool-tracking-page.vercel.app",
    "http://localhost:5173",
    "http://localhost:5173/Envirocool-Tracking-Page",
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

// ✅ Parse JSON body
$input = json_decode(file_get_contents("php://input"), true);

$trackingNumber = isset($input["tracking_number"]) ? trim($input["tracking_number"]) : "";
$rating = isset($input["rating"]) ? trim($input["rating"]) : "";
$feedback = isset($input["comments"]) ? trim($input["comments"]) : "";

if (empty($trackingNumber) || empty($rating) || empty($feedback)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

$sql = "UPDATE Transactions SET customer_rating = ?, customer_feedback = ? WHERE tracking_number = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $rating, $feedback, $trackingNumber);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Feedback saved successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to save feedback."]);
}

$stmt->close();
$conn->close();
