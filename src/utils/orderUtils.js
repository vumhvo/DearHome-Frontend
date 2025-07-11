// Order Management Utility Functions

// Constants
export const DEFAULT_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_TIME = 300;

export const ORDER_STATUS_COLORS = {
  placed: 'gold',
  waitforpayment: 'orange',
  processing: 'yellow',
  shipping: 'cyan',
  delivered: 'green',
  completed: 'blue',
  cancelled: 'red',
  default: 'default'
};

export const ORDER_STATUS_OPTIONS = [
  { key: 'all', label: 'All Status' },
  { key: 'placed', label: 'Placed' },
  { key: 'waitForPayment', label: 'Wait for Payment' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export const SORT_OPTIONS = [
  { key: 'orderDate', label: 'Order Date' },
  { key: 'finalPrice', label: 'Total Amount' },
  { key: 'status', label: 'Status' },
  { key: 'customer', label: 'Customer' },
  { key: 'id', label: 'Order ID' },
];

// $ref/$id Resolution Utility
export const resolveRefs = (obj) => {
  const idMap = new Map();

  const collect = (obj) => {
    if (obj && typeof obj === 'object') {
      if (obj.$id) idMap.set(obj.$id, obj);
      for (const key in obj) {
        if (typeof obj[key] === 'object') collect(obj[key]);
      }
    }
  };

  const deref = (obj, seen = new Map()) => {
    if (Array.isArray(obj)) {
      if (seen.has(obj)) return seen.get(obj);
      const arr = [];
      seen.set(obj, arr);
      for (const item of obj) arr.push(deref(item, seen));
      return arr;
    } else if (obj && typeof obj === 'object') {
      if (obj.$ref) return deref(idMap.get(obj.$ref), seen);
      if (seen.has(obj)) return seen.get(obj);
      const result = {};
      seen.set(obj, result);
      for (const key in obj) {
        if (key !== '$id' && key !== '$ref') {
          if (key === '$values') {
            return deref(obj[key], seen);
          }
          result[key] = deref(obj[key], seen);
        }
      }
      return result;
    }
    return obj;
  };

  collect(obj);
  return deref(obj);
};

// Status and Formatting Utilities
export const getStatusColor = (status) => {
  return ORDER_STATUS_COLORS[status?.toLowerCase()] || ORDER_STATUS_COLORS.default;
};

export const getFormattedStatus = (status) => {
  return status?.replace(/([A-Z])/g, ' $1').trim() || '';
};

export const formatCurrency = (amount) => {
  return `${(amount || 0).toLocaleString('vi-VN')} ₫`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Data Processing Utilities
export const extractOrdersFromResponse = (resolved) => {
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

export const applyClientSideFiltering = (orders, statusFilter) => {
  if (statusFilter === 'all') return orders;
  
  return orders.filter(order => 
    order.status && order.status.toLowerCase() === statusFilter.toLowerCase()
  );
};

export const applyClientSideSearch = (orders, searchText) => {
  if (!searchText) return orders;
  
  const searchLower = searchText.toLowerCase();
  return orders.filter(order => 
    (order.id && order.id.toLowerCase().includes(searchLower)) ||
    (order.user?.name && order.user.name.toLowerCase().includes(searchLower)) ||
    (order.status && order.status.toLowerCase().includes(searchLower))
  );
};

export const applyClientSideSorting = (orders, sortBy, isDescending) => {
  if (!orders.length) return orders;

  return [...orders].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'orderDate':
        aValue = new Date(a.orderDate || 0);
        bValue = new Date(b.orderDate || 0);
        break;
      case 'finalPrice':
        aValue = a.finalPrice || 0;
        bValue = b.finalPrice || 0;
        break;
      case 'status':
        aValue = a.status || '';
        bValue = b.status || '';
        break;
      case 'customer':
        aValue = a.user?.name || '';
        bValue = b.user?.name || '';
        break;
      default:
        aValue = a.id || '';
        bValue = b.id || '';
    }
    
    if (aValue < bValue) return isDescending ? 1 : -1;
    if (aValue > bValue) return isDescending ? -1 : 1;
    return 0;
  });
};

export const validatePaginationData = (paginationData) => {
  return {
    current: Math.max(1, paginationData.current || 1),
    pageSize: Math.max(1, paginationData.pageSize || DEFAULT_PAGE_SIZE),
    total: Math.max(0, paginationData.total || 0)
  };
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
