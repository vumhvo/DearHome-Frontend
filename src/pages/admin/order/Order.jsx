import React, { useState, useEffect, useCallback } from 'react';
import { Button, Space, Card, Typography, message, Modal, Descriptions, Badge, Image, Tooltip, Table, Tag } from 'antd';
import { PrinterOutlined, PlusOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { orderApiRequest, shippingApiRequest } from '../../../api/ApiRequests';
import { URLS } from '../../../constants/urls';
import { useDebounce, usePagination, useOrderFilters } from '../../../hooks/useOrderManagement';
import OrderTable from '../../../components/OrderTable';
import OrderFilters from '../../../components/OrderFilters';
import {
  resolveRefs,
  extractOrdersFromResponse,
  applyClientSideFiltering,
  applyClientSideSearch,
  applyClientSideSorting,
  handleApiError,
  formatCurrency,
  formatDate,
  getStatusColor,
  getFormattedStatus,
  SEARCH_DEBOUNCE_TIME
} from '../../../utils/orderUtils';

const { Title } = Typography;

const Order = () => {
  const navigate = useNavigate();
  
  // Custom Hooks
  const { pagination, updatePagination, resetToFirstPage, validateAndSetPagination } = usePagination();
  const {
    searchText,
    statusFilter,
    sortBy,
    isDescending,
    handleSearchChange,
    handleStatusFilterChange,
    handleSortChange
  } = useOrderFilters();
  
  // Core State
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Modal State
  const [viewModalVisible, setViewModalVisible] = useState(false);
  
  // API Pagination Info
  const [apiPaginationInfo, setApiPaginationInfo] = useState({
    hasNextPage: false,
    hasPreviousPage: false,
    totalPages: 0
  });

  // API Functions
  const fetchFormattedAddress = useCallback(async (addressId) => {
    try {
      const response = await shippingApiRequest.getFormattedAddress(addressId);
      const formattedAddress = response.data;
      
      setSelectedOrder((prevOrder) => ({
        ...prevOrder,
        address: {
          ...prevOrder.address,
          street: formattedAddress.street,
          city: formattedAddress.city.name,
          district: formattedAddress.district.name,
          postalCode: formattedAddress.postalCode,
          country: formattedAddress.country,
        },
      }));
    } catch (error) {
      console.error('Error fetching address:', error);
      const errorMessage = handleApiError(error, 'fetch address');
      message.error(errorMessage);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const offset = (pagination.current - 1) * pagination.pageSize;
    
    console.log('Fetching orders with pagination:', {
      current: pagination.current,
      pageSize: pagination.pageSize,
      offset,
      searchText,
      statusFilter,
      sortBy,
      isDescending
    });
    
    try {
      const response = await orderApiRequest.getAllOrders(
        offset, 
        pagination.pageSize, 
        searchText || '', 
        statusFilter !== 'all' ? statusFilter : '', 
        sortBy, 
        isDescending
      );
      
      console.log('API Response:', response);
      
      if (!response || !response.data) {
        throw new Error('Invalid API response structure');
      }
      
      // Extract and process orders from API response
      const resolved = resolveRefs(response.data);
      let ordersForPage = extractOrdersFromResponse(resolved);
      
      console.log('Extracted orders:', ordersForPage.length);
      console.log('API Pagination Info:', {
        pageNumber: response.pageNumber,
        pageSize: response.pageSize,
        totalRecords: response.totalRecords,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPreviousPage: response.hasPreviousPage
      });
      
      // Important: Don't apply client-side filtering if server handles pagination
      // The server should already return filtered/paginated results
      // Only apply client-side processing if no server-side pagination info is available
      if (!response.totalRecords && !response.totalPages) {
        console.log('Applying client-side processing (no server pagination info)');
        ordersForPage = applyClientSideFiltering(ordersForPage, statusFilter);
        ordersForPage = applyClientSideSearch(ordersForPage, searchText);
        ordersForPage = applyClientSideSorting(ordersForPage, sortBy, isDescending);
      } else {
        console.log('Using server-side pagination, skipping client-side processing');
      }
      
      setOrders(ordersForPage);

      console.log(response)
      
      // Handle pagination from API response - use totalRecords from server
      // Try different possible field names for total records
      const totalRecords = response.data.totalRecords || 
                          response.data.total || 
                          response.data.totalCount || 
                          response.data.count ||
                          (response.data.totalPages ? response.data.totalPages * pagination.pageSize : 0) ||
                          ordersForPage.length;
      
      const currentPage = response.data.pageNumber || 
                         response.data.page || 
                         response.data.currentPage || 
                         pagination.current;

      const pageSizeFromApi = response.data.pageSize || 
                             response.data.size || 
                             response.data.limit || 
                             pagination.pageSize;
      
      const paginationUpdate = {
        current: Math.max(1, currentPage),
        pageSize: Math.max(1, pageSizeFromApi),
        total: Math.max(0, totalRecords),
      };
      
      console.log('Setting pagination:', paginationUpdate);
      console.log('Calculated total pages:', Math.ceil(totalRecords / pageSizeFromApi));
      
      updatePagination(paginationUpdate);
      
      // Store API pagination flags
      setApiPaginationInfo({
        hasNextPage: response.hasNextPage || false,
        hasPreviousPage: response.hasPreviousPage || false,
        totalPages: response.totalPages || 0
      });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      const errorMessage = handleApiError(error, 'fetch orders');
      message.error(errorMessage);
      
      setOrders([]);
      updatePagination({
        current: 1,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, searchText, statusFilter, sortBy, isDescending, updatePagination]);

  const fetchOrderDetail = useCallback(async (orderId) => {
    try {
      setLoading(true);
      const response = await orderApiRequest.getOrderById(orderId);
      const resolvedOrderDetail = resolveRefs(response.data);
      setSelectedOrder(resolvedOrderDetail);
      
      if (resolvedOrderDetail.addressId) {
        await fetchFormattedAddress(resolvedOrderDetail.addressId);
      }
      
      setViewModalVisible(true);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      const errorMessage = handleApiError(error, 'fetch order details');
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFormattedAddress]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    try {
      await orderApiRequest.updateOrderStatus(orderId, newStatus);
      message.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      const errorMessage = handleApiError(error, 'update order status');
      message.error(errorMessage);
    }
  }, [fetchOrders]);

  // Event Handlers
  const viewOrderDetails = useCallback((order) => {
    fetchOrderDetail(order.id);
  }, [fetchOrderDetail]);

  const printOrder = useCallback((orderId) => {
    const order = selectedOrder;
    if (!order) {
      message.error('No order selected to print.');
      return;
    }
    
    navigate(URLS.ADMIN.PRINT_ORDER(orderId), {
      state: {
        order: order,
        formattedAddress: order.address,
      }
    });
  }, [selectedOrder, navigate]);

  const debouncedSearch = useDebounce((value) => {
    handleSearchChange(value);
    resetToFirstPage();
  }, SEARCH_DEBOUNCE_TIME);

  const handleSearch = useCallback((value) => {
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleStatusFilterWrapper = useCallback((status) => {
    handleStatusFilterChange(status);
    resetToFirstPage();
  }, [handleStatusFilterChange, resetToFirstPage]);

  const handleSortChangeWrapper = useCallback((sortField) => {
    handleSortChange(sortField);
    resetToFirstPage();
  }, [handleSortChange, resetToFirstPage]);

  const handleTableChange = useCallback((paginationInfo, filters, sorter) => {
    console.log('Table change triggered:', {
      paginationInfo,
      filters,
      sorter,
      currentPagination: pagination
    });
    
    if (sorter && sorter.field) {
      handleSortChange(sorter.field);
    }
    
    updatePagination({
      current: paginationInfo.current || 1,
      pageSize: paginationInfo.pageSize || pagination.pageSize,
    });
  }, [handleSortChange, updatePagination, pagination.pageSize]);

  // Effects
  useEffect(() => {
    if (pagination?.current && pagination?.pageSize) {
      fetchOrders();
    }
  }, [fetchOrders]);

  // Clear filter handlers
  const handleClearSearch = useCallback(() => {
    handleSearchChange('');
    resetToFirstPage();
  }, [handleSearchChange, resetToFirstPage]);

  const handleClearStatusFilter = useCallback(() => {
    handleStatusFilterWrapper('all');
  }, [handleStatusFilterWrapper]);

  return (
    <div className="order-management">
      <Card
        title={
          <Space>
            <Title level={4} style={{ 
              margin: 0, 
              background: 'linear-gradient(135deg, #faad14, #ffd53e)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              Order Management
            </Title>
            <Tag color="gold">
              {orders.length} orders
              {statusFilter !== 'all' && ` • ${statusFilter === 'WaitForPayment' ? 'Wait for Payment' : statusFilter}`}
              {searchText && ` • "${searchText}"`}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ 
                border: 'none',
              }}
            >
              Add Order
            </Button>
            <Tooltip title="Refresh orders">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchOrders()}
              />
            </Tooltip>
            <Tooltip title="Export orders">
              <Button
                icon={<PrinterOutlined />}
                onClick={() => message.info('Exporting orders...')}
              />
            </Tooltip>
            <Tooltip title="Settings">
              <Button
                icon={<SettingOutlined />}
                onClick={() => message.info('Settings opened')}
              />
            </Tooltip>
          </Space>
        }
      >
    <OrderFilters
      searchText={searchText}
      statusFilter={statusFilter}
      sortBy={sortBy}
      isDescending={isDescending}
      ordersCount={orders.length}
      loading={loading}
      pagination={pagination}
      onSearch={handleSearch}
      onStatusFilterChange={handleStatusFilterWrapper}
      onSortChange={handleSortChangeWrapper}
      onClearSearch={handleClearSearch}
      onClearStatusFilter={handleClearStatusFilter}
    />

    {pagination && typeof pagination === 'object' ? (
          <OrderTable
            orders={orders}
            loading={loading}
            pagination={pagination}
            sortBy={sortBy}
            isDescending={isDescending}
            onViewOrder={viewOrderDetails}
            onStatusChange={handleStatusChange}
            onTableChange={handleTableChange}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Typography.Text type="secondary">Initializing pagination...</Typography.Text>
          </div>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <Typography.Title level={4} style={{ 
              margin: 0, 
              background: 'linear-gradient(135deg, #faad14, #ffd53e)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent' 
            }}>
              Order Details #{selectedOrder?.id ? selectedOrder.id : ''}
            </Typography.Title>
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button 
            key="print" 
            icon={<PrinterOutlined />} 
            onClick={() => printOrder(selectedOrder?.id)}
          >
            Print Order
          </Button>,
          <Button 
            key="close" 
            onClick={() => setViewModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        width={800}
        style={{
          borderRadius: '12px',
        }}
      >
        {loading || !selectedOrder ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Typography.Text type="secondary">Loading order details...</Typography.Text>
          </div>
        ) : (
          <>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Order Status" span={2}>
                <Badge
                  status={getStatusColor(selectedOrder.status) === 'gold' ? 'warning' :
                    getStatusColor(selectedOrder.status) === 'green' ? 'success' :
                      getStatusColor(selectedOrder.status) === 'red' ? 'error' : 'processing'}
                  text={getFormattedStatus(selectedOrder.status)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Customer Name">
                {selectedOrder.user.name}
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">
                {formatDate(selectedOrder.orderDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Method">
                {selectedOrder.paymentMethod}
              </Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                {formatCurrency(selectedOrder.finalPrice)}
              </Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ 
              marginTop: 20, 
              background: 'linear-gradient(135deg, #faad14, #ffd53e)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              Shipping Address
            </Title>
            <Descriptions bordered>
              <Descriptions.Item label="Address" span={2}>
                {selectedOrder.address.street}
              </Descriptions.Item>
              <Descriptions.Item label="City">
                {selectedOrder.address.city}
              </Descriptions.Item>
              <Descriptions.Item label="District">
                {selectedOrder.address.district}
              </Descriptions.Item>
              <Descriptions.Item label="Postal Code">
                {selectedOrder.address.postalCode}
              </Descriptions.Item>
              <Descriptions.Item label="Country" span={3}>
                {selectedOrder.address.country}
              </Descriptions.Item>
            </Descriptions>

            <Title level={4} style={{ 
              marginTop: 20, 
              background: 'linear-gradient(135deg, #faad14, #ffd53e)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              Order Items
            </Title>
            <Table
              dataSource={selectedOrder?.orderDetails || []}
              rowKey="variantId"
              pagination={false}
              columns={[
                {
                  dataIndex: ['variant', 'imageUrls'],
                  key: 'imageUrls',
                  render: (imageUrls) =>
                    imageUrls && imageUrls.length > 0 ? (
                      <Image
                        width={50}
                        height={50}
                        src={imageUrls[0]}
                        alt="Product Image"
                        style={{ borderRadius: '5px' }}
                      />
                    ) : null,
                },
                {
                  title: 'Product Name',
                  dataIndex: ['variant', 'product', 'name'],
                  key: 'productName',
                  render: (_, record) => record?.variant?.product?.name || '',
                },
                {
                  title: 'SKU',
                  dataIndex: ['variant', 'sku'],
                  key: 'sku',
                  render: (_, record) => record?.variant?.sku || '',
                },
                {
                  title: 'Quantity',
                  dataIndex: 'quantity',
                  key: 'quantity',
                },
                {
                  title: 'Price',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  render: (price) => formatCurrency(price),
                },
                {
                  title: 'Subtotal',
                  key: 'totalPrice',
                  dataIndex: 'totalPrice',
                  render: (totalPrice) => formatCurrency(totalPrice),
                },
              ]}
              summary={(pageData) => {
                const total = pageData.reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3}>Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} justifyContent='flex-end'>
                      <strong>{formatCurrency(total)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default Order;
