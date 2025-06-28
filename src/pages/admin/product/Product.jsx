import { useState, useEffect, useCallback } from 'react';
import { Table, Typography, Card, Button, Space, Tag, Breadcrumb, Switch, Input, App, Flex, Row, Col, Dropdown, Select } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SettingOutlined, ReloadOutlined, ExportOutlined, MenuOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import AddProduct from './AddProduct';
import { ProductApiRequest } from '../../../api/ApiRequests';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../../../constants/urls';
import { useMediaQuery } from 'react-responsive';
import {
  extractProductsFromResponse,
  extractPaginationFromResponse,
  buildApiParams,
  formatCurrency,
  formatDate,
  getProductStatusColor,
  getProductStatusText,
  handleApiError,
  PRODUCT_FILTER_OPTIONS, 
  PRODUCT_SORT_OPTIONS,
  SEARCH_DEBOUNCE_TIME
} from '../../../utils/productUtils';

const { Option } = Select;

const Product = () => {
    const { message } = App.useApp();
    const navigate = useNavigate();

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    // State management
    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Pagination state
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: !isMobile,
        simple: isMobile
    });
    
    // Filter and search state
    const [searchText, setSearchText] = useState('');
    const [filter, setFilter] = useState('');
    const [sortBy, setSortBy] = useState('');
    const [isDescending, setIsDescending] = useState(false);

    // Debounce search to avoid too many API calls
    const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);

    // Use imported sort options from utils
    const sortOptions = [
        { label: 'Default', value: '' },
        ...PRODUCT_SORT_OPTIONS.map(option => ({ 
            label: option.label, 
            value: option.key 
        }))
    ];

    // Fetch products with server-side pagination, filtering, and sorting
    const fetchProducts = useCallback(async (resetPage = false) => {
        setLoading(true);
        try {
            const currentPagination = resetPage 
                ? { ...pagination, current: 1 } 
                : pagination;
            
            const apiParams = buildApiParams(
                currentPagination,
                searchText,
                filter,
                sortBy,
                isDescending
            );

            if (process.env.NODE_ENV === 'development') {
                console.log('Fetching products with params:', apiParams);
            }

            const response = await ProductApiRequest.getAllProducts(
                apiParams.offset,
                apiParams.limit,
                apiParams.searchString,
                apiParams.filter,
                apiParams.sortBy,
                apiParams.isDescending
            );

            if (process.env.NODE_ENV === 'development') {
                console.log('Raw API Response:', response);
            }

            if (!response || !response.data) {
                throw new Error('Invalid API response structure');
            }

            // Extract products using the utility function that handles $ref resolution
            const productList = extractProductsFromResponse(response.data);
            if (process.env.NODE_ENV === 'development') {
                console.log('Extracted products:', productList);
            }

            // Extract pagination info from the API response
            const paginationInfo = extractPaginationFromResponse(response.data);
            if (process.env.NODE_ENV === 'development') {
                console.log('Extracted pagination:', paginationInfo);
            }

            // Update state with resolved data
            setProducts(productList);
            
            // Update pagination with API response data
            setPagination(prev => ({
                ...prev,
                current: resetPage ? 1 : paginationInfo.current,
                total: paginationInfo.total,
                totalPages: paginationInfo.totalPages,
                hasPreviousPage: paginationInfo.hasPreviousPage,
                hasNextPage: paginationInfo.hasNextPage,
            }));

        } catch (error) {
            console.error('Error fetching products:', error);
            const errorMessage = handleApiError(error, 'fetch products');
            message.error(errorMessage);
            
            // Reset to empty state on error
            setProducts([]);
            setPagination(prev => ({
                ...prev,
                current: 1,
                total: 0,
            }));
        } finally {
            setLoading(false);
        }
    }, [pagination, searchText, filter, sortBy, isDescending, message]);

    // Debounced search handler
    const handleSearch = useCallback((value) => {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        const timer = setTimeout(() => {
            setSearchText(value);
        }, SEARCH_DEBOUNCE_TIME);
        
        setSearchDebounceTimer(timer);
    }, [searchDebounceTimer]);

    const handleFilterChange = useCallback((value) => {
        setFilter(value);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
    }, []);

    const handleSortChange = useCallback((value) => {
        setSortBy(value);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
    }, []);

    const handleSortDirectionToggle = useCallback(() => {
        setIsDescending(prev => !prev);
        setPagination(prev => ({ ...prev, current: 1 })); // Reset to page 1
    }, []);

    // Table change handler for pagination and sorting
    const handleTableChange = useCallback((paginationInfo, filters, sorter) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Table change:', { paginationInfo, filters, sorter });
        }
        
        // Handle sorting
        if (sorter && sorter.field) {
            setSortBy(sorter.field);
            setIsDescending(sorter.order === 'descend');
        }
        
        // Handle pagination changes
        if (paginationInfo) {
            setPagination(prev => ({
                ...prev,
                current: paginationInfo.current || 1,
                pageSize: paginationInfo.pageSize || prev.pageSize,
            }));
        }
    }, []);

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await ProductApiRequest.updateProductStatus(id, !currentStatus);
            await fetchProducts(); // Refresh current page
            message.success('Product status updated successfully');
        } catch (error) {
            message.error('Failed to update product status');
            console.error(error);
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            await ProductApiRequest.deleteProduct(id);
            await fetchProducts(); // Refresh current page
            message.success('Product deleted successfully');
        } catch (error) {
            message.error('Failed to delete product');
            console.error(error);
        }
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: '10%',
            render: (imageUrl) => (
                <img src={imageUrl} alt="product" style={{ width: 50, height: 50, objectFit: 'cover' }} />
            ),
            responsive: ['md']
        },
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            width: isMobile ? '40%' : '15%',
            sorter: true,
            sortOrder: sortBy === 'name' ? (isDescending ? 'descend' : 'ascend') : null,
            render: (name, record) => (
                <Flex align="center" gap={8}>
                    {isMobile && record.imageUrl && (
                        <img src={record.imageUrl} alt={name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '4px' }} />
                    )}
                    <span>{name}</span>
                </Flex>
            )
        },
        {
            title: 'Category',
            dataIndex: 'category',
            key: 'category',
            width: '15%',
            render: (_, record) => record.category?.name || 'N/A',
            sorter: true,
            sortOrder: sortBy === 'category' ? (isDescending ? 'descend' : 'ascend') : null,
            responsive: ['md']
        },
        {
            title: 'Placement',
            dataIndex: 'placement',
            key: 'placement',
            width: '15%',
            render: (_, record) => record.placement?.name || 'N/A',
            responsive: ['lg']
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: '12%',
            sorter: true,
            sortOrder: sortBy === 'price' ? (isDescending ? 'descend' : 'ascend') : null,
            render: (price) => formatCurrency(price),
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: '10%',
            render: (isActive, record) => (
                <Space direction="vertical" size={4}>
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(checked) => handleToggleStatus(record.id, checked)}
                        loading={loading}
                    />
                </Space>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: '12%',
            sorter: true,
            sortOrder: sortBy === 'createdAt' ? (isDescending ? 'descend' : 'ascend') : null,
            render: (date) => formatDate(date),
            responsive: ['lg']
        },
        {
            title: 'Actions',
            key: 'actions',
            width: isMobile ? '30%' : '15%',
            render: (_, record) => {
                if (isMobile) {
                    // Mobile dropdown menu for actions
                    const items = [
                        {
                            key: 'edit',
                            label: 'Edit',
                            icon: <EditOutlined />,
                            onClick: () => navigate(`${URLS.ADMIN.PRODUCT_EDIT(record.id)}`)
                        },
                        {
                            key: 'delete',
                            label: 'Delete',
                            icon: <DeleteOutlined />,
                            danger: true,
                            onClick: () => handleDeleteProduct(record.id)
                        }
                    ];
                    
                    return (
                        <Dropdown menu={{ items }} trigger={['click']}>
                            <Button size="small" icon={<MenuOutlined />} />
                        </Dropdown>
                    );
                }
                
                return (
                    <Space size="middle">
                        <Button
                            variant='outlined'
                            size='small'
                            icon={<EditOutlined />}
                            onClick={() => navigate(`${URLS.ADMIN.PRODUCT_EDIT(record.id)}`)}
                        />
                        <Button
                            variant='outlined'
                            size='small'
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteProduct(record.id)}
                        />
                    </Space>
                );
            }
        }
    ];

    // Effects for data fetching
    useEffect(() => {
        fetchProducts();
    }, [pagination.current, pagination.pageSize]);

    // Fetch products when search/filter/sort changes (reset to page 1)
    useEffect(() => {
        fetchProducts(true);
    }, [searchText, filter, sortBy, isDescending]);

    // Cleanup search debounce timer
    useEffect(() => {
        return () => {
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
            }
        };
    }, [searchDebounceTimer]);

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item>Products</Breadcrumb.Item>
            </Breadcrumb>
            <Typography.Title style={{ marginTop: 0 }} level={2}>Products</Typography.Title>
            
            {/* Responsive Card */}
            <Card>
                {/* Search, Filter, and Action Controls */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} md={8}>
                        <Input.Search
                            placeholder="Search products..."
                            allowClear
                            style={{ width: '100%' }}
                            onSearch={handleSearch}
                            onChange={(e) => {
                                if (e.target.value === '') {
                                    handleSearch('');
                                }
                            }}
                            enterButton={<SearchOutlined />}
                        />
                    </Col>
                    
                    {!isMobile && (
                        <>
                            <Col xs={24} md={4}>
                                <Select
                                    placeholder="Filter by"
                                    style={{ width: '100%' }}
                                    value={filter}
                                    onChange={handleFilterChange}
                                    allowClear
                                >
                                    {PRODUCT_FILTER_OPTIONS.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            
                            <Col xs={24} md={4}>
                                <Select
                                    placeholder="Sort by"
                                    style={{ width: '100%' }}
                                    value={sortBy}
                                    onChange={handleSortChange}
                                    allowClear
                                >
                                    {sortOptions.map(option => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Col>
                            
                            <Col xs={24} md={2}>
                                <Button
                                    type={isDescending ? 'primary' : 'default'}
                                    icon={<FilterOutlined />}
                                    onClick={handleSortDirectionToggle}
                                    title={isDescending ? 'Descending' : 'Ascending'}
                                >
                                    {isDescending ? '↓' : '↑'}
                                </Button>
                            </Col>
                        </>
                    )}

                    <Col xs={24} md={6}>
                        <Flex justify={isMobile ? "space-between" : "end"} gap={8} wrap="wrap">
                            <Button 
                                type="primary" 
                                onClick={() => setIsAddProductModalOpen(true)}
                                style={{ marginBottom: isMobile ? 8 : 0 }}
                            >
                                <PlusOutlined /> {isMobile ? "Add" : "Add Product"}
                            </Button>
                            <Button 
                                variant='text' 
                                icon={<ReloadOutlined />} 
                                onClick={() => fetchProducts()} 
                                loading={loading} 
                            />
                            {!isMobile && (
                                <>
                                    <Button variant='outlined' icon={<ExportOutlined />} />
                                    <Button variant='outlined' icon={<SettingOutlined />} />
                                </>
                            )}
                            {isMobile && (
                                <Dropdown menu={{ 
                                    items: [
                                        {
                                            key: 'filter',
                                            label: 'Filter',
                                            icon: <FilterOutlined />
                                        },
                                        {
                                            key: 'export',
                                            label: 'Export',
                                            icon: <ExportOutlined />
                                        },
                                        {
                                            key: 'settings',
                                            label: 'Settings',
                                            icon: <SettingOutlined />
                                        }
                                    ]
                                }} trigger={['click']}>
                                    <Button icon={<MenuOutlined />} />
                                </Dropdown>
                            )}
                        </Flex>
                    </Col>
                </Row>

                {/* Active Filters Display */}
                {(searchText || filter || sortBy) && (
                    <Row style={{ marginBottom: 16 }}>
                        <Col span={24}>
                            <Space wrap>
                                <span style={{ fontWeight: 500 }}>Active filters:</span>
                                {searchText && (
                                    <Tag closable onClose={() => handleSearch('')}>
                                        Search: "{searchText}"
                                    </Tag>
                                )}
                                {filter && (
                                    <Tag closable onClose={() => handleFilterChange('')}>
                                        Filter: {PRODUCT_FILTER_OPTIONS.find(opt => opt.value === filter)?.label}
                                    </Tag>
                                )}
                                {sortBy && (
                                    <Tag closable onClose={() => handleSortChange('')}>
                                        Sort: {sortOptions.find(opt => opt.value === sortBy)?.label} 
                                        {isDescending ? ' (↓)' : ' (↑)'}
                                    </Tag>
                                )}
                            </Space>
                        </Col>
                    </Row>
                )}

                {/* Products Table */}
                <Table
                    columns={columns}
                    dataSource={products}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        ...pagination,
                        showTotal: (total, range) => 
                            `Showing ${range[0]}-${range[1]} of ${total} products`,
                    }}
                    onChange={handleTableChange}
                    scroll={{ x: 'max-content' }}
                    size={isMobile ? "small" : "middle"}
                />
            </Card>
            
            <AddProduct
                open={isAddProductModalOpen}
                onCancel={() => setIsAddProductModalOpen(false)}
                onSubmit={(values) => {
                    if (process.env.NODE_ENV === 'development') {
                        console.log('Form submitted with values:', values);
                    }
                    setIsAddProductModalOpen(false);
                    fetchProducts();
                }}
            />
        </>
    );
};

export default Product;
