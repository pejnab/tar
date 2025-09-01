<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../core/config.php'; // Ensures session_start() is called

// Unset all of the session variables
$_SESSION = array();

// Destroy the session
if (session_destroy()) {
    echo json_encode(['success' => true, 'message' => 'Logout successful.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to log out.']);
}
?>
