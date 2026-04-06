# 🍽 RestaurantMap – Full-Stack Restaurant Recommendation System

A full-stack web application for restaurant discovery with an interactive map, built with:
- **Database**: Oracle SQL / PL-SQL
- **Backend**: Node.js + Express + oracledb
- **Frontend**: React + Vite + Leaflet.js + OpenStreetMap

---

## 📁 Project Structure

```
restaurant-app/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── connection.js       # Oracle DB pool setup
│   │   ├── routes/
│   │   │   ├── restaurants.js      # GET/POST restaurants
│   │   │   ├── reviews.js          # POST review
│   │   │   ├── users.js            # Register / login / favorites
│   │   │   └── admin.js            # Approve / reject / delete
│   │   └── server.js               # Express app entry point
│   ├── .env                        # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MapView.jsx         # Leaflet map with custom markers
│   │   │   ├── RestaurantList.jsx  # Sidebar cards
│   │   │   ├── DetailPanel.jsx     # Map overlay detail + review form
│   │   │   ├── AuthModal.jsx       # Login / register modal
│   │   │   └── AddRestaurantModal.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.jsx         # Auth context
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx        # Main map page
│   │   │   └── AdminPage.jsx       # Admin dashboard
│   │   ├── services/
│   │   │   └── api.js              # Axios API service layer
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── database/
│   └── schema.sql                  # All tables, sequences, triggers, seed data
│
└── README.md
```

---

## ⚙️ Prerequisites

- **Node.js** v18 or higher
- **Oracle Database** (XE 21c recommended, or 19c/21c)
- **SQL Developer** (to run the schema script)
- npm or yarn

---

## 🗄️ Step 1 – Database Setup

1. Open **SQL Developer** and connect to your Oracle DB (as shown in your screenshot with `Restaurant_DB`).

2. Open the file `database/schema.sql`.

3. Run the entire script. It will:
   - Drop and recreate all tables
   - Create sequences and triggers
   - Insert seed data (5 Bengaluru restaurants, cuisines, sample reviews)

4. Verify with:
   ```sql
   SELECT TABLE_NAME FROM USER_TABLES ORDER BY TABLE_NAME;
   ```
   You should see: `CUISINES`, `FAVORITES`, `RESTAURANTS`, `RESTAURANT_CUISINE`, `REVIEWS`, `USERS`

---

## 🖥️ Step 2 – Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your Oracle credentials:
```env
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECTION_STRING=localhost:1521/XEPDB1
PORT=5000
FRONTEND_URL=http://localhost:5173
```

> **Connection string formats:**
> - Oracle XE 21c: `localhost:1521/XEPDB1`
> - Oracle XE 11g: `localhost:1521/XE`
> - With service name: `localhost:1521/ORCLPDB1`

Start the backend:
```bash
npm run dev     # development (with nodemon auto-restart)
# or
npm start       # production
```

Test it: `http://localhost:5000/health` should return `{"status":"OK"}`

---

## 🌐 Step 3 – Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 🚀 Full Startup (both terminals)

**Terminal 1 – Backend:**
```bash
cd restaurant-app/backend
npm install
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd restaurant-app/frontend
npm install
npm run dev
```

---

## 🔑 Default Login Credentials

The seed data creates these users (password is stored as `btoa(password)` in this demo):

| Username | Email | Password | Role |
|----------|-------|----------|------|
| admin | admin@restaurant.com | admin123 | ADMIN |
| john_doe | john@example.com | password | USER |

> **Note:** The app uses `btoa()` (base64) as a placeholder hash for demo purposes.
> In production, use **bcrypt** on the backend and never send raw passwords.

To make login work with seed data, update the PASSWORD_HASH values in your DB:
```sql
-- btoa('admin123') = 'YWRtaW4xMjM='
UPDATE USERS SET PASSWORD_HASH = 'YWRtaW4xMjM=' WHERE USERNAME = 'admin';

-- btoa('password') = 'cGFzc3dvcmQ='
UPDATE USERS SET PASSWORD_HASH = 'cGFzc3dvcmQ=' WHERE USERNAME = 'john_doe';
COMMIT;
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/restaurants` | All approved restaurants |
| GET | `/api/restaurants/:id` | Single restaurant + reviews |
| POST | `/api/restaurants` | Submit new restaurant (pending) |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/reviews/restaurant/:id` | Reviews for a restaurant |
| POST | `/api/users/register` | Register user |
| POST | `/api/users/login` | Login |
| GET | `/api/users/:id/favorites` | User's favorites |
| POST | `/api/users/:id/favorites` | Add to favorites |
| GET | `/api/admin/pending` | Pending restaurants (admin) |
| PUT | `/api/admin/restaurants/:id/approve` | Approve restaurant |
| PUT | `/api/admin/restaurants/:id/reject` | Reject restaurant |
| DELETE | `/api/admin/restaurants/:id` | Delete restaurant |
| GET | `/health` | Health check |

---

## ✨ Features

- 🗺️ Interactive Leaflet map with OpenStreetMap tiles
- 📍 Custom map markers (active/selected states)
- 🔍 Search + filter by cuisine and price range
- ⭐ Star rating submission
- 👤 User authentication (register / login)
- ♡ Favorite restaurants
- ➕ Submit new restaurants (pending admin approval)
- 🛡️ Admin dashboard to approve/reject/delete submissions
- 📱 Responsive layout (mobile-friendly)

---

## 🛠️ Troubleshooting

**Oracle connection fails:**
- Ensure Oracle DB is running: check Windows Services or `lsnrctl status`
- Verify connection string matches your Oracle edition
- Try thin mode (oracledb v6+ supports thin mode by default, no Oracle Client needed)

**"ORA-12541: TNS:no listener":**
- Start Oracle listener: `lsnrctl start`

**Frontend shows no restaurants:**
- Check backend is running on port 5000
- Check browser console for CORS or network errors
- Verify restaurants have `STATUS = 'APPROVED'` in DB

**Map not loading:**
- Ensure you have internet access (OpenStreetMap tiles are fetched live)
- Check browser console for Leaflet errors
