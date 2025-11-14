# Soochna Sahayak - Setup & Ngrok Deployment Guide

## 🚀 Quick Start

### Step 1: Save the Logo
1. Save your **Soochna Sahayak logo image** as `logo.png` in the project root folder
2. The logo should be the circular emblem with the police cap that you provided

### Step 2: Install Dependencies
Open PowerShell or Command Prompt in the project folder and run:
```bash
npm install
```

This will install:
- bcryptjs (password hashing)
- express-session (session management)
- All other required dependencies

### Step 3: Start with Ngrok
Simply **double-click** the `start-with-ngrok.bat` file!

This will:
- ✅ Configure ngrok with your authtoken
- ✅ Install any missing dependencies
- ✅ Start the Node.js server on port 3000
- ✅ Open ngrok tunnel for public access

### Step 4: Get Your Public URL
1. The ngrok window will show your public URL
2. Look for the line that says: `Forwarding https://xxxx.ngrok.io -> http://localhost:3000`
3. Copy the **https://xxxx.ngrok.io** URL
4. Share this URL with anyone - they can access your app from anywhere!

---

## 🌐 How Ngrok Works

### What Ngrok Does
- Creates a secure tunnel from the internet to your local server
- Provides a public HTTPS URL that anyone can access
- All requests go through ngrok to your computer
- **All data is saved on YOUR computer** in the `/data` and `/uploads` folders

### Data Persistence
✅ **All data is saved locally**:
- User accounts → `data/users.json`
- FIR cases → `data/cases.json`
- Transcriptions → `data/transcriptions.json`
- File metadata → `data/files.json`
- Uploaded files → `uploads/` folder

✅ **Everyone accessing your ngrok URL shares the same data**:
- One person creates a case → Everyone can see it
- One person uploads a file → Everyone can access it
- Users register once → Their accounts persist

---

## 👤 Authentication System

### New Features
✅ **Real User Registration**
- No more demo credentials!
- Users must sign up with:
  - Full Name
  - Email (unique)
  - Password (hashed with bcrypt)
  - Designation (Inspector, Sub-Inspector, etc.)
  - Police Station
  - Badge Number (optional)

✅ **Secure Login**
- Passwords are hashed (never stored in plain text)
- Sessions last 7 days
- Remember me functionality
- Automatic redirect if not logged in

✅ **Session Management**
- Server-side sessions using express-session
- Automatic authentication check on page load
- Secure logout that clears session

---

## 🎨 Logo Integration

The logo appears in:
1. **Login Page** - Circular logo at top (120px)
2. **Dashboard Sidebar** - Circular logo (80px)
3. **Styled with**:
   - Circular border-radius
   - White background
   - Proper padding
   - Shadow effects
   - No cropping (object-fit: contain)

---

## 📡 Using the Application

### First Time Setup
1. Run `start-with-ngrok.bat`
2. Note your ngrok URL from the console
3. Open the URL in your browser
4. Click "Sign Up" tab
5. Create your first admin account

### Sharing with Others
1. Give them your ngrok URL
2. They create their own accounts
3. Everyone sees the same FIRs, files, and data
4. Data persists even if you restart the server

### Keeping It Running
- Keep both windows open (server & ngrok)
- Don't close your computer or the windows
- Ngrok free tier: URL changes each time you restart
- To get a permanent URL: Upgrade ngrok to paid plan

---

## 🔧 Manual Start (Without Batch File)

If you prefer manual control:

### Terminal 1: Start Server
```bash
node server.js
```

### Terminal 2: Start Ngrok
```bash
ngrok http 3000
```

---

## 🛠️ Troubleshooting

### "Cannot find module 'bcryptjs'"
Run: `npm install`

### "Logo not showing"
- Ensure `logo.png` exists in the project root
- Check the file name is exactly `logo.png`

### "Ngrok command not found"
- Ngrok should be installed globally
- Try: `npm install -g ngrok`

### "Session not persisting"
- Clear browser cookies
- Try in incognito/private mode

### "Users can't access my URL"
- Ensure both server and ngrok windows are running
- Check firewall settings
- Verify you're sharing the HTTPS ngrok URL (not http://localhost)

---

## 📊 Features Summary

✅ **Authentication**
- User registration
- Secure login (bcrypt password hashing)
- Session management
- Remember me functionality

✅ **FIR Management**
- Create, read, update, delete FIRs
- Evidence file attachments
- Status tracking
- Police station assignment

✅ **File Manager**
- Upload files to folders
- Folder navigation with back button
- Move files between folders
- Rename, delete files
- Support for audio, video, images, documents

✅ **Transcription Editor**
- Load audio files
- Advanced audio editing (crop, fade, normalize, etc.)
- Bhashini ASR integration
- Save to file manager or link to FIR

✅ **Analytics**
- Crime statistics charts
- Case status distribution
- Police station comparison

---

## 🌍 Production Deployment

For permanent public access:

### Option 1: Ngrok Paid Plan
- Get a fixed URL
- No session limits
- Better performance

### Option 2: Cloud Hosting
Deploy to:
- Heroku
- AWS EC2
- DigitalOcean
- Azure
- Google Cloud

---

## 📞 Support

If you encounter issues:
1. Check the server console for errors
2. Check the ngrok console for connection issues
3. Verify all dependencies are installed
4. Ensure logo.png exists in project root

---

## 🎉 Ready to Go!

Your Soochna Sahayak system is now fully configured with:
✅ Professional authentication
✅ Beautiful logo integration
✅ Ngrok public access
✅ Complete data persistence

**Just run `start-with-ngrok.bat` and share your URL!**
