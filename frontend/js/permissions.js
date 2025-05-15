class PermissionsManager {
    constructor() {
        this.permissions = [];
        this.role = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            const response = await fetch('/api/admin/permissions', {
                credentials: 'include'
            });
            const data = await response.json();
            
            if (response.ok) {
                this.permissions = data.permissions || [];
                this.role = data.role;
                this.initialized = true;
                this.applyPermissions();
            } else {
                console.error('Failed to fetch permissions:', data.error);
                // Redirect to login if not authenticated
                if (response.status === 401) {
                    window.location.href = '/html/admin/adminLogin.html';
                }
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
        }
    }

    hasPermission(permission) {
        return this.permissions.includes(permission);
    }

    applyPermissions() {
        // Hide elements based on permissions
        document.querySelectorAll('[data-requires-permission]').forEach(element => {
            const requiredPermission = element.getAttribute('data-requires-permission');
            if (!this.hasPermission(requiredPermission)) {
                element.style.display = 'none';
            }
        });

        // Disable buttons/forms based on permissions
        document.querySelectorAll('[data-requires-permission-action]').forEach(element => {
            const requiredPermission = element.getAttribute('data-requires-permission-action');
            if (!this.hasPermission(requiredPermission)) {
                element.disabled = true;
                element.classList.add('disabled');
                if (element.tagName === 'FORM') {
                    element.onsubmit = (e) => {
                        e.preventDefault();
                        alert('You do not have permission to perform this action');
                    };
                }
            }
        });

        // Update UI based on role
        if (this.role) {
            document.querySelectorAll('.role-indicator').forEach(element => {
                element.textContent = this.role.replace('_', ' ').toUpperCase();
            });
        }
    }

    // Helper method to check permissions before making API calls
    async fetchWithPermission(url, options = {}) {
        if (!options.credentials) {
            options.credentials = 'include';
        }
        const response = await fetch(url, options);
        if (response.status === 403) {
            alert('You do not have permission to perform this action');
            throw new Error('Permission denied');
        }
        return response;
    }
}

// Create and export a singleton instance
const permissionsManager = new PermissionsManager();
export default permissionsManager;
