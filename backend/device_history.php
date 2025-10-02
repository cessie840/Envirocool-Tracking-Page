<?php
require 'config.php';

$device_id = $_GET['device_id'] ?? '';

if (!$device_id) {
    echo json_encode(["error" => "Missing device_id"]);
    exit;
}

// Query all past positions for that device
$sql = "SELECT lat, lng, updated_at FROM device_positions 
        WHERE device_id = ? ORDER BY updated_at ASC";
$stmt = $db->prepare($sql);
$stmt->bind_param("s", $device_id);
$stmt->execute();
$result = $stmt->get_result();

$trail = [];
while ($row = $result->fetch_assoc()) {
    $trail[] = [
        "lat" => (float)$row["lat"],
        "lng" => (float)$row["lng"],
        "updated_at" => $row["updated_at"]
    ];
}

header('Content-Type: application/json');
echo json_encode($trail);
