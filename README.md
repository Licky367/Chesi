# Farm Management System

This is a Node.js Express application for managing dairy, poultry, and farm operations.

## Requirements
- Node.js (16+ recommended)
- MongoDB

## Environment
Create a `.env` file from `.env.example` and set production values.

Important variables:
- `PORT` — server port
- `MONGO_URI` — MongoDB connection string
- `SESSION_SECRET` — secure random value
- `FRONTEND_URL` — allowed origin for Socket.IO
- `NODE_ENV` — set to `production` in production

## Run (development)
Install dependencies and start in development mode:

```bash
npm install
npm run dev
```

## Run (production with PM2)
PM2 provides process management and automatic restarts.

```bash
# install pm2 locally as dev dependency (optional)
npm install --omit=dev
# start using npm script
npm run start:prod

# View logs
npm run pm2:logs

# Stop
npm run pm2:stop
```

## Deployment notes
- Use a reverse proxy (NGINX) to handle TLS and serve static assets.
- Ensure `NODE_ENV=production` and `SESSION_SECRET` are set.
- Use a managed MongoDB or run MongoDB with proper backups.

## Files added
- `ecosystem.config.js` – PM2 ecosystem file
- `.env.example` – provided earlier

