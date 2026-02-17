# Deployment Guide for ParkEase on Render.com

This guide details how to deploy the **ParkEase** project (Frontend + Backend + Database) on [Render](https://render.com).

## Prerequisites

1.  **Git Configuration**: Ensure your project is a Git repository and pushed to GitHub.
    -   Initialize Git: `git init` (in `d:\ParkEase`)
    -   Create a `.gitignore` file in the root if one doesn't exist, adding `node_modules` and `.env`.
    -   Commit your code: `git add .` then `git commit -m "Initial commit"`
    -   Push to a new GitHub repositor

---

## Step 1: Deploy PostgreSQL Database (Supabase)

1.  Log in to [Supabase](https://supabase.com/).
2.  Click **New Project**.
3.  **Project Organization**: Select your default org.
4.  **Name**: `parkease-db`.
5.  **Database Password**: Create a strong password (copy this!).
6.  **Region**: Choose the region closest to you (e.g., Singapore, Frankfurt, Oregon).
7.  Click **Create new project**.
8.  Wait for the project to provision.
9.  Go to **Project Settings** (gear icon) -> **Database**.
10. Under **Connection string** -> **URI**, ensure `Mode: Transaction` (port 6543) or `Session` (port 5432) is selected. Use **Session Mode (port 5432)** for direct connections if possible, or create a connection pooler.
    - Copy the Connection String. It looks like: `postgresql://postgres.[ref]:[password]@[host]:5432/postgres`
    - You will need this for the Backend environment variable `DATABASE_URL`.
11. **Enable PostGIS**: Go to **Database** -> **Extensions**. Search for `postgis` and enable it.

---

## Step 2: Deploy Backend (Render)

1.  Log in to your Render Dashboard.
2.  Click **New +** and select **Web Service**.
3.  Connect your **GitHub repository**.
4.  Configure the service:
    -   **Name**: `parkease-backend`
    -   **Root Directory**: `backend`
    -   **Environment**: `Node`
    -   **Build Command**: `npm install && npm run db:migrate`
    -   **Start Command**: `node src/server.js`
5.  **Environment Variables** (Click "Advanced" or scroll to "Environment Variables"):
    -   `DATABASE_URL` = Paste the **Supabase Connection String** from Step 1. (Make sure to replace `[password]` with your actual password).
    -   `NODE_ENV` = `production`
    -   `PORT` = `10000` (Render default).
    -   `FIREBASE_PROJECT_ID` = *(Check your `firebase-service-account.json`)*
    -   `FIREBASE_CLIENT_EMAIL` = *(Check your `firebase-service-account.json`)*
    -   `FIREBASE_PRIVATE_KEY` = *(Check your `firebase-service-account.json` - Copy the whole key including `-----BEGIN...`)*
    -   `CORS_ORIGINS` = `http://localhost:5173,https://your-frontend-name.onrender.com` (Add your frontend URL here *after* step 3).
6.  Click **Create Web Service**.

---

## Step 3: Deploy Frontend (React/Vite)

1.  Click **New +** and select **Static Site**.
2.  Connect the same **GitHub repository**.
3.  Configure the site:
    -   **Name**: `parkease-frontend`
    -   **Root Directory**: `frontend`
    -   **Build Command**: `npm install && npm run build`
    -   **Publish Directory**: `dist`
4.  **Environment Variables**:
    -   `VITE_API_BASE_URL` = The **URL of your deployed Backend** (e.g., `https://parkease-backend.onrender.com`).
5.  **Redirects/Rewrites** (Crucial for React Router):
    -   Go to the **Redirects/Rewrites** tab.
    -   Add a new rule:
        -   **Source**: `/*`
        -   **Destination**: `/index.html`
        -   **Action**: `Rewrite`
6.  Click **Create Static Site**.

---

## Step 4: Final Configuration

1.  Once the Frontend is deployed, copy its URL (e.g., `https://parkease-frontend.onrender.com`).
2.  Go back to your **Backend Service** dashboard on Render.
3.  Go to **Environment**.
4.  Edit the `CORS_ORIGINS` variable.
    -   Add your frontend URL. Example: `http://localhost:5173,https://parkease-frontend.onrender.com`.
5.  **Save Changes**. Render will automatically redeploy the backend.

## Troubleshooting

-   **Backend Logs**: Use the "Logs" tab in Render to see if the server started successfully.
-   **Database**: Ensure the backend can connect. The `Internal Database URL` works only if both services are in the same Render account and region.
-   **Firebase**: If you see authentication errors, double-check the `FIREBASE_PRIVATE_KEY` formatting. Render handles newlines well, but ensure no extra spaces are around the key.
