# Final Deployment Guide

This guide covers deploying the full MERN stack application for free. We will use **MongoDB Atlas** for the database, **Render.com** for the Backend, and **Vercel** for the Frontend.

## Step 1: Set up MongoDB Atlas (Database)
1. Go to [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) and create a free account.
2. Click **Create a Free Cluster** (M0 tier).
3. Under **Database Access**, create a user (username + password) and save these credentials.
4. Under **Network Access**, add the IP Address `0.0.0.0/0` (Allow Access from Anywhere).
5. Go to **Clusters** -> **Connect** -> **Drivers** and copy the connection string. It will look like this:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
6. Replace `<username>` and `<password>` with the credentials you created. Add `hangman` before the `?` to name your database. This is your `MONGO_URI`.

## Step 2: Deploy the Backend (Render)
1. Go to [Render.com](https://render.com/) and create a free account.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub and select the `Hangman-AI` repository.
4. Set the **Root Directory** to `backend`.
5. Set **Build Command** to `npm install` and **Start Command** to `node server.js`.
6. Add the following **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `(Paste your MongoDB connection string from Step 1)`
   - `JWT_SECRET`: `(Generate a random secure string, e.g. "super_secret_hangman_key_123")`
   - `CLIENT_URL`: `(Leave this blank for now, we will update it in Step 4)`
7. Click **Create Web Service**. Wait for it to deploy and copy the URL (e.g., `https://hangman-backend.onrender.com`).

## Step 3: Deploy the Frontend (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and create a free account.
2. Click **Add New** -> **Project**.
3. Import the `Hangman-AI` repository.
4. Set the **Root Directory** to `frontend`. The framework preset should automatically detect `Vite`.
5. Open the **Environment Variables** section and add:
   - `VITE_API_URL`: `(Paste your Render Backend URL here, e.g., https://hangman-backend.onrender.com)`
6. Click **Deploy**. Copy your new Vercel URL (e.g., `https://hangman-ai.vercel.app`).

## Step 4: Link Backend to Frontend
1. Go back to your **Render Dashboard** and select your backend Web Service.
2. Go to the **Environment** tab.
3. Update the `CLIENT_URL` variable to your new Vercel URL (e.g., `https://hangman-ai.vercel.app`).
4. Save the changes. Render will automatically restart your backend with the correct CORS configuration allowing your frontend to communicate with it.

## Done!
Your application is now fully deployed. Any future commits pushed to the `main` branch of your GitHub repository will automatically trigger a rebuild and deployment on both Render and Vercel.
