import os
import sys
import uvicorn

# Ensure the ML directory is on the python search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

if __name__ == "__main__":
    # Ensure stdout handles UTF-8 on Windows
    if sys.platform == "win32":
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    print("=" * 60)
    print(">> Starting Meal Mate AI Backend Server")
    print(">> Swagger Documentation: http://127.0.0.1:8000/docs")
    print("=" * 60)
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[os.path.join(CURRENT_DIR, "app")]
    )
