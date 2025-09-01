<?php
// Start the session
session_start();

// --- Database Configuration ---
// Replace with your actual database credentials
define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'coloring_app');
define('DB_USER', 'root');
define('DB_PASS', '');

// --- Paths and URLs ---
// Dynamically determine the base URL
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
$host = $_SERVER['HTTP_HOST'];
// For script running in a subfolder, get the path.
// SCRIPT_NAME gives the full path to the current script. dirname() gets the directory.
// We need to find the path from the document root to the app's root directory.
// A simple way is to define it manually, but for true dynamic paths, we can do this:
$script_path = str_replace('/index.php', '', $_SERVER['SCRIPT_NAME']);
// If the app is in a subfolder, dirname($_SERVER['SCRIPT_NAME']) might be useful.
// Let's assume the entry point (e.g., index.php) is at the root of the app.
$base_path = dirname($_SERVER['SCRIPT_NAME']);
// If the app is at the root, $base_path will be '/'. If in a subfolder, it will be '/subfolder'.
// We should strip any potential script names if accessing files directly in subdirs.
// A more robust way is to have a known entry point.
// For now, let's calculate it based on the assumption that config.php is in 'core'.
$app_root_path = dirname(__DIR__); // The directory containing 'core'
$document_root = $_SERVER['DOCUMENT_ROOT'];
$base_url_path = str_replace($document_root, '', $app_root_path);
$base_url_path = str_replace('\\', '/', $base_url_path); // for Windows compatibility
$base_url_path = rtrim($base_url_path, '/'); // remove trailing slash if any


define('BASE_URL', $protocol . $host . $base_url_path);

// Define root path for file includes
define('ROOT_PATH', dirname(__DIR__));

// --- Error Reporting ---
// Show all errors during development
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

?>
