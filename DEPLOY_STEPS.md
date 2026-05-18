# Hangman AI Deployment Steps

This file is the practical step-by-step guide to deploy the app correctly.

Deployment setup used by this project:

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas (optional, but recommended for auth and leaderboard)

## Before You Start

Make sure these are already true:

1. Your latest code is pushed to GitHub.
2. The repo is connected to both Vercel and Render.
3. The frontend root is `frontend`.
4. The backend root is `backend`.

Current repo:

- GitHub repo: `https://github.com/salim7-s/Hangman-AI`
- Branch to deploy: `main`

## Deployment Order

Use this order exactly:

1. Create MongoDB Atlas database.
2. Deploy backend on Render.
3. Copy the Render backend URL.
4. Deploy frontend on Vercel.
5. Set `VITE_API_URL` in Vercel to the Render backend URL.
6. Set `CLIENT_URL` in Render to the Vercel frontend URL.
7. Redeploy both if needed.
8. Test the live app.

## Step 1: Create MongoDB Atlas

MongoDB is optional, but without it some persistent features will not work properly.

### 1.1 Create the Atlas project

1. Go to `https://www.mongodb.com/cloud/atlas/register`
2. Create an account or sign in.
3. Create a new project if Atlas asks.
4. Give the project any name you want, for example `Hangman AI`.

### 1.2 Create the cluster

1. Click `Create`.
2. Choose the free plan.
3. Pick:
   - Provider: `AWS`
   - Region: nearest to you, for example `Mumbai (ap-south-1)`
4. Cluster name:
   - you can use `hangman-ai`
   - or keep the default
5. Turn off `Preload sample dataset` if it is enabled.
6. Click `Create Deployment`.

### 1.3 Complete the security popup

When Atlas opens the `Connect to <cluster-name>` popup, do this:

#### Add connection IP address

1. Atlas may already add your current IP automatically.
2. That is enough for local testing.
3. For production later, you should also allow wider access if needed from Render.

Recommended production-safe simple option:

1. Open `Network Access`
2. Click `Add IP Address`
3. Choose `Allow Access from Anywhere`
4. Atlas will enter:

```text
0.0.0.0/0
```

5. Confirm and save.

Note:
- This is common for small student/personal deployments.
- If you want tighter security later, restrict it to known IPs.

#### Create database user

1. In the popup, create a database user if Atlas asks.
2. Choose a username, for example:

```text
hangmanuser
```

3. Choose a strong password.
4. Save the username and password somewhere safe.

Important:
- You will need this exact username and password in the MongoDB connection string.
- Do not commit them to GitHub.

### 1.4 Choose connection method

From the popup in your screenshot:

1. Click `Choose a connection method`
2. Choose `Drivers`
3. Atlas will show a MongoDB URI template

It will look similar to this:

```text
mongodb+srv://<db_username>:<db_password>@hangman-ai.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=hangman-ai
```

### 1.5 Build the final `MONGO_URI`

Take the Atlas URI and replace:

- `<db_username>` with your database username
- `<db_password>` with your database password

Then add your database name after `.net/`

Use this format:

```text
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER_HOST/hangman?retryWrites=true&w=majority&appName=YOUR_CLUSTER_NAME
```

Example:

```text
mongodb+srv://hangmanuser:MyStrongPassword123@hangman-ai.abcde.mongodb.net/hangman?retryWrites=true&w=majority&appName=hangman-ai
```

Important:
- `hangman` here is the database name
- the cluster host comes from Atlas
- do not remove the query string at the end
- if your password contains special characters, URL-encode them

Save this final value. You will use it as `MONGO_URI` in Render.

### 1.6 Atlas checklist

Before moving to Render, make sure all of these are done:

- cluster created
- sample dataset disabled
- database user created
- network access added
- connection string copied
- final `MONGO_URI` prepared

## Step 2: Deploy Backend on Render

### 2.1 Open Render and create the service

1. Go to `https://render.com/`
2. Sign in.
3. Click `New +`
4. Click `Web Service`
5. Connect your GitHub account if Render asks
6. Select repo: `Hangman-AI`
7. Click `Connect`

### 2.2 Fill the Render service settings

Use these values:

- Name: `hangman-ai-backend`
- Branch: `main`
- Region: choose one near you if Render asks
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

If Render shows plan options:

1. Choose the free plan if available
2. Continue

### 2.3 Add backend environment variables

In the Render environment section, add these one by one:

```text
NODE_ENV=production
JWT_SECRET=put_a_long_random_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=https://placeholder.vercel.app
MONGO_URI=your_mongodb_atlas_connection_string
AI_WORD_POOL=game
```

What each one means:

- `NODE_ENV=production`
  - tells Express the app is running live
- `JWT_SECRET=...`
  - used for login tokens
  - must be a long random secret
- `JWT_EXPIRES_IN=7d`
  - token expiry
- `CLIENT_URL=https://placeholder.vercel.app`
  - temporary value for now
  - you will replace it with your real Vercel URL later
- `MONGO_URI=...`
  - paste the full Atlas URI you created in Step 1
- `AI_WORD_POOL=game`
  - keeps the app using the curated playable word list

Do not add:

- `PORT`

Render provides the port automatically.

### 2.4 Generate a JWT secret

If you do not know what to put in `JWT_SECRET`, generate one locally:

```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and paste it into Render.

### 2.5 Create the Render service

1. Double-check:
   - repo is correct
   - branch is `main`
   - root directory is `backend`
   - build command is `npm install`
   - start command is `npm start`
2. Click `Create Web Service`
3. Wait for the deploy logs to finish

### 2.6 Copy the backend URL

When the backend is live, Render gives you a public URL like:

```text
https://hangman-ai-backend.onrender.com
```

Copy it. You need it for Vercel.

### 2.7 Test the backend before moving on

Open this in the browser:

```text
https://your-backend.onrender.com/api/health
```

Expected response:

```json
{ "status": "ok" }
```

If that endpoint does not work:

1. Open Render logs
2. Check env vars
3. Check `MONGO_URI`
4. Confirm root directory is `backend`
5. Fix it before moving to Vercel

## Step 3: Deploy Frontend on Vercel

### 3.1 Open Vercel and import the repo

1. Go to `https://vercel.com/`
2. Sign in
3. Click `Add New`
4. Click `Project`
5. Import GitHub repo: `Hangman-AI`

### 3.2 Configure the Vercel project

Use these values:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`

If Vercel auto-detects these, still verify them manually.

### 3.3 Add frontend environment variable

Add this environment variable:

```text
VITE_API_URL=https://your-backend.onrender.com
```

Important:

- This must be the Render backend URL
- Do not put your Vercel frontend URL here
- Do not leave this empty

### 3.4 Deploy the frontend

1. Double-check:
   - repo is correct
   - root directory is `frontend`
   - `VITE_API_URL` uses the Render backend URL
2. Click `Deploy`
3. Wait for the deployment to finish

### 3.5 Copy the frontend URL

When deployment finishes, Vercel gives you a public URL like:

```text
https://your-app.vercel.app
```

Copy it. You need it for Render.

## Step 4: Link Render and Vercel Properly

### 4.1 Update Render `CLIENT_URL`

Now go back to Render:

1. Open your backend service
2. Open `Environment`
3. Find:

```text
CLIENT_URL
```

4. Replace the placeholder with your real Vercel URL:

```text
CLIENT_URL=https://your-app.vercel.app
```

5. Save changes

### 4.2 Redeploy the backend

After changing `CLIENT_URL`:

1. Trigger a redeploy in Render if it does not restart automatically
2. Wait until deployment finishes

This matters because:

- Express CORS uses `CLIENT_URL`
- Socket.IO also uses `CLIENT_URL`
- multiplayer and API calls can fail if this is wrong

## Step 5: Redeploy Frontend If Needed

Usually Vercel is already correct if you set `VITE_API_URL` while creating the project.

If you need to change it later:

1. Open the Vercel project dashboard
2. Open `Settings`
3. Open `Environment Variables`
4. Find or add:

```text
VITE_API_URL
```

5. Set it to:

```text
https://your-backend.onrender.com
```

6. Save
7. Open `Deployments`
8. Redeploy the latest build

## Step 6: Test the Live App

### 6.1 Basic live checks

Open the Vercel frontend URL and test:

1. Home page loads
2. Solo game starts
3. Reverse mode starts
4. Local duel starts
5. Multiplayer lobby loads
6. Mobile layout looks correct
7. Result modal fits on mobile

### 6.2 API checks

Open browser DevTools and check:

1. `Network` tab
2. requests go to the Render backend URL
3. no CORS errors
4. no failed `/api/game/start` requests

### 6.3 Multiplayer checks

Test multiplayer specifically:

1. Open the site in two tabs or two devices
2. Create a room
3. Join from the second tab
4. Submit a word
5. Guess letters
6. Confirm room updates work live

If multiplayer fails, the first thing to check is Render `CLIENT_URL`.

Open the Vercel frontend URL and test:

1. Home page loads
2. Solo game starts
3. Reverse mode starts
4. Local duel starts
5. Multiplayer lobby loads
6. Mobile layout looks correct
7. Result modal fits on mobile

## Production Environment Values

### Render

```text
NODE_ENV=production
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-app.vercel.app
MONGO_URI=your_mongodb_uri
AI_WORD_POOL=game
```

### Vercel

```text
VITE_API_URL=https://your-backend.onrender.com
```

## Common Mistakes

### Frontend cannot talk to backend

Usually one of these is wrong:

- `VITE_API_URL` points to the wrong URL
- `CLIENT_URL` still points to localhost
- Render backend was not redeployed after changing env vars

### Multiplayer does not work

Usually:

- `CLIENT_URL` is wrong in Render
- frontend and backend URLs do not match the deployed domains

### Backend works locally but not on Render

Check:

- Root directory is `backend`
- Start command is `npm start`
- environment variables are present

### Frontend deploys but shows API errors

Check:

- Root directory is `frontend`
- `VITE_API_URL` uses the Render backend URL
- backend `/api/health` works publicly

## Quick Checklist

- Backend deployed on Render
- Frontend deployed on Vercel
- `MONGO_URI` set
- `VITE_API_URL` set to Render URL
- `CLIENT_URL` set to Vercel URL
- backend health endpoint works
- frontend can start a game
- multiplayer works
- mobile layout looks correct

## Future Updates

After this first setup, future deploys are simple:

1. Commit changes
2. Push to `main`
3. Render and Vercel auto-redeploy

## Repo Files Related to Deployment

- [package.json](./package.json)
- [backend/package.json](./backend/package.json)
- [frontend/package.json](./frontend/package.json)
- [frontend/vercel.json](./frontend/vercel.json)
- [backend/.env.example](./backend/.env.example)
- [docs/deployment_guide.md](./docs/deployment_guide.md)
