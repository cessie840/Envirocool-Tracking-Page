<?php
// --- DEBUGGING SETUP ---
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php-error.log');
error_reporting(E_ALL);

// --- CORS + Headers ---
require_once "database.php";
$allowed_origins = [
    "https://envirocool-tracking-page.vercel.app",
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

// --- Read JSON body ---
$data = json_decode(file_get_contents("php://input"), true);

// --- Validate input ---
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
    $itemsSql = "SELECT description, type_of_product, quantity FROM PurchaseOrder WHERE transaction_id = ?";
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

    // -------------------- FETCH DRIVER INFO --------------------
    $driverInfo = null;
    $driverSql = "
        SELECT 
            CONCAT(dp.pers_fname, ' ', dp.pers_lname) AS driver_name,
            dp.pers_phone AS driver_contact
        FROM DeliveryAssignments da
        LEFT JOIN DeliveryPersonnel dp ON da.personnel_username = dp.pers_username
        WHERE da.transaction_id = ?
        LIMIT 1
    ";
    $driverStmt = $conn->prepare($driverSql);
    if ($driverStmt) {
        $driverStmt->bind_param("i", $transactionId);
        $driverStmt->execute();
        $driverResult = $driverStmt->get_result();
        if ($driverRow = $driverResult->fetch_assoc()) {
            $driverInfo = [
                "driver_name" => $driverRow["driver_name"],
                "driver_contact" => $driverRow["driver_contact"]
            ];
        }
        $driverStmt->close();
    }

    // -------------------- FINAL RESPONSE --------------------
    echo json_encode([
        "success" => true,
        "transaction" => $row,
        "items" => $items,
        "driver" => $driverInfo
    ]);
} else {
    echo json_encode(["success" => false, "message" => "Tracking number not found"]);
}

$stmt->close();
$conn->close();
?>
