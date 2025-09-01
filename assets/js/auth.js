document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const loggedOutView = document.getElementById('logged-out-view');
    const loggedInView = document.getElementById('logged-in-view');
    const userEmailDisplay = document.getElementById('user-email-display');
    const saveProgressBtn = document.getElementById('save-progress-btn');

    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginMessage = document.getElementById('login-message');
    const registerMessage = document.getElementById('register-message');

    const closeBtns = document.querySelectorAll('.close-btn');

    // --- State ---
    let isLoggedIn = false;

    // --- UI Update Functions ---
    function updateUI(loggedIn, user = null) {
        isLoggedIn = loggedIn;
        if (loggedIn) {
            loggedOutView.style.display = 'none';
            loggedInView.style.display = 'block';
            userEmailDisplay.textContent = `Welcome, ${user.email}`;
            saveProgressBtn.style.display = 'inline-block';
        } else {
            loggedOutView.style.display = 'block';
            loggedInView.style.display = 'none';
            userEmailDisplay.textContent = '';
            saveProgressBtn.style.display = 'none';
        }
    }

    function showMessage(element, message, isSuccess) {
        element.textContent = message;
        element.style.color = isSuccess ? 'var(--accent-color)' : 'var(--error-color)';
        element.style.display = 'block';
    }

    // --- Modal Control ---
    loginBtn.addEventListener('click', () => { loginModal.style.display = 'block'; });
    registerBtn.addEventListener('click', () => { registerModal.style.display = 'block'; });
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        });
    });
    window.addEventListener('click', (event) => {
        if (event.target == loginModal || event.target == registerModal) {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
        }
    });

    // --- API Calls ---

    // 1. Check Session on Load
    fetch('api/check_session.php')
        .then(res => res.json())
        .then(data => {
            updateUI(data.loggedIn, data.user);
            // Announce login status so other scripts can react
            document.dispatchEvent(new CustomEvent('auth-checked', { detail: { loggedIn: data.loggedIn } }));
        });

    // 2. Register
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        fetch('api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            showMessage(registerMessage, data.message, data.success);
            if (data.success) {
                setTimeout(() => {
                    registerModal.style.display = 'none';
                    loginModal.style.display = 'block'; // Prompt user to log in
                }, 2000);
            }
        });
    });

    // 3. Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                updateUI(true, data.user);
                loginModal.style.display = 'none';
                 // Announce login status so other scripts can react
                document.dispatchEvent(new CustomEvent('auth-checked', { detail: { loggedIn: true } }));
            } else {
                showMessage(loginMessage, data.message, false);
            }
        });
    });

    // 4. Logout
    logoutBtn.addEventListener('click', () => {
        fetch('api/logout.php')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    updateUI(false);
                }
            });
    });

});
