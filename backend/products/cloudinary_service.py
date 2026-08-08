import logging

import cloudinary
import cloudinary.uploader
from django.conf import settings
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class ImageStorageUnavailable(APIException):
    status_code = 503
    default_detail = "Image storage is temporarily unavailable."
    default_code = "image_storage_unavailable"


class ImageStorageError(APIException):
    status_code = 502
    default_detail = "The image storage operation failed."
    default_code = "image_storage_error"


def configure_cloudinary():
    values = (
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    )
    if not all(values):
        raise ImageStorageUnavailable()
    cloudinary.config(
        cloud_name=values[0],
        api_key=values[1],
        api_secret=values[2],
        secure=True,
    )


def upload_product_image(uploaded_file, product_id):
    configure_cloudinary()
    try:
        result = cloudinary.uploader.upload(
            uploaded_file,
            folder=f"am-store/products/{product_id}",
            resource_type="image",
            use_filename=False,
            unique_filename=True,
            overwrite=False,
        )
    except Exception as exc:
        logger.error(
            "Cloudinary image upload failed (%s)",
            type(exc).__name__,
            extra={"product_id": product_id},
        )
        raise ImageStorageError() from exc

    required = ("public_id", "secure_url", "width", "height", "format")
    if any(result.get(field) in (None, "") for field in required):
        public_id = result.get("public_id")
        if public_id:
            destroy_product_image(public_id, suppress_errors=True)
        raise ImageStorageError("Image storage returned an incomplete response.")
    return {field: result[field] for field in required}


def destroy_product_image(public_id, suppress_errors=False):
    if not public_id:
        return True
    try:
        configure_cloudinary()
        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            invalidate=True,
        )
        if result.get("result") not in {"ok", "not found"}:
            raise RuntimeError(f"Unexpected Cloudinary result: {result.get('result')}")
        return True
    except Exception as exc:
        logger.error("Cloudinary image deletion failed (%s)", type(exc).__name__)
        if suppress_errors:
            return False
        if isinstance(exc, (ImageStorageError, ImageStorageUnavailable)):
            raise
        raise ImageStorageError("The image could not be deleted from storage.") from exc
