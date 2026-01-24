const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

/**
 * Role-based Access Control Middleware
 * Use after authMiddleware to check user roles
 * 
 * Usage:
 *   router.get('/admin', authMiddleware, requireRole('admin'), handler)
 *   router.get('/staff', authMiddleware, requireRole(['admin', 'staff']), handler)
 */
const requireRole = (allowedRoles) => {
  // Convert single role to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      console.log(`[RBAC] Access denied for user ${req.user.email} with role '${userRole}'. Required: ${roles.join(' or ')}`);
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Role Constants
 * Matches Keycloak groups: SIMRS-Admins, SIMRS-Doctors, SIMRS-Nurses, SIMRS-Staff, SIMRS-Readonly
 */
const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  NURSE: 'nurse',
  STAFF: 'staff',
  READONLY: 'readonly',
  USER: 'user'  // Default role for new users
};

/**
 * Map Keycloak group to local role
 */
const mapKeycloakGroupToRole = (groups) => {
  if (!groups || !Array.isArray(groups)) return ROLES.USER;

  // Priority order: admin > doctor > nurse > staff > readonly > user
  if (groups.some(g => g.toLowerCase().includes('admin'))) return ROLES.ADMIN;
  if (groups.some(g => g.toLowerCase().includes('doctor'))) return ROLES.DOCTOR;
  if (groups.some(g => g.toLowerCase().includes('nurse'))) return ROLES.NURSE;
  if (groups.some(g => g.toLowerCase().includes('staff'))) return ROLES.STAFF;
  if (groups.some(g => g.toLowerCase().includes('readonly'))) return ROLES.READONLY;

  return ROLES.USER;
};

module.exports = authMiddleware;
module.exports.requireRole = requireRole;
module.exports.ROLES = ROLES;
module.exports.mapKeycloakGroupToRole = mapKeycloakGroupToRole;
