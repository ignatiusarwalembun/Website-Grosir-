# GrosirHub

Modern Indonesian wholesale commerce catalog built with React + Vite and Node.js + Express.

## Tech Stack
- Frontend: React, Vite, React Router, Lucide React, CSS
- Backend: Node.js, Express, CORS
- Persistence: localStorage for cart and recently viewed products
- Deployment: Railway (one project, two services)

## Structure
```
frontend/
  src/components
  src/pages
  src/context
  src/services
backend/
  src/data.js
  src/server.js
```

## Local Development
### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Environment Variables
Frontend (`frontend/.env`):
```
VITE_API_URL=http://localhost:3001
```

Backend (`backend/.env`):
```
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Railway Deployment
Create one Railway project with two services from this repository:

### grosirhub-backend
- Root directory: `/backend`
- Start command: `npm start`
- Healthcheck: `/api/health`
- Variables: `FRONTEND_URL=<frontend production URL>`

### grosirhub-frontend
- Root directory: `/frontend`
- Build command: `npm run build`
- Start command: `npm start`
- Variables: `VITE_API_URL=<backend production URL>`

The frontend production server binds to Railway's `PORT` and `0.0.0.0`.

## API
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/categories`
- `GET /api/promos`
- `GET /api/orders`
- `POST /api/cart`
