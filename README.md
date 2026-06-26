# ⛪ Church Connect

A lightweight church management system for tracking **members, attendance, and offerings** organized by Class and Section. Built with **Node.js and Express** — runs locally on your network with no internet required.

---

## 🚀 Features

* 👥 Member management organized by Class and Section
* 📅 Attendance tracking with date-wise records
* 💰 Offerings recording per member
* 📊 Dashboard with charts and filters
* 🌙 Dark / Light mode support
* 🖥️ Easy server startup using `run.bat`
* 📱 Accessible from phones and tablets on the same WiFi

---

## 🛠️ Technologies Used

* **Node.js**
* **Express.js**
* **React**
* **Passport.js** (local authentication)
* **Recharts** (dashboard charts)
* **Tailwind CSS**

---

## 📂 Project Structure

```text
church-connect/
├── 📁 client/
│   └── 📁 src/
│       ├── 📁 pages/
│       │   ├── 📄 Login.tsx
│       │   ├── 📄 Dashboard.tsx
│       │   ├── 📄 Members.tsx
│       │   ├── 📄 Classes.tsx
│       │   ├── 📄 Attendance.tsx
│       │   ├── 📄 Reports.tsx
│       │   ├── 📄 Settings.tsx
│       │   └── 📄 not-found.tsx
│       │
│       ├── 📁 hooks/
│       │   ├── 📄 use-auth.ts
│       │   ├── 📄 use-attendance.ts
│       │   ├── 📄 use-classes.ts
│       │   ├── 📄 use-members.ts
│       │   ├── 📄 use-reports.ts
│       │   ├── 📄 use-theme.ts
│       │   └── 📄 use-toast.ts
│       │
│       ├── 📁 lib/
│       │   ├── 📄 queryClient.ts
│       │   ├── 📄 auth-utils.ts
│       │   └── 📄 utils.ts
│       │
│       ├── 📄 App.tsx
│       ├── 📄 main.tsx
│       └── 📄 index.css
│
├── 📁 server/
│   ├── 📄 index.ts
│   ├── 📄 auth.ts
│   ├── 📄 routes.ts
│   ├── 📄 fileStorage.ts
│   ├── 📄 storage.ts
│   ├── 📄 static.ts
│   └── 📄 vite.ts
│
├── 📁 shared/
│   ├── 📄 schema.ts
│   └── 📄 routes.ts
│
├── 📁 data/
│   ├── 📄 users.json
│   └── 📁 users/
│       └── 📁 sam_2323/
│           └── 📄 db.json
│
├── 📁 dist/
│   ├── 📄 index.cjs
│   └── 📁 public/
│
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.ts
├── 📄 vite.config.ts
├── 📄 drizzle.config.ts
├── 📄 components.json
├── 📄 run.bat
└── 📄 README.md
```

---

## ▶️ Running the Application

### Option 1 – Using the BAT file (Windows)

Double click:

run.bat

### Option 2 – Using Command Line

set NODE_ENV=production
set PORT=5000
set SESSION_SECRET=church2024
node dist\index.cjs

> **Note:** Node.js must be installed. Download from https://nodejs.org

---

## 🔐 Demo Login

| Username | Password |
|----------|----------|
| sam_2323 | sam@2323 |

The demo account comes with pre-loaded example data including 3 classes, 4 sections, 11 members, and attendance records.

---

## 📱 Accessing from Your Phone

1. Connect your **phone and laptop to the same WiFi network or hotspot**

2. Find your laptop IP address:

ipconfig

Look for **IPv4 Address**

Example: 192.168.43.120

3. Open your phone browser and enter:

http://192.168.43.120:5000

Now you can access Church Connect from any device on the network.

---

## 📸 Example Use Cases

* Sunday service attendance tracking
* Weekly class member management
* Offering collection records
* Section-wise reporting
* Multi-device access over local WiFi

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**Sam Wilson**

🔗 GitHub: https://github.com/rsamwilson2323-cloud
💼 LinkedIn: https://www.linkedin.com/in/sam-wilson-14b554385

---

⭐ If you found this project useful, consider giving it a **star** on GitHub!
