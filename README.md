# 🍔 Qwicky – Multi-Vendor College Canteen Pre-Order System

Qwicky is a full-stack web application that allows students to pre-order food from multiple college canteen vendors, manage separate carts per vendor, and pay securely online.

🔗 **Live Demo:** https://qwicky-multivendor.vercel.app/
---

## 🚀 Features

- JWT-based authentication (Student / Vendor / Admin)
- Multiple canteen vendors with separate menus
- Vendor-specific cart system (no cross-canteen item mixing)
- Real-time order status tracking
- Secure online payments using Stripe
- Product and vendor image uploads via Cloudinary

---

## 🛠️ Tech Stack

### Backend
- Django & Django REST Framework
- PostgreSQL
- JWT Authentication (Simple JWT)
- Stripe Payments & Webhooks
- Cloudinary
- django-cors-headers

### Frontend
- Next.js (App Router)
- Tailwind CSS
- NextAuth.js
- React Query (TanStack Query)
- Axios
- Stripe.js

---

## 📁 Project Structure

```text
backend/
├── users/
├── vendors/
├── products/
├── cart/
├── orders/
├── payments/
└── qwicky/

frontend/
├── src/app/
├── src/components/
├── src/lib/
└── src/types/
