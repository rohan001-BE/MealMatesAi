# 🥘 Meal Mate AI — Intelligent Nutrition & Culturally-Tailored Meal Planning Ecosystem

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python)](https://python.org/)
[![Firebase Firestore](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Groq LLaMA 3](https://img.shields.io/badge/Groq-Llama%203.3-F55036?style=flat)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

---

## 📌 1. Project Overview

**Meal Mate AI** is a full-stack, AI-powered nutritional planning platform tailored specifically for traditional South Asian / Pakistani diets as well as global dietary frameworks (Keto, High-Protein, Balanced, Vegetarian, and Vegan).

Unlike generic Western calorie trackers, Meal Mate calculates accurate macronutrients for real regional recipes (e.g., *Daal Roti, Chicken Karahi, Biryani, Pulao, Chapli Kabab, Bhindi Masala*) and uses a hybrid Machine Learning & constraint-satisfaction optimization engine to generate balanced multi-day meal plans in seconds.

---

## 🏗️ 2. High-Level Architecture & Tech Stack

```
                                  ┌─────────────────────────────┐
                                  │     Client Web Browsers     │
                                  │ (Mobile, Tablet, Desktop)   │
                                  └──────────────┬──────────────┘
                                                 │
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │      Next.js 16 App         │
                                  │  (frontend/ - Turbopack)    │
                                  │ 42 Responsive Static Pages  │
                                  └──────────────┬──────────────┘
                                                 │ REST API Calls (Axios)
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │    FastAPI Python Server    │
                                  │ (backend/ - Port 8000)      │
                                  └──────┬───────┬───────┬──────┘
                                         │       │       │
              ┌──────────────────────────┘       │       └─────────────────────────┐
              ▼                                  ▼                                 ▼
   ┌──────────────────────┐          ┌──────────────────────┐         ┌──────────────────────┐
   │  Firebase Firestore  │          │ scikit-learn ML &    │         │  Groq AI & Cloudinary│
   │  (Auth, Plans, Logs) │          │ Constraint Optimizer │         │  (Llama 3.3 Chatbot  │
   │  & Cloud Storage     │          │ (meal_mate_recommender)│       │  & Recipe Media CDN) │
   └──────────────────────┘          └──────────────────────┘         └──────────────────────┘
```

### 💻 Frontend Tech Stack
- **Framework**: [Next.js 16.3.3](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS + Custom Responsive Design System
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (`authStore.js`, `wizardStore.js`)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons & UI**: `lucide-react`, `react-icons`, `react-slick`, `react-toastify`, `canvas-confetti`

### ⚙️ Backend Tech Stack
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Asynchronous Python Web Framework)
- **Database & Auth**: Firebase Admin SDK (Cloud Firestore)
- **Machine Learning**: `scikit-learn`, `joblib`, `pandas`, `numpy`
- **Large Language Models (LLM)**: [Groq Cloud](https://groq.com/) (Llama-3.3-70B-Versatile for Roman Urdu / English nutrition consultations)
- **Media Hosting**: [Cloudinary Python SDK](https://cloudinary.com/) for recipe dish photography
- **Concurrency**: `ThreadPoolExecutor` for parallel database pipeline execution ($\sim350\text{ms}$ dashboard response times)

---

## 📂 3. Repository Directory Structure

```
Meal Mate/
├── backend/                             # FastAPI Python Backend & ML Models
│   ├── app/
│   │   ├── api/                         # REST API Route Endpoints
│   │   │   ├── auth.py                  # User authentication (Email/Password & Google OAuth)
│   │   │   ├── users.py                 # User dashboard, calories & profile updates
│   │   │   ├── meal_plans.py            # Multi-day AI meal generation & regeneration
│   │   │   ├── recipes.py               # 650+ recipe exploration, search & bookmarks
│   │   │   ├── custom_meals.py          # Custom recipe creator & user submissions
│   │   │   ├── feedback.py              # Community reviews & testimonials system
│   │   │   ├── chat.py                  # Groq AI Nutritionist conversational stream
│   │   │   └── ingredients.py           # Supermarket grocery store search
│   │   ├── core/                        # Core Singletons & Configurations
│   │   │   ├── config.py                # Environment variable loader
│   │   │   ├── firebase.py              # Firebase Admin SDK & Firestore client
│   │   │   ├── cloudinary_service.py    # Cloudinary image upload utility
│   │   │   └── security.py              # JWT token generation & password hashing
│   │   ├── ml/                          # Machine Learning Recommender Engine
│   │   │   ├── meal_plan_service.py     # Multi-objective dietary solver
│   │   │   └── model_loader.py          # Model weights loader
│   │   ├── models/                      # Pydantic Schemas & Data Models
│   │   │   └── meal_plan.py
│   │   └── main.py                      # FastAPI App lifespan & middleware
│   ├── models/                          # Serialized ML Model (.joblib)
│   ├── .env                             # Backend Environment Variables (Private)
│   ├── .gitignore                       # Backend Git Ignore (Blocks keys & venv)
│   ├── requirements.txt                 # Python dependencies
│   └── run.py                           # Backend startup entry point
│
├── frontend/                            # Next.js 16 Frontend Web Application
│   ├── src/
│   │   ├── app/                         # Next.js App Router (42 Responsive Pages)
│   │   │   ├── page.js                  # Landing Home Page with video hero & slider
│   │   │   ├── dashboard/               # Live User Bento Dashboard
│   │   │   ├── chatbot/                 # Real-time AI Nutritionist Chat & Live DB Ring
│   │   │   ├── meal-planner/            # AI Meal Planning Wizard Intro
│   │   │   ├── meal-plan-result/        # Multi-Day Interactive Meal Schedule
│   │   │   ├── calories-application/    # Interactive Calorie & Macro Calculator
│   │   │   ├── custom-category/         # Dietary Restriction & Allergy Configurator
│   │   │   ├── recipes/                 # 650+ Recipe Directory & Filters
│   │   │   ├── my-meal-plans/           # Saved Historical Meal Plans
│   │   │   ├── custom-recipes/          # Create & Save Custom Dishes
│   │   │   ├── ingredients/             # Pakistani Online Supermarket Store
│   │   │   ├── reviews/                 # Community Reviews & Experience Submissions
│   │   │   ├── update-profile/          # Profile Avatar & Dietary Calibration
│   │   │   ├── setup-account/           # Multi-Step Calorie & Diet Wizard
│   │   │   ├── login/ & signup/         # Authentication Screens
│   │   │   ├── about/ & how-it-works/   # Platform Educational Pages
│   │   │   ├── contact/ & help/         # Support & FAQ Pages
│   │   │   └── terms/ & privacy/        # Legal & Privacy Policies
│   │   ├── components/                  # Reusable UI Components
│   │   │   ├── Navbar.jsx               # Universal Header & Navigation Console Drawer
│   │   │   ├── Footer.jsx               # Site Footer
│   │   │   ├── LayoutWrapper.jsx        # Top-level Page Frame
│   │   │   └── ...
│   │   ├── lib/                         # Axios API Client & Helper Utilities
│   │   │   └── api.js
│   │   └── store/                       # Zustand Global Stores
│   │       ├── authStore.js             # User session, JWT & avatar state
│   │       └── wizardStore.js           # Multi-step meal plan wizard state
│   ├── public/                          # Static Assets (Images, Videos, Icons)
│   ├── .env                             # Frontend Environment Variables (Private)
│   ├── .gitignore                       # Frontend Git Ignore (Blocks .next & keys)
│   ├── package.json                     # Node.js dependencies
│   └── next.config.mjs                  # Next.js configuration
│
├── recipes/                             # Raw Recipe Datasets & Nutritional Indexes
├── .gitignore                           # Root Git Ignore (Comprehensive Security)
└── README.md                            # Complete System Documentation
```

---

## 📱 4. Frontend Pages Directory (All 42 Routes)

| Route Path | Module / Feature Area | Description |
| :--- | :--- | :--- |
| `/` | **Landing Page** | Dynamic video hero background, feature highlights, and interactive testimonials slider. |
| `/dashboard` | **Core Dashboard** | User macro targets, streak badges, active meal schedule checklist, saved plans preview, and recipe catalog. |
| `/chatbot` | **AI Nutritionist Pro** | Conversational nutrition agent with live database calorie ring, macro breakdown, and consultation history drawer. |
| `/meal-planner` | **Planner Intro** | Multi-objective planning wizard entry with personalization breakdowns. |
| `/meal-plan-result` | **Meal Schedule** | Multi-day interactive meal browser with macros, bilingual cooking recipes, and 1-click regeneration. |
| `/meal-planner/result` | **Planner Results** | Alternative direct view for generated schedules. |
| `/setup-account` | **Onboarding Wizard** | Step 1 of personal calibration wizard (Weight goal, pace, and lifestyle). |
| `/physical-stats` | **Physical Stats** | Calculates BMR and TDEE based on age, gender, height, weight, and activity multiplier. |
| `/dietary-type` | **Dietary Selection** | Select dietary style (Desi, Keto, High-Protein, Vegetarian, Vegan, Balanced). |
| `/meals-schedule` | **Meals Allocation** | Choose daily meal distribution (3 Meals, 4 Meals, or 5 Meals/Day). |
| `/diet-nutrition` | **Nutrition Setup** | Calibration of regional food preferences and dietary restrictions. |
| `/meal-type` | **Meal Type Settings** | Select primary meal course types. |
| `/number-of-days` | **Duration Selector** | Choose meal plan duration (1 Day to 7 Days). |
| `/onboarding` | **User Onboarding** | Welcome and baseline metabolic profiling. |
| `/onboarding/result` | **Onboarding Outcome** | Initial metabolic assessment summary. |
| `/calories-application` | **Calorie Calculator** | Bilingual interactive calculator for daily target calories and protein/carb/fat macro distributions. |
| `/calories-result` | **Calculator Results** | Detailed breakdown of calculated daily maintenance, deficit, and surplus targets. |
| `/custom-category` | **Custom Nutrition** | Configure custom nutritional constraints and ingredient exclusions. |
| `/custom-category/calorie-nutrient` | **Calorie Targets** | Fine-tune custom calorie ranges. |
| `/custom-category/calorie-nutrient-result` | **Nutrient Results** | Calculated custom macro targets. |
| `/custom-category/ingredient-restriction` | **Allergies & Restrictions** | Exclude allergens (Dairy, Gluten, Nuts, Seafood, Beef, etc.). |
| `/custom-category/ingredient-restriction-result` | **Restriction Filter** | Resulting recipe set adhering strictly to restrictions. |
| `/custom-category/options` | **Custom Options** | Additional filtering preferences. |
| `/recipes` | **650+ Recipe Directory** | Searchable recipe explorer with image previews, macros, prep time, and bookmarking. |
| `/my-meal-plans` | **Saved Plan History** | Firestore archive of historical meal plans with multi-day inspection and activation. |
| `/custom-recipes` | **Custom Recipe Creator** | Form to submit and calculate custom recipes with Cloudinary photo uploads. |
| `/ingredients` | **Online Grocery Store** | Direct search engine connected to Pakistani supermarkets (Carrefour, Metro, Naheed, Imtiaz, Daraz). |
| `/reviews` | **Community Stories** | Verified member reviews, rating breakdowns, and interactive feedback submission modal. |
| `/update-profile` | **Account Settings** | Manage user name, avatar upload, password changes, and physical vitals. |
| `/your-diet` | **Diet Summary** | Overview of active dietary settings. |
| `/login` | **Authentication** | Email/Password login and Google Sign-in. |
| `/signup` | **Account Registration** | New user onboarding and account creation. |
| `/about` | **About Platform** | Story and mission of Meal Mate AI. |
| `/how-it-works` | **Process Guide** | Explains the 4-step metabolic and culinary optimization pipeline. |
| `/contact` | **Support** | Contact form and developer assistance. |
| `/help` | **Help Center** | Comprehensive FAQ covering bilingual Roman Urdu support, grocery ordering, and macros. |
| `/terms` | **Terms of Service** | Terms and user agreements. |
| `/privacy` | **Privacy Policy** | Data protection and privacy standards. |

---

## ⚡ 5. Backend REST API Reference

All backend endpoints are prefixed with `/api`.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account with email, username & password | ❌ |
| `POST` | `/api/auth/login` | Authenticate user credentials and return JWT bearer token | ❌ |
| `POST` | `/api/auth/google` | Verify Google ID token and log in / create user account | ❌ |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile and metadata | ✅ |
| `POST` | `/api/auth/logout` | Invalidate user session | ✅ |

### 👤 User Metrics & Dashboard (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/users/dashboard` | **Ultra-Fast Parallel Query**: Returns active plan, history, completed meals & calories | ✅ |
| `PUT` | `/api/users/calories` | Update user daily calorie target and macro ratios in Firestore | ✅ |
| `PUT` | `/api/users/update-dietary-type` | Update dietary preference (Desi, Keto, High-Protein, etc.) | ✅ |
| `POST` | `/api/users/upload-profile-image` | Upload profile avatar to Cloudinary and save URL to Firestore | ✅ |
| `POST` | `/api/users/toggle-meal-completion` | Toggle meal checkbox for today and record live daily calories | ✅ |

### 🍱 Meal Planning & Optimizer (`/api/meal-plans`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/meal-plans/generate` | Run ML multi-objective optimizer to generate $N$-day meal plan | ✅ |
| `POST` | `/api/meal-plans/regenerate` | Re-solve dietary schedule with alternative recipe variations | ✅ |
| `GET` | `/api/meal-plans/history` | Retrieve user's past saved meal plans from Firestore | ✅ |
| `DELETE` | `/api/meal-plans/{plan_id}` | Delete a meal plan from user archives | ✅ |

### 🍲 Recipe Management (`/api/recipes`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/recipes/all` | Fetch catalog of 650+ recipes with macros and images | ❌ |
| `GET` | `/api/recipes/{recipe_id}` | Retrieve individual recipe details and cooking method | ❌ |
| `POST` | `/api/recipes/upload-image` | Upload custom recipe image to Cloudinary | ✅ |
| `POST` | `/api/custom-meals` | Save user-created custom recipe to personal library | ✅ |
| `GET` | `/api/custom-meals` | Retrieve all custom recipes created by the user | ✅ |

### 💬 AI Nutritionist Chatbot (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/chat` | Send prompt to Groq LLaMA 3.3 with user dietary context | ✅ |
| `GET` | `/api/chat/conversations` | Retrieve all historical chat threads | ✅ |
| `GET` | `/api/chat/conversations/{conv_id}` | Retrieve conversation message history | ✅ |
| `DELETE` | `/api/chat/conversations/{conv_id}` | Delete a chat consultation thread | ✅ |

### ⭐ Reviews & Store (`/api/feedback` & `/api/ingredients`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/feedback/submit` | Submit platform rating, review text, and dietary feedback | ✅ |
| `GET` | `/api/feedback/all` | Retrieve approved community reviews | ❌ |
| `GET` | `/api/ingredients/search` | Search grocery stores for recipe ingredients | ❌ |

---

## 🧠 6. Machine Learning & Calorie Engine Pipeline

The core recommendation engine uses a 4-tier hybrid pipeline:

```
[ User Vitals ] ──► [ 1. Metabolic BMR/TDEE Calculator ]
                             │
                             ▼
                    [ 2. Macro Allocation Engine ] (Target Cals, Protein, Carbs, Fats)
                             │
                             ▼
                    [ 3. Constraint & Allergy Filter ] (Desi/Keto/Vegetarian/Gluten-Free)
                             │
                             ▼
                    [ 4. ML Random Forest & Diversity Solver ] ──► [ Complete Multi-Day Plan ]
```

1. **Metabolic Calculation (Mifflin-St Jeor Formula)**:
   $$\text{BMR} = 10 \times \text{weight (kg)} + 6.25 \times \text{height (cm)} - 5 \times \text{age (years)} + s$$
   *(where $s = +5$ for males, $-161$ for females)*.
   $$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$$
2. **Macronutrient Constraint Resolution**:
   Caloric targets are balanced across Breakfast ($25\%$), Lunch ($35\%$), Snack ($10\%$), and Dinner ($30\%$) while maintaining high protein targets for muscle preservation.
3. **Culinary Pairing & Diversity**:
   The model checks ingredient overlap between consecutive days to ensure varied, culturally harmonious meal recommendations.

---

## 🔒 7. Environment Variables & Security Setup

### ⚙️ Backend (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
# Server Config
PORT=8000
HOST=127.0.0.1
ENVIRONMENT=development

# JWT Security
SECRET_KEY=your_super_secret_jwt_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Firebase Admin SDK Credentials
FIREBASE_CREDENTIALS_PATH=meal-mates-16030-firebase-adminsdk-fbsvc-df26a0b29e.json

# Cloudinary Image Hosting
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Groq AI LLM
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 💻 Frontend (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

---

## 🚀 8. Installation & Quickstart Guide

### Prerequisites
- **Node.js**: v18.18.0 or higher (Node 20+ recommended)
- **Python**: v3.10 or higher
- **Firebase Project**: Service account JSON key generated from Firebase Console.

---

### Step 1: Set Up and Run the Backend

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create a Python virtual environment
python -m venv .venv

# 3. Activate the virtual environment
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Place your Firebase credentials JSON in the backend/ directory
# Ensure the filename matches FIREBASE_CREDENTIALS_PATH in backend/.env

# 6. Start the FastAPI server
python run.py
```
> The backend server will be live at `http://127.0.0.1:8000`. API documentation is available at `http://127.0.0.1:8000/docs`.

---

### Step 2: Set Up and Run the Frontend

```bash
# 1. In a new terminal window, navigate to the frontend directory
cd frontend

# 2. Install Node.js dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```
> The frontend will be live at `http://localhost:3000`.

---

### Step 3: Production Build Verification

```bash
# Build the optimized static bundle
npm run build
```
> Expected Output: `✓ Generating static pages (42/42) in X.Xs` with 0 build errors.

---

## 🛡️ 9. Git Security & Ignored Files

All sensitive API keys, private credentials, and binary build artifacts are protected by the root `.gitignore`, `backend/.gitignore`, and `frontend/.gitignore`:
- ❌ `.env` and all `.env.*.local` files are ignored.
- ❌ Firebase service account keys (`*firebase-adminsdk*.json`, `*.pem`, `*.key`) are never pushed.
- ❌ Python virtual environments (`.venv/`, `__pycache__/`, `*.pyc`) are excluded.
- ❌ Node dependencies and Next.js cache (`node_modules/`, `.next/`, `out/`) are excluded.

---

## 👨‍💻 Developed by
**Meal Mate AI Engineering Team** — Crafted with Next.js, FastAPI, and Machine Learning.
