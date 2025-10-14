<?php
require_once "database.php";

// --- CORS ---
$allowed_origins = [
  "http://localhost:5173",
  "https://cessie840.github.io"
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
  header("Access-Control-Allow-Origin: $origin");
}
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-KEY");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

header("Content-Type: application/json");

// --- Parameters ---
$type = $_GET['type'] ?? 'monthly';
$date = $_GET['date'] ?? date('Y-m-d');
$month = $_GET['date'] ?? date('Y-m');

$where = "1=1";
$params = [];
$types = "";

if ($type === 'daily') {
  $where = "DATE(t.date_of_order) = ?";
  $params[] = $date;
  $types .= "s";
} else {
  $where = "DATE_FORMAT(t.date_of_order, '%Y-%m') = ?";
  $params[] = $month;
  $types .= "s";
}

// --- Query: includes assigned_device_id + tracking_number ---
$sql = "
SELECT
  t.transaction_id,
  t.tracking_number,
  t.assigned_device_id,
  t.customer_name,
  t.date_of_order,
  po.description AS item_name,
  po.quantity AS item_quantity,
  t.total,
  t.status
FROM Transactions t
JOIN PurchaseOrder po ON po.transaction_id = t.transaction_id
WHERE $where
  AND t.assigned_device_id IS NOT NULL
ORDER BY t.date_of_order DESC, t.transaction_id DESC, po.po_id ASC
";

$stmt = $conn->prepare($sql);
if (!empty($params)) {
  $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$out = [];
while ($row = $res->fetch_assoc()) {
  $row['total'] = (float)$row['total'];
  $out[] = $row;
}
$stmt->close();

echo json_encode($out);
