<?php
require_once __DIR__ . '/core/db.php';

$design_id = $_GET['design_id'] ?? null;
if (!$design_id) {
    header('Location: index.php');
    exit;
}

// Fetch the processed SVG path for the design
$stmt = $pdo->prepare("SELECT processed_filepath FROM designs WHERE id = ?");
$stmt->execute([$design_id]);
$design = $stmt->fetch();

if (!$design) {
    // No design found, redirect
    header('Location: index.php?message=design_not_found');
    exit;
}

$svg_path = BASE_URL . $design['processed_filepath'];

require_once __DIR__ . '/templates/header.php';
?>

<div id="auth-container" style="position: absolute; top: 10px; right: 20px; z-index: 100;">
    <!-- Logged out state -->
    <div id="logged-out-view">
        <button id="login-btn" class="tool-btn">Login</button>
        <button id="register-btn" class="tool-btn">Register</button>
    </div>
    <!-- Logged in state -->
    <div id="logged-in-view" style="display: none;">
        <span id="user-email-display" style="margin-right: 10px;"></span>
        <button id="logout-btn" class="tool-btn">Logout</button>
    </div>
</div>

<div id="coloring-app-container" style="width: 95vw; max-width: 1400px; margin: 10px auto;">
    <a href="javascript:history.back()">&larr; Back to Collection</a>
    <div id="coloring-app">
        <div id="toolbar">
            <h3>Tools</h3>
            <div class="tool-group">
                <button id="fill-tool-btn" class="tool-btn active">Fill</button>
                <button id="brush-tool-btn" class="tool-btn">Brush</button>
            </div>
            <div id="brush-options" style="display: none;">
                <label for="brush-size">Size: <span id="brush-size-label">10</span></label>
                <input type="range" id="brush-size" min="1" max="100" value="10" style="width: 100%;">
            </div>
            <hr style="border-color: var(--border-color); margin: 15px 0;">
            <button id="undo-btn" class="tool-btn">Undo</button>
            <button id="redo-btn" class="tool-btn">Redo</button>

            <h3 style="margin-top: 20px;">File</h3>
            <button id="save-progress-btn" class="tool-btn" style="display: none;">Save Progress</button>
            <button id="export-png-btn" class="tool-btn">Export PNG</button>
            <button id="export-pdf-btn" class="tool-btn">Export PDF</button>

            <h3 style="margin-top: 20px;">Colors</h3>
            <div id="color-palette">
                <!-- Preset colors will be added here -->
            </div>
            <label for="custom-color" style="margin-top: 10px;">Custom Color</label>
            <input type="color" id="custom-color" value="#FFFFFF">
        </div>
        <div id="canvas-container">
            <canvas id="coloring-canvas"></canvas>
        </div>
    </div>
</div>

<!-- Include Fabric.js library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js"></script>

<!-- Include jsPDF library -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>

<!-- Include our application script -->
<!-- We pass the SVG path to the script using a data attribute on the body or a specific element -->
<script>
    // Pass data to the JS script
    const SVG_PATH = "<?php echo $svg_path; ?>";
    const DESIGN_ID = "<?php echo $design_id; ?>";
</script>
<script src="<?php echo BASE_URL; ?>/assets/js/app.js"></script>
<script src="<?php echo BASE_URL; ?>/assets/js/auth.js"></script>


<!-- Auth Modals -->
<div id="login-modal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Login</h2>
        <form id="login-form">
            <div class="form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" required>
            </div>
            <div class="form-group">
                <label for="login-password">Password</label>
                <input type="password" id="login-password" required>
            </div>
            <button type="submit" class="btn">Login</button>
            <p id="login-message" class="message" style="display: none;"></p>
        </form>
    </div>
</div>

<div id="register-modal" class="modal" style="display: none;">
    <div class="modal-content">
        <span class="close-btn">&times;</span>
        <h2>Register</h2>
        <form id="register-form">
            <div class="form-group">
                <label for="register-email">Email</label>
                <input type="email" id="register-email" required>
            </div>
            <div class="form-group">
                <label for="register-password">Password (min 8 chars)</label>
                <input type="password" id="register-password" required>
            </div>
            <button type="submit" class="btn">Register</button>
            <p id="register-message" class="message" style="display: none;"></p>
        </form>
    </div>
</div>


<?php require_once __DIR__ . '/templates/footer.php'; ?>
