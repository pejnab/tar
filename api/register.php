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

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'Invalid email format.';
    echo json_encode($response);
    exit;
}

if (strlen($password) < 8) {
    $response['message'] = 'Password must be at least 8 characters long.';
    echo json_encode($response);
    exit;
}

// Check if user already exists
try {
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        $response['message'] = 'An account with this email already exists.';
        echo json_encode($response);
        exit;
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
    echo json_encode($response);
    exit;
}


// Hash the password
$password_hash = password_hash($password, PASSWORD_DEFAULT);

// Insert new user into the database
try {
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
    if ($stmt->execute([$email, $password_hash])) {
        $response['success'] = true;
        $response['message'] = 'Registration successful! You can now log in.';
    } else {
        $response['message'] = 'Failed to register user.';
    }
} catch (PDOException $e) {
    $response['message'] = 'Database error: ' . $e->getMessage();
}

echo json_encode($response);
?>
