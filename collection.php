<?php
require_once __DIR__ . '/core/db.php';

$token = $_GET['token'] ?? null;
$error = '';
$collection_name = '';
$designs = [];

if (!$token) {
    // If no token, redirect to home.
    header('Location: index.php');
    exit;
}

// Fetch the collection by share_token
$stmt = $pdo->prepare("SELECT id, name FROM collections WHERE share_token = ?");
$stmt->execute([$token]);
$collection = $stmt->fetch();

if ($collection) {
    $collection_name = $collection['name'];

    // Fetch all designs for this collection
    $stmt = $pdo->prepare("SELECT id, processed_filepath FROM designs WHERE collection_id = ? ORDER BY created_at");
    $stmt->execute([$collection['id']]);
    $designs = $stmt->fetchAll();
} else {
    $error = "Invalid or expired token. Please check your link or token and try again.";
}

require_once __DIR__ . '/templates/header.php';
?>

<div class="container">
    <?php if ($error): ?>
        <h1>Access Denied</h1>
        <p style="color: var(--error-color); font-size: 1.2em;"><?php echo htmlspecialchars($error); ?></p>
        <a href="index.php" class="btn">Return Home</a>
    <?php else: ?>
        <h1>Collection: <?php echo htmlspecialchars($collection_name); ?></h1>
        <h2>Select a design to start coloring</h2>

        <?php if (empty($designs)): ?>
            <p>This collection has no designs yet. Please check back later.</p>
        <?php else: ?>
            <div class="collection-grid">
                <?php foreach ($designs as $design): ?>
                    <a href="color.php?design_id=<?php echo $design['id']; ?>" class="design-card">
                        <img src="<?php echo BASE_URL . htmlspecialchars($design['processed_filepath']); ?>" alt="Coloring Design">
                        <div class="design-card-title">
                            Design #<?php echo $design['id']; ?>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/templates/footer.php'; ?>
