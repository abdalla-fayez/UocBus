document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = '/auth/microsoft';
            }
        })
        .catch(() => {
            window.location.href = '/auth/microsoft';
        });
});