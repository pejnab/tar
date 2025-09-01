<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php';

$response = ['success' => false, 'message' => 'An unknown error occurred.', 'data' => null];

// Security: Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    $response['message'] = 'Authentication required.';
    http_response_code(401); // Unauthorized
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    $response['message'] = 'Invalid request method.';
    http_response_code(405); // Method Not Allowed
    echo json_encode($response);
    exit;
}

$design_id = $_GET['design_id'] ?? null;
$user_id = $_SESSION['user_id'];

if (empty($design_id)) {
    $response['message'] = 'Design ID is required.';
    http_response_code(400); // Bad Request
    echo json_encode($response);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT progress_data FROM user_progress WHERE user_id = ? AND design_id = ?");
    $stmt->execute([$user_id, $design_id]);
    $progress = $stmt->fetch();

    if ($progress) {
        $response['success'] = true;
        $response['message'] = 'Progress loaded successfully.';
        // The data is already JSON, but it's stored as a string in the DB.
        // Let's decode and re-encode to ensure it's valid JSON.
        $response['data'] = json_decode($progress['progress_data']);
    } else {
        $response['success'] = true;
        $response['message'] = 'No saved progress found for this design.';
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    http_response_code(500);
}

echo json_encode($response);
?>
