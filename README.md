#  CholoShobai

> **CholoShobai** platform connects people with similar travel plans. They can share costs which saves their money with a safe travel. We don’t provide vehicles, we help people to find each other.

**[Quick view: demo video](https://drive.google.com/file/d/1YFaN9XgD9kFF7gJL888Jy6fq-E7n2jeY/view?usp=drive_link)**

---

##  Features

###  Authentication & Accounts
- **Register & Login** with secure JWT-based authentication.
- Passwords hashed with **bcrypt** before storage.
- **Token blacklisting** on logout — invalidated tokens auto-expire after 24 hours via MongoDB TTL.
- **Role-based access** for regular users and administrators.

###  Ride Management
- **Post a ride** with starting point, destination, date, time, available slots, and a gender preference (Male / Female / Both).
- **Browse & search rides** with flexible filters, search by origin, destination, date, time, or preference using fuzzy location matching.
- **My Rides**  view, expand, and manage all rides you've created.
- **Open / Close rides** to control whether new passengers can join.
- **Edit or delete** your own rides at any time.

###  Joining & Confirmation Flow
- **Join or leave** a ride with a single toggle — requests start as `pending`.
- Ride owners (who posted the travel request) review joined passengers and **confirm or cancel** each request.
- Only **confirmed participants** (and the owner) gain access to the ride's private chat.

###  Real-Time Chat
- **Live messaging** per ride powered by **Socket.IO**.
- Ride-specific chat rooms — join, send, and receive messages instantly.
- Server-side authorization ensures only the owner or confirmed riders can post.
- **Connection status indicators** and automatic reconnection (up to 5 retries).
- Message history persisted and loaded on open, with auto-scroll and timestamped bubbles.

###  Ratings & Reputation
- **Rate fellow users** (1–5 stars) with an optional comment.
- One rating per user pair — submitting again **updates** your previous rating.
- Self-rating is prevented.
- View any user's **average rating**, star breakdown, and full review history on their profile.

###  Profiles & Search
- **My Profile** and **public user profiles** with name, email, and reputation.
- **Search users** by name or email to view and rate them.

###  Admin Dashboard
- Dedicated panel visible only to administrators.
- **Manage users** — view all accounts, promote/demote admins, and delete users (with cascading cleanup of their rides and ratings).
- **Moderate ratings** — review and remove any rating across the platform.
- Built-in safeguards prevent deleting admin accounts.

---

##  Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, React Router 7, Axios, Socket.IO Client, Tailwind CSS 4, jwt-decode |
| **Backend** | Node.js, Express 5, Socket.IO, JWT, bcrypt, express-validator |
| **Database** | MongoDB with Mongoose |
| **Auth** | JSON Web Tokens (JWT) + token blacklist (TTL) |

---

##  Project Structure

```
CholoShobai/
├── backend/
│   ├── controllers/      # Business logic (rides, messages, users, ratings, admin)
│   ├── models/           # Mongoose schemas (User, Ride, Message, Rating, BlacklistToken)
│   ├── routes/           # Express route definitions
│   ├── middlewares/      # Auth & admin authorization
│   ├── services/         # Reusable service logic
│   ├── socket.js         # Socket.IO real-time chat
│   ├── app.js            # Express app & middleware setup
│   └── server.js         # HTTP server, Socket.IO & MongoDB bootstrap
│
└── frontend/
    ├── src/
    │   ├── pages/         # Home, Landing, MyRides, Profiles, RideConfirmation, Chat, Admin
    │   ├── components/    # Forms, sidebar, chat UI, ride cards
    │   ├── contexts/      # AuthContext & ChatContext (global state)
    │   └── App.js         # Router configuration
    └── package.json
```

---

##  Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (local instance or MongoDB Atlas connection string)

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/CholoShobai.git
cd CholoShobai
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:
```env
PORT=4000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
```

Start the backend:
```bash
npm run dev      # development (with nodemon)
# or
npm start        # production
```

### 3. Frontend setup
```bash
cd ../frontend
npm install
npm start
```

The frontend runs on **http://localhost:3000** and proxies API requests to the backend on **http://localhost:4000**.

>  Both the backend and frontend must be running simultaneously.

---

##  API Overview

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/users/register` | Register a new account |
| `POST` | `/users/login` | Log in and receive a JWT |
| `GET`  | `/users/profile` | Get the current user's profile |
| `GET`  | `/users/` | List all users |
| `GET`  | `/users/search?query=` | Search users by name or email |
| `GET`  | `/users/:id` | Get a user by ID |
| `GET`  | `/users/logout` | Log out (blacklists the token) |

### Rides
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/rides` | Search & filter rides |
| `GET`    | `/api/rides/myrides` | Rides created by the current user |
| `GET`    | `/api/rides/mychats` | Rides the user can chat in |
| `GET`    | `/api/rides/:id` | Get a single ride |
| `POST`   | `/api/rides` | Create a ride |
| `PATCH`  | `/api/rides/:id` | Update a ride |
| `DELETE` | `/api/rides/:id` | Delete a ride |
| `PUT`    | `/api/rides/:id/status` | Open / close a ride |
| `PUT`    | `/api/rides/:id/join` | Join or leave a ride |
| `PUT`    | `/api/rides/:id/user/:userId/status` | Confirm / cancel a passenger |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/messages/:rideId` | Fetch chat history for a ride |

### Ratings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST`   | `/api/ratings` | Create or update a rating |
| `GET`    | `/api/ratings/user/:userId` | Get a user's ratings & average |
| `DELETE` | `/api/ratings/:id` | Delete your rating |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/admin/users` | List all users |
| `GET`    | `/admin/ratings` | List all ratings |
| `DELETE` | `/admin/users/:userId` | Delete a user & their data |
| `DELETE` | `/admin/ratings/:ratingId` | Delete a rating |
| `PUT`    | `/admin/users/:userId/make-admin` | Promote to admin |
| `PUT`    | `/admin/users/:userId/remove-admin` | Demote from admin |

### Socket.IO Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRideChat`   | Client → Server | Join a ride's chat room |
| `leaveRideChat`  | Client → Server | Leave a ride's chat room |
| `sendMessage`    | Client → Server | Send a message (authorized) |
| `receiveMessage` | Server → Client | Broadcast a new message |

---

##  How It Works

1. **Sign up** and log in your session is secured with a JWT.
2. **Post a ride** as a driver, or **search and join** one as a passenger.
3. Drivers **confirm passengers** from their ride confirmation page.
4. Confirmed riders and the driver coordinate in a **real-time chat room**.
5. After the trip, **rate each other** to build trust in the community.

---

