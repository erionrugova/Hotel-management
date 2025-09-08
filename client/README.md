# Hotel Management Client

A modern React frontend for the Hotel Management System.

## Features

- **Authentication**: JWT-based login with role-based access
- **Role-based Routing**:
  - ADMIN users → Dashboard
  - Other users → Public pages
- **Room Management**: View and filter rooms with real-time data
- **Dashboard**: Admin dashboard with real-time statistics
- **Responsive Design**: Built with Tailwind CSS

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env
```

3. Start the development server:

```bash
npm start
```

## API Integration

The client connects to the backend API at `http://localhost:3000/api` and includes:

- Authentication endpoints
- Room management
- Booking management
- User management (admin only)

## Tech Stack

- React 19
- React Router DOM
- Tailwind CSS
- Recharts (for dashboard charts)
- Custom API service layer

## docker exec -it hotel-mysql mysql -u hotel_user -p
