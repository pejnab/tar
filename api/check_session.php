<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/config.php'; // Ensures session_start() is called

$response = [
    'loggedIn' => false,
    'user' => null
];

if (isset($_SESSION['user_id']) && isset($_SESSION['user_email'])) {
    $response['loggedIn'] = true;
    $response['user'] = [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['user_email']
    ];
}

echo json_encode($response);
?>
