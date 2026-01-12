# Flager - Social Media Platform

A modern full-stack social media application built with React TypeScript (frontend) and Express TypeScript (backend).

## 🚀 Tech Stack

### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Server State**: React Query (TanStack Query)
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Routing**: React Router v6

### Backend

- **Framework**: Express + TypeScript
- **Real-time**: Socket.IO
- **Databases**:
  - MongoDB Atlas (main database)
  - Redis Cloud (caching, sessions)
  - Neo4j Cloud (friend relationships graph)
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
Flager-project/
├── frontend/          # React TypeScript frontend
├── backend/           # Express TypeScript backend
└── shared/            # Shared types and constants
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- MongoDB Atlas account
- Redis Cloud account
- Neo4j Cloud account

### Installation

1. **Clone and navigate to project**

```bash
cd Flager-project
```

2. **Install Frontend Dependencies**

```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**

```bash
cd ../backend
npm install
```

4. **Configure Environment Variables**

Edit `backend/.env.development` with your database credentials:

- MongoDB URI
- Redis host, port, password
- Neo4j URI, username, password
- JWT secrets

5. **Run Development Servers**

Terminal 1 (Backend):

```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):

```bash
cd frontend
npm run dev
```

## 🌐 Access

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api/v1
- **Health Check**: http://localhost:5000/health

## 📚 Features

- ✅ User Authentication (JWT)
- ✅ Real-time Chat (Socket.IO)
- ✅ Friend System (Neo4j Graph)
- ✅ Posts & Feed
- ✅ Notifications
- ✅ File Upload

## 🔧 Development

### Frontend Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

### Backend Scripts

```bash
npm run dev      # Start dev server with nodemon
npm run build    # Compile TypeScript
npm start        # Run production build
npm run lint     # Run ESLint
```

## 📖 Documentation

For detailed documentation, see:

- Project structure and architecture
- API endpoints
- Database schemas
- Socket.IO events

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT License

---

**Built with ❤️ using React, Express, and TypeScript**
