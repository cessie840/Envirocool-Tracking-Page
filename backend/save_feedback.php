<?php
require_once "database.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
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
