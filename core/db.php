<?php
// Include the configuration file
// Use require_once to ensure it's included only once and stop execution if it's missing.
require_once __DIR__ . '/config.php';

$pdo = null;

try {
    // Create a new PDO instance
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Throw exceptions on errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,   // Fetch associative arrays
        PDO::ATTR_EMULATE_PREPARES   => false,              // Use native prepared statements
    ];

    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);

} catch (PDOException $e) {
    // If connection fails, stop the script and show an error message.
    // In a production environment, you would log this error and show a generic message.
    die("Database connection failed: " . $e->getMessage());
}

// Now, any script that includes 'core/db.php' will have access to the $pdo object.
?>
