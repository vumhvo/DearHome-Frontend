import React from 'react';
import { Row, Col, Input, Dropdown, Menu, Button, Space, Tag, Typography } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  SortAscendingOutlined, 
  SortDescendingOutlined, 
  DownOutlined 
} from '@ant-design/icons';
import { ORDER_STATUS_OPTIONS, SORT_OPTIONS } from '../utils/orderUtils';

const OrderFilters = ({
  searchText,
  statusFilter,
  sortBy,
  isDescending,
  ordersCount,
  loading,
  pagination,
  onSearch,
  onStatusFilterChange,
  onSortChange,
  onClearSearch,
  onClearStatusFilter
}) => {
  const getStatusDisplayName = (status) => {
    if (status === 'all') return 'All Status';
    if (status === 'waitForPayment') return 'Wait for Payment';
    return status;
  };

  const getSortDisplayName = (sort) => {
    switch (sort) {
      case 'orderDate': return 'Date';
      case 'finalPrice': return 'Amount';
      case 'customer': return 'Customer';
      case 'id': return 'ID';
      default: return 'Status';
    }
  };

  return (
    <>
      {/* Search and Filter Controls */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Input.Search
            placeholder="Search orders..."
            allowClear
            onSearch={onSearch}
            enterButton={<SearchOutlined />}
            style={{ borderRadius: '8px' }}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Dropdown
            overlay={
              <Menu onClick={(e) => onStatusFilterChange(e.key)}>
                {ORDER_STATUS_OPTIONS.map(option => (
                  <Menu.Item key={option.key}>
                    {option.label}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button style={{ width: '100%', borderColor: '#faad14' }}>
              <FilterOutlined style={{ color: '#faad14' }} />
              {getStatusDisplayName(statusFilter)} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Dropdown
            overlay={
              <Menu onClick={(e) => onSortChange(e.key)}>
                {SORT_OPTIONS.map(option => (
                  <Menu.Item key={option.key}>
                    {option.label} {sortBy === option.key ? (isDescending ? '↓' : '↑') : ''}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button style={{ width: '100%', borderColor: '#faad14' }}>
              {isDescending ? 
                <SortDescendingOutlined style={{ color: '#faad14' }} /> : 
                <SortAscendingOutlined style={{ color: '#faad14' }} />
              }
              Sort: {getSortDisplayName(sortBy)} <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      {/* Active Filters and Status Display */}
      <Row style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              {(searchText || statusFilter !== 'all') && (
                <>
                  <Typography.Text strong style={{ color: '#faad14' }}>
                    Active Filters:
                  </Typography.Text>
                  {searchText && (
                    <Tag color="gold" closable onClose={onClearSearch}>
                      Search: "{searchText}"
                    </Tag>
                  )}
                  {statusFilter !== 'all' && (
                    <Tag color="gold" closable onClose={onClearStatusFilter}>
                      Status: {getStatusDisplayName(statusFilter)}
                    </Tag>
                  )}
                </>
              )}
            </Space>
            
            <Space>
              <Typography.Text type="secondary">
                {loading ? 'Loading...' : `${ordersCount} orders found`}
              </Typography.Text>
              {pagination?.total > 0 && (
                <Typography.Text type="secondary">
                  Page {pagination?.current || 1} of {Math.ceil((pagination?.total || 0) / (pagination?.pageSize || 10))}
                </Typography.Text>
              )}
            </Space>
          </Space>
        </Col>
      </Row>
    </>
  );
};

export default OrderFilters;
