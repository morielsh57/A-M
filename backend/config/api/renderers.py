from rest_framework.renderers import JSONRenderer


class EnvelopedJSONRenderer(JSONRenderer):
    """Wrap successful API payloads in the project-wide response envelope."""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = (renderer_context or {}).get("response")

        if response is not None and response.status_code == 204:
            return b""

        if response is not None and response.status_code < 400:
            if not (isinstance(data, dict) and data.get("success") is True):
                if isinstance(data, dict) and "results" in data and "pagination" in data:
                    data = {
                        "success": True,
                        "data": data["results"],
                        "meta": {"pagination": data["pagination"]},
                    }
                else:
                    data = {"success": True, "data": data}

        return super().render(data, accepted_media_type, renderer_context)
