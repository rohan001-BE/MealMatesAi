# Meal Mate AI — Production FastAPI Backend & Machine Learning Microservice 🥗🤖🔥

A complete, high-performance, AI-first backend built with **Python FastAPI**, **Firebase Admin SDK (Firestore Database)**, **Cloudinary**, **Groq AI (Llama 3.3)**, and **Machine Learning Recommendation & Nutrition Engines**.

---

## 🌟 Key Architecture & Features

```text
ML/
├── app/
│   ├── main.py                       # FastAPI Application, Lifespan, CORS, API Routers
│   ├── core/
│   │   ├── config.py                 # Pydantic Settings (.env, Firebase, Cloudinary, Groq)
│   │   ├── firebase.py               # Firebase Admin SDK & Firestore client initialization
│   │   ├── security.py               # Password hashing (bcrypt) & signed JWT tokens
│   │   ├── deps.py                   # FastAPI Auth Dependency (Bearer JWT & Firebase token)
│   │   └── cloudinary_service.py     # Cloudinary media and avatar upload service
│   ├── api/
│   │   ├── auth.py                   # Email/Password Signup, Login, Google Auth, Me
│   │   ├── users.py                  # User Profile, Mifflin-St Jeor Calories, Profile Pic Upload
│   │   ├── meal_plans.py             # Generate Meal Plan, History in Firestore, Regenerate, Delete
│   │   ├── recommendations.py        # Top-K AI Single-Slot Recommendations (KNN Cosine Similarity)
│   │   ├── recipes.py                # 727+ Recipes Catalog, Full-Text Search, Multi-Filter
│   │   ├── custom_meals.py           # Search & Refresh meals by calories + specific macro target
│   │   ├── groq_chatbot.py           # Groq Llama-3 AI Nutritionist with Firestore Multi-Turn History
│   │   ├── feedback.py               # User Feedback submission to Firestore
│   │   ├── visuals.py                # High-res ML visual analytics & confusion matrix
│   │   └── health.py                 # Health & Service Status check
│   ├── schemas/                      # Typed Pydantic request/response models
│   ├── services/                     # Business logic, Firestore transactions, Groq API, Nutrition
│   └── ml/                           # KNN Recommender, Optimizer, Model Loader
├── scripts/
│   ├── seed_firestore_recipes.py     # Batch import all 727 recipes into Firestore
│   └── test_backend_flow.py          # 12-Step automated integration test suite
├── requirements.txt
├── .env                              # Credentials (Firebase, Cloudinary, Groq, JWT)
└── run.py                            # 1-Click PyCharm server launcher
```

---

## 🚀 1-Click PyCharm Execution

1. Open `d:\Client Work\Meal mate\ML` in **PyCharm**.
2. Go to **Settings (Ctrl+Alt+S)** → **Project: ML** → **Python Interpreter** → select `.\.venv\Scripts\python.exe`.
3. In the project file tree on the left, right-click [`run.py`](file:///d:/Client%20Work/Meal%20mate/ML/run.py) and click **Run 'run'** (or press `Shift + F10`).
4. Open your browser at:
   👉 **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** to test the interactive Swagger documentation.

---

## 📡 API Endpoints Overview

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Health** | `/health` | `GET` | Service status, model version, indexed recipe count |
| **Auth** | `/api/auth/signup` | `POST` | Email/Password registration with bcrypt + JWT |
| **Auth** | `/api/auth/login` | `POST` | Email/Password login |
| **Auth** | `/api/auth/google` | `POST` | Google Sign-in/Sign-up with automatic Google avatar sync |
| **Auth** | `/api/auth/me` | `GET` | Get current authenticated user profile |
| **Users** | `/api/users/calories` | `POST` | Calculate BMR/TDEE & save daily calories in Firestore |
| **Users** | `/api/users/profile` | `GET` | Get full user profile, calories, and preferences |
| **Users** | `/api/users/profile` | `PUT` | Update user metrics, diet, or meal slots |
| **Users** | `/api/users/profile-image` | `POST` | Upload custom profile picture to Cloudinary |
| **Meal Plans** | `/api/meal-plans/generate` | `POST` | Generate 1-14 Day balanced meal plan (saves to Firestore) |
| **Meal Plans** | `/api/meal-plans/history` | `GET` | Get saved meal plans history for user |
| **Meal Plans** | `/api/meal-plans/regenerate` | `POST` | Regenerate meal plan with fresh recipe candidates |
| **Meal Plans** | `/api/meal-plans/{id}` | `DELETE` | Delete saved meal plan from Firestore |
| **AI Recommender** | `/api/recommendations` | `POST` | Top-K single-slot ML recommendations |
| **Recipes** | `/api/recipes` | `GET` | Browse, search, and filter 727+ recipes |
| **Recipes** | `/api/recipes/{id}` | `GET` | Get recipe details, ingredients & instructions |
| **Custom Meals** | `/api/custom-meals/search` | `POST` | Match exact calories + specific nutrient (Protein, Carbs, etc.) |
| **Custom Meals** | `/api/custom-meals` | `GET` | Get user saved custom nutrient meals |
| **Groq Chatbot** | `/api/chat` | `POST` | Chat with AI Nutritionist (Groq Llama-3) |
| **Groq Chatbot** | `/api/chat/conversations` | `GET` | Get list of user chat threads from Firestore |
| **Groq Chatbot** | `/api/chat/conversations/{id}` | `GET` | Get full messages in conversation thread |
| **Feedback** | `/api/feedback` | `POST` | Submit reviews/feedback to Firestore |

---

## 🧪 Automated Testing

Run the complete 12-scenario integration test suite:
```powershell
python scripts/test_backend_flow.py
```
