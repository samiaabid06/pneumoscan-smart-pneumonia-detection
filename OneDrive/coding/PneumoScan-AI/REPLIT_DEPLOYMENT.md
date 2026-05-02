# PneumoScan AI — Replit Deployment Guide

## ✅ Free Hosting on Replit

Deploy PneumoScan AI on **Replit** — completely free with automatic hosting!

**What You Get:**
- ✓ Free hosting (always running)
- ✓ Auto-deploy from GitHub
- ✓ Built-in database support
- ✓ No credit card required
- ✓ Public URL for sharing
- ✓ Collaborative editing

---

## Step 1: Prepare Your GitHub Repository

### Verify Your Repository

Your repository is at:
```
https://github.com/samiaabid06/PneumoScan-Smart-Pneumonia-Detection
```

Ensure all project files are pushed to GitHub:

```bash
# In your project directory
git status
git add .
git commit -m "Deploy to Replit"
git push origin main
```

**Files needed in GitHub:**
- ✓ `app_prod.py` (main application)
- ✓ `config.py` (configuration)
- ✓ `models.py` (database models)
- ✓ `.replit` (Replit config)
- ✓ `replit.nix` (dependencies)
- ✓ `requirements.txt` (Python packages)
- ✓ `app/` folder (templates, static files)
- ✓ `models/` folder (ML model)
- ✓ `.env.example` (environment template)

---

## Step 2: Create Replit Project from GitHub

### Quick Import

1. **Go to Replit:** https://replit.com

2. **Click "Create"** → **"Import from GitHub"**

3. **Paste your GitHub URL:**
   ```
   https://github.com/samiaabid06/PneumoScan-Smart-Pneumonia-Detection
   ```

4. **Click "Import from GitHub"**

5. **Wait for Replit to clone and setup** (2-3 minutes)

### Alternative: Manual Setup

If import doesn't work:

1. Go to https://replit.com/create
2. Select **Python**
3. Name it `PneumoScan-AI`
4. In the Shell tab, run:
   ```bash
   git clone https://github.com/samiaabid06/PneumoScan-Smart-Pneumonia-Detection.git .
   pip install -r requirements.txt
   ```

---

## Step 3: Configure Environment Variables

### In Replit Dashboard

1. **Click "Secrets"** (lock icon) in left sidebar
2. **Add these secrets:**

| Key | Value |
|-----|-------|
| `FLASK_ENV` | `production` |
| `FLASK_DEBUG` | `False` |
| `SECRET_KEY` | (generate below) |
| `DATABASE_URL` | `sqlite:///pneumoscan.db` |
| `DEMO_MODE` | `False` |
| `USE_CUDA` | `False` |
| `CORS_ORIGINS` | Your Replit URL (added after deployment) |

### Generate a Secure SECRET_KEY

Click "Shell" tab and run:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Copy the output and add as `SECRET_KEY` secret.

---

## Step 4: Optimize for Replit's Limited Resources

Replit free tier has limited RAM/CPU. Make these adjustments:

### Edit `.env.example` in Replit editor

```env
# Reduce resource usage
DEMO_MODE=True              # Use demo mode (no GPU)
USE_CUDA=False              # Disable GPU
MAX_FILE_SIZE=5242880       # Reduce to 5MB (from 16MB)
WORKERS=1                   # Single worker
LOG_LEVEL=WARNING           # Reduce logging
```

### Edit `app_prod.py`

Find this line (around line 70):
```python
use_cuda = app.config['USE_CUDA']
```

Change to:
```python
use_cuda = False  # Force CPU for Replit
```

---

## Step 5: Run the Application

### In Replit Shell

```bash
# Install dependencies (if not already done)
pip install -r requirements.txt

# Initialize database
python3 -c "from app_prod import app; from models import init_db; init_db(app)"

# Start the app
python3 app_prod.py
```

### Or Click "Run" Button

Replit automatically runs the command in `.replit` file.

**Output:**
```
 * Running on http://0.0.0.0:5000
 * Replit detected...
 * Your app is running at https://yourname-pneumoscansmart.replit.dev
```

---

## Step 6: Get Your Public URL

Once running, you'll see a message like:

```
Your app is running at: https://YourUsername-PneumoScan-AI.replit.dev
```

**Share this URL to access your app publicly!**

---

## Step 7: Update CORS for Your Replit URL

In Replit Secrets, update:

```
CORS_ORIGINS=https://YourUsername-PneumoScan-AI.replit.dev,http://localhost:5000
```

---

## Testing Your Deployment

### Health Check

```bash
curl https://YourUsername-PneumoScan-AI.replit.dev/health
```

Response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "database": "connected"
}
```

### Test Prediction

1. Open https://YourUsername-PneumoScan-AI.replit.dev
2. Fill in patient form
3. Upload chest X-ray image
4. Click "Analyze"
5. See prediction results

### Check Database

In Replit Shell:
```bash
sqlite3 pneumoscan.db "SELECT COUNT(*) FROM predictions;"
```

---

## Features on Replit

| Feature | Included |
|---------|----------|
| Always-on Hosting | ✓ Free |
| Public URL | ✓ Yes |
| Database (SQLite) | ✓ Yes |
| File Storage | ✓ Up to 1GB |
| Uptime | ~99% (reboots periodically) |
| SSL/HTTPS | ✓ Yes |
| Collaboration | ✓ Live shared editing |

---

## Troubleshooting

### App Won't Start

**Check Replit Shell:**
```bash
python3 app_prod.py
```

Look for error messages. Common issues:

1. **Missing dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Python version issue:**
   ```bash
   python3 --version  # Should be 3.9+
   ```

3. **Port already in use:**
   - Click "Stop" button
   - Wait 30 seconds
   - Click "Run" again

### Database Issues

**Reset database:**
```bash
rm pneumoscan.db
python3 -c "from app_prod import app; from models import init_db; init_db(app)"
```

### Out of Memory

Replit may kill process if using too much RAM:

1. Enable DEMO_MODE in Secrets:
   ```
   DEMO_MODE=True
   ```
2. Restart server

### Static Files Not Loading

Ensure all files exist:
```bash
ls -la app/static/
ls -la app/templates/
```

---

## Keep Your App Running

Replit free tier may put idle repls to sleep. To keep running:

### Option 1: Use Uptimebot (FREE)

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Create monitor: `https://YourUsername-PneumoScan-AI.replit.dev/health`
4. Set interval: every 5 minutes
5. Repl stays awake!

### Option 2: Enable Always On (PAID)

Replit Plus subscription:
- $7/month for always-on hosting
- Better performance
- More storage

### Option 3: Manual Heartbeat

Add to `.replit` to wake up periodically:

```bash
# Add to crontab via Shell
echo "0 * * * * curl https://YourUsername-PneumoScan-AI.replit.dev/health" | crontab -
```

---

## Sharing Your App

### Public Sharing

1. Copy your Replit URL
2. Share anywhere:
   - Email
   - Social media
   - Portfolio website
   - GitHub README

### Embed in Website

Add to your website's HTML:
```html
<iframe 
  src="https://YourUsername-PneumoScan-AI.replit.dev" 
  style="width:100%;height:800px;border:none;">
</iframe>
```

### GitHub README Badge

Add to your README.md:
```markdown
[![Run on Replit](https://replit.com/badge/github/samiaabid06/PneumoScan-Smart-Pneumonia-Detection)](https://replit.com/@YourUsername/PneumoScan-AI?v=1)
```

---

## Advanced Features

### Persistent Storage

Replit stores files permanently. Your database (`pneumoscan.db`) persists across restarts.

### Database Backup

```bash
# Download database
# (Use Replit Files tab → pneumoscan.db → Download)
```

### View Logs

In Replit Shell:
```bash
tail -f logs/pneumoscan.log
```

### Monitor Resources

```bash
top
free -h
df -h
```

---

## Upgrade to Better Performance

When ready for more users, upgrade to:

### Replit Plus
- Always-on hosting
- 10GB storage
- Better CPU/RAM
- $7/month

### Or switch to Railway.app (recommended)
- **Free tier:** 5GB storage, $5/month credit
- Better for production
- PostgreSQL database included
- Zero-config deployment

See `RAILWAY_DEPLOYMENT.md` for Railway setup.

---

## Next Steps

### Immediate (Today)
1. ✓ Push code to GitHub
2. ✓ Import to Replit
3. ✓ Set environment variables
4. ✓ Run application
5. ✓ Get public URL
6. ✓ Test endpoints

### Short-term (This week)
- [ ] Set up uptimebot to keep app alive
- [ ] Share public URL with others
- [ ] Collect feedback
- [ ] Monitor logs for errors

### Long-term (Next month)
- [ ] Consider Replit Plus or Railway for better uptime
- [ ] Implement database backups
- [ ] Add authentication system
- [ ] Scale to handle more users

---

## Support

### Replit Docs
- https://docs.replit.com
- https://docs.replit.com/hosting/deploying-http-servers

### PneumoScan Issues
- Check `logs/pneumoscan.log` in Replit Shell
- Review `DEPLOYMENT_GUIDE.md` for general help

### Need Help?
- Join Replit Community: https://replit.com/community
- Check GitHub Issues: Your repo's Issues tab

---

## Summary

**Your app is now online!**

| Component | Status |
|-----------|--------|
| Code | ✓ On GitHub |
| Hosting | ✓ On Replit |
| Database | ✓ SQLite |
| SSL/HTTPS | ✓ Automatic |
| URL | ✓ Public |

**Access at:** `https://YourUsername-PneumoScan-AI.replit.dev`

**Share the link with anyone!** No installation needed. 🎉

---

## Comparison: Free Hosting Options

| Platform | Free Tier | Uptime | Bandwidth | Best For |
|----------|-----------|--------|-----------|----------|
| **Replit** | Yes | 99% | Unlimited | Quick sharing, learning |
| **Railway** | $5 credit | 99.5% | High | Small projects |
| **Render** | Yes | 95% | Limited | Side projects |
| **Fly.io** | 3 GB/month | 99.9% | 160GB | Serious projects |
| **Heroku** | Removed | — | — | Deprecated |

**Recommendation:** Start with Replit for free. Upgrade to Railway when you need better uptime.

---

**Congratulations! Your PneumoScan AI is live on the internet!** 🚀
