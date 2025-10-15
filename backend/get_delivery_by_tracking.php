<?php
// ✅ CORS + JSON headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

// ✅ Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ Error handling: capture and return as JSON (no HTML)
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "PHP Warning: $errstr in $errfile on line $errline"
    ]);
    exit();
});
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && $error['type'] === E_ERROR) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "error" => "Fatal Error: {$error['message']}"
        ]);
    }
});

// ✅ Include database
require_once "database.php";

// ✅ Validate input
$tracking_number = $_GET['tracking_number'] ?? '';
if (empty($tracking_number)) {
    echo json_encode(["success" => false, "error" => "Missing tracking number"]);
    exit();
}

// ✅ Fetch from transaction
$stmt = $conn->prepare("
    SELECT tracking_number, customer_name, customer_address, status,
           latitude AS truck_lat, longitude AS truck_lng,
           assigned_device_id
    FROM transaction
    WHERE tracking_number = ?
");
$stmt->bind_param("s", $tracking_number);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Delivery not found"]);
    exit();
}

$data = $result->fetch_assoc();

// ✅ Add fallback coordinates from current_positions
if (($data['truck_lat'] == 0 || $data['truck_lng'] == 0) && !empty($data['assigned_device_id'])) {
    $dev = $conn->prepare("SELECT lat, lng FROM current_positions WHERE device_id = ? LIMIT 1");
    $dev->bind_param("s", $data['assigned_device_id']);
    $dev->execute();
    $res = $dev->get_result()->fetch_assoc();
    if ($res) {
        $data['truck_lat'] = $res['lat'];
        $data['truck_lng'] = $res['lng'];
    }
}

// ✅ Add static company location
$data['company_lat'] = 14.2664;
$data['company_lng'] = 121.0920;

// ✅ Send clean JSON response
echo json_encode(["success" => true, "data" => $data]);
exit();
