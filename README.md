# Eyewear E-Commerce Backend API

A comprehensive backend system for an eyewear e-commerce system built with Express and TypeScript. This system supports both customer-facing features and admin management with role-based access control, payment integration, AI-powered recommendations, and real-time features.

## 🚀 Tech Stack

### Core Framework
- **Runtime**: Node.js >= 18.x
- **Framework**: Express 5.1.0 + TypeScript
- **API Version**: v1 (configurable)

### Databases & Storage
- **MongoDB**: Main database for products, orders, users, and transactions
- **Redis**: Caching layer and session management
- **Supabase**: Cloud storage for product images and documents
- **Cloudinary**: Image upload and optimization

### Authentication & Security
- **JWT**: Access and refresh token authentication
- **Passport.js**: Google OAuth 2.0 integration
- **bcrypt**: Password hashing
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling

### Payment & Communication
- **PayOS**: Payment gateway integration
- **Nodemailer**: Email notifications
- **Socket.IO**: Real-time communication

### AI & Automation
- **Google Generative AI**: AI-powered product recommendations
- **BullMQ**: Job queue for background tasks (invoices, emails)

### Development Tools
- **TypeScript**: Type-safe development
- **Nodemon**: Hot reload in development
- **Morgan**: HTTP request logger
- **ESLint**: Code quality
- **Zod**: Runtime schema validation

## 📁 Project Structure

```
be-swp391-eye-wear/
├── src/
│   ├── config/           # Configuration files (DB, cloud storage, constants)
│   ├── controllers/      # Route handlers (admin, client, common)
│   ├── converters/       # Data transformation logic
│   ├── errors/           # Custom error classes
│   ├── middlewares/      # Authentication, validation, CORS
│   ├── models/           # MongoDB schemas (Mongoose models)
│   ├── queues/           # BullMQ workers (email, invoice processing)
│   ├── repositories/     # Database access layer
│   ├── routes/           # API route definitions
│   ├── scripts/          # Utility scripts (backup, embedding)
│   ├── seeds/            # Database seed data
│   ├── services/         # Business logic layer
│   ├── templates/        # Email templates
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Helper functions
│   ├── app.ts            # Express app configuration
│   └── server.ts         # Server entry point
├── dist/                 # Compiled JavaScript output
├── api-endpoints.md      # Complete API documentation
├── DEPLOY.md             # Deployment guide
├── docker-compose.yml    # Docker configuration
└── Dockerfile            # Container definition
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MongoDB** Atlas account (or local MongoDB)
- **Redis** instance (local or cloud)
- **Supabase** account (for file storage)
- **Cloudinary** account (for image uploads)
- **PayOS** account (for payment processing)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Thangwibu1/be-swp391-eye-wear.git
cd be-swp391-eye-wear
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NODE_ENV=development
PORT=5000
API_VERSION=v1

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_URL=your_redis_url

# Neo4j (if using graph features)
NEO4J_URI=your_neo4j_uri
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

# CORS
FE_CLIENT_DOMAIN=http://localhost:3000
FE_ADMIN_DOMAIN=http://localhost:3001

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_SECRET_KEY=your_secret_key

# Email
MAIL_SENDER=your_email@gmail.com
MAIL_PASS=your_app_password

# PayOS
PAYOS_CLIENT_KEY=your_client_key
PAYOS_API_KEY=your_api_key
PAYOS_CHECKSUM_KEY=your_checksum_key
```

4. **Run development server**

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## 🌐 API Access

- **Health Check**: `http://localhost:5000/health`
- **Admin API**: `http://localhost:5000/api/v1/admin`
- **Client API**: `http://localhost:5000/api/v1`
- **Common/Public API**: `http://localhost:5000/api/v1`

For complete API documentation, see [api-endpoints.md](./api-endpoints.md)

## 📚 Key Features

### Customer Features
- ✅ **Authentication**: Register, login, Google OAuth, password reset
- ✅ **Product Browsing**: Search, filter by category/attributes, pagination
- ✅ **Shopping Cart**: Add/remove items, update quantities
- ✅ **Wishlist**: Save favorite products
- ✅ **Checkout**: Multiple payment methods (COD, online payment via PayOS)
- ✅ **Order Management**: Track orders, view history, cancel orders
- ✅ **Invoices**: View and download order invoices
- ✅ **AI Recommendations**: AI-powered product suggestions
- ✅ **Customer Support**: Return tickets, report issues

### Admin Features
- ✅ **Dashboard**: Sales analytics, revenue reports
- ✅ **Product Management**: CRUD operations, inventory tracking
- ✅ **Category & Attribute Management**: Organize product catalog
- ✅ **Order Processing**: Update order status, assign delivery staff
- ✅ **Customer Management**: View customer data, spending analytics
- ✅ **Staff Management**: Role-based access control
- ✅ **Invoice Management**: Generate, track, and manage invoices
- ✅ **Voucher System**: Create and manage discount codes
- ✅ **Import Products**: Bulk product imports
- ✅ **Return & Refund Management**: Handle customer returns

### Technical Features
- ✅ **Real-time Updates**: Socket.IO for live notifications
- ✅ **File Upload**: Supabase + Cloudinary integration
- ✅ **Background Jobs**: BullMQ for async email and invoice processing
- ✅ **Caching**: Redis for performance optimization
- ✅ **Rate Limiting**: Protection against API abuse
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Validation**: Zod schema validation on all endpoints
- ✅ **Error Handling**: Centralized error middleware

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors automatically

# Database
npm run seed         # Seed database with initial data

# Utilities
npm run backup:products    # Backup products collection
npm run embed:products     # Generate product embeddings for AI
```

## 🐳 Docker Deployment

### Using Docker Compose

1. **Create `.env` file** with production values

2. **Build and run**

```bash
docker compose up -d --build
```

3. **View logs**

```bash
docker compose logs -f
```

4. **Stop container**

```bash
docker compose down
```

For detailed deployment instructions, see [DEPLOY.md](./DEPLOY.md)

## 📖 API Documentation

### Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Authentication

Most endpoints require authentication via JWT:

```bash
Authorization: Bearer <access_token>
```

Refresh tokens are stored in httpOnly cookies.

### Main API Routes

- **Admin Auth**: `/api/v1/admin/auth`
- **Client Auth**: `/api/v1/auth`
- **Products**: `/api/v1/products`
- **Categories**: `/api/v1/categories`
- **Cart**: `/api/v1/cart`
- **Checkout**: `/api/v1/checkout`
- **Orders**: `/api/v1/orders` (client) / `/api/v1/admin/orders` (admin)
- **Invoices**: `/api/v1/invoices`
- **Vouchers**: `/api/v1/vouchers`
- **Upload**: `/api/v1/upload`

For complete endpoint documentation, see [api-endpoints.md](./api-endpoints.md)

## 🔐 Security Features

- **JWT Authentication**: Secure access and refresh token mechanism
- **Password Hashing**: bcrypt with salt rounds
- **HTTP Security Headers**: Helmet middleware
- **CORS**: Configurable origin whitelist
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Mongoose ODM
- **XSS Protection**: Built-in Express escaping

## 🚀 Production Deployment

### Environment Checklist

- ✅ Set `NODE_ENV=production`
- ✅ Use strong JWT secrets (min 32 chars)
- ✅ Configure production MongoDB cluster
- ✅ Set up Redis instance
- ✅ Configure CORS with actual frontend domains
- ✅ Enable HTTPS (via reverse proxy)
- ✅ Set up monitoring and logging
- ✅ Configure firewall rules
- ✅ Whitelist IPs in cloud databases

### Recommended Infrastructure

- **Hosting**: Google Cloud VPS, AWS EC2, or DigitalOcean
- **Database**: MongoDB Atlas (managed)
- **Cache**: Redis Cloud or AWS ElastiCache
- **CDN**: Cloudflare for static assets
- **SSL**: Let's Encrypt via Nginx reverse proxy

See [DEPLOY.md](./DEPLOY.md) for complete deployment guide.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit your changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## 📄 License

This project is part of an academic Software Project (SWP391) and is for educational purposes.

---

**Built with ❤️ using Express, TypeScript, and MongoDB**
