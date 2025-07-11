# DearHome Frontend - URL Mapping Summary

## Overview
This document provides a comprehensive mapping of all URLs to their corresponding pages in the DearHome Frontend application.

## Route Structure

### Authentication Routes (`/auth/*`)
| URL | Component | Description |
|-----|-----------|-------------|
| `/auth/login` | Auth.jsx | User login page |
| `/auth/register` | Auth.jsx | User registration page |
| `/auth/signup` | Signup.jsx | Alternative signup page |
| `/auth/forgot-password` | Auth.jsx | Password recovery |
| `/auth/reset-password` | Auth.jsx | Password reset form |

### Admin Routes (`/admin/*`)
**Main Sections**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/dashboard` | Dashboard.jsx | Admin dashboard overview |
| `/admin/test-cors` | TestCors.jsx | CORS testing page |
| `/admin/profile` | UserProfile.jsx | Admin user profile |

**Product Management**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/products` | Product.jsx | Product listing page |
| `/admin/products/add` | AddProduct.jsx | Add new product page |
| `/admin/products/:id` | EditProduct.jsx | Edit product page |
| `/admin/products/:id/variants` | ProductVariants.jsx | Product variants management |

**Order Management**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/orders` | Order.jsx | Order listing and management |
| `/admin/orders/:id` | PrintOrder.jsx | Order details view |

**Customer Management**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/customers` | Customers.jsx | Customer listing |
| `/admin/customers/:id` | EditCustomer.jsx | Customer details view |
| `/admin/customers/:id/edit` | EditCustomer.jsx | Edit customer page |

**Inventory Management**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/inventory` | Inventory.jsx | Inventory overview |
| `/admin/inventory/add-good-received-note` | AddGoodReceivedNote.jsx | Add inventory |
| `/admin/inventory/edit-good-received-note/:id` | EditGoodReceivedNote.jsx | Edit inventory |

**Application Settings**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/application/categories` | CategoryAndPlacement.jsx | Category management |
| `/admin/application/attributes` | ProductAttribute.jsx | Product attributes management |

**Promotions**
| URL | Component | Description |
|-----|-----------|-------------|
| `/admin/promotions` | Promotions.jsx | Promotion management |

### Customer Routes (`/*`)
**Main Pages**
| URL | Component | Description |
|-----|-----------|-------------|
| `/` | Home.jsx | Homepage |
| `/profile` | CustomerProfile.jsx | Customer profile page |

**Product Browsing**
| URL | Component | Description |
|-----|-----------|-------------|
| `/products` | Products.jsx | Product catalog |
| `/product/:id` | ProductDetails.jsx | Individual product page |

**Category Browsing**
| URL | Component | Description |
|-----|-----------|-------------|
| `/category/:slug` | CategoryDetails.jsx | Top-level category |
| `/category/:parentSlug/:slug` | CategoryDetails.jsx | Nested category |

**Shopping Flow**
| URL | Component | Description |
|-----|-----------|-------------|
| `/cart` | Cart.jsx | Shopping cart |
| `/checkout` | Checkout.jsx | Checkout process |

**Order Management**
| URL | Component | Description |
|-----|-----------|-------------|
| `/order-tracking` | OrderTracking.jsx | Track order status |
| `/review-order/:id` | ReviewOrder.jsx | Order review page |

**Special Features**
| URL | Component | Description |
|-----|-----------|-------------|
| `/virtual-room-planner` | VirtualRoomPlanner.jsx | Virtual room planning tool |

### Standalone Routes
| URL | Component | Description |
|-----|-----------|-------------|
| `/verify-payment` | VerifyPayment.jsx | Payment verification |
| `/vr-placement` | VRPlacement.jsx | VR furniture placement |

## Layout Structure

### Admin Layout (`AdminLayout.jsx`)
- Wraps all `/admin/*` routes
- Provides admin navigation and authentication
- Includes admin menu and header

### Customer Layout (`CustomerLayout.jsx`)
- Wraps most customer routes (except standalone ones)
- Provides customer navigation and header
- Includes customer menu and footer

## Route Protection
- Admin routes require admin authentication
- Customer routes may require user authentication for certain features
- Some routes like `/verify-payment` and `/vr-placement` are standalone for specific workflows

## URL Constants Usage
All URLs are defined in `/src/constants/urls.jsx` and should be imported using:
```javascript
import { URLS } from './constants/urls';
```

Example usage:
```javascript
// Static routes
navigate(URLS.CUSTOMER.HOME);
navigate(URLS.ADMIN.DASHBOARD);

// Dynamic routes with parameters
navigate(URLS.CUSTOMER.PRODUCT_DETAIL(productId));
navigate(URLS.ADMIN.PRODUCT_EDIT(productId));
```

## Notes
- The application uses HashRouter for routing
- Parameter-based routes use functions for URL generation
- All routes are properly mapped to their corresponding components
- Missing components have been identified and imported in AppRouter.jsx
