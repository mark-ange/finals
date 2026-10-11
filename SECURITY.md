# CityCare CDO - Security Documentation

## 🔒 Security Overview

This document outlines all security measures implemented in the CityCare CDO project to prevent hacking, data breaches, and common web vulnerabilities.

---

## 🛡️ Security Features Implemented

### 1. **Authentication Security**

#### Password Policies
- Minimum length: 8 characters
- Must contain: uppercase letter, lowercase letter, number, and special character
- Password hashing: bcrypt with salt (10 rounds)
- Applied to: User registration, admin login, password updates

#### JWT Token Security
- **Access Tokens**: Short-lived (30 days default, configurable via `JWT_EXPIRES_IN`)
- **Refresh Tokens**: Long-lived (90 days default, configurable via `JWT_REFRESH_EXPIRES_IN`)
- Token blacklisting: Revoked tokens are stored and cannot be reused
- Automatic token expiration check on frontend
- Secure token storage in HTTP-only, secure cookies (production)

**Environment Variables:**
```env
JWT_SECRET=your_strong_secret_key_here
JWT_EXPIRES_IN=30d
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=90d
```

#### Authentication Rate Limiting
- Login endpoints: 5 attempts per 15 minutes per IP
- Protection against: Brute force attacks, credential stuffing
- Applied to: `/api/auth/login`, `/api/auth/admin-login`, `/api/auth/register-resident`

---

### 2. **Input Validation & Sanitization**

#### Backend Validation
- **express-validator** library for comprehensive validation
- Applied to all POST/PUT endpoints
- Validations include:
  - Required fields
  - Data type checking
  - String length limits
  - Email format validation
  - Mobile phone format validation
  - Custom validation rules

#### Frontend Sanitization
- Input sanitization before API requests
- XSS pattern removal (script tags, event handlers, javascript:)
- Applied to all API request bodies

#### NoSQL Injection Prevention
- **express-mongo-sanitize** middleware
- Removes `$`, `.`, and other MongoDB operators from user input
- Applied globally to all routes

#### JSON Injection Protection
- Prevents prototype pollution attacks
- Blocks requests containing `__proto__`, `constructor`, `prototype`
- Applied globally to all JSON requests

---

### 3. **API Rate Limiting**

#### General API Rate Limiting
- 100 requests per hour per IP (configurable)
- Applied to all API endpoints
- Prevents: DDoS attacks, API abuse

#### Authentication Rate Limiting
- 5 login attempts per 15 minutes per IP
- Prevents: Brute force attacks

#### Configuration Options:
```javascript
// In backend/middleware/securityMiddleware.js
const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // requests per window
  // ...
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // requests per window
  // ...
});
```

---

### 4. **Security Headers (Helmet.js)**

All security headers are set via the Helmet middleware:

```javascript
const setSecurityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  frameguard: { action: "deny" }, // X-Frame-Options: DENY
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true, // X-Content-Type-Options: nosniff
  referrerPolicy: { policy: "same-origin" },
  xssFilter: true // X-XSS-Protection: 1; mode=block
});
```

**Frontend Security Headers (index.html):**
```html
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: wss: https: http://localhost:*; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';" />
<meta http-equiv="X-Content-Type-Options" content="nosniff" />
<meta http-equiv="X-Frame-Options" content="DENY" />
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
<meta name="robots" content="noindex, nofollow" />
```

---

### 5. **CSRF Protection**

#### Backend CSRF Middleware
- CSRF token generation for each session
- Token validation for state-changing requests (POST, PUT, DELETE)
- One-time use tokens (automatically invalidated after use)
- Stored server-side with session binding

#### Frontend Implementation
- CSRF token included in request headers
- Automatic token generation on page load
- Validation middleware integrated with session management

---

### 6. **CORS Configuration**

#### Secure CORS Settings
```javascript
app.use(cors({
  origin: getCorsOptions, // Dynamic origin validation
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400 // 24 hours
}));
```

**Configuration:**
```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000,http://127.0.0.1:5173
NODE_ENV=development
```

---

### 7. **XSS Protection**

#### Backend XSS Prevention
- **xss-clean** library for automatic sanitization
- Manual XSS protection as fallback
- Removes dangerous patterns:
  - `<script>` tags
  - `javascript:` protocol
  - Event handlers (`onclick`, `onload`, etc.)
  - HTML tags with malicious attributes

#### Frontend XSS Prevention
- Input sanitization before display
- Output encoding in templates
- Safe HTML rendering in Vue components

---

### 8. **Session Management**

#### Secure Session Handling
- Express-session with secure cookie settings
- Session expiration: 24 hours
- HTTP-only cookies (prevents JavaScript access)
- Secure cookies in production (HTTPS only)
- SameSite cookie attribute (CSRF protection)

**Configuration:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'citycare_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

---

### 9. **Authorization & Access Control**

#### Role-Based Access Control (RBAC)
- **Admin-only routes**: Require `admin`, `clenro_officer`, `CLENRO Central Admin`, or `CLENRO Staff` role
- **Protected routes**: Require valid JWT token
- **Public routes**: Accessible without authentication

**Middleware:**
```javascript
// In backend/middleware/authMiddleware.js
const adminOnly = (req, res, next) => {
  if (req.user && (
    req.user.role === 'admin' ||
    req.user.role === 'clenro_officer' ||
    req.user.role === 'CLENRO Central Admin' ||
    req.user.role === 'CLENRO Staff'
  )) {
    next();
  } else {
    res.status(403).json({ 
      success: false, 
      message: 'Access denied: Administrator privileges required' 
    });
  }
};
```

#### Applied to:
- DELETE operations (reports, barangays, fleet, schedules, notifications)
- POST operations for admin-only features
- PUT operations for sensitive data
- Dashboard access

---

### 10. **Database Security**

#### MongoDB Security
- **Connection encryption**: TLS/SSL enabled
- **IP whitelisting**: Required for MongoDB Atlas (IP: 49.149.74.5)
- **Authentication**: Username/password required
- **Input sanitization**: All queries use parameterized inputs

**Connection String:**
```env
MONGO_URI=<configure privately from MongoDB Atlas>
MONGO_URI_DIRECT=<optional; configure privately if required>
```

---

## 🚨 Security Checklist

### Pre-Deployment Security Audit

- [ ] **Environment Variables**: All secrets moved to environment variables
- [ ] **HTTPS**: Production server uses HTTPS with valid SSL certificate
- [ ] **Database**: MongoDB Atlas IP whitelist includes production server IP
- [ ] **Firebase**: Firebase Admin SDK configured with service account
- [ ] **Secrets**: No hardcoded credentials in source code
- [ ] **CORS**: Production CORS origins configured correctly
- [ ] **Rate Limits**: Production rate limits adjusted for expected traffic

### Security Configuration File (Recommended)

Create a `.env.security` file (add to `.gitignore`):

```env
# JWT Configuration
JWT_SECRET=generate_strong_random_key_here_32_bytes_minimum
JWT_REFRESH_SECRET=generate_another_strong_random_key_here
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d

# Session Configuration
SESSION_SECRET=generate_strong_session_secret_here

# MongoDB Configuration
MONGO_URI=<configure privately from MongoDB Atlas>
MONGO_URI_DIRECT=<optional; configure privately if required>

# CORS Configuration
ALLOWED_ORIGINS=https://citycare-cdo.gov.ph,https://www.citycare-cdo.gov.ph

# Application Configuration
NODE_ENV=production
PORT=5000

# Rate Limiting (adjust for production)
API_RATE_LIMIT_MAX=1000
API_RATE_LIMIT_WINDOW_MS=3600000
AUTH_RATE_LIMIT_MAX=10
AUTH_RATE_LIMIT_WINDOW_MS=900000
```

---

## 🔍 Monitoring & Logging

### Security Event Logging

All security-related events should be logged:

```javascript
// In middleware, log security events
console.log(`[SECURITY] Rate limit exceeded for IP: ${req.ip}`);
console.log(`[SECURITY] Invalid JWT token: ${error.message}`);
console.log(`[SECURITY] CSRF validation failed for session: ${sessionId}`);
console.log(`[SECURITY] NoSQL injection attempt detected from IP: ${req.ip}`);
```

### Recommended Monitoring Tools

1. **Application Logs**: Centralized logging (ELK Stack, Splunk, etc.)
2. **Rate Limit Monitoring**: Track 429 responses
3. **Authentication Monitoring**: Track failed login attempts
4. **Error Tracking**: Sentry, Rollbar, or similar

---

## 🚨 Incident Response

### Common Security Incidents

#### 1. Brute Force Attack Detected
- **Symptoms**: Multiple failed login attempts from single IP
- **Response**: IP is automatically blocked for 15 minutes
- **Action**: Monitor, consider permanent block if persistent

#### 2. Injection Attempt Detected
- **Symptoms**: Malicious input patterns in requests
- **Response**: Request is rejected, IP logged
- **Action**: Investigate source, strengthen input validation

#### 3. Unauthorized Access Attempt
- **Symptoms**: 401/403 responses on protected endpoints
- **Response**: Access denied, token invalidated
- **Action**: Review access logs, check for compromised tokens

#### 4. Data Breach
- **Symptoms**: Unusual data access patterns
- **Response**: 
  1. Revoke all active tokens
  2. Rotate all secrets (JWT, database passwords, etc.)
  3. Force password reset for all users
  4. Investigate source of breach

---

## 📋 Security Testing

### Manual Security Testing Checklist

#### 1. Authentication Testing
- [ ] Register with weak password (should fail)
- [ ] Login with incorrect credentials (should fail with rate limiting)
- [ ] Login with valid credentials (should succeed)
- [ ] Access protected route without token (should fail with 401)
- [ ] Access protected route with invalid token (should fail with 401)
- [ ] Access admin-only route with user token (should fail with 403)

#### 2. Input Validation Testing
- [ ] Submit form with XSS payload (should be sanitized)
- [ ] Submit form with NoSQL injection (should be sanitized)
- [ ] Submit form with SQL injection (should be sanitized)
- [ ] Submit form with empty required fields (should fail validation)
- [ ] Submit form with invalid email format (should fail validation)

#### 3. Rate Limiting Testing
- [ ] Make 6 login attempts from same IP (5th should fail)
- [ ] Wait 15 minutes, try again (should succeed)
- [ ] Make 101 API requests in one hour (101st should fail)

#### 4. CORS Testing
- [ ] Request from allowed origin (should succeed)
- [ ] Request from disallowed origin (should fail)
- [ ] Request with credentials from disallowed origin (should fail)

#### 5. Security Headers Testing
- [ ] Check for X-Frame-Options header (should be DENY)
- [ ] Check for X-Content-Type-Options header (should be nosniff)
- [ ] Check for Content-Security-Policy header (should be present)
- [ ] Check for X-XSS-Protection header (should be enabled)
- [ ] Check for Strict-Transport-Security header (should be enabled)

---

### Automated Security Testing

#### Tools to Use:

1. **OWASP ZAP** - Comprehensive web application security scanner
2. **NMAP** - Network and port scanning
3. **SQLMap** - SQL injection testing (ensure NoSQL protection works)
4. **Burp Suite** - Manual penetration testing
5. **Snyk** - Dependency vulnerability scanning

#### Commands:

```bash
# Run OWASP ZAP baseline scan
zap-baseline.py -t http://localhost:5000

# Run NPM audit
npm audit

# Run Snyk test (requires Snyk CLI)
snyk test

# Run OWASP dependency check
npm install -g owasp-dependency-check
owasp-dependency-check --scan . --format HTML --out report.html
```

---

## 🛠️ Security Best Practices

### For Developers

1. **Never hardcode credentials** - Always use environment variables
2. **Always validate input** - Use express-validator for all endpoints
3. **Always sanitize output** - Use xss-clean or manual sanitization
4. **Use parameterized queries** - Never concatenate user input into queries
5. **Implement proper error handling** - Don't expose stack traces in production
6. **Use HTTPS** - Always use HTTPS in production
7. **Keep dependencies updated** - Regularly update npm packages
8. **Review code for vulnerabilities** - Use security-focused code reviews

### For System Administrators

1. **Rotate secrets regularly** - JWT secrets, database passwords, API keys
2. **Monitor logs** - Set up alerts for security events
3. **Implement backups** - Regular database backups
4. **Keep server updated** - Apply security patches promptly
5. **Implement firewall rules** - Restrict access to necessary ports only
6. **Use WAF** - Web Application Firewall for additional protection

---

## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [express-rate-limit Documentation](https://github.com/express-rate-limit/rate-limiter)
- [express-mongo-sanitize Documentation](https://github.com/express-mongo-sanitize/express-mongo-sanitize)
- [JWT Best Practices](https://auth0.com/docs/secure/tokens/json-web-tokens/json-web-token-best-practices)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

## 📞 Support & Reporting

### Security Vulnerability Reporting

If you discover a security vulnerability in this project, please:

1. **Do not** disclose the vulnerability publicly
2. **Do** report it privately to the development team
3. **Include** details about the vulnerability and steps to reproduce

**Contact:** security@citycare-cdo.gov.ph

---

*This security documentation is part of the CityCare CDO project and should be kept up to date with all security-related changes.*
