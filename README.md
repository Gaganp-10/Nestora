# 🏠 Nestora Frontend

**India's most trusted PG & Hostel Finder** — A modern React.js frontend for the Nestora platform.

---

## 🚀 Quick Start

```bash
# 1. Navigate into the frontend folder
cd nestora-frontend

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will open at **http://localhost:3000**

> Make sure the Flask backend is running at **http://localhost:5000** before starting.

---

## 🗂️ Folder Structure

```
nestora-frontend/
├── public/
├── src/
│   ├── api/
│   │   └── axios.js          # Axios instance + JWT interceptors
│   ├── context/
│   │   └── AuthContext.jsx   # Global auth state + ProtectedRoute
│   ├── components/
│   │   ├── Navbar.jsx         # Sticky top navbar (auth-aware)
│   │   ├── Footer.jsx         # Site footer
│   │   ├── HostelCard.jsx     # Hostel listing card
│   │   ├── SearchBar.jsx      # City/area/room-type search
│   │   ├── FilterSidebar.jsx  # Browse page filter panel
│   │   ├── ReviewCard.jsx     # Individual review display
│   │   ├── ImageGallery.jsx   # Photo gallery with thumbnails
│   │   ├── StarRating.jsx     # Star rating display
│   │   └── Loader.jsx         # Loading spinner
│   ├── pages/
│   │   ├── Home.jsx           # Landing page with hero, features
│   │   ├── Browse.jsx         # Search & filter hostels
│   │   ├── HostelDetail.jsx   # Single hostel full view
│   │   ├── Login.jsx          # Owner login
│   │   ├── Register.jsx       # Owner registration
│   │   ├── Dashboard.jsx      # Owner dashboard (protected)
│   │   ├── AddHostel.jsx      # Add new hostel (protected)
│   │   ├── EditHostel.jsx     # Edit hostel (protected)
│   │   └── NotFound.jsx       # 404 page
│   ├── styles/
│   │   ├── global.css         # Design system tokens + global styles
│   │   ├── Navbar.css
│   │   ├── Footer.css
│   │   ├── Home.css
│   │   ├── Browse.css
│   │   ├── HostelCard.css
│   │   ├── HostelDetail.css
│   │   ├── Auth.css           # Login + Register shared styles
│   │   ├── Dashboard.css
│   │   └── Forms.css          # AddHostel + EditHostel styles
│   ├── utils/
│   │   └── helpers.js         # formatCurrency, formatDate, getRentRange, etc.
│   ├── App.jsx                # Route definitions
│   └── main.jsx               # React entry point
├── .env                       # Environment variables
├── index.html
└── package.json
```

---

## 🔌 API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Owner login → returns JWT token |
| POST | `/api/auth/register` | Owner registration |
| GET | `/api/hostels` | List hostels with filters & pagination |
| GET | `/api/hostels/:id` | Get single hostel detail |
| POST | `/api/hostels` | Create new hostel (protected) |
| PUT | `/api/hostels/:id` | Update hostel (protected) |
| DELETE | `/api/hostels/:id` | Delete hostel (protected) |
| GET | `/api/hostels/my` | Owner's own listings (protected) |
| POST | `/api/rooms` | Add room to hostel (protected) |
| PUT | `/api/rooms/:id` | Update room (protected) |
| GET | `/api/reviews/hostel/:id` | Get hostel reviews |
| POST | `/api/reviews/hostel/:id` | Submit a review |
| POST | `/api/images/hostel/:id` | Upload hostel images (protected) |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| `--primary` | `#E85D26` (Nestora Orange) |
| `--secondary` | `#1A1A2E` (Dark Navy) |
| `--success` | `#10B981` |
| `--danger` | `#EF4444` |
| `--radius` | `12px` |
| Font | Inter (Google Fonts) |

---

## 🔐 Auth Flow

1. Owner registers via `/register` → JWT token stored in `localStorage` as `nestora_token`
2. All protected API calls automatically include `Authorization: Bearer <token>` via Axios interceptor  
3. On `401` response → token is cleared → user redirected to `/login`
4. Protected routes (`/dashboard`, `/dashboard/add`, `/dashboard/edit/:id`) redirect to `/login` if not authenticated

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout Change |
|-----------|---------------|
| `> 1024px` | Full desktop layout |
| `768px – 1024px` | Tablet — 2 column grid, compact nav |
| `< 768px` | Mobile — hamburger menu, single column, filter drawer |

---

## 🔧 Environment Variables

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Nestora
```

---

## 🏗️ Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18.2+ | UI framework |
| Vite | 5.x | Build tool & dev server |
| React Router DOM | 6.20+ | Client-side routing |
| Axios | 1.6+ | HTTP client with interceptors |
| React Hook Form | 7.48+ | Form validation |
| Plain CSS | — | Styling (no Tailwind) |

---

## 🧪 Development Tips

- All API calls show a loading spinner and handle errors gracefully
- Images that fail to load show a `🏠` placeholder automatically
- The `FilterSidebar` syncs with URL query params (bookmark-friendly)
- `console.log` statements are left in for debugging — remove for production

---

## 📦 Build for Production

```bash
npm run build
```

Output is generated in the `dist/` folder.

---

*Built with ❤️ for Nestora — India's PG & Hostel Finder*
