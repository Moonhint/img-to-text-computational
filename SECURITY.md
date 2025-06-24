# Security Guidelines

This document outlines security best practices for developing and publishing the img-to-text-computational package.

## 🔐 NPM Token Security

### Setting Up NPM Authentication

1. **Create NPM Account**
   - Sign up at [npmjs.com](https://www.npmjs.com)
   - Verify your email address

2. **Generate NPM Token**
   - Go to [NPM Tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token"
   - Choose "Automation" for CI/CD or "Publish" for manual publishing
   - Copy the token immediately (it won't be shown again)

3. **Configure Local Environment**
   ```bash
   # Copy the example configuration
   cp .npmrc.example .npmrc
   
   # Edit .npmrc and replace YOUR_NPM_TOKEN_HERE with your actual token
   nano .npmrc
   ```

4. **Verify Configuration**
   ```bash
   # Test authentication
   npm whoami
   
   # Should display your NPM username
   ```

### Security Best Practices

#### ✅ DO
- **Use `.npmrc.example`** as a template for team members
- **Keep `.npmrc` in `.gitignore`** (already configured)
- **Use automation tokens** for CI/CD pipelines
- **Rotate tokens regularly** (every 90 days recommended)
- **Use environment variables** in CI/CD systems
- **Limit token scope** to minimum required permissions

#### ❌ DON'T
- **Never commit `.npmrc`** with real tokens to Git
- **Don't share tokens** in chat, email, or documentation
- **Don't use personal tokens** in shared environments
- **Don't hardcode tokens** in scripts or configuration files
- **Don't use tokens with excessive permissions**

## 🔒 Environment Variables

For CI/CD and production environments, use environment variables:

### GitHub Actions (already configured)
```yaml
- name: Publish to NPM
  run: npm publish
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Local Development
```bash
# Set environment variable (temporary)
export NPM_TOKEN=your_token_here
npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN

# Or use .npmrc file (recommended for local development)
```

## 🛡️ Git Security

### Protected Files
The following files are automatically ignored by Git:

```
.npmrc                    # NPM authentication
.env*                     # Environment variables
*.key, *.pem, *.p12      # Certificate files
secrets.json             # Secret configuration
config/secrets.js        # Secret configuration
```

### Checking for Exposed Secrets
```bash
# Check if .npmrc is properly ignored
git status

# Verify .npmrc is not tracked
git ls-files | grep npmrc

# Should only show .npmrc.example, not .npmrc
```

### Emergency: Token Exposed
If you accidentally commit a token:

1. **Immediately revoke the token** at [NPM Tokens](https://www.npmjs.com/settings/tokens)
2. **Generate a new token**
3. **Update your local `.npmrc`**
4. **Remove the token from Git history:**
   ```bash
   # Remove file from Git history (use with caution)
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch .npmrc' \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push to remote (dangerous - coordinate with team)
   git push --force --all
   ```

## 🔍 Security Scanning

### Automated Security Checks
The CI/CD pipeline includes:

- **Dependency vulnerability scanning** with `npm audit`
- **Security audit** with `audit-ci`
- **Secret detection** (configured in GitHub Actions)

### Manual Security Checks
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## 📋 Security Checklist

Before publishing or pushing to GitHub:

- [ ] `.npmrc` is in `.gitignore`
- [ ] No hardcoded tokens in source code
- [ ] Environment variables used in CI/CD
- [ ] Dependencies are up to date
- [ ] No high-severity vulnerabilities
- [ ] Tokens have appropriate scope/permissions
- [ ] `.npmrc.example` is available for team members

## 🚨 Incident Response

If you suspect a security issue:

1. **Don't panic** - assess the situation
2. **Revoke compromised credentials** immediately
3. **Generate new credentials**
4. **Update all environments** with new credentials
5. **Review logs** for unauthorized access
6. **Document the incident** for future prevention

## 📞 Contact

For security concerns or questions:
- **Email**: email.to.antoni@gmail.com
- **GitHub Issues**: [Security Issues](https://github.com/Moonhint/img-to-text-computational/issues)
- **Private Disclosure**: Use GitHub Security Advisories

## 📚 Additional Resources

- [NPM Security Best Practices](https://docs.npmjs.com/security)
- [GitHub Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/) 