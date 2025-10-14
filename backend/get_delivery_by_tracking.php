<?php
// --- DEBUGGING SETUP ---
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

// --- CORS + Headers ---
require_once "database.php";
header("Access-Control-Allow-Origin: https://cessie840.github.io");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight requests ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Read JSON or GET param ---
$input = json_decode(file_get_contents("php://input"), true);
$trackingNumber = $_GET['tracking_number'] ?? $input['tracking_number'] ?? null;

if (!$trackingNumber || empty(trim($trackingNumber))) {
    echo json_encode(["success" => false, "message" => "Tracking number is required"]);
    exit;
}
$trackingNumber = trim($trackingNumber);

// --- FETCH DELIVERY DETAILS ---
$sql = "
    SELECT 
        t.transaction_id,
        t.tracking_number,
        t.customer_name,
        t.customer_address,
        t.customer_contact,
        t.date_of_order,
        t.target_date_delivery,
        t.mode_of_payment,
        t.payment_option,
        t.total,
        t.status AS delivery_status,
        t.customer_rating,
        t.customer_feedback,
        d.assigned_device_id,
        d.driver,
        d.latitude,
        d.longitude,
        d.status AS truck_status,
        d.shipout_time,
        d.completed_time
    FROM Transactions t
    LEFT JOIN Delivery d ON t.transaction_id = d.transaction_id
    WHERE t.tracking_number = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "SQL prepare failed: " . $conn->error]);
    exit;
}
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $transactionId = $row["transaction_id"];

    // --- FETCH ITEMS ---
    $items = [];
    $itemSql = "SELECT description, quantity FROM PurchaseOrder WHERE transaction_id = ?";
    $itemStmt = $conn->prepare($itemSql);
    if ($itemStmt) {
        $itemStmt->bind_param("i", $transactionId);
        $itemStmt->execute();
        $itemResult = $itemStmt->get_result();
        while ($item = $itemResult->fetch_assoc()) {
            $items[] = $item;
        }
        $itemStmt->close();
    }

    echo json_encode([
        "success" => true,
        "data" => $row,
        "items" => $items
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Tracking number not found"]);
}

$stmt->close();
$conn->close();
