# ⛪ Church Connect — Smart Church Management System

> **Manage members. Track attendance. Record offerings.**
> A lightweight Church Management System built with **Node.js, Express, React, and Tailwind CSS**. Works completely offline on your local network with secure authentication and a modern dashboard.

---

# ✨ Features

👥 **Member Management**

* Organize members by **Class** and **Section**
* Add, edit, delete, and search members
* Easy profile management

📅 **Attendance Tracking**

* Record attendance date-wise
* View attendance history
* Filter by class and section
* Quick attendance reports

💰 **Offering Management**

* Record member offerings
* View contribution history
* Easy financial tracking

📊 **Dashboard**

* Interactive charts
* Attendance statistics
* Member summaries
* Quick filters

🌙 **Modern Interface**

* Dark & Light Theme
* Responsive UI
* Mobile Friendly
* Clean Dashboard Design

🌐 **Local Network Access**

* Access from laptops, phones and tablets
* No internet required
* Runs completely on your own network

---

# 📂 Project Structure

```text
church-connect/
│
├── dist/
│   ├── index.cjs
│   └── public/
│
├── data/
│   ├── users.json
│   └── users/
│       └── sam_2323/
│           └── db.json
│
├── run.bat
└── README.md
```

The database is stored locally in JSON format, making the application lightweight and easy to deploy.

---

# ⚙️ Installation

### 1️⃣ Clone Repository

```bash
git clone https://github.com/rsamwilson2323-cloud/church-connect.git

cd church-connect
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Start the Server

Windows users can simply double-click

```text
run.bat
```

or run manually

```bash
set NODE_ENV=production
set PORT=5000
set SESSION_SECRET=church2024

node dist\index.cjs
```

---

# 📦 Technologies Used

| Technology   | Purpose             |
| ------------ | ------------------- |
| Node.js      | Runtime Environment |
| Express.js   | Backend Framework   |
| React        | Frontend UI         |
| Passport.js  | User Authentication |
| Tailwind CSS | Responsive Styling  |
| Recharts     | Dashboard Analytics |

---

# 🔐 Demo Login

| Username | Password |
| -------- | -------- |
| sam_2323 | sam@2323 |

The demo account includes

* ✅ 3 Classes
* ✅ 4 Sections
* ✅ 11 Members
* ✅ Attendance Records
* ✅ Offering Records
* ✅ Dashboard Analytics

---

# 📱 Access From Your Phone

### Same WiFi Network

1. Connect your laptop and phone to the same WiFi or hotspot.

2. Find your laptop IP

```bash
ipconfig
```

Example

```text
IPv4 Address : 192.168.43.120
```

3. Open

```text
http://192.168.43.120:5000
```

Now Church Connect is available on any device connected to the same network.

---

# 🖥️ How It Works

```text
Member
    │
    ▼
Church Connect Server
(Node.js + Express)
    │
    ├──────── Attendance
    │
    ├──────── Members
    │
    ├──────── Offerings
    │
    └──────── Dashboard
            │
            ▼
     Phone • Laptop • Tablet
```

React provides the user interface while Express handles all server operations. Data is securely stored in local JSON files for fast offline access.

---

# 🧠 Key Technical Details

| Feature           | Implementation             |
| ----------------- | -------------------------- |
| Authentication    | Passport.js Local Strategy |
| Database          | JSON Storage               |
| Dashboard         | Recharts                   |
| UI                | React + Tailwind CSS       |
| Backend           | Express.js                 |
| Responsive Design | Mobile & Desktop           |
| Theme             | Dark / Light Mode          |
| Network           | Local LAN Access           |

---

# 📸 Example Use Cases

* ⛪ Sunday Service Attendance
* 👥 Church Member Directory
* 💰 Weekly Offering Records
* 📊 Attendance Reports
* 📋 Section-wise Management
* 📱 Multi-device Access

---

# ⚠️ Important Notes

* No internet connection is required.
* Works entirely on your local network.
* Data remains stored locally.
* Accessible from phones, tablets, and computers.
* Lightweight and easy to deploy.

---

# 🚀 Future Improvements

📧 Email Notifications

📄 PDF Report Generation

☁ Cloud Backup

📱 Android & iOS App

🔔 Event & Meeting Reminders

👨‍👩‍👧 Family Management

📊 Advanced Analytics

🗓️ Event Calendar

---

# ⚠️ Disclaimer

This project is developed for **church administration, educational purposes, and small to medium congregations**. It is intended to simplify member management, attendance tracking, and offering records while operating entirely within a local network.

---

# 👨‍💻 Author

**Sam Wilson**

🌐 GitHub — https://github.com/rsamwilson2323-cloud

💼 LinkedIn — https://www.linkedin.com/in/sam-wilson-14b554385

---

# 📜 License

This project is licensed under the **MIT License**.

---

<div align="center">

## ⭐ If you found this project helpful, don't forget to leave a Star!

### ⛪ Church Connect — Bringing Church Administration into the Digital Age.

Made with ❤️ by **Sam Wilson**

</div>
