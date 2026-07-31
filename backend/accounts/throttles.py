import hashlib

from rest_framework.throttling import SimpleRateThrottle


class VerificationResendEmailThrottle(SimpleRateThrottle):
    scope = "verification_resend_email"

    def get_cache_key(self, request, view):
        email = str(request.data.get("email", "")).strip().lower()
        if not email:
            return None
        identifier = hashlib.sha256(email.encode("utf-8")).hexdigest()
        return self.cache_format % {"scope": self.scope, "ident": identifier}


class VerificationResendIPThrottle(SimpleRateThrottle):
    scope = "verification_resend_ip"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
