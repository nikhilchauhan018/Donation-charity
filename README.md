<div align="center">

<!--
  🖼️ PROJECT BANNER
  Upload banner.png to the repository root and uncomment the image below.

  <img src="./banner.png" alt="Donation & Charity Portal Banner" width="100%" />
-->

# 🤝 Donation & Charity Portal

A full-stack platform connecting **Donors** and **NGOs** to make giving simple, transparent, and impactful.

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

[Live Demo](#) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## 📖 About The Project

The **Donation & Charity Portal** is a web application that bridges the gap between people who want to donate (food, clothes, books, money, etc.) and verified NGOs that distribute these donations to those in need. It provides role-based dashboards for **Donors**, **NGOs**, and **Admins**, real-time notifications, pickup tracking, and a public leaderboard to encourage community participation.

### ✨ Key Features

- 🔐 **Secure Authentication** — Email/OTP based signup & login for Donors and NGOs, separate secured Admin login
- 🎁 **Donation Management** — Donors can create donation requests; NGOs can accept, schedule pickups, and track status
- 📊 **Role-Based Dashboards** — Dedicated dashboards for Donors, NGOs, and Admins with real-time stats
- 🔔 **Real-Time Notifications** — Live updates using Socket.IO whenever a donation status changes
- 🏆 **Leaderboard** — Recognizes top-contributing donors and NGOs
- 📝 **NGO Blog** — NGOs can publish updates and stories about their work
- 🖼️ **Homepage Sliders & Content Management** — Admin-manageable homepage content
- 📍 **Pickup Tracking** — Track donation pickups from request to completion
- 📱 **Fully Responsive** — Built with Angular Material for a clean experience on any device

---

## 📸 Dashboard Screenshots

### Admin Dashboard

<p align="center">
  <img
    src="./admin-dashboard.png"
    alt="Admin Dashboard"
    width="900"
  />
</p>

### NGO Dashboard

<p align="center">
  <img
    src="./ngo-dashboard.png"
    alt="NGO Dashboard"
    width="900"
  />
</p>

### User Dashboard

<p align="center">
  <img
    src="./user-dashboard.png"
    alt="User Dashboard"
    width="900"
  />
</p>

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Angular 18, Angular Material, RxJS, Socket.IO Client |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | MySQL |
| **Real-time** | Socket.IO |
| **Auth** | JWT, bcrypt, Email OTP verification |
| **Email** | Brevo (Transactional Email API) |
| **Deployment** | Netlify (Frontend) · Render (Backend) · Hostinger (MySQL) |

---

## 📁 Project Structure

```text
Donation-charity/
├── frontend/                  # Angular application
│   └── src/app/
│       ├── auth/              # Donor/NGO login, signup, OTP verification
│       ├── admin/             # Admin login, register, dashboard
│       ├── donor/             # Donor dashboard, contributions, donation list
│       ├── ngo/               # NGO dashboard, requests, blog management
│       ├── pages/             # Static pages (about, blog, 404)
│       ├── shared/            # Shared header, notification bell, etc.
│       └── services/          # API, auth, and socket services
│
└── backend/                   # Express + TypeScript API
    └── src/
        ├── controllers/       # Route handlers
        ├── routes/            # Express route definitions
        ├── models/            # Data models
        ├── services/          # Business logic
        ├── middleware/        # Auth, role, error handling
        ├── utils/             # JWT, email, OTP, logging utilities
        ├── socket/            # Socket.IO server setup
        └── config/            # Environment and MySQL configuration
