# GitHub Secrets Setup for cPanel FTP Deployment

This guide will help you add the necessary secrets to your GitHub repository for automatic FTP deployment to cPanel.

## Steps to Add Secrets:

### 1. Go to Your GitHub Repository Settings
1. Open your repository: https://github.com/TheophilusChinomona/acbf-org
2. Click on **Settings** (top menu)
3. In the left sidebar, click on **Secrets and variables** → **Actions**

### 2. Add Each Secret

Click **New repository secret** and add each of the following:

#### Secret 1: FTP_SERVER
- **Name**: `FTP_SERVER`
- **Value**: `ftp.executus-ent.co.za`
- Click **Add secret**

#### Secret 2: FTP_USERNAME
- **Name**: `FTP_USERNAME`
- **Value**: `dev@dev.acbf.org.za`
- Click **Add secret**

#### Secret 3: FTP_PASSWORD
- **Name**: `FTP_PASSWORD`
- **Value**: `[Your FTP password - type it in yourself]`
- Click **Add secret**

#### Secret 4: FTP_REMOTE_PATH
- **Name**: `FTP_REMOTE_PATH`
- **Value**: `/home/executu1/public_html/dev.acbf.org.za`
- Click **Add secret**

## Verification

After adding all 4 secrets, go back to **Secrets and variables** → **Actions** and you should see:
- ✅ FTP_SERVER
- ✅ FTP_USERNAME
- ✅ FTP_PASSWORD
- ✅ FTP_REMOTE_PATH

## How It Works

Once secrets are added, the GitHub Actions workflows will:

1. **Auto-Deploy (on push to main)**:
   - Automatically runs when you push to main
   - Builds your React app
   - Deploys to cPanel via FTP

2. **Manual-Deploy (on-demand)**:
   - Trigger from GitHub Actions tab
   - Select which branch to deploy
   - Builds and deploys to cPanel

## Testing

To test if everything is working:

1. Make a small change to your code
2. Push to main: `git push origin main`
3. Go to GitHub → **Actions** tab
4. Watch the **Auto Deploy Main to cPanel** workflow run
5. Check your cPanel to verify files were uploaded

## Troubleshooting

If the deployment fails, check the GitHub Actions logs:
1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the **Deploy to cPanel via FTP** step
4. Look for error messages

Common issues:
- **Connection refused**: Check FTP credentials and server address
- **Permission denied**: Ensure FTP user has write permissions to the remote path
- **Timeout**: cPanel server may be slow; check manually if files were uploaded

## Security Notes

- Secrets are encrypted and never displayed in logs
- Only use this FTP account for deployments
- Consider changing the FTP password after initial setup if desired
