# A&M Risk Register

This register tracks the main delivery and operational risks for the A&M clothing e-commerce platform. Scores are calculated as `impact × probability`, with each factor rated from 1 (low) to 10 (high).

| Risk ID | Category | Title | Description | Potential impact | Impact | Probability | Score | Rank | Mitigation plan |
|---|---|---|---|---|---:|---:|---:|---:|---|
| R-01 | Technical | Django API integration issues | The React client under `frontend/` may expect payloads or endpoints that differ from the Django REST API implemented under `backend/`. | Catalogue, cart, checkout, and account flows may fail for customers. | 9 | 6 | 54 | 2 | Define and version API contracts, document serializers and endpoints, and add integration tests before connecting the frontend. |
| R-02 | Resource | Frontend delivery and integration delays | Delays implementing the React application under `frontend/` may prevent end-to-end features from being completed on time. | Customer-facing features and full-system demonstrations may be blocked. | 8 | 8 | 64 | 1 | Keep the frontend in `frontend/`, agree on the API contract early, use mock responses, and integrate one feature at a time. |
| R-03 | Security | Authentication and authorization defects | Errors in the custom `accounts.User` model, role handling, or API permissions may allow improper access or prevent valid users from signing in. | Accounts and administrative or supplier functionality may be unavailable or exposed. | 10 | 4 | 40 | 3 | Test registration, authentication, roles, and permissions independently; keep secrets out of source control; add negative authorization tests. |
| R-04 | Timeline | Incomplete commerce workflows | Catalogue, cart, order, review, notification, and pickup-point apps exist, but their end-to-end workflows may not be completed within the planned iteration. | The MVP may lack checkout, order tracking, or review functionality. | 6 | 6 | 36 | 4 | Prioritize core purchase flows, define acceptance criteria per Django app, and defer lower-priority enhancements. |
| R-05 | Operational | MySQL environment inconsistency | Local and CI environments may use different MySQL versions, schemas, credentials, or migration states. | Tests and deployments may fail despite working on a developer machine, and data may become inconsistent. | 4 | 5 | 20 | 5 | Pin dependencies, run migrations in controlled environments, use consistent `DB_*` variables, and validate migrations in CI. |

Total risk score: **214**  
Overall project risk rating: **Medium**

Score bands: Low 1–30, Medium 31–60, High 61–100.
