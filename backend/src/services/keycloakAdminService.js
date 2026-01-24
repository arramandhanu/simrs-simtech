/**
 * Keycloak Admin API Service
 * Manages users and groups in Keycloak from SIMRS application
 */

const axios = require('axios');

const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || 'simrs';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'simrs-app';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

// Cache for access token
let tokenCache = {
    accessToken: null,
    expiresAt: 0
};

/**
 * Get admin access token using client credentials
 */
async function getAccessToken() {
    // Return cached token if still valid
    if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    try {
        const tokenUrl = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;

        const response = await axios.post(tokenUrl,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: KEYCLOAK_CLIENT_ID,
                client_secret: KEYCLOAK_CLIENT_SECRET
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        const { access_token, expires_in } = response.data;

        // Cache token with 60 second buffer before expiry
        tokenCache = {
            accessToken: access_token,
            expiresAt: Date.now() + (expires_in - 60) * 1000
        };

        return access_token;
    } catch (error) {
        console.error('Failed to get Keycloak admin token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with Keycloak Admin API');
    }
}

/**
 * Get Keycloak admin API base URL
 */
function getAdminUrl() {
    return `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}`;
}

/**
 * Make authenticated request to Keycloak Admin API
 */
async function adminRequest(method, path, data = null) {
    const token = await getAccessToken();
    const url = `${getAdminUrl()}${path}`;

    try {
        const response = await axios({
            method,
            url,
            data,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Keycloak Admin API error [${method} ${path}]:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get all groups in the realm
 */
async function getGroups() {
    return adminRequest('GET', '/groups');
}

/**
 * Find a group by name
 */
async function findGroupByName(groupName) {
    const groups = await getGroups();
    return groups.find(g => g.name === groupName);
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
    const users = await adminRequest('GET', `/users?email=${encodeURIComponent(email)}&exact=true`);
    return users.length > 0 ? users[0] : null;
}

/**
 * Get user by Keycloak ID
 */
async function getUserById(keycloakId) {
    try {
        return await adminRequest('GET', `/users/${keycloakId}`);
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
}

/**
 * Get user's groups
 */
async function getUserGroups(keycloakId) {
    return adminRequest('GET', `/users/${keycloakId}/groups`);
}

/**
 * Add user to a group
 */
async function addUserToGroup(keycloakId, groupId) {
    await adminRequest('PUT', `/users/${keycloakId}/groups/${groupId}`);
    console.log(`Added user ${keycloakId} to group ${groupId}`);
}

/**
 * Remove user from a group
 */
async function removeUserFromGroup(keycloakId, groupId) {
    await adminRequest('DELETE', `/users/${keycloakId}/groups/${groupId}`);
    console.log(`Removed user ${keycloakId} from group ${groupId}`);
}

/**
 * Map app role to Keycloak group name
 */
const ROLE_TO_GROUP = {
    admin: 'SIMRS-Admins',
    doctor: 'SIMRS-Doctors',
    nurse: 'SIMRS-Nurses',
    staff: 'SIMRS-Staff',
    readonly: 'SIMRS-Readonly',
    user: null // No group for basic user role
};

/**
 * Sync user role to Keycloak
 * @param {string} keycloakId - Keycloak user ID
 * @param {string} newRole - New role to assign
 */
async function syncUserRole(keycloakId, newRole) {
    if (!keycloakId) {
        console.log('No Keycloak ID, skipping role sync');
        return;
    }

    try {
        // Get all groups
        const allGroups = await getGroups();

        // Get user's current groups
        const userGroups = await getUserGroups(keycloakId);

        // Remove from all SIMRS groups
        for (const group of userGroups) {
            if (group.name.startsWith('SIMRS-')) {
                await removeUserFromGroup(keycloakId, group.id);
            }
        }

        // Add to new group if role has a corresponding group
        const targetGroupName = ROLE_TO_GROUP[newRole];
        if (targetGroupName) {
            const targetGroup = allGroups.find(g => g.name === targetGroupName);
            if (targetGroup) {
                await addUserToGroup(keycloakId, targetGroup.id);
            } else {
                console.warn(`Group ${targetGroupName} not found in Keycloak. Please create it.`);
            }
        }

        console.log(`Synced role '${newRole}' for Keycloak user ${keycloakId}`);
    } catch (error) {
        console.error('Failed to sync user role to Keycloak:', error.message);
        // Don't throw - role sync is secondary to DB storage
    }
}

/**
 * Check if Keycloak Admin API is accessible
 */
async function healthCheck() {
    try {
        await getAccessToken();
        await adminRequest('GET', '/groups');
        return { status: 'ok', message: 'Keycloak Admin API accessible' };
    } catch (error) {
        return { status: 'error', message: error.message };
    }
}

module.exports = {
    getAccessToken,
    getGroups,
    findGroupByName,
    getUserByEmail,
    getUserById,
    getUserGroups,
    addUserToGroup,
    removeUserFromGroup,
    syncUserRole,
    healthCheck,
    ROLE_TO_GROUP
};
