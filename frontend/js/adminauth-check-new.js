export async function checkAdminAuth() {
    try {
        const response = await fetch('/api/admin/check-auth', { credentials: 'include' });
        const data = await response.json();
        if (!data.authenticated) {
            window.location.href = '/api/admin/login';
            return false;
        }
        return true;
    } catch (error) {
        window.location.href = '/api/admin/login';
        return false;
    }
}

export function setupLogout() {
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
}

// Initialize both auth check and logout handler when imported
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupLogout();
});
