
<?php
require_once "database.php";

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle OPTIONS preflight
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$trackingNumber = isset($data["tracking_number"]) ? trim($data["tracking_number"]) : "";

if (empty($trackingNumber)) {
    echo json_encode(["success" => false, "message" => "Tracking number is required"]);
    exit;
}

// ✅ Step 1: Get the device_id from the Transactions table
$sql = "SELECT device_id FROM Transactions WHERE tracking_number = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $trackingNumber);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $deviceId = $row["device_id"];

    if (!empty($deviceId)) {
        // ✅ Step 2: Get the latest location from current_positions
        $locSql = "
            SELECT lat, lng, updated_at 
            FROM current_positions 
            WHERE device_id = ? 
            ORDER BY updated_at DESC 
            LIMIT 1
        ";
        $locStmt = $conn->prepare($locSql);
        $locStmt->bind_param("s", $deviceId);
        $locStmt->execute();
        $locResult = $locStmt->get_result();

        if ($location = $locResult->fetch_assoc()) {
            echo json_encode([
        "success" => true,
        "tracking_number" => $trackingNumber,
        "device_id" => $deviceId,
        "location" => [
            "lat" => (float)$location["lat"],
            "lng" => (float)$location["lng"],
            "updated_at" => $location["updated_at"]
            ]
            ]);
        } else {
            echo json_encode([
                "success" => false,
                "message" => "No location found for this device"
            ]);
        }

        $locStmt->close();
    } else {
        echo json_encode([
            "success" => false,
            "message" => "No device assigned to this tracking number"
        ]);
    }
} else {
    echo json_encode([
        "success" => false,
        "message" => "Tracking number not found"
    ]);
}

$stmt->close();
$conn->close();