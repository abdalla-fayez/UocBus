document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginErrorDiv = document.getElementById('loginError');
  
    // Set focus on the username field on page load
    document.getElementById('username').focus();
  
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevent the form from submitting normally
  
      // Build URL-encoded form data from the form inputs
      const formData = new URLSearchParams(new FormData(loginForm)).toString();
  
      try {
        const response = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
  
        if (response.ok) {
          // If login was successful, redirect to the dashboard URL
          window.location.href = '/admin/admindashboard.html';
        } else {
          // If login failed, show the error message from the response
          const errorText = await response.text();
          loginErrorDiv.style.display = 'block';
          loginErrorDiv.textContent = errorText;
        }
      } catch (error) {
        console.error('Error during login:', error);
        loginErrorDiv.style.display = 'block';
        loginErrorDiv.textContent = 'An unexpected error occurred. Please try again.';
      }
    });
  });
  