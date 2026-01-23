# Backend Deployment Guide - Google Cloud VPS

## Prerequisites

- Google Cloud VPS with Docker and Docker Compose installed ✓
- SSH access to your VPS
- GitHub account with access to the private repository

---

## Deployment Steps for Google Cloud VPS

### Step 1: Connect to Your VPS

```bash
# SSH into your Google Cloud VPS
ssh username@your-vps-ip
# Example: ssh thang@34.123.45.67
```

### Step 2: Authenticate with GitHub (Private Repo)

Since your repository is private, you need to authenticate. There are two methods:

#### Method A: Using Personal Access Token (Recommended)

1. Create a GitHub Personal Access Token:
    - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
    - Click "Generate new token (classic)"
    - Give it a name (e.g., "VPS Deployment")
    - Select scope: `repo` (Full control of private repositories)
    - Click "Generate token"
    - **Copy the token immediately** (you won't see it again)

2. Clone using the token:
    ```bash
    git clone https://YOUR_TOKEN@github.com/Thangwibu1/be-swp391-eye-wear.git
    cd be-swp391-eye-wear
    ```

#### Method B: Using SSH Key

1. Generate SSH key on VPS:

    ```bash
    ssh-keygen -t ed25519 -C "your_email@example.com"
    # Press Enter to accept default location
    # Press Enter twice for no passphrase
    ```

2. Copy the public key:

    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```

3. Add to GitHub:
    - Go to GitHub → Settings → SSH and GPG keys → New SSH key
    - Paste the key and save

4. Clone the repository:
    ```bash
    git clone git@github.com:Thangwibu1/be-swp391-eye-wear.git
    cd be-swp391-eye-wear
    ```

### Step 3: Create Environment File

This is the **most critical step**. The `.env` file contains your secrets and is not in the repository.

```bash
# Create .env file
nano .env
```

Paste the following and **fill in your production values**:

```env
NODE_ENV=production
PORT=5000
API_VERSION=v1

# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Redis
REDIS_URL=your_redis_url

# Neo4j
NEO4J_URI=your_neo4j_uri
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_EXPIRES_IN_SECOND=604800
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN_SECOND=2592000

# CORS - Update with your frontend URLs
FE_CLIENT_DOMAIN=https://your-frontend-domain.com
FE_ADMIN_DOMAIN=https://your-admin-domain.com

# Cloudinary
CLOUD_NAME=your_cloud_name
CLOUD_API_KEY=your_api_key
CLOUD_SECRET_KEY=your_secret_key
```

**Save and exit**: Press `Ctrl+O`, then `Enter`, then `Ctrl+X`

### Step 4: Run with Docker Compose

```bash
# Build and start the container in detached mode
sudo docker compose up -d --build
```

This will:

- Build the Docker image
- Start the container in the background
- Automatically restart if it crashes

### Step 5: Verify Deployment

Check if the container is running:

```bash
sudo docker compose ps
```

View logs to confirm successful startup:

```bash
sudo docker compose logs -f
```

You should see messages like:

- "Connected to MongoDB"
- "Connected to Redis"
- "Server running on port 5000"

Press `Ctrl+C` to exit logs.

### Step 6: Test the API

```bash
# Test from the VPS
curl http://localhost:5000/api/v1

# Test from outside (if firewall allows)
curl http://your-vps-ip:5000/api/v1
```

### Step 7: Configure Firewall (Google Cloud)

1. Go to Google Cloud Console → VPC Network → Firewall
2. Create a firewall rule:
    - Name: `allow-backend-5000`
    - Targets: All instances (or specific tags)
    - Source IP ranges: `0.0.0.0/0` (or restrict to your frontend IP)
    - Protocols and ports: `tcp:5000`
    - Click "Create"

---

## Useful Commands

### View Logs

```bash
sudo docker compose logs -f
```

### Restart Container

```bash
sudo docker compose restart
```

### Stop Container

```bash
sudo docker compose down
```

### Update Code (Pull Latest Changes)

```bash
# Pull latest code
git pull

# Rebuild and restart
sudo docker compose up -d --build
```

### Remove Everything and Start Fresh

```bash
sudo docker compose down
sudo docker system prune -a
git pull
sudo docker compose up -d --build
```

---

## Local Testing (Before Deploying)

Test on your local machine first:

1. **Create `.env` file**:

    ```bash
    # Windows Command Prompt
    copy .env.development .env

    # Linux/Mac
    cp .env.development .env
    ```

2. **Run Docker Compose**:

    ```bash
    docker compose up --build
    ```

3. **Stop**:
   Press `Ctrl+C` or run `docker compose down`

---

## Troubleshooting

### Container keeps restarting

```bash
# Check logs for errors
sudo docker compose logs

# Common issues:
# - Missing environment variables
# - Cannot connect to MongoDB/Redis/Neo4j
# - Port 5000 already in use
```

### Cannot connect to databases

- Verify your MongoDB URI, Redis URL, and Neo4j credentials
- Check if your VPS IP is whitelisted in MongoDB Atlas
- Ensure Neo4j Aura allows connections from your VPS IP

### Port 5000 not accessible

- Check Google Cloud firewall rules
- Verify the container is running: `sudo docker compose ps`
- Check if port is listening: `sudo netstat -tlnp | grep 5000`

---

## Security Recommendations

1. **Never commit `.env` to Git** ✓ (already in `.gitignore`)
2. **Use strong JWT secrets** (min 32 characters, random)
3. **Restrict CORS origins** to your actual frontend domains
4. **Whitelist VPS IP** in MongoDB Atlas and Neo4j Aura
5. **Use HTTPS** in production (consider nginx reverse proxy)
6. **Regular updates**: `git pull && sudo docker compose up -d --build`
