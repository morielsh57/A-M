# A&M REST API standards

## URLs and content type

- Product endpoints live under `/api/v1/`.
- Requests and responses use JSON and UTF-8.
- OpenAPI is served at `/api/schema/`; interactive Swagger UI is at `/api/docs/`.

## Requests

- Use `Content-Type: application/json` for request bodies and validate them with
  a DRF serializer. Unknown or malformed input must return a `400` error.
- Use lower-case `snake_case` field names in bodies and query parameters.
- Put resource identifiers in the URL, filtering/sorting/pagination in the query
  string, and create/update attributes in the JSON body.
- Never accept secrets in URLs. Authentication credentials belong in the
  documented authorization header.

## Successful responses

```json
{
  "success": true,
  "data": {"id": 42, "name": "Example"}
}
```

Use `200 OK` for reads and updates, `201 Created` for creation, and `204 No
Content` for a successful deletion. A 204 response intentionally has no body.

## Errors

```json
{
  "success": false,
  "error": {
    "code": "validation_error",
    "message": "The submitted data is invalid.",
    "details": {"email": ["Enter a valid email address."]}
  }
}
```

Common statuses are `400` validation/request error, `401` missing or invalid
authentication, `403` insufficient role/permission, `404` missing resource,
`405` unsupported method, `429` rate limited, and `500` unexpected server error.
Unexpected errors are logged server-side and return only a generic message.

## Pagination

List endpoints accept `page` and `page_size` (default 20, maximum 100):

```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "page": 1,
      "page_size": 20,
      "total_pages": 0,
      "total_items": 0,
      "next": null,
      "previous": null
    }
  }
}
```

## Documenting new endpoints

Every endpoint must describe its request and response serializers, status codes,
and examples with `extend_schema`. State whether it is public or authenticated
and name required roles in the operation description. Public operations use
`auth=[]`; protected operations must declare authentication and DRF permission
classes. Never put credentials, tokens, internal exception text, or stack traces
in examples or responses.

## Customer registration and email verification

- `POST /api/v1/auth/register/` creates inactive Customer accounts only.
- `GET /api/v1/auth/verify-email/?token=...` consumes a one-hour, one-time token
  and redirects to the configured frontend success URL with the consumed token
  included as a `token` query parameter.
- `POST /api/v1/auth/resend-verification/` sends a replacement token and is
  limited to one request per minute per normalized email and client IP.
- Supplier and Admin creation is intentionally excluded from public
  registration and must be implemented through protected administration APIs.
