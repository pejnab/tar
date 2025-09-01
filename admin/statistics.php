<?php
require_once __DIR__ . '/../core/db.php';

// --- Fetch Statistics ---
$stats = [
    'collections' => 0,
    'designs' => 0,
    'users' => 0,
    'popular_designs' => []
];

try {
    // Total Collections
    $stats['collections'] = $pdo->query("SELECT COUNT(*) FROM collections")->fetchColumn();

    // Total Designs
    $stats['designs'] = $pdo->query("SELECT COUNT(*) FROM designs")->fetchColumn();

    // Total Users
    $stats['users'] = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

    // Top 10 Most Popular Designs (by number of saves)
    $stmt = $pdo->query("
        SELECT d.id, d.thumbnail_filepath, c.name as collection_name, COUNT(up.id) as save_count
        FROM user_progress up
        JOIN designs d ON up.design_id = d.id
        JOIN collections c ON d.collection_id = c.id
        GROUP BY d.id
        ORDER BY save_count DESC
        LIMIT 10
    ");
    $stats['popular_designs'] = $stmt->fetchAll();

} catch (PDOException $e) {
    $error_message = "Error fetching statistics: " . $e->getMessage();
}


require_once __DIR__ . '/../templates/admin_header.php';
?>

<div style="margin-bottom: 20px;">
    <a href="collections.php" class="btn btn-secondary">Manage Collections</a>
    <a href="statistics.php" class="btn">View Statistics</a>
</div>

<h2>Application Statistics</h2>

<?php if (isset($error_message)): ?>
    <div class="message error"><?php echo htmlspecialchars($error_message); ?></div>
<?php else: ?>
    <div style="display: flex; gap: 20px; justify-content: space-around; text-align: center;">
        <div style="background-color: var(--secondary-color); padding: 20px; border-radius: 8px; flex-grow: 1;">
            <h3>Total Collections</h3>
            <p style="font-size: 2em; margin: 0;"><?php echo $stats['collections']; ?></p>
        </div>
        <div style="background-color: var(--secondary-color); padding: 20px; border-radius: 8px; flex-grow: 1;">
            <h3>Total Designs</h3>
            <p style="font-size: 2em; margin: 0;"><?php echo $stats['designs']; ?></p>
        </div>
        <div style="background-color: var(--secondary-color); padding: 20px; border-radius: 8px; flex-grow: 1;">
            <h3>Total Users</h3>
            <p style="font-size: 2em; margin: 0;"><?php echo $stats['users']; ?></p>
        </div>
    </div>

    <div class="table-container" style="margin-top: 40px;">
        <h3>Most Popular Designs</h3>
        <table>
            <thead>
                <tr>
                    <th>Design ID</th>
                    <th>Collection</th>
                    <th>Times Saved</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($stats['popular_designs'])): ?>
                    <tr><td colspan="3">No usage data yet.</td></tr>
                <?php else: ?>
                    <?php foreach ($stats['popular_designs'] as $design): ?>
                        <tr>
                            <td>#<?php echo htmlspecialchars($design['id']); ?></td>
                            <td><?php echo htmlspecialchars($design['collection_name']); ?></td>
                            <td><?php echo htmlspecialchars($design['save_count']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
<?php endif; ?>


<?php require_once __DIR__ . '/../templates/admin_footer.php'; ?>
