import { Typography, Card, Row, Col, Input, Select, Flex, Image, Breadcrumb, Pagination, Spin, message, App } from 'antd';
import { useState, useEffect, useCallback } from 'react';
import ProductCard from '../../components/ProductCard';
import CategoryCard from '../../components/CategoryCard';
import ComboCard from '../../components/ComboCard';
import { URLS } from '../../constants/urls';
import { CategoryApiRequest, ProductApiRequest } from '../../api/ApiRequests';
import { 
  resolveRefs, 
  extractProductsFromResponse, 
  extractPaginationFromResponse,
  handleApiError 
} from '../../utils/productUtils';
import { SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;

const Products = () => {
    const { message: messageApi } = App.useApp();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [hotProducts, setHotProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hotProductsLoading, setHotProductsLoading] = useState(false);
    
    // Enhanced pagination state to match API response structure
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 8,
        total: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false
    });

    const fetchCategories = async () => {
        try {
            const response = await CategoryApiRequest.getAllParentCategories();
            
            // Handle $ref resolution if needed
            let categoriesData = response.data;
            if (categoriesData && typeof categoriesData === 'object') {
                categoriesData = resolveRefs(categoriesData);
            }
            
            // Extract categories from response
            const categories = categoriesData?.$values || categoriesData || [];
            setCategories(categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
            const errorMessage = handleApiError(error, 'fetch categories');
            messageApi.error(errorMessage);
        }
    };

    const fetchProducts = useCallback(async (page = pagination.current, pageSize = pagination.pageSize, searchText = '') => {
        setLoading(true);
        try {
            // Calculate offset for pagination (0-based index for the API)
            const offset = (page - 1) * pageSize;
            
            if (process.env.NODE_ENV === 'development') {
                console.log('Fetching products with params:', { offset, pageSize, searchText });
            }
            
            // Use the API request with pagination parameters and search
            const response = await ProductApiRequest.getAllProducts(
                offset, 
                pageSize, 
                searchText, // searchString parameter
                '', // filter parameter
                '', // sortBy parameter  
                false // isDescending parameter
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
            setPagination({
                current: page,
                pageSize: pageSize,
                total: paginationInfo.total,
                totalPages: paginationInfo.totalPages,
                hasPreviousPage: paginationInfo.hasPreviousPage,
                hasNextPage: paginationInfo.hasNextPage,
            });
            
        } catch (error) {
            console.error("Error fetching products:", error);
            const errorMessage = handleApiError(error, 'fetch products');
            messageApi.error(errorMessage);
            
            // Reset to empty state on error
            setProducts([]);
            setPagination(prev => ({
                ...prev,
                current: 1,
                total: 0,
                totalPages: 0,
                hasPreviousPage: false,
                hasNextPage: false
            }));
        } finally {
            setLoading(false);
        }
    }, [pagination.current, pagination.pageSize, messageApi]);

    const fetchHotProducts = async () => {
        setHotProductsLoading(true);
        try {
            const response = await ProductApiRequest.getTopSaleProducts(10);
            
            // Handle $ref resolution for hot products
            let hotProductsData = response.data;
            if (hotProductsData && typeof hotProductsData === 'object') {
                hotProductsData = resolveRefs(hotProductsData);
            }
            
            // Extract hot products from response
            const hotProductsList = hotProductsData?.$values || hotProductsData || [];
            setHotProducts(hotProductsList);
        } catch (error) {
            console.error("Error fetching hot products:", error);
            const errorMessage = handleApiError(error, 'fetch hot products');
            messageApi.error(errorMessage);
            setHotProducts([]); // Set empty array on error
        } finally {
            setHotProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchProducts();
        fetchHotProducts();
    }, []);

    const handlePageChange = (page, pageSize) => {
        fetchProducts(page, pageSize, searchTerm);
    };

    const handleSearch = (value) => {
        setSearchTerm(value);
        // Reset to first page when searching
        fetchProducts(1, pagination.pageSize, value);
    };

    // If we have a search term, we've already filtered on the server side
    // So we can use the products directly from the API
    const filteredProducts = products;

    const combos = [
        {
            id: 1,
            name: 'Furniture Bundle',
            description: 'Buy any sofa + coffee table, get 15% OFF',
            category: 'Furniture',
            price: 15,
            image: 'https://product.hstatic.net/1000280685/product/den_noti_757ede804a0040c680335ad6ab94b796_compact.png'
        },
        {
            id: 2,
            name: 'Home Decor Set',
            description: 'Buy any 3 decor items, get 20% OFF',
            category: 'Decor',
            price: 20,
            image: 'https://product.hstatic.net/1000280685/product/den_noti_757ede804a0040c680335ad6ab94b796_compact.png'
        }
    ];

    const filteredCombos = combos.filter(combo => {
        const matchesSearch = combo.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Debugging: Log the current state
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.log('Current state:', {
                products: products.length,
                pagination,
                searchTerm,
                loading
            });
        }
    }, [products, pagination, searchTerm, loading]);

    return (
        <App>
            <Flex vertical gap={24}>
                <Breadcrumb>
                    <Breadcrumb.Item href={URLS.CUSTOMER.HOME}>Home</Breadcrumb.Item>
                    <Breadcrumb.Item href={URLS.CUSTOMER.PRODUCTS}>Products</Breadcrumb.Item>
                </Breadcrumb>
            <Row>
                <Col xs={24} sm={24} md={16} lg={16}>
                    <Image 
                    width={'100%'}
                    height={'100%'}
                    preview={false}
                    src='https://firebasestorage.googleapis.com/v0/b/makemyhome-27df4.appspot.com/o/Banners%2FImages%2Fminimalist-interior-design.jpg?alt=media&token=2fb4fddd-57d9-40bd-b07d-64fc7ec03602'
                    />
                </Col>
                <Col xs={0} sm={0} md={8} lg={8}>
                    <Image 
                    width={'100%'}
                    height={'100%'}
                    preview={false}
                    src='https://firebasestorage.googleapis.com/v0/b/makemyhome-27df4.appspot.com/o/Banners%2FImages%2Fhome-plant-vase-decoration-assortment.jpg?alt=media&token=e79674e6-f657-45be-a09a-87d3d5139a5f'
                    />
                </Col>
            </Row>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Title level={2} style={{ 
                    background: 'linear-gradient(135deg, #faad14, #ffd53e)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 700
                }}>
                    Our Products
                </Title>
                
            </div>

            {/* Hot Sale Products */}
            <div>
                <Title level={3}>Hot Sale</Title>
                <Spin spinning={hotProductsLoading}>
                    <Row gutter={[16, 16]}>
                        {hotProducts.map(product => (
                            <Col xs={12} sm={12} md={8} lg={6} key={product.id}>
                                <ProductCard product={product} />
                            </Col>
                        ))}
                        {hotProducts.length === 0 && !hotProductsLoading && (
                            <Col span={24}>
                                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                    <Text type="secondary">No hot sale products available</Text>
                                </div>
                            </Col>
                        )}
                    </Row>
                </Spin>
            </div>

            {/* Categories */}
            <div>
                <Title level={3}>Shop by Category</Title>
                <Row gutter={[32, 16]}>
                    {categories?.length > 0 && categories
                        .map(category => (
                            <Col xs={12} sm={8} md={6} lg={4} key={category.value}>
                                <CategoryCard image={category.imageUrl} title={category.name} slug={category.slug} />
                            </Col>
                        ))}
                </Row>
            </div>

            
            <Row gutter={[16, 16]}>
                <Col xs={0} sm={0} md={12} lg={12}>
                    <Image 
                    preview={false}
                    src='https://firebasestorage.googleapis.com/v0/b/makemyhome-27df4.appspot.com/o/Banners%2FImages%2Fpicture-frame-by-velvet-armchair.jpg?alt=media&token=d4d0af61-4c75-4343-b618-e27160849bd2'
                    />
                </Col>
                <Col xs={24} sm={24} md={12} lg={12}>
                        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <Search
                        placeholder="Search for products..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onSearch={handleSearch}
                        loading={loading}
                        style={{
                            '& .ant-input-search-button .ant-btn-primary': {
                                background: 'linear-gradient(135deg, #faad14, #ffd53e)',
                                borderColor: '#faad14'
                            }
                        }}
                    />
                </div>
                
                {/* Search Results Summary */}
                {searchTerm && (
                    <div style={{ 
                        marginTop: '16px', 
                        padding: '8px 16px', 
                        background: 'rgba(250, 173, 20, 0.1)',
                        borderRadius: '6px',
                        display: 'inline-block'
                    }}>
                        <Text type="secondary">
                            {loading ? 'Searching...' : `Found ${pagination.total} results for "${searchTerm}"`}
                        </Text>
                    </div>
                )}
                    <Spin spinning={loading}>
                        <Row gutter={[32, 16]} style={{ marginTop: '20px' }}>
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <Col xs={12} sm={12} md={12} lg={12} key={product.id}>
                                        <ProductCard product={product} />
                                    </Col>
                                ))
                            ) : (
                                !loading && (
                                    <Col span={24}>
                                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                            <Text type="secondary">
                                                {searchTerm ? `No products found for "${searchTerm}"` : 'No products available'}
                                            </Text>
                                        </div>
                                    </Col>
                                )
                            )}
                        </Row>
                    </Spin>
                </Col>
            </Row>

            {/* Enhanced Pagination */}
            {filteredProducts.length > 0 && (
                <Card style={{ 
                    textAlign: 'center', 
                    marginTop: '32px',
                    borderRadius: '12px',
                    border: '1px solid rgba(250, 173, 20, 0.2)'
                }}>
                    <div style={{ marginBottom: '16px' }}>
                        <Text style={{ fontSize: '16px', color: '#666' }}>
                            Showing{' '}
                            <span style={{ color: '#faad14', fontWeight: 600 }}>
                                {((pagination.current - 1) * pagination.pageSize) + 1}-
                                {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                            </span>
                            {' '}of{' '}
                            <span style={{ color: '#faad14', fontWeight: 600 }}>
                                {pagination.total}
                            </span>
                            {' '}products
                        </Text>
                    </div>
                    <Pagination 
                        current={pagination.current} 
                        pageSize={pagination.pageSize} 
                        total={pagination.total} 
                        onChange={handlePageChange}
                        showSizeChanger={false}
                        showQuickJumper={false}
                        disabled={loading}
                        style={{
                            '& .ant-pagination-item-active': {
                                backgroundColor: '#faad14',
                                borderColor: '#faad14'
                            }
                        }}
                    />
                </Card>
            )}
            </Flex>
        </App>
    );
};

export default Products;

// Add custom styles for the customer products page
const customerProductStyles = `
.ant-input-search .ant-input-search-button .ant-btn-primary {
    background: linear-gradient(135deg, #faad14, #ffd53e) !important;
    border-color: #faad14 !important;
    box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3) !important;
}

.ant-pagination-item-active {
    background-color: #faad14 !important;
    border-color: #faad14 !important;
}

.ant-pagination-item-active a {
    color: white !important;
}

.ant-pagination-item:hover {
    border-color: #faad14 !important;
}

.ant-pagination-item:hover a {
    color: #faad14 !important;
}

.ant-input-search:hover .ant-input-search-button .ant-btn-primary {
    background: linear-gradient(135deg, #ffd53e, #faad14) !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const existingStyle = document.getElementById('customer-products-styles');
    if (!existingStyle) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'customer-products-styles';
        styleSheet.type = 'text/css';
        styleSheet.innerText = customerProductStyles;
        document.head.appendChild(styleSheet);
    }
}
