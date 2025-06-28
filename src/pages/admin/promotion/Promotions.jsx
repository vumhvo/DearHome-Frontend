import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Card, Typography, message, Modal, Form, Input, DatePicker, InputNumber, Select, Popconfirm, Switch, Row, Col, App, Flex, Image, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, FilterOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import moment from 'moment';
import { promotionApiRequest, ProductApiRequest } from '../../../api/ApiRequests';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

const Promotions = () => {
  const {message} = App.useApp();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerLevelFilter, setCustomerLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('');
  const [isDescending, setIsDescending] = useState(false);
  const [form] = Form.useForm();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);

  useEffect(() => {
    fetchPromotions();
  }, [pagination.current, searchText, statusFilter, customerLevelFilter, sortBy, isDescending]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        search: searchText,
      };

      // Add status filter (map to server format if needed)
      if (statusFilter && statusFilter !== 'all') {
        params.filter = statusFilter === 'active' ? 'isActive:true' : 'isActive:false';
      }

      // Add sorting
      if (sortBy) {
        params.sortBy = sortBy;
        params.isDescending = isDescending;
      }

      const response = await promotionApiRequest.getAllPromotions(params);
      
      // Debug logging
      console.log('API Response:', response.data);
      
      // Validate response structure
      if (!response || !response.data) {
        console.error('Invalid API response:', response);
        setPromotions([]);
        setPagination({ ...pagination, total: 0 });
        return;
      }

      // Extract promotions data with fallbacks
      let promotionsData = [];
      let totalCount = 0;
      
      if (response.data.data && response.data.data.$values && Array.isArray(response.data.data.$values)) {
        // Handle the specific API structure: response.data.data.$values
        promotionsData = response.data.data.$values;
        totalCount = response.data.totalRecords || response.data.data.$values.length;
      } else if (response.data.$values && Array.isArray(response.data.$values)) {
        // Handle alternative structure: response.data.$values
        promotionsData = response.data.$values;
        totalCount = response.data.totalCount || response.data.$values.length;
      } else if (Array.isArray(response.data)) {
        // Handle direct array structure: response.data
        promotionsData = response.data;
        totalCount = response.data.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure: response.data.data
        promotionsData = response.data.data;
        totalCount = response.data.totalRecords || response.data.data.length;
      } else {
        console.warn('Unexpected response format:', response.data);
        promotionsData = [];
        totalCount = 0;
      }

      // Client-side filtering if server doesn't support it
      if ((statusFilter && statusFilter !== 'all') || 
          (customerLevelFilter && customerLevelFilter !== 'all')) {
        if (Array.isArray(promotionsData)) {
          promotionsData = promotionsData.filter(promotion => {
            if (!promotion) return false;
            
            // Status filter
            if (statusFilter !== 'all') {
              if (statusFilter === 'active' && !promotion.isActive) return false;
              if (statusFilter === 'inactive' && promotion.isActive) return false;
            }
            
            // Customer level filter
            if (customerLevelFilter !== 'all' && promotion.customerLevel !== customerLevelFilter) {
              return false;
            }
            
            return true;
          });
        }
      }

      // Client-side sorting if server doesn't support it
      if (sortBy && Array.isArray(promotionsData) && promotionsData.length > 0) {
        promotionsData.sort((a, b) => {
          if (!a || !b) return 0;
          
          let aValue = a[sortBy];
          let bValue = b[sortBy];

          // Handle different data types
          if (sortBy === 'StartDate' || sortBy === 'EndDate') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
          } else if (sortBy === 'DiscountPercentage' || sortBy === 'Usage') {
            aValue = Number(aValue) || 0;
            bValue = Number(bValue) || 0;
          } else if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue?.toLowerCase() || '';
          }

          let comparison = 0;
          if (aValue > bValue) comparison = 1;
          if (aValue < bValue) comparison = -1;

          return isDescending ? -comparison : comparison;
        });
      }

      // Ensure promotionsData is always an array
      if (!Array.isArray(promotionsData)) {
        console.error('promotionsData is not an array:', promotionsData);
        promotionsData = [];
      }

      setPromotions(promotionsData);
      setPagination({
        ...pagination,
        total: totalCount,
      });
    } catch (error) {
      console.error('Error fetching promotions:', error);
      message.error('Failed to fetch promotions');
      // Set empty array on error to prevent further issues
      setPromotions([]);
      setPagination({ ...pagination, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await ProductApiRequest.getAllProducts(0, 100); // Fetch up to 100 products
      setProducts(response.data.$values || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      message.error('Failed to fetch products');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddPromotion = () => {
    setModalType('add');
    form.resetFields();
    setSelectedProductIds([]);
    setModalVisible(true);
    // Fetch products when adding a new promotion
    fetchProducts();
  };

  const handleEditPromotion = (promotion) => {
    if (!promotion) {
      message.error('Invalid promotion data');
      return;
    }
    
    setModalType('edit');
    setSelectedPromotion(promotion);
    
    // Safely extract product IDs
    const productIds = [];
    if (promotion.products && promotion.products.$values && Array.isArray(promotion.products.$values)) {
      productIds.push(...promotion.products.$values.map(product => product.id).filter(id => id));
    } else if (promotion.productIds && Array.isArray(promotion.productIds)) {
      productIds.push(...promotion.productIds.filter(id => id));
    }
    
    setSelectedProductIds(productIds);
    
    // Safely set form values
    const formValues = {
      ...promotion,
    };
    
    // Handle date range safely
    if (promotion.startDate && promotion.endDate) {
      try {
        formValues.dateRange = [moment(promotion.startDate), moment(promotion.endDate)];
      } catch (error) {
        console.warn('Invalid date format:', error);
        formValues.dateRange = null;
      }
    }
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
    // Fetch products when editing a promotion
    fetchProducts();
  };

  const handleViewPromotion = (promotion) => {
    if (!promotion) {
      message.error('Invalid promotion data');
      return;
    }
    
    setModalType('view');
    setSelectedPromotion(promotion);
    
    // Safely extract product IDs
    const productIds = [];
    if (promotion.products && promotion.products.$values && Array.isArray(promotion.products.$values)) {
      productIds.push(...promotion.products.$values.map(product => product.id).filter(id => id));
    } else if (promotion.productIds && Array.isArray(promotion.productIds)) {
      productIds.push(...promotion.productIds.filter(id => id));
    }
    
    setSelectedProductIds(productIds);
    
    // Safely set form values
    const formValues = {
      ...promotion,
    };
    
    // Handle date range safely
    if (promotion.startDate && promotion.endDate) {
      try {
        formValues.dateRange = [moment(promotion.startDate), moment(promotion.endDate)];
      } catch (error) {
        console.warn('Invalid date format:', error);
        formValues.dateRange = null;
      }
    }
    
    form.setFieldsValue(formValues);
    setModalVisible(true);
  };

  const handleDeletePromotion = async (promotionId) => {
    if (!promotionId) {
      message.error('Invalid promotion ID');
      return;
    }
    
    try {
      // Optimistically update the UI
      setPromotions(prevPromotions => 
        Array.isArray(prevPromotions) 
          ? prevPromotions.filter(item => item?.id !== promotionId)
          : []
      );
      message.success('Promotion deleted successfully');
      
      // Here you would typically call the API to delete on server
      // await promotionApiRequest.deletePromotion(promotionId);
    } catch (error) {
      console.error('Error deleting promotion:', error);
      message.error('Failed to delete promotion');
      // Refresh the data on error
      fetchPromotions();
    }
  };

  const handleSubmit = async (values) => {
    try {
      const promotionData = {
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      };
      delete promotionData.dateRange;

      console.log('Promotion Data:', promotionData);

      if (modalType === 'add') {
        await promotionApiRequest.createPromotion(promotionData);
        message.success('Promotion added successfully');
      } else if (modalType === 'edit') {
        await promotionApiRequest.updatePromotion(selectedPromotion.id, promotionData);
        fetchPromotions();
        message.success('Promotion updated successfully');
      }
      
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving promotion:', error);
      message.error('Failed to save promotion');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleCustomerLevelFilter = (value) => {
    setCustomerLevelFilter(value);
    setPagination({ ...pagination, current: 1 });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setIsDescending(!isDescending);
    } else {
      setSortBy(field);
      setIsDescending(false);
    }
    setPagination({ ...pagination, current: 1 });
  };

  const resetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setCustomerLevelFilter('all');
    setSortBy('');
    setIsDescending(false);
    setPagination({ ...pagination, current: 1 });
  };

  const handleTableChange = (paginationInfo, filters, sorter) => {
    setPagination({
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
      total: pagination.total,
    });
  };

  const handleProductSelection = (selectedIds) => {
    setSelectedProductIds(selectedIds);
  };

  const columns = [
    {
      title: (
        <Space>
          Code
          <Button
            type="text"
            size="small"
            icon={sortBy === 'Code' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('Code')}
            style={{ color: sortBy === 'Code' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: (
        <Space>
          Name
          <Button
            type="text"
            size="small"
            icon={sortBy === 'Name' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('Name')}
            style={{ color: sortBy === 'Name' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
   
    {
      title: (
        <Space>
          Discount
          <Button
            type="text"
            size="small"
            icon={sortBy === 'DiscountPercentage' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('DiscountPercentage')}
            style={{ color: sortBy === 'DiscountPercentage' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (value) => `${value || 0}%`,
      sorter: true,
    },
    {
      title: (
        <Space>
          Start Date
          <Button
            type="text"
            size="small"
            icon={sortBy === 'StartDate' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('StartDate')}
            style={{ color: sortBy === 'StartDate' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? moment(date).format('YYYY-MM-DD') : '-',
      sorter: true,
    },
    {
      title: (
        <Space>
          End Date
          <Button
            type="text"
            size="small"
            icon={sortBy === 'EndDate' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('EndDate')}
            style={{ color: sortBy === 'EndDate' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date) => date ? moment(date).format('YYYY-MM-DD') : '-',
      sorter: true,
    },
    {
      title: 'Customer Level',
      dataIndex: 'customerLevel',
      key: 'customerLevel',
      render: (level) => {
        const colors = {
          'Bronze': 'orange',
          'Silver': 'gray',
          'Gold': 'gold',
          'Platinum': 'purple'
        };
        return (
          <Tag color={colors[level] || 'default'}>
            {level || 'N/A'}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: (
        <Space>
          Usage
          <Button
            type="text"
            size="small"
            icon={sortBy === 'Usage' ? (isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />) : <SortAscendingOutlined />}
            onClick={() => handleSort('Usage')}
            style={{ color: sortBy === 'Usage' ? '#faad14' : '#666' }}
          />
        </Space>
      ),
      dataIndex: 'usage',
      key: 'usage',
      render: (value) => value || 0,
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => handleViewPromotion(record)}
            type="text"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditPromotion(record)}
            type="text"
          />
          <Popconfirm
            title="Are you sure you want to delete this promotion?"
            onConfirm={() => handleDeletePromotion(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderModalTitle = () => {
    switch (modalType) {
      case 'add':
        return 'Add New Promotion';
      case 'edit':
        return 'Edit Promotion';
      case 'view':
        return 'Promotion Details';
      default:
        return 'Promotion';
    }
  };

  return (
    <div>
      <Card
        title={
          <Space>
            <Title level={4} style={{ margin: 0, background: 'linear-gradient(135deg, #faad14, #ffd53e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
              Promotions
            </Title>
            <Tag color="gold">
              Page {pagination.current} • {Array.isArray(promotions) ? promotions.length : 0} of {pagination.total} promotions
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddPromotion}
            >
              Add Promotion
            </Button>
            <Tooltip title="Refresh promotions">
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchPromotions}
                style={{ borderColor: '#faad14', color: '#faad14' }}
              />
            </Tooltip>
          </Space>
        }
      >
        {/* Filters and Search */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search promotions..."
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ 
                borderRadius: '8px',
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined style={{ color: '#faad14' }} />}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="Customer Level"
              value={customerLevelFilter}
              onChange={handleCustomerLevelFilter}
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined style={{ color: '#faad14' }} />}
            >
              <Option value="all">All Levels</Option>
              <Option value="Bronze">Bronze</Option>
              <Option value="Silver">Silver</Option>
              <Option value="Gold">Gold</Option>
              <Option value="Platinum">Platinum</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Space>
              <Select
                placeholder="Sort by"
                value={sortBy}
                onChange={(value) => {
                  setSortBy(value);
                  setPagination({ ...pagination, current: 1 });
                }}
                style={{ width: 120 }}
                allowClear
              >
                <Option value="Name">Name</Option>
                <Option value="Code">Code</Option>
                <Option value="DiscountPercentage">Discount</Option>
                <Option value="StartDate">Start Date</Option>
                <Option value="EndDate">End Date</Option>
                <Option value="Usage">Usage</Option>
                <Option value="CustomerLevel">Level</Option>
              </Select>
              {sortBy && (
                <Button
                  type="text"
                  icon={isDescending ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                  onClick={() => setIsDescending(!isDescending)}
                  style={{ color: '#faad14' }}
                >
                  {isDescending ? 'Desc' : 'Asc'}
                </Button>
              )}
              {(searchText || statusFilter !== 'all' || customerLevelFilter !== 'all' || sortBy) && (
                <Button
                  type="link"
                  onClick={resetFilters}
                  style={{ color: '#faad14' }}
                >
                  Reset
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* Current Filters Display */}
        {(searchText || statusFilter !== 'all' || customerLevelFilter !== 'all' || sortBy) && (
          <Row style={{ marginBottom: 16 }}>
            <Col span={24}>
              <Space wrap>
                <Typography.Text strong style={{ color: '#faad14' }}>Active Filters:</Typography.Text>
                {searchText && <Tag color="gold" closable onClose={() => setSearchText('')}>Search: "{searchText}"</Tag>}
                {statusFilter !== 'all' && <Tag color="gold" closable onClose={() => setStatusFilter('all')}>Status: {statusFilter}</Tag>}
                {customerLevelFilter !== 'all' && <Tag color="gold" closable onClose={() => setCustomerLevelFilter('all')}>Level: {customerLevelFilter}</Tag>}
                {sortBy && (
                  <Tag color="gold" closable onClose={() => setSortBy('')}>
                    Sort: {sortBy} ({isDescending ? 'Desc' : 'Asc'})
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={Array.isArray(promotions) ? promotions : []}
          rowKey={(record) => record?.id || Math.random()}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => {
              const start = range ? range[0] : 0;
              const end = range ? range[1] : 0;
              return `Showing ${start}-${end} of ${total} promotions`;
            },
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={handleTableChange}
          style={{
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
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
              {renderModalTitle()}
            </Typography.Title>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={modalType === 'view' ? [
          <Button key="close" onClick={() => setModalVisible(false)} style={{ borderColor: '#faad14', color: '#faad14' }}>
            Close
          </Button>
        ] : null}
        destroyOnClose
        width={700}
        style={{
          borderRadius: '12px',
        }}
        styles={{
          header: {
            background: 'linear-gradient(135deg, #fefefe, #fff9e6)',
            borderRadius: '12px 12px 0 0'
          },
          body: {
            background: 'linear-gradient(135deg, #fefefe, #fff9e6)'
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={modalType === 'view'}
        >
          <Form.Item
            name="name"
            label="Promotion Name"
            rules={[{ required: true, message: 'Please enter promotion name' }]}
          >
            <Input placeholder="Enter promotion name" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Promotion Code"
            rules={[{ required: true, message: 'Please enter promotion code' }]}
          >
            <Input placeholder="Enter promotion code" />
          </Form.Item>

          <Form.Item
            name="discountPercentage"
            label="Discount Percentage"
            rules={[{ required: true, message: 'Please enter discount percentage' }]}
          >
            <InputNumber
              min={0}
              max={100}
              placeholder="Enter discount percentage"
              style={{ width: '100%' }}
              formatter={value => `${value}%`}
              parser={value => value.replace('%', '')}
            />
          </Form.Item>

          <Form.Item
            name="customerLevel"
            label="Customer Level"
            rules={[{ required: true, message: 'Please select customer level' }]}
          >
            <Select placeholder="Select customer level">
              <Option value="Bronze">Bronze</Option>
              <Option value="Silver">Silver</Option>
              <Option value="Gold">Gold</Option>
              <Option value="Platinum">Platinum</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Promotion Period"
            rules={[{ required: true, message: 'Please select promotion period' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="usage"
            label="Usage Limit"
            rules={[{ required: true, message: 'Please enter usage limit' }]}
          >
            <InputNumber
              min={1}
              placeholder="Enter usage limit"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} placeholder="Enter promotion description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          {modalType !== 'view' && (
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                >
                  {modalType === 'add' ? 'Add Promotion' : 'Save Changes'}
                </Button>
                <Button 
                  onClick={() => setModalVisible(false)}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Promotions;
