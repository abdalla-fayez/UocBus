document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is authenticated
    fetch('/api/admin/check-auth', { credentials: 'include' })
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/api/admin/login';
            }
        })
        .catch(() => {
            window.location.href = '/api/admin/login';
        });

    // Add event listener to the logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                const response = await fetch('/api/admin/logout', {
                    method: 'GET',
                    credentials: 'include'
                });
                if (response.ok) {
                    window.location.href = '/api/admin/login';
                } else {
                    alert('Logout failed.');
                }
            } catch (error) {
                console.error('Logout error:', error);
            }
        });
    }
});
