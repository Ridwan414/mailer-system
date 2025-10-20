// Middleware for Cloudflare Access verification
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Cache for JWKS client
let client = null;

const getJwksClient = () => {
  if (!client && process.env.CLOUDFLARE_TEAM_DOMAIN) {
    client = jwksClient({
      jwksUri: `https://${process.env.CLOUDFLARE_TEAM_DOMAIN}.cloudflareaccess.com/cdn-cgi/access/certs`,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true
    });
  }
  return client;
};

const cloudflareAccessMiddleware = async (req, res, next) => {
  // In development, skip Cloudflare Access
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      email: 'dev@localhost',
      commonName: 'Development User'
    };
    return next();
  }

  // Cloudflare Access sets these headers
  const cfEmail = req.headers['cf-access-authenticated-user-email'];
  const cfJwt = req.headers['cf-access-jwt-assertion'];
  
  // Check if headers are present
  if (!cfEmail || !cfJwt) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Cloudflare Access required'
    });
  }

  // If CLOUDFLARE_TEAM_DOMAIN is not set, skip JWT verification (basic mode)
  if (!process.env.CLOUDFLARE_TEAM_DOMAIN) {
    console.warn('CLOUDFLARE_TEAM_DOMAIN not set - using basic Cloudflare Access mode');
    req.user = {
      email: cfEmail,
      commonName: req.headers['cf-access-common-name']
    };
    return next();
  }

  // Verify JWT token
  try {
    const jwksClientInstance = getJwksClient();
    
    // Decode the token to get the kid (key id)
    const decoded = jwt.decode(cfJwt, { complete: true });
    
    if (!decoded || !decoded.header || !decoded.header.kid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    // Get the signing key
    const key = await jwksClientInstance.getSigningKey(decoded.header.kid);
    const signingKey = key.getPublicKey();

    // Verify the token
    const verified = jwt.verify(cfJwt, signingKey, {
      audience: process.env.CLOUDFLARE_AUD || '',
      algorithms: ['RS256']
    });

    // Add user info to request
    req.user = {
      email: verified.email || cfEmail,
      commonName: verified.common_name || req.headers['cf-access-common-name']
    };

    next();
  } catch (error) {
    console.error('Cloudflare Access JWT verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Token verification failed'
    });
  }
};

// Optional: Admin check middleware
const requireAdmin = (req, res, next) => {
  // Implement your admin check logic here
  // This could check against a list of admin emails
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',');
  
  if (!adminEmails.includes(req.user.email)) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required'
    });
  }
  
  next();
};

module.exports = {
  cloudflareAccessMiddleware,
  requireAdmin
};