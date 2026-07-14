# A&M – Software and Development Tools

## 1. Purpose

This document provides a concise overview of the main software technologies and development tools that will be used in the **A&M** project.

The selected stack supports the implementation of a modern full-stack web application with a clear separation between the user interface, server-side logic, data storage, source control, and project management.

---

## 2. Technology Stack

### 2.1 Frontend

**Technology:** React 18 with TypeScript

The frontend will be developed using **React 18** and **TypeScript**.

React will be responsible for building the application's user interface using reusable components. TypeScript will provide static typing, improve code readability, and reduce errors during development.

---

### 2.2 Backend

**Technology:** Python REST API

The backend will be implemented in **Python** and will expose a **REST API** for communication with the frontend.
The backend framework will **Django**


### 2.3 Database

**Technology:** MySQL

The project will use **MySQL** as its relational database management system.

MySQL will store the persistent application data and maintain relationships between the system entities.

The backend will be the only application layer permitted to access the database directly. The frontend will access data exclusively through the backend REST API.

---

## 3. Source Control

### 3.1 GitHub Repository

The project source code will be stored and managed in a **GitHub repository**.

https://github.com/morielsh57/A-M

Development should be performed through separate branches. Changes should be reviewed through pull requests before being merged into the **main** branch.

Branches should be named as follows:

```text
private/{username}/task-name
```

---

## 4. Project Management

### 4.1 GitHub Projects

**GitHub Projects** will be used to manage the project backlog, tasks, priorities, and development progress.

https://github.com/users/morielsh57/projects/2

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

The primary system communication flow will be:

```text
User
  ↓
React 18 + TypeScript Frontend
  ↓ HTTP/HTTPS and JSON
Python REST API
  ↓ SQL
MySQL Database
```

Example request flow:

1. The user performs an action in the React application.
2. The frontend sends an HTTP request to the Python REST API.
3. The backend validates the request.
4. The backend reads from or writes to MySQL.
5. The backend returns a JSON response.
6. The frontend updates the user interface.

---

## 6. Main Features
### 6.1. User Authentication and Account Management

The system supports user registration, login, logout, and profile management.

Main capabilities include:

- Customer registration.
- Email verification.
- Secure login and logout.
- Role-based access control.
- User profile viewing and editing.
- Support for three user roles:
  - Customer
  - Supplier
  - Administrator

---

### 6.2. Product Catalogue

The system provides a structured product catalogue that allows users to browse and search for products.

Main capabilities include:

- Browse products by main category.
- Browse products by subcategory.
- Search for products by name or keyword.
- Sort and filter products.
- View detailed product information.

Each product may include:

- Product name.
- Product images.
- Description.
- Price.
- Available sizes.
- Available colors.
- Stock quantity.
- Product rating.
- Customer reviews.

---

### 6.3. Shopping Cart

Customers can manage products before completing an order.

Main capabilities include:

- Add products to the shopping cart.
- Select product size.
- Select product color.
- Select product quantity.
- Update product quantities.
- Remove products from the cart.
- View the total cart price.
- Merge a guest cart with the customer's saved cart after login.

---

### 6.4. Checkout and Order Creation

The checkout process allows customers to review their cart and create an order.

Main capabilities include:

- Review the shopping cart before purchase.
- Select a pickup location via Google Maps.
- Submit an order.
- Process an online payment via PayPal.
- Store payment information.
- Store order information.
- Display an order confirmation after a successful purchase.

---

### 6.5. Customer Order Management

Customers can view and track their previous and current orders.

Main capabilities include:

- View order history.
- View detailed information about an order.
- View the products included in an order.
- View the total order price.
- Track the order status.

Possible order statuses include:

- `Pending`
- `Completed`
- `Cancelled`

---

### 6.6. Product Reviews and Ratings

Customers can provide feedback about products they purchased.

Main capabilities include:

- Submit a star rating.
- Write a product review.
- Edit an existing review.
- Display reviews on the product page.
- Display the average product rating.
- Allow reviews only for products from completed orders.

---

### 6.7. Administrator Dashboard

Administrators can manage the main resources of the system.

Main capabilities include:

- Add new products.
- Edit existing products.
- Remove products.
- Update product prices.
- Manage product inventory.
- Add, edit, and remove categories.
- Manage customer accounts.
- Manage supplier accounts.
- Manage administrator accounts.
- View all orders.
- Update order statuses.
- Delete orders when permitted.
- View system and business information.

---

### 6.8. Supplier Management

Suppliers have access to a dedicated interface for managing relevant products and orders.

Main capabilities include:

- Log in to the supplier interface.
- View assigned products.
- View relevant orders.
- Receive notifications about new orders.
- Receive notifications about cancelled orders.
- Update the status of assigned orders.
- Manage relevant product information according to permissions.

---

### 6.9. Responsive User Interface

The application will support different screen sizes and devices.

Supported devices include:

- Desktop computers.
- Laptop computers.
- Tablets.
- Smartphones.

The interface will adapt according to the user's role and permissions.

---

### 6.10. Backend and Database Integration

The frontend communicates with the backend through a REST API.

The system architecture includes:

- React 18 and TypeScript frontend.
- Python REST API backend.
- MySQL database.
- JSON-based communication between the frontend and backend.

The backend is responsible for:

- Business logic.
- Request validation.
- Authentication.
- Authorization.
- Database access.
- Error handling.
- Data integrity.

---

### Feature Summary

A&M is an online clothing-store platform that provides:

- User registration and authentication.
- Role-based access control.
- Product browsing and searching.
- Shopping-cart management.
- Checkout and online payments.
- Order tracking.
- Product reviews and ratings.
- Product, category, user, and order administration.
- Responsive support for desktop and mobile devices.

---

## 7. Technology Summary

| Area | Selected Technology | Main Responsibility |
|---|---|---|
| Frontend | React 18 and TypeScript | User interface and client-side interaction |
| Backend | Python REST API | Business logic, validation, and API services |
| Database | MySQL | Persistent relational data storage |
| Source Control | GitHub Repository | Version control and code collaboration |
| Project Management | GitHub Projects | Backlog, tasks, workflow, and progress tracking |

---
