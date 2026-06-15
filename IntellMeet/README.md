# 🚀 IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

<div align="center">

![IntellMeet](https://img.shields.io/badge/IntellMeet-AI%20Meeting%20Platform-6366f1?style=for-the-badge)
![MERN](https://img.shields.io/badge/Stack-MERN-10b981?style=for-the-badge)
![WebRTC](https://img.shields.io/badge/Video-WebRTC-f59e0b?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge)

**Transform meetings into actionable outcomes with AI-powered transcription, summaries, and collaboration tools.**

[Live Demo](#live-demo) • [Features](#features) • [Tech Stack](#tech-stack) • [Setup](#setup) • [API Reference](#api)

</div>

---

## 📋 Overview

IntellMeet is a production-grade enterprise meeting and collaboration platform built using the **MERN stack** (MongoDB, Express, React, Node.js). It provides real-time video conferencing, AI-generated meeting summaries, automatic transcription, smart action item extraction, and collaborative team workspaces.

### 🎯 Target Users
- Remote & hybrid enterprise teams
- Project managers needing meeting accountability
- Organizations seeking to reduce meeting overhead

### 💼 Business Value
- **Save 30%+ time** with AI-generated summaries and action items
- **Never miss action items** with automatic extraction and assignment
- **Boost accountability** with tracked tasks and analytics
- **Enterprise security** with JWT auth, rate limiting, and encryption

---

## ✨ Features

| ID | Feature | Description | Status |
|----|---------|-------------|--------|
| F01 | **User Authentication** | JWT-based signup/login, role-based access (Admin/Member) | ✅ |
| F02 | **Video Meetings** | WebRTC video conferencing, screen sharing, recording | ✅ |
| F03 | **AI Intelligence** | GPT-4o transcription, summaries, action item extraction | ✅ |
| F04 | **Real-Time Chat** | In-meeting chat via Socket.io, typing indicators | ✅ |
| F05 | **Post-Meeting Dashboard** | Meeting history, summaries, action items tracking | ✅ |
| F06 | **Team Management** | Team workspaces, Kanban boards, task assignment | ✅ |
| F07 | **Analytics** | Meeting frequency, productivity metrics, charts | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 19 + TypeScript + Vite | Fast HMR, latest React features |
| **Styling** | Tailwind CSS v4 | Modern utility-first CSS |
| **State** | Zustand + TanStack Query | Lightweight client + server state |
| **Backend** | Node.js + Express + TypeScript | Scalable, fast API server |
| **Database** | MongoDB + Mongoose | Flexible document schemas |
| **Real-Time** | Socket.io + WebRTC | Video + bidirectional communication |
| **AI** | OpenAI GPT-4o | Meeting summarization & transcription |
| **Auth** | JWT + bcrypt | Secure stateless authentication |
| **Cache** | Redis | Session management |
| **Charts** | Recharts | React-native data visualization |

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** >= 20.x
- **MongoDB** (local or Atlas)
- **Redis** (optional, for caching)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/intellmeet.git
cd intellmeet

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and (optionally) OpenAI API key

# 4. Seed demo data
npm run seed

# 5. Start development servers
npm run dev
```

**Frontend:** http://localhost:5173  
**Backend:** http://localhost:5000

### Demo Credentials
```
Email: demo@intellmeet.com
Password: Demo@123
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/meetings` | Create meeting |
| GET | `/api/meetings` | List meetings |
| POST | `/api/meetings/join/:roomId` | Join meeting |
| PUT | `/api/meetings/:id/end` | End meeting |
| GET | `/api/meetings/dashboard` | Dashboard stats |

### Teams & Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspace/teams` | Create team |
| GET | `/api/workspace/teams` | List teams |
| POST | `/api/workspace/tasks` | Create task |
| PUT | `/api/workspace/tasks/:id` | Update task |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/summarize` | Generate meeting summary |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                   │
│  Landing │ Auth │ Dashboard │ Meeting │ Teams │ Stats │
├─────────────────────────────────────────────────────┤
│              WebRTC (P2P Video/Audio)                 │
├─────────────────────────────────────────────────────┤
│           Socket.io (Signaling + Chat)                │
├─────────────────────────────────────────────────────┤
│              Backend (Express + Node.js)              │
│  Auth │ Meetings │ Teams │ Tasks │ AI │ Analytics     │
├─────────────────────────────────────────────────────┤
│     MongoDB          │     Redis     │   OpenAI API   │
└─────────────────────────────────────────────────────┘
```

---

## 🔒 Security Measures

- **JWT Authentication** with access/refresh token strategy
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** (200 req/15min per IP)
- **CORS** configured for specific origins
- **Helmet** security headers
- **Input Validation** with Zod schemas
- **HTTP-Only Cookies** for refresh tokens
- **WebRTC DTLS/SRTP** encryption for media

---

## 👤 Author

**Ayush** — Zidio Development Internship (March 2026)

---

## 📄 License

This project is licensed under the MIT License.
