import os
import cloudinary
import cloudinary.uploader
from app.core.config import settings

if settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    print("[Cloudinary] Cloudinary Configured Successfully.")

def upload_image(file_obj, folder: str = "meal_mates") -> str:
    """
    Uploads an image file or bytes to Cloudinary and returns the secure URL.
    """
    try:
        response = cloudinary.uploader.upload(
            file_obj,
            folder=folder,
            resource_type="image"
        )
        return response.get("secure_url", "")
    except Exception as e:
        print(f"[Cloudinary Error] Cloudinary Upload Error: {e}")
        raise ValueError(f"Failed to upload image to Cloudinary: {str(e)}")
