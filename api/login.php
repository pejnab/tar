<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/db.php'; // Access to $pdo and session_start()

$response = ['success' => false, 'message' => 'An unknown error occurred.'];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    $response['message'] = 'Invalid request method.';
    echo json_encode($response);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$email = $data['email'] ?? null;
$password = $data['password'] ?? null;

if (empty($email) || empty($password)) {
    $response['message'] = 'Email and password are required.';
    echo json_encode($response);
    exit;
}

// Find user by email
try {
    $stmt = $pdo->prepare("SELECT id, email, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // Password is correct, start session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_email'] = $user['email'];

        $response['success'] = true;
        $response['message'] = 'Login successful!';
        $response['user'] = ['email' => $user['email']];
    } else {
        // Invalid credentials
        $response['message'] = 'Invalid email or password.';
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
?>
