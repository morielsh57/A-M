from unittest.mock import patch

from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework import exceptions, serializers
from rest_framework.test import APIClient, APIRequestFactory
from rest_framework.request import Request
from rest_framework.views import APIView

from config.api.exceptions import api_exception_handler
from config.api.pagination import StandardPageNumberPagination


class _FailureView(APIView):
    def get(self, request):
        raise RuntimeError("database password: must-never-leak")


class ApiContractTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_success_response_uses_envelope(self):
        response = self.client.get(reverse("api-health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"success": True, "data": {"status": "ok"}})

    def test_method_error_uses_error_envelope(self):
        response = self.client.post(reverse("api-health"), {})

        self.assertEqual(response.status_code, 405)
        self.assertEqual(response.json()["success"], False)
        self.assertEqual(response.json()["error"]["code"], "method_not_allowed")

    def test_validation_error_preserves_field_names(self):
        exc = serializers.ValidationError({"email": ["Enter a valid email address."]})

        response = api_exception_handler(exc, {})

        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data["error"]["details"])

    def test_pagination_has_bounded_page_size_and_metadata(self):
        request = Request(APIRequestFactory().get("/items/?page=2&page_size=2"))
        paginator = StandardPageNumberPagination()

        page = paginator.paginate_queryset([1, 2, 3, 4, 5], request)
        response = paginator.get_paginated_response(page)

        self.assertEqual(page, [3, 4])
        self.assertEqual(
            response.data["pagination"],
            {
                "page": 2,
                "page_size": 2,
                "total_pages": 3,
                "total_items": 5,
                "next": "http://testserver/items/?page=3&page_size=2",
                "previous": "http://testserver/items/?page_size=2",
            },
        )

    @patch("config.api.exceptions.logger.exception")
    def test_unexpected_error_is_sanitized(self, _logger):
        request = APIRequestFactory().get("/failure/")

        response = _FailureView.as_view()(request)
        response.render()

        self.assertEqual(response.status_code, 500)
        self.assertNotIn("must-never-leak", response.content.decode())
        self.assertEqual(response.data["error"]["code"], "internal_server_error")

    def test_openapi_schema_and_swagger_ui_are_available(self):
        schema = self.client.get(reverse("api-schema"))
        docs = self.client.get(reverse("api-docs"))

        self.assertEqual(schema.status_code, 200)
        self.assertIn("application/vnd.oai.openapi", schema["Content-Type"])
        self.assertContains(docs, "SwaggerUIBundle")
