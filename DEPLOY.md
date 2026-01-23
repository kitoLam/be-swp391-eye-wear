# Backend Deployment Guide

## Frequently Asked Question: "Where is the .env file?"

You noticed that `.env` files are not in the repository. **This is intentional for security.** You should never commit secrets (passwords, API keys) to Git.

**How it works:**

1.  **Local Machine**: You have `.env.development` with your secrets.
2.  **VPS (Server)**: You manually create a `.env` file and paste your secrets there.
3.  **Docker**: When you run `docker-compose up`, Docker reads the `.env` file on the VPS and injects the values into the container. The app reads them from `process.env`.

---

## Local Testing (How to run on your machine)

If you want to test Docker on your own computer before deploying:

1.  **Create `.env` file**:
    Since `docker-compose.yml` looks for `.env`, you need to create it from your existing dev file.

    ```bash
    cp .env.development .env
    # Or on Windows Command Prompt:
    # copy .env.development .env
    ```

2.  **Run Docker Compose**:

    ```bash
    docker-compose up --build
    ```

    This will build the container and start the server on port 5000.

3.  **Stop**:
    Press `Ctrl+C` or run `docker-compose down`.

---

## VPS Deployment Steps

### 1. Prepare your Secrets (On Local Machine)

Open your local `.env.development` file. Copy its content. You will need this for the VPS.

### 2. Connect to VPS

SSH into your server.

### 3. Clone Repository

```bash
git clone <your-repo-link>
cd be-swp391-eye-wear
```

### 4. Create the Secret File (Crucial Step)

You must create the `.env` file manually because it's not in Git.

1.  Create the file:
    ```bash
    nano .env
    ```
2.  **PASTE** the content you copied from your local `.env.development` here.
3.  (Optional) Update values for production (e.g., change `NODE_ENV=development` to `NODE_ENV=production`).
4.  Save and exit (Ctrl+O, Enter, Ctrl+X).

### 5. Run the Application

Now that the `.env` file exists on the VPS, Docker can read it.

```bash
# Install Docker if needed
sudo apt update && sudo apt install docker.io docker-compose -y

# Start the app
sudo docker-compose up -d --build
```

### 6. Verify

Check if the app picked up the variables:

```bash
sudo docker-compose logs -f
```

If you see "Connected to MongoDB" (or similar success messages), it worked!
