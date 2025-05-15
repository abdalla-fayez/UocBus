const db = require('../models/dbconnection');

const checkPermission = (requiredPermissions) => {
    // Convert single permission to array for consistent handling
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return async (req, res, next) => {
        try {
            if (!req.session.adminUser) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            // Get user's permissions based on their role
            const [userPerms] = await db.query(`
                SELECT DISTINCT p.permission_name
                FROM admin_users u
                JOIN admin_roles r ON u.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN admin_permissions p ON rp.permission_id = p.id
                WHERE u.id = ?
            `, [req.session.adminUser.id]);

            const userPermissions = userPerms.map(p => p.permission_name);

            // Check if user has any of the required permissions
            const hasPermission = permissions.some(permission => 
                userPermissions.includes(permission)
            );

            if (!hasPermission) {
                return res.status(403).json({ 
                    error: 'You do not have permission to perform this action' 
                });
            }

            next();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
};

module.exports = checkPermission;
