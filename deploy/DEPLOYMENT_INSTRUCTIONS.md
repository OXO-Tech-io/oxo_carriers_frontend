# Deployment Instructions for app.oxocareers.com

## Files to Upload

Upload the entire contents of the 'deploy' folder to your server at:
https://app.oxocareers.com/

## Upload Structure

The deploy folder contains:
- standalone/ - Next.js standalone build
- server.js - Server entry point
- package.json - Minimal dependencies
- .htaccess - LiteSpeed server configuration

## Server Setup

1. Upload all files from the 'deploy' folder to your server root
2. Install Node.js dependencies (if not already installed):
   ```bash
   npm install --production
   ```

3. Configure Node.js Application in cPanel:
   - Application Root: /public_html (or your domain directory)
   - Application URL: app.oxocareers.com
   - Application Startup File: server.js
   - Node.js Version: 18.x or higher

4. Set Environment Variables (if needed):
   - NEXT_PUBLIC_API_URL=https://your-backend-api-url/api
   - PORT=3000 (or your server's port)

5. Start the application in cPanel Node.js Selector

## Alternative: Using Standalone Server Directly

If your server supports it, you can run:
```bash
node standalone/server.js
```

## Troubleshooting

- Check Node.js logs in cPanel
- Verify all files are uploaded correctly
- Ensure file permissions are correct (644 for files, 755 for directories)
- Check that Node.js version is compatible (18.x or higher)
