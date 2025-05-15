-- Add new columns to admin_users table
ALTER TABLE admin_users ADD COLUMN role_id INT NULL;

-- Create roles table
CREATE TABLE admin_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Create permissions table
CREATE TABLE admin_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Create role_permissions junction table
CREATE TABLE role_permissions (
    role_id INT,
    permission_id INT,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

-- Add foreign key to admin_users
ALTER TABLE admin_users
ADD FOREIGN KEY (role_id) REFERENCES admin_roles(id);

-- Insert basic roles
INSERT INTO admin_roles (role_name, description) VALUES
('super_admin', 'Full system access with all permissions'),
('fleet_manager', 'Manage buses, routes and pickup points'),
('booking_manager', 'View bookings and generate reports');

-- Insert basic permissions
INSERT INTO admin_permissions (permission_name, description) VALUES
('manage_buses', 'Create, update, and delete buses'),
('manage_routes', 'Create, update, and delete routes'),
('manage_pickup_points', 'Manage pickup points'),
('view_bookings', 'View booking information'),
('generate_reports', 'Generate and download reports'),
('manage_automation', 'Control trip automation settings');

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM admin_roles r 
CROSS JOIN admin_permissions p 
WHERE r.role_name = 'super_admin';

-- Fleet Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM admin_roles r 
CROSS JOIN admin_permissions p 
WHERE r.role_name = 'fleet_manager' 
AND p.permission_name IN ('manage_buses', 'manage_routes', 'manage_pickup_points');

-- Booking Manager permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM admin_roles r 
CROSS JOIN admin_permissions p 
WHERE r.role_name = 'booking_manager' 
AND p.permission_name IN ('view_bookings', 'generate_reports');

-- Assign roles to existing users
UPDATE admin_users SET role_id = (
    SELECT id FROM admin_roles WHERE role_name = 'super_admin'
) WHERE username = 'app_team';

UPDATE admin_users SET role_id = (
    SELECT id FROM admin_roles WHERE role_name = 'fleet_manager'
) WHERE username = 'fleet';

UPDATE admin_users SET role_id = (
    SELECT id FROM admin_roles WHERE role_name = 'booking_manager'
) WHERE username = 'finance';
