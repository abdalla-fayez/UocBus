document.addEventListener('DOMContentLoaded', () => {
    const profilePhoto = document.getElementById('profilePhoto');
    const displayNameElement = document.getElementById('displayName');

    fetch('/api/session/user/retrieve')
        .then(response => response.json())
        .then(user => {
            if (user.photo) {
                profilePhoto.src = user.photo;
            }
            if (user.displayName) {
                displayNameElement.textContent = user.displayName;
            }
        })
        .catch(error => {
            console.error('Error fetching user data:', error);
        });
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');

    logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = '/api/logout';
    });
});