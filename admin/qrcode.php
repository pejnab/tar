<?php
require_once __DIR__ . '/../core/config.php';
require_once __DIR__ . '/../core/lib/php-qrcode.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    // Optional: Create a default error image or just exit
    header("HTTP/1.1 400 Bad Request");
    echo "Error: Token is required.";
    exit;
}

// Construct the full URL for the collection
$url = BASE_URL . '/collection.php?token=' . urlencode($token);

// Generate the QR code image and stream it to the browser
// The library's png() method with the second parameter as false will output directly.
QRCode::png($url, false, 'L', 8, 2);
?>
