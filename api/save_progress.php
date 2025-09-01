<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

// Security: Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Authentication required. Please log in to save your progress.';
    http_response_code(401); // Unauthorized
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method.';
    http_response_code(405); // Method Not Allowed
    echo json_encode($response);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$design_id = $data['design_id'] ?? null;
$progress_data = $data['progress_data'] ?? null;
$user_id = $_SESSION['user_id'];

if (empty($design_id) || empty($progress_data)) {
    $response['message'] = 'Design ID and progress data are required.';
    http_response_code(400); // Bad Request
    echo json_encode($response);
    exit;
}

// Use INSERT ... ON DUPLICATE KEY UPDATE to either create or update progress
$sql = "INSERT INTO user_progress (user_id, design_id, progress_data)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE progress_data = VALUES(progress_data)";

try {
    $stmt = $pdo->prepare($sql);
    if ($stmt->execute([$user_id, $design_id, $progress_data])) {
        $response['success'] = true;
        $response['message'] = 'Progress saved successfully!';
    } else {
        $response['message'] = 'Failed to save progress.';
        http_response_code(500); // Internal Server Error
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    http_response_code(500);
}

echo json_encode($response);
?>
