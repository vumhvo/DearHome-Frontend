import { useState, useCallback, useEffect } from 'react';

// Custom hook for debouncing values
export const useDebounce = (callback, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setDebounceTimer(timer);
  }, [callback, delay, debounceTimer]);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
};

// Custom hook for managing pagination state
export const usePagination = (initialPageSize = 10) => {
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: initialPageSize,
    total: 0
  });

  const updatePagination = useCallback((updates) => {
    setPagination(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetToFirstPage = useCallback(() => {
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  }, []);

  const validateAndSetPagination = useCallback((apiResponse) => {
    const validatedPagination = {
      current: Math.max(1, apiResponse.pageNumber || pagination.current),
      pageSize: Math.max(1, apiResponse.pageSize || pagination.pageSize),
      total: Math.max(0, apiResponse.totalRecords || 0),
    };

    // Validate against API constraints
    if (apiResponse.totalPages && validatedPagination.current > apiResponse.totalPages && apiResponse.totalPages > 0) {
      validatedPagination.current = apiResponse.totalPages;
    }

    if (apiResponse.pageNumber === 1 && !apiResponse.hasPreviousPage) {
      validatedPagination.current = 1;
    }

    setPagination(validatedPagination);
    return validatedPagination;
  }, [pagination.current, pagination.pageSize]);

  return {
    pagination,
    updatePagination,
    resetToFirstPage,
    validateAndSetPagination
  };
};

// Custom hook for managing filters and search
export const useOrderFilters = () => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('orderDate');
  const [isDescending, setIsDescending] = useState(true);

  const handleSearchChange = useCallback((value) => {
    setSearchText(value);
  }, []);

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  const handleSortChange = useCallback((sortField) => {
    if (sortBy === sortField) {
      setIsDescending(!isDescending);
    } else {
      setSortBy(sortField);
      setIsDescending(true);
    }
  }, [sortBy, isDescending]);

  const resetFilters = useCallback(() => {
    setSearchText('');
    setStatusFilter('all');
    setSortBy('orderDate');
    setIsDescending(true);
  }, []);

  return {
    searchText,
    statusFilter,
    sortBy,
    isDescending,
    handleSearchChange,
    handleStatusFilterChange,
    handleSortChange,
    resetFilters
  };
};
