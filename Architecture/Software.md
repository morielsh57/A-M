# A&M – Software and Development Tools

## 1. Purpose

This document describes the software technologies, development tools, and main features implemented in **A&M Fashion**, a clothing e-commerce application with customer, supplier, and administrator interfaces.

The description reflects the repository's source code and configuration. The system separates the React user interface, Django business logic, and MySQL data storage hosted on Aiven in production.

---

## 2. Technology Stack

### 2.1 Frontend

**Technology:** React 18.2 with TypeScript and Vite

The frontend uses reusable React components and TypeScript types. Vite provides the development server and production builds; `npm run build` checks TypeScript before building the application.

React Router manages navigation. Redux Toolkit and React Redux manage shared application state. Axios handles REST requests, authorization headers, and access-token refresh. SCSS/Sass, Material UI, Ant Design, and React Bootstrap provide styling and interface components. React Hook Form handles forms, and React Toastify displays feedback.

The frontend integrates the PayPal React SDK for payment approval and Google Maps for pickup-point selection.

---

### 2.2 Backend

**Technology:** Python, Django 6.0.7, and Django REST Framework 3.17.1

The backend exposes a versioned REST API under `/api/v1`. Django applications separate accounts, catalogue, products, carts, payments, orders, reviews, notifications, and pickup points.

Serializers validate input, permission classes enforce roles and ownership, and service functions implement business operations. Database transactions protect cart updates, order creation, inventory changes, and fulfillment transitions.

The backend integrates PayPal for payment creation and capture, Cloudinary for product images, and configurable SMTP/Brevo delivery for verification and password-reset email.

---

### 2.3 Database

**Technology:** MySQL with the Django ORM and migrations; hosted on [Aiven](https://aiven.io/mysql) in production

MySQL stores users and roles, suppliers, category hierarchies, products and size/color variants, image metadata, carts, payments, orders, supplier fulfillments, reviews, notifications, and pickup points.

Inventory is tracked per product variant. Payment and order items store snapshots of product names, sizes, colors, quantities, and prices. Foreign keys, uniqueness constraints, and protected relationships maintain data integrity. Django migrations manage schema changes.

The production database is hosted on **[Aiven for MySQL](https://aiven.io/mysql)** and stores the application's relational data. The backend API runs on Render and connects to Aiven using environment-based database settings; the frontend is hosted on Netlify. Product-image files are stored separately in Cloudinary, while their metadata is stored in MySQL.

Only the backend accesses the database. The frontend accesses application data through the REST API. Database credentials and optional SSL settings come from environment variables; backend automated tests use a separate in-memory SQLite database.

---

## 3. Source Control

### 3.1 GitHub Repository

The project source code is stored and managed in the **GitHub repository**:

https://github.com/morielsh57/A-M

Development should use separate branches and pull-request review before merging into **main**. The documented branch naming convention is:

```text
private/{username}/task-name
```

The configured GitHub Actions workflow runs Django checks and tests on Python 3.12/3.13 and frontend production builds on Node.js 20/22. Successful backend checks on pushes to `main` trigger the configured Render deployment hook.

---

## 4. Project Management

### 4.1 GitHub Projects

**GitHub Projects** provides the project's workspace for backlog items, priorities, assignments, and progress tracking:

https://github.com/users/morielsh57/projects/2/views/1

Each work item should be represented by a GitHub Issue and may include:

- Title.
- Description.
- Acceptance criteria.
- Definition of Done.
- Priority.
- Assignee.
- Relevant labels.
- Related pull requests.

---

## 5. Communication Between Components

The implemented system communication flow is:

```text
User
  ↓
React 18 + TypeScript Frontend
  ↓ HTTP/HTTPS REST requests
Django REST Framework API (/api/v1)
  ↓ Django ORM
MySQL Database (Aiven in production)
```

Example request flow:

1. The user performs an action in the React application.
2. Axios sends an HTTP request to the backend; protected requests include a JWT bearer access token.
3. The backend validates input and checks authentication, role, and resource ownership.
4. The service layer applies business rules and reads or writes database records through the ORM.
5. The backend returns a response using the shared API conventions.
6. Redux state and the user interface update with the result or an error message.

Requests and responses normally use JSON with `snake_case` fields; image uploads use multipart requests. Successful JSON responses contain `success` and `data`; errors contain `success: false` and an `error` object with `code`, `message`, and `details`. Paginated endpoints include pagination metadata, with a default page size of 20 and maximum of 100. Successful deletions may return `204 No Content`.

The frontend also uses Google Maps and the PayPal approval SDK. The backend communicates with PayPal, Cloudinary, and SMTP/Brevo. API conventions are documented in [backend/API_STANDARDS.md](../backend/API_STANDARDS.md); OpenAPI and Swagger UI are exposed at `/api/schema` and `/api/docs`.

---

## 6. Main Features
### 6.1. User Authentication and Account Management

The system implements registration, authentication, and account management with backend-enforced permissions.

Main capabilities include:

- Customer registration with an inactive account until email verification.
- Email verification through a one-time email link, followed by activation and redirection to the frontend with login tokens.
- Backend verification-email resend endpoint.
- JWT login, access-token refresh, and logout with refresh-token blacklisting.
- Refresh-token rotation and automatic frontend access-token refresh.
- Role-based access control for `Customer`, `Supplier`, and `Admin`.
- Profile viewing and editing of name, phone, and address, and password changes through a separate endpoint. Self-service profile editing cannot change email, role, or account/verification status.
- Backend password-reset request and token-consumption endpoints with email delivery.
- Rate limits for verification resend and password-reset requests.

Frontend route guards control page access; the backend independently checks active accounts, roles, and ownership.

Verification resend and password reset are implemented in the backend API; the current frontend does not provide dedicated forms for these operations.

---

### 6.2. Product Catalogue

The system provides a structured product catalogue for browsing and searching.

Main capabilities include:

- Browse products by main category and subcategory.
- Search products and use search autocomplete.
- View paginated category and search results.
- Filter and sort through the catalogue API by category, price, size, color, availability, name, rating, or date, as applicable. The current category/search pages do not expose advanced filter or sorting controls.
- View detailed product information and available variants.

Product pages display:

- Product name and images.
- Description and price.
- Available sizes and colors.
- Stock availability for size/color variants, used to disable unavailable purchase options; exact inventory quantities are returned by the API.
- Average rating and customer reviews.

Products and variants have active states. Product images are stored in Cloudinary, with image metadata and product/variant relationships stored in the database.

---

### 6.3. Shopping Cart

Guest and authenticated customers can manage products before purchase.

Main capabilities include:

- Add a product variant with a selected size, color, and quantity.
- Update quantities and remove items.
- View item prices and the total cart price.
- Select specific cart items for checkout.
- Merge a guest cart with the customer's saved cart after login.

Guest carts use the `X-Guest-Cart-Id` header. The backend validates active products/variants and stock, calculates prices, and restricts access to the appropriate cart. Adding an existing variant increases its quantity. During guest-cart merging, quantities are combined and capped at available stock; unavailable variants are skipped, and the guest cart is deleted after merging.

Adding items to the cart does not reserve inventory; stock is checked again during payment creation and store-order creation.

---

### 6.4. Checkout and Order Creation

Checkout purchases selected cart items and associates the order with a payment and an active pickup point.

Main capabilities include:

- Review and select cart items before purchase.
- Select an active pickup point through Google Maps and location search.
- Process an online payment through PayPal.
- Store payment information and purchased-item snapshots.
- Create the store order and display its details after successful checkout.

The implemented sequence is:

1. The customer selects items and a pickup point.
2. The backend validates selected cart items and stock, calculates the amount from product prices, creates a PayPal order using an idempotency key, and then stores the local payment and payment-item snapshots.
3. The customer approves the payment through PayPal.
4. The backend captures the payment and verifies completed status, amount, and currency.
5. The frontend submits the completed payment ID and pickup-point ID to create the store order.
6. In a database transaction, the backend checks payment ownership, active pickup point, variant availability, stock, and snapshot totals; creates the order and item snapshots; decreases inventory; and creates supplier fulfillments and new-order notifications.
7. Purchased items are removed from the cart, unpurchased items are preserved in a new saved cart, and the frontend navigates to the order-details page.

Repeated store-order creation with the same payment returns the existing order. Payment creation reuses an existing payment for the same customer's idempotency key, and capture returns the stored payment if it is already completed. PayPal cancellation and errors are displayed to the customer.

Payment capture precedes store-order creation, so a stock or availability failure can occur after capture. The current implementation does not provide automatic refunds for this case or for store-order cancellation.

---

### 6.5. Customer Order Management

Customers can view their own current and previous orders.

Main capabilities include:

- View paginated order history and detailed order information.
- View purchased products, size/color variants, quantities, and saved prices.
- View the total price, payment information, and pickup-point information.
- Track the overall order status.
- Cancel a pending order through the backend customer-order cancellation endpoint.

The current customer order pages display history, details, and status; they do not provide a cancellation button.

Possible order statuses include:

- `Pending`: the order was created and fulfillment is outstanding.
- `Completed`: fulfillment is complete, or an administrator set the order to completed.
- `Cancelled`: the order was cancelled.

Customers cannot cancel completed orders or access another customer's order. Cancellation restores purchased inventory; repeated cancellation does not restore it again. Administrator reactivation of a cancelled order checks and decreases stock again. Cancellation updates supplier fulfillments and creates supplier cancellation notifications. It does not automatically refund the PayPal payment.

Supplier fulfillment is stored separately for each supplier in an order. Completing one supplier's portion leaves the overall order pending until all supplier fulfillments are completed.

Order status changes follow these implemented rules:

| Actor / operation | Allowed change | Result |
|---|---|---|
| Customer cancellation | Own order: `Pending` to `Cancelled` | Restores inventory, cancels supplier fulfillments, and creates cancellation notifications |
| Supplier completion | Own fulfillment: `Pending` to `Completed`, while the order is pending | Completes the overall order when every supplier fulfillment is completed |
| Administrator status update | Between `Pending`, `Completed`, and `Cancelled` | Synchronizes supplier fulfillments; cancellation restores stock and reactivation reserves stock |
| Repeating the current status | No status change | Leaves inventory unchanged |

Payment completion and order completion are separate states: successful PayPal capture allows a store order to be created as `Pending`; fulfillment determines when that order becomes `Completed`.

---

### 6.6. Product Reviews and Ratings

Customers can provide feedback about products from their own completed orders.

Main capabilities include:

- Submit a star rating and written review.
- Edit an existing owned review.
- Display reviews on product pages.
- Display the average product rating.
- Check review eligibility using purchase ownership and completed-order status.

The backend prevents duplicate reviews for the same eligible purchase and rejects unauthorized review creation or editing.

Ratings range from 1 to 5 and review text must be nonblank. Review creation checks completed-order status; the review-edit API checks ownership without rechecking order status. The frontend review page requires the order to be completed for both creation and editing.

---

### 6.7. Admin Dashboard

Administrators manage the main system resources through the management interface.

Main capabilities include:

- View business summaries and activity information.
- Add and edit products, sizes/colors, prices, inventory, and active states.
- Upload, replace, and delete product images through Cloudinary.
- Remove products subject to backend relationship restrictions.
- Add, edit, and remove main categories and subcategories.
- Manage customer, supplier, and administrator accounts.
- View and search orders, filter by status, and inspect order details.
- Update order statuses with inventory and supplier-fulfillment changes handled by backend services.
- Preserve order history: the backend rejects all order-deletion requests because orders are historical business records.
- Manage pickup points.
- Edit the administrator profile and change the password.

Referenced resources are protected where required. Products can be deactivated when deletion is disallowed. Administrators can change an order among the stored statuses; reactivating a cancelled order requires sufficient inventory.

---

### 6.8. Supplier Management

Suppliers access role-specific pages within the management interface.

Main capabilities include:

- Log in to the supplier interface and view a supplier dashboard.
- View assigned products, create products assigned to themselves, and edit their own product details, prices, variants, inventory, active states, and images through the shared management interface/API.
- View relevant orders and their own items and subtotals.
- Receive stored notifications about new and cancelled orders.
- View notification details and read/unread state.
- Mark their own pending fulfillment as completed.
- Edit their profile and change their password.

Backend queries scope products and orders to the signed-in supplier. Suppliers update only their own fulfillment from `Pending` to `Completed`, while the overall order is still pending. They cannot complete another supplier's portion. The overall order becomes completed after all supplier fulfillments are completed.

Supplier order responses contain only their own items, subtotal, fulfillment status, and pickup information, and exclude customer and payment details. Product and variant deletion is restricted to administrators. The dedicated supplier product-update endpoint rejects changes to ownership and catalogue number; the shared management endpoint uses a different serializer and permits catalogue-number editing, so the dedicated endpoint's restrictions do not describe every supplier update path.

The frontend periodically polls for notifications. The backend also exposes unread-count and mark-all-read endpoints.

---

### 6.9. Responsive User Interface

The interface uses responsive navigation, product grids, forms, checkout layouts, and management tables with mobile card views.

The layouts adapt to:

- Desktop computers.
- Laptop computers.
- Tablets.
- Smartphones.

Customer, supplier, and administrator navigation and page access depend on the user's role and permissions. Shared components provide loading, empty, and error states, pagination, and feedback messages.

---

### 6.10. Backend and Database Integration

The frontend communicates with the backend through the versioned REST API. The backend accesses MySQL through the Django ORM; the production database is hosted on [Aiven](https://aiven.io/mysql).

The system architecture includes:

- React 18 and TypeScript frontend built with Vite.
- Python backend using Django and Django REST Framework.
- MySQL relational database hosted on Aiven in production, with Django migrations.
- JSON-based communication and multipart image uploads.

The backend is responsible for:

- Business logic and request validation.
- JWT authentication and role/ownership authorization.
- Database access and data integrity.
- Server-calculated prices and per-variant stock checks.
- Transactional order, cart, and inventory operations.
- Shared error handling and pagination.
- PayPal capture verification, Cloudinary image operations, and transactional email.

Runtime settings and credentials come from environment variables, documented in `backend/.env.example`. The frontend exposes configured variables with the `REACT_APP_` prefix. Django tests cover the backend domains and shared API behavior; the configured frontend CI check runs a type-checked production build.

---

### Feature Summary

A&M Fashion is an online clothing-store platform that implements:

- Registration, email verification, JWT authentication, and role-based access.
- Product browsing, searching, pagination, and variant selection, with additional filtering and sorting available through the API.
- Guest/customer carts and cart merging.
- Selected-item checkout, PayPal payments, and map-based pickup selection.
- Order history, saved purchase details, and inventory-aware status changes.
- Separate supplier fulfillments and order notifications.
- Purchase-verified product reviews and ratings.
- Product, category, user, order, and pickup-point administration.
- Responsive customer and management interfaces.

---

## 7. Technology Summary

| Area | Selected Technology | Main Responsibility |
|---|---|---|
| Frontend | React 18.2, TypeScript, SCSS, UI component libraries | Customer and management interfaces |
| Frontend tooling | Vite | Development server and type-checked production builds |
| State and HTTP | Redux Toolkit, React Redux, Axios | Shared state, API requests, token refresh |
| Backend | Python, Django 6.0.7, Django REST Framework 3.17.1 | Business logic, validation, permissions, REST API |
| Database | MySQL on Aiven in production, Django ORM and migrations | Persistent application data, relationships, constraints |
| Database hosting | [Aiven for MySQL](https://aiven.io/mysql) | Hosting the production MySQL database; accessed only by the backend |
| Authentication | Simple JWT | Access/refresh tokens, rotation, blacklisting |
| Payments | PayPal API and React SDK | Payment creation, approval, capture |
| Pickup selection | Google Maps and backend pickup points | Map/search and pickup-point selection |
| Product images | Cloudinary | Image upload, delivery, replacement, deletion |
| Transactional email | SMTP / Brevo | Verification and password-reset email |
| API documentation | drf-spectacular, OpenAPI, Swagger UI | API schema and interactive documentation |
| Source Control | GitHub Repository | Version control and code collaboration |
| Project Management | GitHub Projects | Backlog, tasks, workflow, progress tracking |
| Validation and deployment | GitHub Actions, Render deployment hook | Backend tests, frontend builds, backend deployment trigger |

---

