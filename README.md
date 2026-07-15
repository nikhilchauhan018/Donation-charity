<div align="center">

<!--
  PROJECT BANNER
  Upload banner.png to the repository root and uncomment the image below.

  <img src="./banner.png" alt="Donation & Charity Portal Banner" width="100%" />
-->

# Donation & Charity Portal

A full-stack platform connecting Donors and NGOs to make giving simple, transparent, and impactful.

[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io&logoColor=white)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

[Live Demo](#) &nbsp;·&nbsp; [Report a Bug](#) &nbsp;·&nbsp; [Request a Feature](#)

</div>

<br/>

## Table of Contents

- [About the Project](#about-the-project)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

<br/>

## About the Project

The **Donation & Charity Portal** is a web application that bridges the gap between people who want to donate (food, clothes, books, money, etc.) and verified NGOs that distribute these donations to those in need. It provides role-based dashboards for Donors, NGOs, and Admins, real-time notifications, pickup tracking, and a public leaderboard to encourage community participation.

### Key Features

| Feature | Description |
|---|---|
| **Secure Authentication** | Email/OTP based signup and login for Donors and NGOs, with a separate secured Admin login |
| **Donation Management** | Donors create donation requests; NGOs accept, schedule pickups, and track status end-to-end |
| **Role-Based Dashboards** | Dedicated dashboards for Donors, NGOs, and Admins with real-time statistics |
| **Real-Time Notifications** | Live status updates powered by Socket.IO |
| **Leaderboard** | Recognizes top-contributing donors and NGOs |
| **NGO Blog** | NGOs can publish updates and stories about their work |
| **Content Management** | Admin-manageable homepage sliders and content |
| **Pickup Tracking** | Full visibility from donation request to completed pickup |
| **Responsive UI** | Built with Angular Material for a consistent experience across devices |

<br/>

## Screenshots

### Admin Dashboard
<p align="center">
  <img src="./admin-dashboard.png" alt="Admin Dashboard" width="900" />
</p>

### NGO Dashboard
<p align="center">
  <img src="./ngo-dashboard.png" alt="NGO Dashboard" width="900" />
</p>

### User Dashboard
<p align="center">
  <img src="./user-dashboard.png" alt="User Dashboard" width="900" />
</p>

<br/>

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18, Angular Material, RxJS, Socket.IO Client |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL |
| Real-time | Socket.IO |
| Auth | JWT, bcrypt, Email OTP verification |
| Email | Brevo Transactional Email API |
| Deployment | Netlify (Frontend), Render (Backend), Hostinger (MySQL) |

<br/>

## Project Structure

```text
Donation-charity/
├── frontend/                  # Angular application
│   └── src/app/
│       ├── auth/               # Donor/NGO login, signup, OTP verification
│       ├── admin/               # Admin login, register, dashboard
│       ├── donor/               # Donor dashboard, contributions, donation list
│       ├── ngo/                 # NGO dashboard, requests, blog management
│       ├── pages/               # Static pages (about, blog, 404)
│       ├── shared/              # Shared header, notification bell, etc.
│       └── services/            # API, auth, and socket services
│
└── backend/                   # Express + TypeScript API
    └── src/
        ├── controllers/        # Route handlers
        ├── routes/             # Express route definitions
        ├── models/             # Data models
        ├── services/           # Business logic
        ├── middleware/         # Auth, role, error handling
        ├── utils/              # JWT, email, OTP, logging utilities
        ├── socket/             # Socket.IO server setup
        └── config/             # Environment and MySQL configuration
```

<br/>

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm
- A MySQL database (local or hosted — e.g. [Hostinger](https://www.hostinger.com/), [PlanetScale](https://planetscale.com/))
- A [Brevo](https://www.brevo.com/) account for sending transactional (OTP) emails

### 1. Clone the repository

```bash
git clone https://github.com/nikhilchauhan018/Donation-charity.git
cd Donation-charity
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` with the following variables:

```env
# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:4200

# Auth
JWT_SECRET=your_jwt_secret
ADMIN_SECURITY_CODE=your_admin_security_code

# MySQL
MYSQL_HOST=your_mysql_host
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=your_mysql_database

# Email (Brevo API)
BREVO_API_KEY=your_brevo_api_key
SMTP_FROM=Your App Name <your_verified_sender@email.com>
```

Run the backend:

```bash
npm run dev       # development (with hot reload)
npm run build     # compile TypeScript
npm start         # run the compiled build
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm start
```

The application will be available at `http://localhost:4200`, with the API running at `http://localhost:4000`.

<br/>

## Deployment

This project is designed to run across three free/low-cost services:

| Service | Used For |
|---|---|
| Netlify | Hosting the Angular frontend |
| Render | Hosting the Node.js/Express backend |
| Hostinger | Hosting the MySQL database |

> **Note:** Render's free tier blocks outbound SMTP ports (25, 465, 587). This project sends OTP emails through [Brevo's HTTP API](https://developers.brevo.com/) instead of traditional SMTP, so email delivery works reliably even on free hosting tiers.

Ensure `FRONTEND_URL` on the backend exactly matches your deployed frontend URL, with no trailing slash, to avoid CORS errors.

<br/>

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the backend server runs on |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Deployed frontend URL, used for CORS |
| `JWT_SECRET` | Secret key used to sign JWT tokens |
| `ADMIN_SECURITY_CODE` | Security code required for admin registration |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | MySQL connection details |
| `BREVO_API_KEY` | API key from your Brevo account, used to send OTP emails |
| `SMTP_FROM` | Sender name and email shown on outgoing emails (must be a verified sender in Brevo) |

<br/>

## Contributing

Contributions are welcome. To contribute:

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m "Add some AmazingFeature"`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

<br/>

## License

Distributed under the MIT License. See `LICENSE` for more information.

<br/>

## Author

**Nikhil Chauhan**
[GitHub — @nikhilchauhan018](https://github.com/nikhilchauhan018)

<div align="center">
<sub>Built to make giving easier.</sub>
</div>
