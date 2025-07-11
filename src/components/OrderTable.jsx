import React, { useMemo } from 'react';
import { Table, Tag, Button, Space, Tooltip, Dropdown, Menu } from 'antd';
import { 
  EyeOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  DownOutlined 
} from '@ant-design/icons';
import { 
  getStatusColor, 
  getFormattedStatus, 
  formatCurrency, 
  formatDate,
  DEFAULT_PAGE_SIZE 
} from '../utils/orderUtils';

const OrderTable = ({
  orders,
  loading,
  pagination,
  sortBy,
  isDescending,
  onViewOrder,
  onStatusChange,
  onTableChange
}) => {
  // Memoized Table Columns
  const columns = useMemo(() => [
    {
      title: 'Order ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <a>#{id?.substring(0, 8)}...</a>,
      sorter: true,
      sortOrder: sortBy === 'id' ? (isDescending ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Customer',
      dataIndex: 'user',
      key: 'customer',
      render: (user) => user?.name || '',
      sorter: true,
      sortOrder: sortBy === 'customer' ? (isDescending ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date) => formatDate(date),
      sorter: true,
      sortOrder: sortBy === 'orderDate' ? (isDescending ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Total',
      dataIndex: 'finalPrice',
      key: 'finalPrice',
      render: (finalPrice) => formatCurrency(finalPrice),
      sorter: true,
      sortOrder: sortBy === 'finalPrice' ? (isDescending ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getFormattedStatus(status).toUpperCase()}
        </Tag>
      ),
      sorter: true,
      sortOrder: sortBy === 'status' ? (isDescending ? 'descend' : 'ascend') : null,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => onViewOrder(record)}
              size="small"
              style={{ borderColor: '#faad14', color: '#faad14' }}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu
                onClick={(e) => onStatusChange(record.id, e.key)}
                items={[
                  { key: 'Processing', label: 'Mark as Processing', icon: <CheckOutlined /> },
                  { key: 'Shipping', label: 'Mark as Shipping', icon: <CheckOutlined /> },
                  { key: 'Delivered', label: 'Mark as Delivered', icon: <CheckOutlined /> },
                  { key: 'Completed', label: 'Mark as Completed', icon: <CheckOutlined /> },
                  { type: 'divider' },
                  { key: 'Cancelled', label: 'Mark as Cancelled', icon: <CloseOutlined />, danger: true },
                ]}
              />
            }
            trigger={['click']}
          >
            <Button size="small" style={{ borderColor: '#faad14', color: '#faad14' }}>
              Actions <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      ),
    },
  ], [sortBy, isDescending, onViewOrder, onStatusChange]);

  // Memoized Pagination Configuration
  const paginationConfig = useMemo(() => {
    const config = {
      current: Math.max(1, pagination?.current || 1),
      pageSize: Math.max(1, pagination?.pageSize || DEFAULT_PAGE_SIZE),
      total: Math.max(0, pagination?.total || 0),
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => {
        const start = range ? range[0] : 0;
        const end = range ? range[1] : 0;
        return `Showing ${start}-${end} of ${total} orders`;
      },
      pageSizeOptions: ['5', '10', '20', '50'],
      disabled: false,
      hideOnSinglePage: false,
    };
    
    console.log('OrderTable pagination config:', config);
    console.log('Raw pagination prop:', pagination);
    
    return config;
  }, [pagination]);

  return (
    <Table
      columns={columns}
      dataSource={orders}
      rowKey="id"
      loading={loading}
      pagination={paginationConfig}
      onChange={onTableChange}
      style={{
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      locale={{
        emptyText: loading ? 'Loading orders...' : 'No orders found'
      }}
    />
  );
};

export default OrderTable;
