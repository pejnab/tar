<?php
require_once __DIR__ . '/../core/db.php';

$id = $_GET['id'] ?? null;
$message = '';
$message_type = '';
$collection = null;

// If no ID is provided, redirect back to the collections page.
if (!$id) {
    header('Location: collections.php');
    exit;
}

// --- Handle Form Submission (Update) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_collection'])) {
    $name = trim($_POST['name']);
    $collection_id = $_POST['id'];

    if (empty($name)) {
        $message = "Collection name cannot be empty.";
        $message_type = 'error';
    } else {
        try {
            $stmt = $pdo->prepare("UPDATE collections SET name = ? WHERE id = ?");
            $stmt->execute([$name, $collection_id]);

            // Redirect back to the main collections page after successful update
            header('Location: collections.php?message=updated');
            exit;

        } catch (PDOException $e) {
            $message = "Error updating collection: " . $e->getMessage();
            $message_type = 'error';
        }
    }
}


// --- Fetch the collection data for the form ---
try {
    $stmt = $pdo->prepare("SELECT id, name FROM collections WHERE id = ?");
    $stmt->execute([$id]);
    $collection = $stmt->fetch();

    if (!$collection) {
        // If no collection is found with that ID, redirect.
        header('Location: collections.php?message=notfound');
        exit;
    }
} catch (PDOException $e) {
    $message = "Error fetching collection data: " . $e->getMessage();
    $message_type = 'error';
}


// --- Include Header ---
require_once __DIR__ . '/../templates/admin_header.php';
?>

<h2>Edit Collection</h2>

<!-- Display Messages -->
<?php if ($message): ?>
    <div class="message <?php echo $message_type; ?>">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<?php if ($collection): ?>
<div class="form-container">
    <form action="edit_collection.php?id=<?php echo htmlspecialchars($id); ?>" method="POST">
        <input type="hidden" name="id" value="<?php echo htmlspecialchars($collection['id']); ?>">
        <div class="form-group">
            <label for="name">Collection Name</label>
            <input type="text" id="name" name="name" value="<?php echo htmlspecialchars($collection['name']); ?>" required>
        </div>
        <button type="submit" name="update_collection" class="btn">Update Collection</button>
        <a href="collections.php" class="btn btn-secondary">Cancel</a>
    </form>
</div>
<?php endif; ?>


<?php
// --- Include Footer ---
require_once __DIR__ . '/../templates/admin_footer.php';
?>
