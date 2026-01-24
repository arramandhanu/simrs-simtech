const dotenv = require('dotenv');
dotenv.config();

const keycloakConfig = {
    enabled: process.env.KEYCLOAK_ENABLED === 'true',
    url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM || 'simrs',
    clientId: process.env.KEYCLOAK_CLIENT_ID || 'simrs-app',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || '',
    callbackUrl: process.env.KEYCLOAK_CALLBACK_URL || 'http://localhost:5000/api/auth/keycloak/callback',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4173',
};

// Build Keycloak URLs
keycloakConfig.authUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;
keycloakConfig.tokenUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;
keycloakConfig.userInfoUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;
keycloakConfig.certsUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`;

module.exports = keycloakConfig;
