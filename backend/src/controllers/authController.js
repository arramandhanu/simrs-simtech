const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const keycloakConfig = require('../config/keycloak');
const { mapKeycloakGroupToRole } = require('../middleware/authMiddleware');

// Helper function to generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider || 'database'
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Helper function to format user response
const formatUserResponse = (user, token) => ({
  success: true,
  data: {
    token,
    user: {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      position: user.position,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0ea5e9&color=fff`
    }
  }
});

// Database Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json(formatUserResponse(user, token));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Register (for testing)
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }

  const { email, password, name } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
      [email, hashedPassword, name || email.split('@')[0], 'user']
    );

    res.status(201).json({ success: true, message: 'User created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Keycloak: Redirect to Keycloak login
exports.keycloakLogin = (req, res) => {
  if (!keycloakConfig.enabled) {
    return res.status(400).json({ success: false, message: 'Keycloak is not enabled' });
  }

  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: keycloakConfig.callbackUrl,
    response_type: 'code',
    scope: 'openid profile email'
  });

  // Support kc_idp_hint to skip Keycloak login page and go directly to IdP (e.g., google)
  if (req.query.kc_idp_hint) {
    params.append('kc_idp_hint', req.query.kc_idp_hint);
    console.log(`[SSO] Redirecting to IdP: ${req.query.kc_idp_hint}`);
  }

  res.redirect(`${keycloakConfig.authUrl}?${params.toString()}`);
};

// Keycloak: Handle callback
exports.keycloakCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${keycloakConfig.frontendUrl}/login?error=no_code`);
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch(keycloakConfig.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: keycloakConfig.clientId,
        client_secret: keycloakConfig.clientSecret,
        code: code,
        redirect_uri: keycloakConfig.callbackUrl
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Keycloak token error:', tokenData);
      return res.redirect(`${keycloakConfig.frontendUrl}/login?error=token_error`);
    }

    // Get user info from Keycloak
    const userInfoResponse = await fetch(keycloakConfig.userInfoUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    // Decode access token to get groups/roles
    const accessTokenPayload = JSON.parse(
      Buffer.from(tokenData.access_token.split('.')[1], 'base64').toString()
    );

    // Extract groups from token (Keycloak puts them in 'groups' claim)
    const groups = accessTokenPayload.groups || [];
    const mappedRole = mapKeycloakGroupToRole(groups);

    console.log(`[SSO] User ${userInfo.email} - Groups: ${groups.join(', ')} -> Role: ${mappedRole}`);

    // Find or create user in database
    let { rows } = await db.query('SELECT * FROM users WHERE email = $1', [userInfo.email]);

    let user;
    if (rows.length === 0) {
      // Create new user from Keycloak with mapped role
      const result = await db.query(
        'INSERT INTO users (email, name, role, password) VALUES ($1, $2, $3, $4) RETURNING *',
        [userInfo.email, userInfo.name || userInfo.preferred_username, mappedRole, 'keycloak_sso']
      );
      user = result.rows[0];
      console.log(`[SSO] Created new user: ${user.email} with role: ${user.role}`);
    } else {
      user = rows[0];
      // Update role if it changed in Keycloak (optional - sync role on each login)
      if (user.role !== mappedRole && mappedRole !== 'user') {
        await db.query('UPDATE users SET role = $1 WHERE id = $2', [mappedRole, user.id]);
        user.role = mappedRole;
        console.log(`[SSO] Updated user ${user.email} role to: ${mappedRole}`);
      }
    }

    user.authProvider = 'keycloak';
    const token = generateToken(user);

    // Redirect to frontend with token
    res.redirect(`${keycloakConfig.frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    }))}`);

  } catch (error) {
    console.error('Keycloak callback error:', error);
    res.redirect(`${keycloakConfig.frontendUrl}/login?error=server_error`);
  }
};

// Get Keycloak status
exports.getAuthConfig = (req, res) => {
  res.json({
    success: true,
    data: {
      keycloak: {
        enabled: keycloakConfig.enabled,
        loginUrl: keycloakConfig.enabled ? '/api/auth/keycloak' : null
      }
    }
  });
};
