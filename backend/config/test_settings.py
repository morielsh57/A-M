from config.settings import *  # noqa: F403


SECRET_KEY = "test-only-secret-key-not-for-production"

DATABASES = {  # noqa: F405
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
EMAIL_PROVIDER = "smtp"
DEFAULT_FROM_EMAIL = "A&M Fashion <am.fashion.service@gmail.com>"

PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
