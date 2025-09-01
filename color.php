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

<div id="coloring-app-container" style="width: 95vw; max-width: 1400px; margin: 10px auto;">
    <a href="javascript:history.back()">&larr; Back to Collection</a>
    <div id="coloring-app">
        <div id="toolbar">
            <h3>Tools</h3>
            <button id="undo-btn" class="tool-btn">Undo</button>
            <button id="redo-btn" class="tool-btn">Redo</button>

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

<!-- Include our application script -->
<!-- We pass the SVG path to the script using a data attribute on the body or a specific element -->
<script>
    // Pass data to the JS script
    const SVG_PATH = "<?php echo $svg_path; ?>";
</script>
<script src="<?php echo BASE_URL; ?>/assets/js/app.js"></script>

<?php require_once __DIR__ . '/templates/footer.php'; ?>
