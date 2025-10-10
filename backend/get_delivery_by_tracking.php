<?php
// --- DEBUGGING SETUP ---
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log'); 
error_reporting(E_ALL);

// --- CORS + Headers ---
require_once "database.php";
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Read JSON body
$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (!isset($data['tracking_number']) || empty(trim($data['tracking_number']))) {
    echo json_encode(["success" => false, "message" => "Tracking number is required"]);
    exit;
}

$trackingNumber = trim($data["tracking_number"]);

// -------------------- FETCH TRANSACTION --------------------
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
        t.customer_feedback
    FROM Transactions t
    WHERE t.tracking_number = ?
    LIMIT 1
";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["success" => false, "message" => "SQL error (transaction): " . $conn->error]);
    exit;
}
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $transactionId = $row["transaction_id"];

    // -------------------- FETCH ITEMS --------------------
    $items = [];
    $itemsSql = "SELECT description, quantity FROM PurchaseOrder WHERE transaction_id = ?";
    $itemsStmt = $conn->prepare($itemsSql);
    if (!$itemsStmt) {
        echo json_encode(["success" => false, "message" => "SQL error (items): " . $conn->error]);
        exit;
    }
    $itemsStmt->bind_param("i", $transactionId);
    $itemsStmt->execute();
    $itemsResult = $itemsStmt->get_result();
    while ($item = $itemsResult->fetch_assoc()) {
        $items[] = $item;
    }
    $itemsStmt->close();

    echo json_encode([
        "success" => true,
        "transaction" => $row,
        "items" => $items
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Tracking number not found"]);
}

$stmt->close();
$conn->close();
