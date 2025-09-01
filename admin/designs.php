<?php
require_once __DIR__ . '/../core/db.php';

$collection_id = $_GET['collection_id'] ?? null;
$message = '';
$message_type = '';

// If no collection ID, redirect
if (!$collection_id) {
    header('Location: collections.php');
    exit;
}

// Fetch collection details
$stmt = $pdo->prepare("SELECT name FROM collections WHERE id = ?");
$stmt->execute([$collection_id]);
$collection = $stmt->fetch();

if (!$collection) {
    header('Location: collections.php?message=notfound');
    exit;
}

// --- Handle POST Requests ---

// Handle Design Upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['design_file'])) {
    $file = $_FILES['design_file'];

    // Basic file validation
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $message = "Error during file upload. Code: " . $file['error'];
        $message_type = 'error';
    } else {
        $allowed_types = ['image/svg+xml', 'image/png'];
        if (!in_array($file['type'], $allowed_types)) {
            $message = "Invalid file type. Only SVG and PNG are allowed.";
            $message_type = 'error';
        } else {
            // Create a unique filename to avoid conflicts
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $unique_name = uniqid('design_', true) . '.' . $extension;

            $original_path = ROOT_PATH . '/uploads/original/' . $unique_name;

            if (move_uploaded_file($file['tmp_name'], $original_path)) {
                // --- Image Processing ---
                require_once __DIR__ . '/../core/process_image.php';

                $output_directory = ROOT_PATH . '/uploads/processed';
                $processed_path_db = ImageProcessor::process($original_path, $output_directory);

                if ($processed_path_db) {
                    // Save to database
                    try {
                        $stmt = $pdo->prepare("INSERT INTO designs (collection_id, original_filepath, processed_filepath) VALUES (?, ?, ?)");
                        $stmt->execute([$collection_id, '/uploads/original/' . $unique_name, $processed_path_db]);
                        $message = "Design uploaded and processed successfully.";
                        $message_type = 'success';
                    } catch (PDOException $e) {
                        $message = "Database error after processing: " . $e->getMessage();
                        $message_type = 'error';
                        // Clean up processed file if DB insert fails
                        if (file_exists(ROOT_PATH . $processed_path_db)) {
                            unlink(ROOT_PATH . $processed_path_db);
                        }
                    }
                } else {
                    $message = "Failed to process the image. Please ensure it is a valid SVG or PNG.";
                    $message_type = 'error';
                    // Clean up original file if processing fails
                    unlink($original_path);
                }

            } else {
                $message = "Failed to move uploaded file.";
                $message_type = 'error';
            }
        }
    }
}

// Handle Design Deletion
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_design'])) {
    $design_id = $_POST['design_id'];

    // First, get file paths to delete them from the server
    $stmt = $pdo->prepare("SELECT original_filepath, processed_filepath, thumbnail_filepath FROM designs WHERE id = ?");
    $stmt->execute([$design_id]);
    $paths = $stmt->fetch();

    if ($paths) {
        // Delete the files
        if (file_exists(ROOT_PATH . $paths['original_filepath'])) {
            unlink(ROOT_PATH . $paths['original_filepath']);
        }
        if (file_exists(ROOT_PATH . $paths['processed_filepath'])) {
            unlink(ROOT_PATH . $paths['processed_filepath']);
        }
        if ($paths['thumbnail_filepath'] && file_exists(ROOT_PATH . $paths['thumbnail_filepath'])) {
            unlink(ROOT_PATH . $paths['thumbnail_filepath']);
        }

        // Delete from database
        $stmt = $pdo->prepare("DELETE FROM designs WHERE id = ?");
        $stmt->execute([$design_id]);
        $message = "Design deleted successfully.";
        $message_type = 'success';
    }
}


// --- Fetch existing designs for this collection ---
$stmt = $pdo->prepare("SELECT id, original_filepath, processed_filepath FROM designs WHERE collection_id = ? ORDER BY created_at DESC");
$stmt->execute([$collection_id]);
$designs = $stmt->fetchAll();


require_once __DIR__ . '/../templates/admin_header.php';
?>

<a href="collections.php">&larr; Back to Collections</a>
<h2>Designs for "<?php echo htmlspecialchars($collection['name']); ?>"</h2>

<!-- Display Messages -->
<?php if ($message): ?>
    <div class="message <?php echo $message_type; ?>">
        <?php echo htmlspecialchars($message); ?>
    </div>
<?php endif; ?>

<!-- Upload Form -->
<div class="form-container">
    <h3>Upload New Design</h3>
    <form action="designs.php?collection_id=<?php echo $collection_id; ?>" method="POST" enctype="multipart/form-data">
        <div class="form-group">
            <label for="design_file">Select SVG or PNG file</label>
            <input type="file" id="design_file" name="design_file" accept="image/svg+xml,image/png" required>
        </div>
        <button type="submit" class="btn">Upload Design</button>
    </form>
</div>

<!-- List Designs -->
<div class="table-container" style="margin-top: 40px;">
    <h3>Existing Designs</h3>
    <table style="width: 100%;">
        <thead>
            <tr>
                <th>Thumbnail</th>
                <th>Original File</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (empty($designs)): ?>
                <tr><td colspan="3">No designs uploaded for this collection yet.</td></tr>
            <?php else: ?>
                <?php foreach ($designs as $design): ?>
                    <tr>
                        <td>
                            <!-- Thumbnail: SVGs can be used directly. For PNGs, you might need a smaller version. -->
                            <img src="<?php echo BASE_URL . htmlspecialchars($design['processed_filepath']); ?>" alt="Thumbnail" style="width: 100px; height: 100px; background: #fff; padding: 5px; border-radius: 4px;">
                        </td>
                        <td><?php echo htmlspecialchars(basename($design['original_filepath'])); ?></td>
                        <td>
                            <form action="designs.php?collection_id=<?php echo $collection_id; ?>" method="POST" onsubmit="return confirm('Are you sure you want to delete this design?');">
                                <input type="hidden" name="design_id" value="<?php echo $design['id']; ?>">
                                <button type="submit" name="delete_design" class="btn btn-danger">Delete</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
            <?php endif; ?>
        </tbody>
    </table>
</div>


<?php require_once __DIR__ . '/../templates/admin_footer.php'; ?>
