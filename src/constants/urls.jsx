/**
 * URL Configuration for DearHome Frontend Application
 * 
 * This file contains all the route definitions for the application,
 * organized by user type and functionality.
 * 
 * Structure:
 * - AUTH: Authentication related routes
 * - ADMIN: Admin panel routes (requires admin authentication)
 * - CUSTOMER: Customer-facing routes (public and user-authenticated)
 * - PERSONALIZATION: User profile and preference routes
 */

const appUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173/#';

export const URLS = {
    // Base URL
    APP_URL: appUrl,
    
    // ========================================
    // AUTHENTICATION ROUTES
    // ========================================
    AUTH: {
        LOGIN: '/auth/login',                    // User login page
        REGISTER: '/auth/register',              // User registration page  
        SIGNUP: '/auth/signup',                  // Alternative signup page
        FORGOT_PASSWORD: '/auth/forgot-password', // Password recovery
        RESET_PASSWORD: '/auth/reset-password'   // Password reset form
    },
    
    // ========================================
    // ADMIN PANEL ROUTES
    // ========================================
    ADMIN: {
        // Main admin sections
        DASHBOARD: '/admin/dashboard',           // Admin dashboard overview
        
        // Product management
        PRODUCTS: '/admin/products',             // Product listing page
        PRODUCT_ADD: '/admin/products/add',      // Add new product page
        PRODUCT_EDIT: (id) => `/admin/products/${id}`,        // Edit product page
        PRODUCT_VARIANTS: (id) => `/admin/products/${id}/variants`, // Product variants management
        
        // Order management
        ORDERS: '/admin/orders',                 // Order listing and management
        ORDER_DETAILS: (id) => `/admin/orders/${id}`,         // Order details view
        PRINT_ORDER: (id) => `/admin/print-order/${id}`,      // Print order page
        
        // Customer management
        CUSTOMERS: '/admin/customers',           // Customer listing
        CUSTOMER_DETAILS: (id) => `/admin/customers/${id}`,   // Customer details view
        CUSTOMER_EDIT: (id) => `/admin/customers/${id}/edit`, // Edit customer page
        
        // Inventory management
        INVENTORY: '/admin/inventory',           // Inventory overview
        ADD_GOOD_RECEIVED_NOTE: '/admin/inventory/add-good-received-note',     // Add inventory
        EDIT_GOOD_RECEIVED_NOTE: (id) => `/admin/inventory/edit-good-received-note/${id}`, // Edit inventory
        
        // Application settings
        CATEGORIES: '/admin/application/categories',           // Category management
        CATEGORY_AND_PLACEMENT: '/admin/application/categories', // Category and placement settings
        PRODUCT_ATTRIBUTES: '/admin/application/attributes',   // Product attributes management
        
        // Promotions
        PROMOTIONS: '/admin/promotions',         // Promotion management
        PROMOTION_ADD: '/admin/promotions/add',  // Add new promotion
        PROMOTION_EDIT: (id) => `/admin/promotions/${id}`,     // Edit promotion
        
        // Admin user management
        PROFILE: '/admin/profile',               // Admin user profile
        SETTINGS: '/admin/settings',             // Admin panel settings
        
    },

    // ========================================
    // CUSTOMER ROUTES
    // ========================================
    CUSTOMER: {
        // Main pages
        HOME: '/',                               // Homepage
        
        // Product browsing
        PRODUCTS: '/products',                   // Product catalog
        PRODUCT_DETAIL: (id) => `/product/${id}`, // Individual product page
        
        // Category browsing
        CATEGORIES: '/categories',               // Category listing
        CATEGORY_DETAIL: (slug, parentSlug) =>  // Category detail page
            parentSlug
                ? `/category/${parentSlug}/${slug}`  // Nested category
                : `/category/${slug}`,                // Top-level category
        
        // Shopping flow
        CART: '/cart',                           // Shopping cart
        CHECKOUT: '/checkout',                   // Checkout process
        
        // Order management
        ORDERS: '/orders',                       // Customer order history
        ORDER_DETAILS: (id) => `/orders/${id}`, // Order details view
        ORDER_TRACKING: '/order-tracking',      // Track order status
        REVIEW_ORDER: (id) => `/review-order/${id}`, // Order review page
    
        
        // Payment
        VERIFY_PAYMENT: '/verify-payment',      // Payment verification
        
        // User account
        PROFILE: '/profile',                     // Customer profile page
        
        // Information pages
        ABOUT: '/about',                         // About us page
        CONTACT: '/contact',                     // Contact information
        
        // Special features
        INTERIOR_DESIGN: '/interior-design',    // Interior design services
        VR_PLACEMENT: '/vr-placement',          // VR furniture placement
        VIRTUAL_ROOM_PLANNER: '/virtual-room-planner', // Virtual room planning tool
    },
    
    // ========================================
    // PERSONALIZATION ROUTES
    // ========================================
    PERSONALIZATION: {
        USER_PROFILE: '/personalization/profile', // User personalization settings
    }
};

