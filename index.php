<?php require_once __DIR__ . '/templates/header.php'; ?>

<div class="container">
    <h1>ProColor</h1>
    <h2>The Professional Coloring Experience</h2>

    <p style="margin-top: 30px; font-size: 1.2em;">
        Welcome! If you have a collection token, please enter it below to begin.
    </p>

    <div class="token-form">
        <form action="collection.php" method="GET">
            <input type="text" name="token" placeholder="Enter Your Collection Token" required>
            <br>
            <button type="submit" class="btn">Access Collection</button>
        </form>
    </div>

    <p style="margin-top: 50px; color: var(--font-color-secondary);">
        No token? Collections are shared via private links or tokens provided by an administrator.
    </p>
</div>

<?php require_once __DIR__ . '/templates/footer.php'; ?>
