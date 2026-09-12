# watchera-ecommerce
WATCHERA is a premium full-stack e-commerce website for luxury watches, built with Angular, Tailwind CSS, Node.js, Express.js and MongoDB.

# WATCHERA — Premium Watch E-Commerce Website

[![Angular](https://img.shields.io/badge/Frontend-Angular-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![Tailwind CSS](https://img.shields.io/badge/UI-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/API-Express.js-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2451)](https://razorpay.com/)

> **WATCHERA** is a premium full-stack e-commerce platform for luxury watches, designed with a responsive customer storefront and a separate backend API for products, users, carts, orders, and administrative operations.

---

## 📌 Project Overview

WATCHERA is an academic full-stack e-commerce project built around a modern JavaScript/TypeScript stack.

The project documentation describes:

- **Frontend:** Angular + Tailwind CSS
- **Backend:** Node.js + Express.js + CORS
- **Database:** MongoDB / MongoDB Atlas
- **API Testing:** Postman
- **Payment:** Razorpay
- **Development:** Visual Studio Code + Chrome

The application is designed to support a premium shopping journey for watches, including product discovery, filtering, product details, authentication, cart and wishlist management, checkout, payments, order tracking, reviews, customer support, and administrative management.

---

## ✨ Main Features

### Customer Features

- User registration and login
- Profile management
- Product browsing
- Product search
- Advanced filtering
  - Brand
  - Price
  - Movement
  - Gender
  - Category
- Product details and specifications
- High-resolution product galleries
- Shopping cart
- Wishlist
- Coupon / discount support
- Checkout
- Payment processing
- Order confirmation
- Order history
- Order tracking
- Invoice generation
- Ratings and reviews
- Customer support / inquiry functionality

### Admin Features

- Secure admin login
- Dashboard and business overview
- Product CRUD
  - Add product
  - View product
  - Update product
  - Delete product
- Category management
- Inventory / stock management
- Customer management
- Order management
- Shipping status management
- Coupon management
- Sales and revenue reporting
- Promotional / featured product management

### Backend Capabilities

- REST API architecture
- MongoDB data persistence
- Authentication and authorization
- Role-based access
- CORS configuration
- Secure environment-based configuration
- Product, user, cart, wishlist, coupon and order APIs
- Payment integration support

---

# 🏗️ Project Structure

The current local project is organized as a two-application structure:

```text
watchera/
│
├── client/                    # Angular frontend
│   ├── .angular/              # Angular local cache (not committed)
│   ├── .vscode/               # VS Code workspace settings
│   ├── dist/                  # Angular build output (not committed)
│   ├── node_modules/          # Frontend dependencies (not committed)
│   ├── public/                # Public/static assets
│   ├── src/                   # Main Angular source code
│   ├── .editorconfig
│   ├── .gitignore
│   ├── .postcssrc.json
│   ├── angular.json           # Angular workspace configuration
│   ├── package.json           # Frontend dependencies/scripts
│   ├── package-lock.json
│   ├── README.md
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   └── tsconfig.spec.json
│
├── server/                   # Node.js + Express backend
│   ├── node_modules/         # Backend dependencies (not committed)
│   ├── src/                  # Backend source code
│   ├── .env                  # Local secrets/configuration (NEVER COMMIT)
│   ├── .gitignore
│   └── package.json          # Backend dependencies/scripts
│
└── README.md                 # Main project documentation
```

### Important

The `node_modules`, Angular build/cache directories, and real `.env` values are local development files and should not be pushed to GitHub.

---

# 💻 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Angular |
| UI | Tailwind CSS |
| Language | TypeScript / JavaScript |
| Backend | Node.js |
| API Framework | Express.js |
| Browser Security / Communication | CORS |
| Database | MongoDB |
| Cloud Database Option | MongoDB Atlas |
| Payments | Razorpay |
| API Testing | Postman |
| Editor | Visual Studio Code |
| Browser Testing | Google Chrome |

---

# ✅ Prerequisites

Before running WATCHERA on a new computer, install:

1. **Node.js**
2. **npm** (installed with Node.js)
3. **Git**
4. **Visual Studio Code**
5. **MongoDB / MongoDB Atlas access**
6. A modern browser such as Chrome

Verify Node.js and npm:

```bash
node --version
npm --version
```

Verify Git:

```bash
git --version
```

---

# 🚀 Run WATCHERA Locally

The frontend and backend are separate applications, so they should normally be run in two terminal windows.

## 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/watchera-ecommerce.git
cd watchera
```

> Replace `YOUR-USERNAME` and the repository name with the actual GitHub repository URL.

---

## 2. Install Frontend Dependencies

Open a terminal in the project root:

```bash
cd client
npm install
```

`npm install` uses the project's `package.json` and lock file to install the required packages.

---

## 3. Configure the Backend Environment

Open:

```text
server/.env
```

The repository should contain a safe template such as:

```text
server/.env.example
```

Create your own local:

```text
server/.env
```

and add the environment values required by the backend.

Typical configuration can include items such as:

```env
PORT=YOUR_BACKEND_PORT
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_JWT_SECRET
RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_KEY_SECRET
```

### Security Rule

**Never commit real credentials to GitHub.**

Do not publish:

- MongoDB passwords
- JWT secrets
- Razorpay secret keys
- API keys
- Email passwords
- Private tokens
- Production credentials

Only publish placeholder values in `.env.example`.

---

## 4. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

---

## 5. Start the Backend

First inspect the available npm scripts:

```bash
npm run
```

Use the backend script defined in `server/package.json`.

For example, if the project defines:

```json
"scripts": {
  "start": "node ..."
}
```

run:

```bash
npm start
```

If the project defines a development script such as:

```json
"dev": "nodemon ..."
```

run:

```bash
npm run dev
```

> Do not invent a backend start command. The authoritative command is the `scripts` section of `server/package.json`.

---

## 6. Start the Angular Frontend

Open another terminal:

```bash
cd client
```

Then use the Angular development server:

```bash
npx ng serve
```

The Angular CLI will compile the application and start the development server.

You can also use the project's `start` script if `client/package.json` provides one:

```bash
npm start
```

The terminal will display the local frontend address.

A common Angular development address is:

```text
http://localhost:4200
```

but use the URL shown by your terminal if the project is configured for another port.

---

# 🔌 Frontend ↔ Backend Connection

The Angular client communicates with the Express backend through HTTP API requests.

Typical local architecture:

```text
Browser
   │
   ▼
Angular Client
   │
   │ HTTP / REST API
   ▼
Express + Node.js Server
   │
   ▼
MongoDB
```

For payment-enabled flows:

```text
Customer
   │
   ▼
Angular Checkout
   │
   ▼
Backend API
   │
   ▼
Razorpay
   │
   ▼
Payment Confirmation
   │
   ▼
Order Creation / Update
```

If the frontend cannot reach the backend, verify:

- the backend is running;
- the API base URL is correct;
- the backend port matches the frontend configuration;
- CORS settings allow the frontend origin;
- MongoDB is connected;
- required `.env` values exist.

---

# 🗄️ Database

WATCHERA uses MongoDB for application data.

The documented data model includes entities such as:

- Users
- Products
- Categories
- Cart
- Wishlist
- Coupons
- Shipping Zones
- Orders

The product model includes fields for product identity, brand, SKU, category, pricing, stock, images, movement, case/strap materials, dial color, case size, water resistance, warranty and product-status flags.

The order model includes user, order items, shipping address, payment method, price breakdown, payment status, delivery status, order status, coupon discount and timestamps.

---

# 🧪 Testing

The project should be tested at multiple levels.

## Frontend Tests

Check:

- Navigation
- Product search
- Product filters
- Product details
- Login / registration
- Cart
- Wishlist
- Checkout
- Responsive layout
- User profile
- Order history

## Backend / API Tests

Use Postman to check:

- Authentication APIs
- Product APIs
- User APIs
- Cart APIs
- Wishlist APIs
- Coupon APIs
- Order APIs
- Admin APIs
- Payment-related endpoints

## Database Tests

Verify:

- Products are stored correctly
- User records are created correctly
- Cart updates persist
- Orders are created correctly
- Inventory changes correctly
- Coupon usage is handled correctly

## Responsive Testing

Test the UI on:

- Desktop
- Laptop
- Tablet
- Mobile

---

# 🛡️ Security Guidelines

Before sharing the repository publicly:

### Never commit

```text
.env
.env.*
node_modules/
dist/
.angular/
```

### Never hard-code

```text
Database passwords
JWT secrets
Payment secrets
Private API keys
```

### Recommended approach

Commit:

```text
.env.example
```

Example:

```env
MONGO_URI=
JWT_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
PORT=
```

but keep the real values only inside your local `server/.env`.

---

# 📦 Dependency Installation After Cloning

A new developer does **not** need to copy `node_modules`.

They only need to clone the project and run:

```bash
cd client
npm install
```

and:

```bash
cd ../server
npm install
```

This recreates the required dependencies from the package manifests and lock files.

---

# 🧭 Recommended Development Workflow

After cloning:

```text
1. Clone repository
        ↓
2. Install client dependencies
        ↓
3. Configure server/.env
        ↓
4. Install server dependencies
        ↓
5. Start MongoDB / verify Atlas
        ↓
6. Start Express backend
        ↓
7. Start Angular frontend
        ↓
8. Open the local website
        ↓
9. Test customer workflows
        ↓
10. Test admin workflows
```

---

# 🔄 Git Workflow for Contributors

Before starting work:

```bash
git pull
```

After making changes:

```bash
git status
```

Stage changes:

```bash
git add -A
```

Create a meaningful commit:

```bash
git commit -m "feat: improve product filtering"
```

Push:

```bash
git push
```

---

# 📝 Recommended Commit Message Style

Use clear commit messages:

```text
feat: add product search
feat: improve checkout flow
feat: add wishlist support
feat: add admin product management
fix: resolve cart quantity bug
fix: correct product filter issue
fix: resolve order status update
refactor: improve product service
docs: update setup instructions
style: improve mobile layout
```

Avoid vague messages such as:

```text
update
changes
final
new
test
```

---

# 🌐 Production Build

For a production frontend build:

```bash
cd client
npx ng build
```

Angular creates a production build in the configured `dist/` output directory.

The production deployment must also be configured to point API requests to the production backend rather than the local development server.

Backend deployment requires:

- Node.js runtime
- Production environment variables
- MongoDB connection
- Correct CORS configuration
- Secure payment configuration
- HTTPS
- Production API URL

---

# 📁 Suggested Repository Layout for GitHub

A clean GitHub repository should look approximately like:

```text
watchera/
│
├── client/
│   ├── public/
│   ├── src/
│   ├── angular.json
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── docs/
│   ├── WATCHERA_PROJECT_DOCUMENTATION.pdf
│   └── screenshots/
│
├── .gitignore
├── README.md
└── LICENSE
```

> Keep the actual `server/.env` local and out of GitHub.

---

# 📚 Documentation

The project documentation covers:

- Introduction
- Project profile
- Environment requirements
- Technology stack
- System analysis
- Feasibility study
- Requirement analysis
- Proposed system
- Project modules
- DFD / UML
- Use cases
- Activity flows
- ER / class diagram
- Database design
- User interface
- Software testing
- Future enhancements
- Conclusion

The documentation can be stored under:

```text
docs/WATCHERA_PROJECT_DOCUMENTATION.pdf
```

---

# 🎯 Project Goals

WATCHERA focuses on:

- Premium watch-store presentation
- Responsive user experience
- Secure account management
- Product discovery
- Easy shopping cart and checkout
- Order management
- Inventory control
- Administrative reporting
- Scalable full-stack architecture

---

# 🔮 Future Enhancement Ideas

Potential future improvements include:

- AI-powered watch recommendations
- AI-assisted product imaging
- 3D / virtual try-on
- Native mobile application
- International currencies
- Multilingual support
- Predictive sales analytics
- Automated stock alerts
- Loyalty and membership programs
- Automated email / SMS notifications

---

# 👨‍🎓 Academic Project

**Project:** WATCHERA — E-Commerce Website of Watch

**Course:** Bachelor of Computer Applications (BCA)

**Semester:** BCA Sem VI

**Academic Year:** 2025–26

**Institute:** SDJ International College, Vesu

**Guided By:** Prof. Disha Nalwala

---

# 👥 Project Team

- Bhingradia Fenil Nitinbhai
- Savsani Ronak Anilbhai
- Avaiya Nand Rajkumar

---

# ⚠️ Important Project Notes

1. This repository contains the source code for the WATCHERA academic project.
2. Local environment variables are intentionally excluded from version control.
3. Database credentials must be supplied by each developer in their own environment.
4. Payment credentials must never be committed to GitHub.
5. Backend startup commands must match the scripts defined in `server/package.json`.
6. Frontend startup commands must match the scripts/configuration defined in `client/package.json` and `angular.json`.

---

# 🙌 Getting Help

When troubleshooting, check in this order:

```text
1. Is Node.js installed?
2. Is MongoDB / MongoDB Atlas reachable?
3. Is server/.env configured?
4. Did npm install complete successfully?
5. Is the backend running?
6. Is the frontend running?
7. Is the frontend API URL correct?
8. Is CORS configured correctly?
9. Check the browser Console.
10. Check the backend terminal logs.
11. Test the API with Postman.
```

---

## 📄 License

This project was created as an academic/educational project.

Unless a separate open-source license is added to the repository, reuse and redistribution should be treated as subject to the project's ownership and academic requirements.
