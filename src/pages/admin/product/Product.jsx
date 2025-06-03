import { useState, useEffect } from 'react';
import { Table, Typography, Card, Button, Space, Tag, Breadcrumb, Switch, Input, App, Flex, Row, Col, Dropdown } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, SettingOutlined, ReloadOutlined, ExportOutlined, MenuOutlined } from '@ant-design/icons';
import AddProduct from './AddProduct';
import { ProductApiRequest } from '../../../api/ApiRequests';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../../../constants/urls';
import { useMediaQuery } from 'react-responsive';
const Product = () => {
    const { message } = App.useApp();
    const navigate = useNavigate();

    // Responsive breakpoints
    const isMobile = useMediaQuery({ maxWidth: 767 });
    const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
    const isDesktop = useMediaQuery({ minWidth: 1024 });

    const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await ProductApiRequest.getAllProducts();
            setProducts(response.data.$values || []);
        } catch (error) {
            message.error('Failed to fetch products');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter products based on search text
    const filteredProducts = products.filter(product =>
        product.name?.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleSearch = (value) => {
        setSearchText(value);
    };

    const handleToggleStatus = async (id, currentStatus) => {
        try {
            await ProductApiRequest.updateProductStatus(id, !currentStatus);
            fetchProducts();
            message.success('Product status updated successfully');
        } catch (error) {
            message.error('Failed to update product status');
            console.error(error);
        }
    };

    const handleDeleteProduct = (id) => {
        try {
            // Implement delete functionality
            ProductApiRequest.deleteProduct(id);
            fetchProducts();
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
            sorter: (a, b) => a.name.localeCompare(b.name),
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
            filters: Array.from(new Set(products.map(p => p.category?.name))).filter(Boolean).map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.category?.name === value,
            responsive: ['md']
        },
        {
            title: 'Placement',
            dataIndex: 'placement',
            key: 'placement',
            width: '15%',
            render: (_, record) => record.placement?.name || 'N/A',
            filters: Array.from(new Set(products.map(p => p.placement?.name))).filter(Boolean).map(name => ({ text: name, value: name })),
            onFilter: (value, record) => record.placement?.name === value,
            responsive: ['lg']
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: '10%',
            render: (price) => `$${price.toFixed(2)}`,
            sorter: (a, b) => a.price - b.price,
            responsive: ['sm']
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: '10%',
            render: (status) => (
                <Tag color={status === 'In Stock' ? 'green' : 'orange'}>
                    {status}
                </Tag>
            ),
            responsive: ['sm']
        },
        {
            title: 'Active',
            dataIndex: 'isActive',
            key: 'isActive',
            width: isMobile ? '30%' : '15%',
            render: (isActive, record) => (
                <Switch 
                    checked={isActive} 
                    onChange={() => handleToggleStatus(record.id, isActive)}
                    size={isMobile ? "small" : "default"}
                />
            )
        },
        {
            title: '',
            key: 'actions',
            width: isMobile ? '30%' : '10%',
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
                            icon={<EditOutlined />}
                            onClick={() => navigate(`${URLS.ADMIN.PRODUCT_EDIT(record.id)}`)}
                        />

                        <Button
                            variant='outlined'
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteProduct(record.id)}
                        />
                    </Space>
                );
            },
        },
    ];

    return (
        <>
            <Breadcrumb>
                <Breadcrumb.Item>Products</Breadcrumb.Item>
            </Breadcrumb>
            <Typography.Title style={{ marginTop: 0 }} level={2}>Products</Typography.Title>
            
            {/* Responsive Card */}
            <Card>
                {/* Search and Action Buttons */}
                <Row gutter={[16, 16]} justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} md={12}>
                        <Input.Search
                            placeholder="Search products..."
                            allowClear
                            style={{ width: '100%' }}
                            onSearch={handleSearch}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} md={12}>
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
                                onClick={fetchProducts} 
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

                {/* Products Table */}
                <Table
                    columns={columns}
                    dataSource={filteredProducts}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        total: filteredProducts.length,
                        pageSize: isMobile ? 5 : 10,
                        showSizeChanger: !isMobile,
                        showQuickJumper: !isMobile,
                        simple: isMobile
                    }}
                    scroll={{ x: 'max-content' }}
                    size={isMobile ? "small" : "middle"}
                />
            </Card>
            
            <AddProduct
                open={isAddProductModalOpen}
                onCancel={() => setIsAddProductModalOpen(false)}
                onSubmit={(values) => {
                    console.log('Form submitted with values:', values);
                    setIsAddProductModalOpen(false);
                    fetchProducts();
                }}
            />
        </>
    );
};

export default Product;
