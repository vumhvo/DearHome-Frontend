// Product Management Utility Functions

// Constants
export const DEFAULT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_TIME = 300;

export const PRODUCT_STATUS_COLORS = {
  active: 'green',
  inactive: 'red',
  default: 'default'
};

export const PRODUCT_FILTER_OPTIONS = [
  { label: 'All Products', value: '' },
  { label: 'Active Products', value: 'active' },
  { label: 'Inactive Products', value: 'inactive' },
];

export const PRODUCT_SORT_OPTIONS = [
  { key: 'name', label: 'Product Name' },
  { key: 'price', label: 'Price' },
  { key: 'createdAt', label: 'Created Date' },
  { key: 'updatedAt', label: 'Updated Date' },
  { key: 'category', label: 'Category' },
];

// $ref/$id Resolution Utility for Products
export const resolveRefs = (obj) => {
  const idMap = new Map();

  // First pass: collect all objects with $id
  const collect = (obj) => {
    if (obj && typeof obj === 'object') {
      if (obj.$id) {
        idMap.set(obj.$id, obj);
      }
      if (Array.isArray(obj)) {
        obj.forEach(item => collect(item));
      } else {
        Object.values(obj).forEach(value => {
          if (typeof value === 'object') {
            collect(value);
          }
        });
      }
    }
  };

  // Second pass: resolve all $ref references
  const deref = (obj, seen = new Set()) => {
    if (Array.isArray(obj)) {
      if (seen.has(obj)) return obj; // Circular reference protection
      seen.add(obj);
      const result = [];
      for (const item of obj) {
        result.push(deref(item, seen));
      }
      seen.delete(obj);
      return result;
    } else if (obj && typeof obj === 'object') {
      if (obj.$ref) {
        const referenced = idMap.get(obj.$ref);
        if (referenced && !seen.has(referenced)) {
          return deref(referenced, seen);
        }
        return referenced || obj; // Return original if reference not found
      }
      
      if (seen.has(obj)) return obj; // Circular reference protection
      seen.add(obj);
      
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key === '$id') continue; // Skip $id keys in final result
        if (key === '$values' && Array.isArray(value)) {
          // Special handling for $values arrays
          seen.delete(obj);
          return deref(value, seen);
        }
        result[key] = deref(value, seen);
      }
      seen.delete(obj);
      return result;
    }
    return obj;
  };

  collect(obj);
  return deref(obj);
};

// Extract products from API response
export const extractProductsFromResponse = (response) => {
  if (!response) return [];
  
  // Resolve $ref references first
  const resolved = resolveRefs(response);
  
  // Extract products array from various possible structures
  if (resolved.data && Array.isArray(resolved.data)) {
    return resolved.data;
  } else if (resolved.data?.$values && Array.isArray(resolved.data.$values)) {
    return resolved.data.$values;
  } else if (resolved && Array.isArray(resolved)) {
    return resolved;
  } else if (resolved?.$values && Array.isArray(resolved.$values)) {
    return resolved.$values;
  } else {
    console.warn('Unexpected API response structure:', resolved);
    return [];
  }
};

// Extract pagination info from API response
export const extractPaginationFromResponse = (response) => {
  const defaultPagination = {
    current: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
  };

  if (!response) return defaultPagination;

  return {
    current: Math.max(1, response.pageNumber || 1),
    pageSize: Math.max(1, response.pageSize || DEFAULT_PAGE_SIZE),
    total: Math.max(0, response.totalRecords || 0),
    showSizeChanger: true,
    showQuickJumper: true,
    // Additional pagination info
    totalPages: response.totalPages || 0,
    hasPreviousPage: response.hasPreviousPage || false,
    hasNextPage: response.hasNextPage || false,
  };
};

// Format currency for display
export const formatCurrency = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

// Format date for display
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Get status color for products
export const getProductStatusColor = (isActive) => {
  return isActive ? PRODUCT_STATUS_COLORS.active : PRODUCT_STATUS_COLORS.inactive;
};

// Get status text for products
export const getProductStatusText = (isActive) => {
  return isActive ? 'Active' : 'Inactive';
};

// Error handling utility
export const handleApiError = (error, action = 'operation') => {
  console.error(`Error during ${action}:`, error);
  
  if (error.response) {
    // Server responded with an error status
    const status = error.response.status;
    switch (status) {
      case 401:
        return 'Authentication required. Please log in again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.response.data?.message || `Failed to ${action}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    return error.message || `An unexpected error occurred during ${action}`;
  }
};

// Validate pagination parameters
export const validatePaginationParams = (current, pageSize) => {
  return {
    current: Math.max(1, current || 1),
    pageSize: Math.max(1, Math.min(100, pageSize || DEFAULT_PAGE_SIZE)), // Cap at 100
  };
};

// Build API query parameters
export const buildApiParams = (pagination, searchText, filter, sortBy, isDescending) => {
  const { current, pageSize } = validatePaginationParams(pagination.current, pagination.pageSize);
  const offset = (current - 1) * pageSize;
  
  return {
    offset,
    limit: pageSize,
    searchString: searchText?.trim() || '',
    filter: filter || '',
    sortBy: sortBy || '',
    isDescending: Boolean(isDescending),
  };
};
