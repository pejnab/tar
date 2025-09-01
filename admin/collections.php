<?php
// Include database connection. This also includes config.php.
require_once __DIR__ . '/../core/db.php';

$message = '';
$message_type = '';

// --- Handle Form Submissions (Create/Delete) ---

// Handle CREATE request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_collection'])) {
    $name = trim($_POST['name']);

    if (empty($name)) {
        $message = "Collection name cannot be empty.";
        $message_type = 'error';
    } else {
        try {
            // Generate a unique share token
            $share_token = bin2hex(random_bytes(16));

            $stmt = $pdo->prepare("INSERT INTO collections (name, share_token) VALUES (?, ?)");
            $stmt->execute([$name, $share_token]);

            $message = "Collection '{$name}' created successfully.";
            $message_type = 'success';
        } catch (PDOException $e) {
            $message = "Error creating collection: " . $e->getMessage();
            $message_type = 'error';
        }
    }
}

// Handle DELETE request
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_collection'])) {
    $id = $_POST['id'];

    try {
        $stmt = $pdo->prepare("DELETE FROM collections WHERE id = ?");
        $stmt->execute([$id]);

        $message = "Collection deleted successfully.";
        $message_type = 'success';
    } catch (PDOException $e) {
        $message = "Error deleting collection: " . $e->getMessage();
        $message_type = 'error';
    }
}


// --- Fetch Data for Display ---
$collections = [];
try {
    $stmt = $pdo->query("SELECT id, name, share_token, created_at FROM collections ORDER BY created_at DESC");
    $collections = $stmt->fetchAll();
} catch (PDOException $e) {
    // If the table doesn't exist yet, we can show a friendly error.
    if ($e->getCode() === '42S02') { // Base table or view not found
        $message = "The 'collections' table does not seem to exist. Please run the database.sql script.";
        $message_type = 'error';
    } else {
        $message = "Error fetching collections: " . $e->getMessage();
        $message_type = 'error';
    }
}

// --- Include Header ---
require_once __DIR__ . '/../templates/admin_header.php';
?>

<div style="margin-bottom: 20px;">
    <a href="collections.php" class="btn">Manage Collections</a>
    <a href="statistics.php" class="btn btn-secondary">View Statistics</a>
</div>

<h2>Manage Collections</h2>

<!-- Display Messages -->
<?php if ($message): ?>
    <div class="message <?php echo $message_type; ?>">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<!-- Create Collection Form -->
<div class="form-container">
    <h3>Create New Collection</h3>
    <form action="collections.php" method="POST">
        <div class="form-group">
            <label for="name">Collection Name</label>
            <input type="text" id="name" name="name" required>
        </div>
        <button type="submit" name="create_collection" class="btn">Create Collection</button>
    </form>
</div>

<!-- List Collections -->
<div class="table-container" style="margin-top: 40px;">
    <h3>Existing Collections</h3>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Share Token</th>
                <th>Created At</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($collections)): ?>
                <tr>
                    <td colspan="5">No collections found.</td>
                </tr>
            <?php else: ?>
                <?php foreach ($collections as $collection): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($collection['id']); ?></td>
                        <td><?php echo htmlspecialchars($collection['name']); ?></td>
                        <td><?php echo htmlspecialchars($collection['share_token']); ?></td>
                        <td><?php echo htmlspecialchars($collection['created_at']); ?></td>
                        <td>
                            <form action="collections.php" method="POST" style="display:inline;" onsubmit="return confirm('Are you sure you want to delete this collection? This will also delete all designs within it.');">
                                <input type="hidden" name="id" value="<?php echo $collection['id']; ?>">
                                <button type="submit" name="delete_collection" class="btn btn-danger">Delete</button>
                            </form>
                            <a href="designs.php?collection_id=<?php echo $collection['id']; ?>" class="btn">Designs</a>
                            <a href="edit_collection.php?id=<?php echo $collection['id']; ?>" class="btn btn-secondary">Settings</a>
                            <a href="qrcode.php?token=<?php echo $collection['share_token']; ?>" class="btn" target="_blank" title="Show QR Code" style="padding: 10px 12px;">QR</a>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../templates/admin_footer.php';
?>
