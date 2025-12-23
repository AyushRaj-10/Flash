# FlowDine - Restaurant Queue Management System

FlowDine is an intelligent queue management system that transforms the restaurant waiting experience. It provides real-time queue tracking, automated notifications, and comprehensive analytics for restaurants to efficiently manage their waiting lists.

![FlowDine](https://img.shields.io/badge/FlowDine-Restaurant%20Queue-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=flat-square&logo=mongodb)

## 🌟 Features

### Customer Interface
- **Join Queue**: Customers can join the virtual waiting line by providing their name, party size, and email
- **Real-time Tracking**: Live position updates with progress visualization
- **Wait Time Estimates**: Accurate wait time predictions based on queue position
- **Cancel Anytime**: Easy queue cancellation from the customer interface
- **Responsive Design**: Beautiful, modern UI with 3D Spline backgrounds and animations

### Staff Dashboard
- **Queue Management**: View and manage the waiting queue in real-time
- **Seat Next Customer**: Mark the next customer as seated with one click
- **Seated Customers**: Monitor currently seated customers
- **Person Has Eaten**: Mark customers as finished and remove them from the database
- **Live Updates**: Real-time synchronization across all connected devices

### Admin Interface
- **Queue Overview**: Complete view of waiting and seated customers
- **Direct Management**: Seat customers and mark them as finished
- **Real-time Sync**: Instant updates via WebSocket connections

### Analytics Dashboard
- **Performance Metrics**: Track total parties served, average party size, and wait times
- **Hourly Distribution**: Visualize customer flow throughout the day
- **Date Range Filtering**: Analyze performance over custom date ranges
- **Interactive Charts**: Beautiful visualizations using Chart.js

### Technical Features
- **Real-time Communication**: WebSocket (Socket.IO) for instant updates
- **Email Notifications**: Automated email alerts for queue confirmations and table readiness
- **Database Persistence**: MongoDB for reliable data storage
- **RESTful API**: Well-structured backend API for all operations

## 📁 Project Structure

```
Flash/
├── Server/                 # Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js          # MongoDB connection configuration
│   ├── controllers/
│   │   ├── queue.controller.js      # Queue management logic
│   │   └── analytics.controller.js  # Analytics data aggregation
│   ├── models/
│   │   ├── Customer.schema.js       # Customer data model
│   │   └── ...                      # Other models
│   ├── routes/
│   │   ├── queue.routes.js          # Queue API routes
│   │   └── analytics.routes.js      # Analytics API routes
│   ├── services/
│   │   ├── Notification.service.js  # Email notification service
│   │   └── Analytics.service.js     # Analytics service
│   ├── utils/
│   │   └── response.util.js         # Utility functions
│   ├── scheduler.js                 # Background job scheduler
│   └── server.js                    # Main server file
│
├── frontend/               # Customer & Staff Frontend (React + Vite)
    ├── src/
    │   ├── pages/
    │   │   ├── HomePage.jsx          # Landing page
    │   │   ├── CustomerInterface.jsx # Customer queue interface
    │   │   ├── StaffDashboard.jsx    # Staff management dashboard
    │   │   └── AnalyticsDashboard.jsx # Analytics dashboard
    │   ├── utils/
    │   │   ├── api.js                # API client functions
    │   │   └── websocket.js          # WebSocket client (Socket.IO)
    │   ├── App.jsx                   # Main app component with routing
    │   └── index.css                 # Global styles
    ├── vite.config.js                # Vite configuration
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or cloud instance like MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Flash
   ```

2. **Install Backend Dependencies**
   ```bash
   cd Server
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```


### Environment Setup

Create a `.env` file in the `Server` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/flashdine
# or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/flashdine

# Server Port
PORT=3000

# Email Configuration (for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

> **Note**: For Gmail, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd Server
   npm start
   ```
   The server will run on `http://localhost:3000`

2. **Start the Frontend (Customer & Staff)**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`


3. **Access the Application**
   - **Home Page**: http://localhost:5173/
   - **Customer Interface**: http://localhost:5173/queue/join
   - **Staff Dashboard**: http://localhost:5173/staff/dashboard
   - **Analytics Dashboard**: http://localhost:5173/staff/analytics

## 📡 API Endpoints

### Queue Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/queue/join` | Join the queue |
| `GET` | `/api/queue` | Get all waiting customers |
| `GET` | `/api/queue/seated` | Get all seated customers |
| `POST` | `/api/queue/seat` | Seat the next customer |
| `DELETE` | `/api/queue/cancel/:id` | Cancel a waiting customer |
| `DELETE` | `/api/queue/finished/:id` | Mark a seated customer as finished |
| `DELETE` | `/api/queue/delete-by-email` | Delete customer by email |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/stats` | Get queue statistics (with optional `startDate` and `endDate` query params) |
| `GET` | `/api/analytics/seated` | Get seated customers for analytics |

### Request/Response Examples

**Join Queue**
```javascript
POST /api/queue/join
Body: {
  "id": "customer_123456",
  "name": "John Doe",
  "partySize": 4,
  "email": "john@example.com"
}

Response: {
  "customer": { ... },
  "position": 3
}
```

**Get Queue Stats**
```javascript
GET /api/analytics/stats?startDate=2024-01-01&endDate=2024-01-31

Response: {
  "totalServed": 150,
  "totalParties": 200,
  "averagePartySize": 3.5,
  "averageWaitTime": 25,
  "currentQueueLength": 10,
  "hourlyData": { "0": 5, "1": 3, ... }
}
```

## 🔌 WebSocket Events

The application uses Socket.IO for real-time communication:

### Server Emits

- `queueUpdated` - Emitted when the waiting queue changes
- `seatedUpdated` - Emitted when the seated customers list changes

### Client Listens

- `QUEUE_UPDATED` - Receive updated waiting queue
- `SEATED_UPDATED` - Receive updated seated customers list

## 🗄️ Database Schema

### Customer Model

```javascript
{
  customerId: String (required, unique),
  name: String (required),
  partySize: Number (required),
  email: String (required),
  status: String (enum: ["WAITING", "SEATED"], default: "WAITING"),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **Nodemailer** - Email notification service
- **node-cron** - Task scheduler

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Chart.js** - Data visualization
- **Socket.IO Client** - WebSocket client
- **Spline** - 3D scene rendering
- **React Hot Toast** - Toast notifications
- **Lucide React** - Icon library

## 🔧 Configuration

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory (optional):

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Admin Environment Variables

Create a `.env` file in the `Admin` directory (optional):

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

### Vite Proxy Configuration

The frontend `vite.config.js` includes proxy configuration to forward API requests to the backend:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3000',
    changeOrigin: true
  },
  '/socket.io': {
    target: 'http://localhost:3000',
    ws: true,
    changeOrigin: true
  }
}
```

## 🚦 Usage Guide

### For Customers

1. Visit the home page and click "Join the Queue"
2. Fill in your name, party size, and email
3. You'll receive a confirmation email and see your position in the queue
4. Monitor your position in real-time as you wait
5. You'll receive a notification when your table is ready
6. You can cancel your queue entry anytime

### For Staff

1. Navigate to the Staff Dashboard
2. View the current waiting queue
3. Click "Seat Next Customer" when a table is available
4. Monitor seated customers in the "Seated Customers" section
5. Click "Person Has Eaten" when customers finish dining to remove them from the system

### For Administrators

1. Access the Admin Interface
2. View both waiting and seated queues
3. Manage customer seating and completion directly

## 📊 Analytics Features

The Analytics Dashboard provides:

- **Total Served**: Number of customers who have been seated
- **Total Parties**: Total number of parties in the queue
- **Average Party Size**: Average number of people per party
- **Average Wait Time**: Average waiting time for customers
- **Current Queue Length**: Number of customers currently waiting
- **Hourly Distribution**: Chart showing customer arrivals by hour

## 🔒 Security Notes

- The application currently doesn't require authentication for staff/admin access
- Email credentials are stored in environment variables (not committed to git)
- For production, consider implementing:
  - JWT authentication
  - Role-based access control
  - Rate limiting
  - Input validation and sanitization
  - HTTPS/SSL certificates

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or your MongoDB Atlas connection string is correct
- Check your `MONGO_URI` in the `.env` file

### WebSocket Connection Errors
- Verify the backend server is running on port 3000
- Check CORS settings in `server.js`
- Ensure firewall isn't blocking WebSocket connections

### Email Notifications Not Working
- Verify Gmail App Password is correctly set in `.env`
- Check that 2-factor authentication is enabled on your Gmail account
- Ensure `EMAIL_USER` and `EMAIL_PASS` are correctly configured

### Port Conflicts
- Backend runs on port 3000 by default
- Frontend runs on port 5173 by default
- Admin runs on port 5174 by default
- Modify ports in respective configuration files if needed

## 📝 Development

### Adding New Features

1. **Backend**: Add controllers in `Server/controllers/`, routes in `Server/routes/`
2. **Frontend**: Add pages in `frontend/src/pages/`, update routing in `App.jsx`

### Code Style

- Use ES6+ JavaScript features
- Follow React best practices and hooks
- Use async/await for asynchronous operations
- Implement error handling for API calls

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 🙏 Acknowledgments

- Built with React, Node.js, and MongoDB
- UI components styled with Tailwind CSS
- 3D graphics powered by Spline
- Icons by Lucide React

---

**FlowDine** - *Stop Waiting. Start Dining.* 🍽️

