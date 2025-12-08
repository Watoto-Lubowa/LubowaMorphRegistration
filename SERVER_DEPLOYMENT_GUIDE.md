# Server Deployment Setup Guide

This guide explains how to deploy the Vue app to your own server using GitHub Actions.

## Prerequisites

1. A web server with FTP/SFTP access (cPanel, Plesk, VPS, etc.)
2. Access to your server's SSH or FTP credentials
3. GitHub repository secrets configured

## Required GitHub Secrets

Go to your repository on GitHub → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

### For SFTP Deployment (Recommended - More Secure)

| Secret Name | Example Value | Description |
|------------|---------------|-------------|
| `FTP_SERVER` | `example.com` or `123.45.67.89` | Your server hostname or IP address |
| `FTP_USERNAME` | `your-username` | Your server username |
| `FTP_PORT` | `22` | SSH/SFTP port (usually 22) |
| `SSH_PRIVATE_KEY` | `-----BEGIN RSA PRIVATE KEY-----...` | Your SSH private key |
| `FTP_REMOTE_PATH` | `/public_html/vue/` or `/var/www/html/vue/` | Path where files should be uploaded |

### For FTP Deployment (Alternative)

| Secret Name | Example Value | Description |
|------------|---------------|-------------|
| `FTP_SERVER` | `ftp.example.com` | Your FTP server address |
| `FTP_USERNAME` | `your-username` | Your FTP username |
| `FTP_PASSWORD` | `your-password` | Your FTP password |
| `FTP_REMOTE_PATH` | `/public_html/vue/` | Path where files should be uploaded |

## How to Generate SSH Private Key (for SFTP)

If you're using SFTP, you'll need to generate an SSH key pair:

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "github-actions-deploy"

# Save as: ~/.ssh/github_deploy_key (or any name you prefer)
# Don't set a passphrase (just press Enter)
```

Then:

1. **Copy the PUBLIC key** (`~/.ssh/github_deploy_key.pub`) to your server:
   ```bash
   ssh-copy-id -i ~/.ssh/github_deploy_key.pub your-username@your-server.com
   ```
   Or manually add it to `~/.ssh/authorized_keys` on your server

2. **Copy the PRIVATE key** (`~/.ssh/github_deploy_key`) contents to GitHub secret `SSH_PRIVATE_KEY`
   ```bash
   cat ~/.ssh/github_deploy_key
   ```
   Copy the entire output including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`

## Server Configuration

### 1. Web Server Setup

Create the target directory on your server:

```bash
# For Apache/cPanel
mkdir -p /public_html/vue

# For Nginx/VPS
mkdir -p /var/www/html/vue

# Set proper permissions
chmod 755 /path/to/vue
```

### 2. Configure Web Server for Vue SPA

#### Apache (.htaccess)

Create `.htaccess` in your vue folder:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /vue/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /vue/index.html [L]
</IfModule>

# Enable GZIP compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript
</IfModule>

# Set caching headers
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

#### Nginx

Add to your nginx config:

```nginx
location /vue/ {
    alias /var/www/html/vue/;
    try_files $uri $uri/ /vue/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Then reload nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Workflow

### Using SFTP (Recommended)

The `deploy-to-server.yml` is configured to use SFTP by default. Just push to `main-vue` branch:

```bash
git push origin main-vue
```

### Using FTP Instead

If you prefer FTP, edit `.github/workflows/deploy-to-server.yml`:

1. Comment out the SFTP deployment step
2. Uncomment the FTP deployment step
3. Push your changes

## Verification

After deployment, check:

1. **Files uploaded**: SSH to your server and verify files exist:
   ```bash
   ls -la /path/to/vue/
   ```

2. **Website accessible**: Visit `https://your-domain.com/vue/`

3. **Check browser console**: Look for any 404 errors or CORS issues

## Troubleshooting

### Deployment fails with "Permission denied"

- Verify SSH key is added to server's `~/.ssh/authorized_keys`
- Check folder permissions on server (`chmod 755`)
- Ensure FTP user has write permissions

### Vue app shows blank page

- Check browser console for errors
- Verify the `base` URL in `vite.config.ts` matches your deployment path
- Check that `.htaccess` or nginx config is properly set up

### 404 errors on page refresh

- Ensure URL rewriting is configured (see Web Server Configuration above)
- For Apache, verify `mod_rewrite` is enabled

## Security Considerations

1. **Use SFTP over FTP** - SFTP encrypts data in transit
2. **Restrict SSH key access** - Only allow the deploy key, not password authentication
3. **Use specific deployment user** - Don't use root or your main admin account
4. **Set proper file permissions** - Files should be readable but not writable by web server

## Additional Configuration

### Custom Domain

If deploying to a subdomain (e.g., `vue.example.com`):

1. Update `vite.config.ts`:
   ```typescript
   base: '/', // Root path since it's a subdomain
   ```

2. Rebuild and deploy:
   ```bash
   npm run build
   git add -A
   git commit -m "Update base URL for subdomain"
   git push origin main-vue
   ```

### Environment-specific builds

For different environments (staging, production):

1. Create separate workflow files
2. Use different secrets for each environment
3. Deploy to different server paths

## Support

If you encounter issues:
1. Check GitHub Actions logs for deployment errors
2. Check server logs (`/var/log/apache2/error.log` or `/var/log/nginx/error.log`)
3. Verify all secrets are correctly set in GitHub
