<?php
require_once "database.php";

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit(0);
}

$trackingNumber = isset($_POST["tracking_number"]) ? trim($_POST["tracking_number"]) : "";
$rating = isset($_POST["rating"]) ? trim($_POST["rating"]) : "";
$feedback = isset($_POST["feedback"]) ? trim($_POST["feedback"]) : "";

if (empty($trackingNumber) || empty($rating) || empty($feedback)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

$sql = "UPDATE Transactions SET customer_rating = ?, cancelled_reason = ? WHERE tracking_number = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $rating, $feedback, $trackingNumber);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Feedback saved successfully."]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to save feedback."]);
}

$stmt->close();
$conn->close();
