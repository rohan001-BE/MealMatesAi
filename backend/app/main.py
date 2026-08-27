import os
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.firebase import init_firebase
from app.ml.model_loader import model_loader

from app.api import (
    auth,
    users,
    planners,
    meal_plans,
    recommendations,
    recipes,
    custom_meals,
    groq_chatbot,
    feedback,
    visuals,
    health
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("[Server] STARTING MEAL MATE AI & FASTAPI BACKEND SERVER (ULTRA-FAST)")
    print("=" * 60)
    
    # 1. Initialize Firebase Firestore
    try:
        init_firebase()
    except Exception as e:
        print(f"[Warning] Firebase initialization warning: {e}")

    # 2. Warm up ML model and Inverted Search Indexes
    try:
        model_loader.get_bundle()
    except Exception as e:
        print(f"[Warning] ML Model warm-up warning: {e}")

    print("[Server] All services, models, and fast indexes ready.")
    print("=" * 60)
    yield
    print("[Server] Shutting down Meal Mate API Server.")

app = FastAPI(
    title="Meal Mate AI — Production Machine Learning & Backend API",
    description="""
9. **Feedback:** User reviews and ratings in Firestore.
10. **Visual Analytics & Confusion Matrix:** High-res ML evaluation charts.
    """,
    version="2.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Performance Middleware: Measure Request-Response Latency
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time * 1000:.2f}ms"
    return response

# 2. GZip Compression Middleware (Compress payloads > 1000 bytes)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Standardized Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Unhandled Error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"success": False, "detail": "Internal server error occurred. Please try again."}
    )

# Mount Static Visuals if present
visuals_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "visuals")
if os.path.exists(visuals_dir):
    app.mount("/static/visuals", StaticFiles(directory=visuals_dir), name="visuals")

# Register All API Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(planners.router)
app.include_router(meal_plans.router)
app.include_router(recommendations.router)
app.include_router(recipes.router)
app.include_router(custom_meals.router)
app.include_router(groq_chatbot.router)
app.include_router(feedback.router)
app.include_router(visuals.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
