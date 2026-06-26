====================================================
  Church Management System - Sunday School
====================================================

REQUIREMENTS
------------
- Node.js (LTS version)
  Download from: https://nodejs.org/en/download

HOW TO RUN
----------
1. Install Node.js if not already installed (see above)
2. Double-click "start.bat"
3. Wait for it to install and start (first run takes longer)
4. Open your browser and go to: http://localhost:5000

FIRST TIME SETUP
----------------
- Click "Create account" on the login page
- The FIRST account created will have demo data loaded
  automatically (so you can show clients how it works)
- Every account after that starts empty and private

USER DATA
---------
- All data is saved locally in the "data\" folder
- Each user account has its own folder: data\users\{id}\
- Users list: data\users.json
- No internet connection or external database needed

STOPPING THE APP
----------------
- Press Ctrl+C in the black command window, then close it
- Or just close the command window directly

NOTES
-----
- The app runs on port 5000 by default
- Data is stored as JSON files - you can back them up
  by copying the "data\" folder
- To reset all data, delete the "data\" folder and restart
