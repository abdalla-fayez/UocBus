document.addEventListener('DOMContentLoaded', () => {
    // Initialize user interface
    initializeUserInterface();
    // Initialize ticket allowance
    updateTicketAllowance();
});

function initializeUserInterface() {
    const profilePhoto = document.getElementById('profilePhoto');
    const displayNameElement = document.getElementById('displayName');
    const logoutButton = document.getElementById('logoutButton');

    // Setup logout handler
    logoutButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = '/api/logout';
    });

    // Fetch and update user data
    fetch('/api/session/user/retrieve')
        .then(response => response.json())
        .then(user => {
            if (user.photo) profilePhoto.src = user.photo;
            if (user.displayName) displayNameElement.textContent = user.displayName;
        })
        .catch(error => console.error('Error fetching user data:', error));
}

async function updateTicketAllowance() {
    try {
        const [ticketsResponse, maxAllowanceResponse] = await Promise.all([
            fetch('/api/user/ticketsbooked'),
            fetch('/api/system/maxTicketAllowance')
        ]);

        if (!ticketsResponse.ok || !maxAllowanceResponse.ok) {
            throw new Error('Failed to fetch ticket allowance data');
        }

        const ticketsData = await ticketsResponse.json();
        const maxAllowanceData = await maxAllowanceResponse.json();

        const maxTickets = maxAllowanceData.maxTicketAllowance;
        const usedTickets = ticketsData.ticketsBooked;
        const remainingTickets = maxTickets - usedTickets;

        document.getElementById('remainingTickets').textContent = remainingTickets;
        document.getElementById('maxTickets').textContent = maxTickets;
    } catch (error) {
        console.error('Error fetching ticket allowance:', error);
        document.getElementById('remainingTickets').textContent = '-';
        document.getElementById('maxTickets').textContent = '-';
    }
}