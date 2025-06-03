import { Row, Col, Card, Statistic, Typography, Tabs, Flex, Button, Tooltip, Radio, List, Table, Progress, DatePicker, message } from 'antd';
import { ShoppingOutlined, UserOutlined, DollarOutlined, ShoppingCartOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { statisticsApiRequest } from '../../api/ApiRequests';
Chart.register(...registerables);

const { Title } = Typography;

const Dashboard = () => {
    // Utility function to format period keys (e.g., "2025-5" to "May 2025" or "2025" to "2025")
    const formatPeriodKey = (key) => {
        if (key && key.includes('-')) {
            const parts = key.split('-');
            if (parts.length === 2) {
                const year = parts[0];
                const month = parts[1];
                const date = new Date(year, month - 1);
                return date.toLocaleString('default', { month: 'short', year: 'numeric' });
            }
        } else if (key && /^\d{4}$/.test(key)) {
            // For yearly data, just return the year
            return key;
        }
        return key;
    };

    const [overallStats, setOverallStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalCustomers: 0
    });
    const [loading, setLoading] = useState(true);
    // Initialize date range with default values: 1 year ago to today
    const defaultStartDate = new Date();
    defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
    const [dateRange, setDateRange] = useState([
        dayjs(defaultStartDate),
        dayjs()
    ]);
    const [salesByPeriod, setSalesByPeriod] = useState([]);
    const [orderCountByPeriod, setOrderCountByPeriod] = useState([]);
    const [periodType, setPeriodType] = useState('monthly');
    const [topSellingProducts, setTopSellingProducts] = useState({
        byAmount: [],
        byCount: []
    });
    const [orderStatusPercentage, setOrderStatusPercentage] = useState([]);
    const [categoriesStock, setCategoriesStock] = useState([]);
    const [promotionStats, setPromotionStats] = useState([]);
    const [loadingTopProducts, setLoadingTopProducts] = useState(false);
    const [loadingOrderStatus, setLoadingOrderStatus] = useState(false);
    const [loadingCategoriesStock, setLoadingCategoriesStock] = useState(false);
    const [loadingPromotionStats, setLoadingPromotionStats] = useState(false);

    // Fetch overall statistics on component mount
    useEffect(() => {
        // Since we now have default dates, we should include them in our initial API calls
        fetchOverallStats();
        fetchSalesAndOrdersByPeriod();
        fetchTopSellingProducts();
        fetchOrderStatusPercentage();
        fetchCategoriesStock();
        fetchPromotionStatistics();
    }, []);

    // Fetch overall statistics with optional date range
    const fetchOverallStats = async () => {
        try {
            setLoading(true);
            const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
            const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
            
            const response = await statisticsApiRequest.getOverallStatistics(startDate, endDate);
            console.log('Overall stats response:', response.data);
            setOverallStats(response.data);
        } catch (error) {
            console.error('Error fetching overall statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle date range change
    const handleDateRangeChange = (dates) => {
        // If dates is null or empty (user cleared the selection), reset to default date range
        if (!dates || !dates.length) {
            const defaultStartDate = new Date();
            defaultStartDate.setFullYear(defaultStartDate.getFullYear() - 1);
            setDateRange([dayjs(defaultStartDate), dayjs()]);
            
            // Fetch with default date range
            fetchOverallStats();
            fetchSalesAndOrdersByPeriod();
            fetchTopSellingProducts();
            fetchPromotionStatistics();
        } else {
            setDateRange(dates);
            if (dates && dates[0] && dates[1]) {
                // Only fetch if both start and end dates are selected
                fetchOverallStats();
                fetchSalesAndOrdersByPeriod();
                fetchTopSellingProducts();
                fetchPromotionStatistics();
            }
        }
    };

    // Handle period type change
    const handlePeriodTypeChange = (e) => {
        setPeriodType(e.target.value);
        fetchSalesAndOrdersByPeriod(e.target.value);
    };

    // Fetch sales and orders by period
    const fetchSalesAndOrdersByPeriod = async (period = periodType) => {
        try {
            setLoading(true);
            const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
            const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
            
            // Fetch sales by period
            const salesResponse = await statisticsApiRequest.getSalesStatistics(period, startDate, endDate);
            console.log('Sales by period response:', salesResponse.data);
            
            if (salesResponse.data && salesResponse.data.$values) {
                // Log the transformed data for debugging
                console.log('Processed sales data:', salesResponse.data.$values);
                setSalesByPeriod(salesResponse.data.$values);
            } else {
                console.warn('Invalid or empty sales response format:', salesResponse.data);
                setSalesByPeriod([]);
            }
            
            // Fetch orders by period
            const ordersResponse = await statisticsApiRequest.getOrderCountStatistics(period, startDate, endDate);
            console.log('Orders by period response:', ordersResponse.data);
            
            if (ordersResponse.data && ordersResponse.data.$values) {
                // Log the transformed data for debugging
                console.log('Processed order count data:', ordersResponse.data.$values);
                setOrderCountByPeriod(ordersResponse.data.$values);
            } else {
                console.warn('Invalid or empty order count response format:', ordersResponse.data);
                setOrderCountByPeriod([]);
            }
        } catch (error) {
            console.error('Error fetching period statistics:', error);
            message.error('Failed to fetch period statistics');
        } finally {
            setLoading(false);
        }
    };

    // Fetch top selling products
    const fetchTopSellingProducts = async (count = 5) => {
        try {
            setLoadingTopProducts(true);
            const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
            const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
            
            const response = await statisticsApiRequest.getTopSellingProducts(count, startDate, endDate);
            console.log('Top selling products response:', response.data);
            
            if (response.data) {
                // Create a map to resolve $ref references later
                const idToObjectMap = {};
                
                // Process top products by amount (sales value)
                const topByAmount = response.data.topSaleProductsByAmount && 
                                    response.data.topSaleProductsByAmount.$values ? 
                                    response.data.topSaleProductsByAmount.$values.map(item => {
                    // Store each item's key object with its $id for reference resolution
                    if (item.key && item.key.$id) {
                        idToObjectMap[item.key.$id] = item.key;
                    }
                    
                    return {
                        id: item.key?.id || '',
                        key: item.key?.name || 'Unknown Product',
                        name: item.key?.name || 'Unknown Product',
                        imageUrl: item.key?.imageUrl || '',
                        value: item.value || 0,
                        price: item.key?.price || 0,
                        description: item.key?.description || '',
                        category: item.key?.categoryId || ''
                    };
                }) : [];
                
                // Process top products by count (quantity sold)
                const topByCount = response.data.topSaleProductsByCount && 
                                   response.data.topSaleProductsByCount.$values ? 
                                   response.data.topSaleProductsByCount.$values.map(item => {
                    // Resolve $ref if it exists, or use the original key
                    const resolvedKey = item.key && item.key.$ref ? idToObjectMap[item.key.$ref] : item.key;
                    
                    return {
                        id: resolvedKey?.id || '',
                        key: resolvedKey?.name || 'Unknown Product',
                        name: resolvedKey?.name || 'Unknown Product',
                        imageUrl: resolvedKey?.imageUrl || '',
                        count: item.value || 0,
                        price: resolvedKey?.price || 0,
                        description: resolvedKey?.description || '',
                        category: resolvedKey?.categoryId || ''
                    };
                }) : [];
                
                console.log('Transformed top products by amount:', topByAmount);
                console.log('Transformed top products by count:', topByCount);
                
                setTopSellingProducts({
                    byAmount: topByAmount,
                    byCount: topByCount
                });
            } else {
                console.warn('Invalid or empty top products response format:', response.data);
                setTopSellingProducts({
                    byAmount: [],
                    byCount: []
                });
            }
        } catch (error) {
            console.error('Error fetching top selling products:', error);
            message.error('Failed to fetch top selling products');
        } finally {
            setLoadingTopProducts(false);
        }
    };

    // Fetch order status percentage
    const fetchOrderStatusPercentage = async () => {
        try {
            setLoadingOrderStatus(true);
            const response = await statisticsApiRequest.getOrderStatusPercentage();
            console.log('Order status percentage response:', response.data);
            
            if (response.data && response.data.$values) {
                // Transform the data format to match our chart component's expected format
                const transformedData = response.data.$values.map(item => ({
                    key: item.status,
                    value: item.percentage
                }));
                console.log('Transformed order status data:', transformedData);
                setOrderStatusPercentage(transformedData);
            }
        } catch (error) {
            console.error('Error fetching order status percentage:', error);
            message.error('Failed to fetch order status percentage');
        } finally {
            setLoadingOrderStatus(false);
        }
    };

    // Fetch categories stock
    const fetchCategoriesStock = async () => {
        try {
            setLoadingCategoriesStock(true);
            const response = await statisticsApiRequest.getCategoriesStock();
            console.log('Categories stock response:', response.data);
            
            if (response.data && response.data.$values) {
                // Format the data to make it easier to work with
                const transformedData = response.data.$values.map(category => ({
                    id: category.id,
                    key: category.categoryName,
                    name: category.categoryName,
                    stockAmount: category.stockAmount,
                    percentage: category.percentage,
                    subCategories: category.subCategories && category.subCategories.$values ? 
                        category.subCategories.$values.map(subCategory => ({
                            id: subCategory.id,
                            name: subCategory.name,
                            stockAmount: subCategory.stockAmount,
                            percentage: subCategory.percentage
                        })) : []
                }));
                
                console.log('Transformed categories stock data:', transformedData);
                setCategoriesStock(transformedData);
            } else {
                console.warn('Invalid or empty categories stock response format:', response.data);
                setCategoriesStock([]);
            }
        } catch (error) {
            console.error('Error fetching categories stock:', error);
            message.error('Failed to fetch categories stock');
        } finally {
            setLoadingCategoriesStock(false);
        }
    };

    // Fetch promotion statistics
    const fetchPromotionStatistics = async () => {
        try {
            setLoadingPromotionStats(true);
            const startDate = dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : '';
            const endDate = dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : '';
            
            const response = await statisticsApiRequest.getPromotionStatistics(startDate, endDate);
            console.log('Promotion statistics response:', response.data);
            
            if (response.data && response.data.$values) {
                // Transform the data to match the expected format
                const transformedData = response.data.$values.map(item => ({
                    key: item.promotionName || 'Unknown Promotion',
                    name: item.promotionName || 'Unknown Promotion',
                    revenue: item.totalRevenue || 0,
                    items: item.totalItemsSold || 0,
                    effectiveness: item.effectiveness || 0,
                    discountAmount: item.totalDiscountAmount || 0,
                    description: item.description || ''
                }));
                
                console.log('Transformed promotion data:', transformedData);
                setPromotionStats(transformedData);
            } else {
                console.warn('Invalid or empty promotion response format:', response.data);
                setPromotionStats([]);
            }
        } catch (error) {
            console.error('Error fetching promotion statistics:', error);
            message.error('Failed to fetch promotion statistics');
        } finally {
            setLoadingPromotionStats(false);
        }
    };

    return (
        <>
            <Typography.Title style={{ marginTop: 0 }} level={2}>Dashboard</Typography.Title>
            
            <Flex 
                justify={{ xs: 'center', sm: 'end' }} 
                style={{ marginBottom: 16 }} 
                gap={{ xs: 8, sm: 16 }}
                wrap="wrap"
            >
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={() => {
                        fetchOverallStats();
                        fetchSalesAndOrdersByPeriod();
                        fetchTopSellingProducts();
                        fetchOrderStatusPercentage();
                        fetchCategoriesStock();
                        fetchPromotionStatistics();
                        message.success('Dashboard data refreshed');
                    }}
                >
                    Refresh All Data
                </Button>
                <DatePicker.RangePicker 
                    onChange={handleDateRangeChange}
                    value={dateRange}
                    allowClear={true}
                    placeholder={['1 Year Ago', 'Today']}
                    style={{ width: '100%', maxWidth: '300px' }}
                />
            </Flex>
            
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Sales"
                            value={overallStats.totalSales}
                            prefix={<DollarOutlined />}
                            precision={2}
                            loading={loading}
                            formatter={(value) => value.toLocaleString('vnd', { style: 'currency', currency: 'VND' })}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Orders"
                            value={overallStats.totalOrders}
                            prefix={<ShoppingCartOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Products"
                            value={overallStats.totalProducts}
                            prefix={<ShoppingOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Customers"
                            value={overallStats.totalCustomers}
                            prefix={<UserOutlined />}
                            loading={loading}
                        />
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card style={{ marginTop: 16 }}>
                        <Tabs defaultActiveKey="sales"
                            tabBarExtraContent={{
                                right: <Flex justify='space-between' align='center' gap={{ xs: 8, sm: 16 }} wrap="wrap">
                                    <Radio.Group value={periodType} onChange={handlePeriodTypeChange} size={{ xs: 'small', sm: 'middle' }}>
                                        <Radio.Button value="daily">Daily</Radio.Button>
                                        <Radio.Button value="monthly">Monthly</Radio.Button>
                                        <Radio.Button value="yearly">Yearly</Radio.Button>
                                    </Radio.Group>
                                    <Button 
                                        icon={<ReloadOutlined />} 
                                        onClick={() => fetchSalesAndOrdersByPeriod()}
                                    >
                                        Refresh
                                    </Button>
                                </Flex>
                            }}
                        >
                            <Tabs.TabPane tab={`Sales (${loading ? 'Loading...' : `${(overallStats.totalSales || 0).toLocaleString('vnd', { style: 'currency', currency: 'VND' })}`})`} key="sales">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={18}>
                                        {loading ? (
                                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>Loading sales data...</Typography.Text>
                                            </div>
                                        ) : salesByPeriod.length === 0 ? (
                                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>No sales data available for the selected period</Typography.Text>
                                            </div>
                                        ) : (
                                            <Line
                                                height={200}
                                                data={{
                                                    labels: salesByPeriod.map(item => formatPeriodKey(item.key)),
                                                    datasets: [
                                                        {
                                                            label: 'Sales (VND)',
                                                            data: salesByPeriod.map(item => item.value),
                                                            fill: false,
                                                            borderColor: '#1890ff',
                                                            tension: 0.4
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                        },
                                                        title: {
                                                            display: false
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                callback: (value) => `${value.toLocaleString('vnd', { style: 'currency', currency: 'VND' })}`
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Typography>Sales Ranking</Typography>
                                        {loadingTopProducts ? (
                                            <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>Loading top products...</Typography.Text>
                                            </div>
                                        ) : !topSellingProducts.byAmount || topSellingProducts.byAmount.length === 0 ? (
                                            <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>No product sales data available</Typography.Text>
                                            </div>
                                        ) : (
                                            <List
                                                dataSource={topSellingProducts.byAmount}
                                                renderItem={(item, index) => (
                                                    <List.Item key={item.id || `product-${index}`}>
                                                        <Flex align="center" style={{ width: '100%' }}>
                                                            <div style={{ width: 40, marginRight: 8 }}>
                                                                {item.imageUrl ? (
                                                                    <img
                                                                        src={item.imageUrl}
                                                                        alt={item.name}
                                                                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ width: 32, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <ShoppingOutlined />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Flex vertical style={{ flex: 1 }}>
                                                                <Typography.Text strong ellipsis style={{ maxWidth: '100%' }}>
                                                                    {item.name}
                                                                </Typography.Text>
                                                                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                                                    Unit: {((item.price / 1000000).toFixed(2)).toLocaleString('vnd', { style: 'currency', currency: 'VND' })}M
                                                                </Typography.Text>
                                                            </Flex>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <Typography.Text strong>
                                                                    {((item.value / 1000000).toFixed(2)).toLocaleString('vnd', { style: 'currency', currency: 'VND' })}M
                                                                </Typography.Text>
                                                            </div>
                                                        </Flex>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </Col>
                                </Row>


                            </Tabs.TabPane>
                            <Tabs.TabPane tab={`Orders (${loading ? 'Loading...' : (overallStats.totalOrders || 0).toLocaleString()})`} key="orders">
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} md={18}>
                                        {loading ? (
                                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>Loading orders data...</Typography.Text>
                                            </div>
                                        ) : orderCountByPeriod.length === 0 ? (
                                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>No orders data available for the selected period</Typography.Text>
                                            </div>
                                        ) : (
                                            <Line
                                                height={200}
                                                data={{
                                                    labels: orderCountByPeriod.map(item => formatPeriodKey(item.key)),
                                                    datasets: [
                                                        {
                                                            label: 'Orders',
                                                            data: orderCountByPeriod.map(item => item.value),
                                                            fill: false,
                                                            borderColor: '#1890ff',
                                                            tension: 0.4
                                                        }
                                                    ]
                                                }}
                                                options={{
                                                    responsive: true,
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                        },
                                                        title: {
                                                            display: false
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            ticks: {
                                                                callback: (value) => value.toLocaleString()
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        )}
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <Typography>Orders Ranking</Typography>
                                        {loadingTopProducts ? (
                                            <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>Loading top products...</Typography.Text>
                                            </div>
                                        ) : !topSellingProducts.byCount || topSellingProducts.byCount.length === 0 ? (
                                            <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>No product orders data available</Typography.Text>
                                            </div>
                                        ) : (
                                            <List
                                                dataSource={topSellingProducts.byCount}
                                                renderItem={(item, index) => (
                                                    <List.Item key={item.id || `order-${index}`}>
                                                        <Flex align="center" style={{ width: '100%' }}>
                                                            <div style={{ width: 40, marginRight: 8 }}>
                                                                {item.imageUrl ? (
                                                                    <img
                                                                        src={item.imageUrl}
                                                                        alt={item.name}
                                                                        style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ width: 32, height: 32, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <ShoppingOutlined />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Flex vertical style={{ flex: 1 }}>
                                                                <Typography.Text strong ellipsis style={{ maxWidth: '100%' }}>
                                                                    {item.name}
                                                                </Typography.Text>
                                                                <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                                                    Unit: {((item.price / 1000000).toFixed(2)).toLocaleString('vnd', { style: 'currency', currency: 'VND' })}M
                                                                </Typography.Text>
                                                            </Flex>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <Typography.Text strong>
                                                                    {item.count} units
                                                                </Typography.Text>
                                                            </div>
                                                        </Flex>
                                                    </List.Item>
                                                )}
                                            />
                                        )}
                                    </Col>
                                </Row>

                            </Tabs.TabPane>
                        </Tabs>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={12}>
                    <Card 
                        title="Promotion Effectiveness" 
                        extra={
                            <Button 
                                icon={<ReloadOutlined />} 
                                size="small"
                                onClick={fetchPromotionStatistics}
                            >
                                Refresh
                            </Button>
                        }
                    >
                        {loadingPromotionStats ? (
                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography.Text>Loading promotion data...</Typography.Text>
                            </div>
                        ) : promotionStats.length === 0 ? (
                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography.Text>No promotion data available for the selected period</Typography.Text>
                            </div>
                        ) : (
                            <Row gutter={[12, 12]}>
                                <Col xs={24} sm={12}>
                                    <Card>
                                        <Statistic 
                                            title="Total Items Sold" 
                                            value={promotionStats.reduce((sum, item) => sum + (item.items || 0), 0)} 
                                        />
                                    </Card>
                                </Col>                                            <Col xs={24} sm={12}>
                                    <Card>
                                        <Statistic 
                                            title="Total Discount Amount" 
                                            value={promotionStats.reduce((sum, item) => sum + (item.discountAmount || 0), 0)} 
                                            prefix={<DollarOutlined />}
                                            precision={2}
                                            formatter={(value) => value.toLocaleString('vnd', { style: 'currency', currency: 'VND' })}
                                        />
                                    </Card>
                                </Col>                                            <Col span={24}>
                                    <Table
                                        dataSource={promotionStats}
                                        columns={[
                                            {
                                                title: 'Promotion Name',
                                                dataIndex: 'name',
                                                key: 'name',
                                                ellipsis: true,
                                            },
                                            {
                                                title: 'Items',
                                                dataIndex: 'items',
                                                key: 'items',
                                                sorter: (a, b) => a.items - b.items,
                                            },
                                            {
                                                title: 'Discount Amount',
                                                dataIndex: 'discountAmount',
                                                key: 'discountAmount',
                                                render: (value) => (
                                                    <Typography.Text>
                                                        {value.toLocaleString('vnd', { style: 'currency', currency: 'VND' })}
                                                    </Typography.Text>
                                                ),
                                                sorter: (a, b) => a.discountAmount - b.discountAmount,
                                            },
                                            {
                                                title: 'Effectiveness',
                                                dataIndex: 'effectiveness',
                                                key: 'effectiveness',
                                                render: (value) => {
                                                    // Determine color based on effectiveness
                                                    let color = 'green';
                                                    if (value < 0.5) color = 'red';
                                                    else if (value < 0.8) color = 'orange';
                                                    
                                                    return (
                                                        <Tooltip title={`${(value * 100).toFixed(1)}% effective`}>
                                                            <Progress 
                                                                percent={Number((value * 100).toFixed(1))} 
                                                                size="small" 
                                                                strokeColor={color}
                                                            />
                                                        </Tooltip>
                                                    );
                                                },
                                                sorter: (a, b) => a.effectiveness - b.effectiveness,
                                            },
                                        ]}
                                        pagination={{ pageSize: 5 }}
                                        size="small"
                                    />
                                </Col>
                            </Row>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Proportion of Order Status" style={{ height: '100%' }}>
                       
                        <Row gutter={[12, 12]} style={{ alignItems: 'center', justifyContent: 'center' }}>
                            {loadingOrderStatus ? (
                                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Typography.Text>Loading order status data...</Typography.Text>
                                </div>
                            ) : orderStatusPercentage.length === 0 ? (
                                <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Typography.Text>No order status data available</Typography.Text>
                                </div>
                            ) : (
                                <Doughnut                                
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: 'right'
                                            },
                                            tooltip: {
                                                callbacks: {
                                                    label: function(context) {
                                                        let label = context.label || '';
                                                        if (label) {
                                                            label += ': ';
                                                        }
                                                        if (context.parsed !== null) {
                                                            label += context.parsed + '%';
                                                        }
                                                        return label;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    data={{
                                        labels: orderStatusPercentage.map(item => item.key),
                                        datasets: [{
                                            data: orderStatusPercentage.map(item => item.value),
                                            backgroundColor: [
                                                '#FF6384',
                                                '#36A2EB',
                                                '#FFCE56',
                                                '#4BC0C0',
                                                '#9966FF'
                                            ]
                                        }]
                                    }}
                                    style={{ height: '80%' }}
                                />
                            )}
                        </Row>
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24}>
                    <Card title="Inventory Management">
                        {loadingCategoriesStock ? (
                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography.Text>Loading inventory data...</Typography.Text>
                            </div>
                        ) : categoriesStock.length === 0 ? (
                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Typography.Text>No inventory data available</Typography.Text>
                            </div>
                        ) : (
                            <Tabs size={{ xs: 'small', sm: 'middle' }}>
                                {categoriesStock.map((category, index) => (
                                    <Tabs.TabPane 
                                        tab={
                                            <Flex vertical justify="space-between" align="center" gap={2}>
                                                <Typography.Text>{category.name}</Typography.Text>
                                                <Progress 
                                                    percent={Math.round(category.percentage)} 
                                                    status={category.percentage > 0 ? "active" : "exception"}
                                                    size="small"
                                                />
                                            </Flex>
                                        } 
                                        key={category.id || `category-${index}`}
                                    >
                                        {category.subCategories && category.subCategories.length > 0 ? (
                                            <>
                                                <div style={{ marginBottom: 16 }}>
                                                    <Statistic 
                                                        title={`Total Stock for ${category.name}`}
                                                        value={category.stockAmount}
                                                        suffix="items"
                                                    />
                                                </div>
                                                
                                                <Bar
                                                    height={200}
                                                    data={{
                                                        labels: category.subCategories.map(item => item.name),
                                                        datasets: [{
                                                            label: 'Stock Amount',
                                                            data: category.subCategories.map(item => item.stockAmount),
                                                            backgroundColor: '#1890ff'
                                                        }]
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: `${category.name} Stock Distribution by Subcategory`
                                                            },
                                                            tooltip: {
                                                                callbacks: {
                                                                    label: function(context) {
                                                                        let label = context.dataset.label || '';
                                                                        if (label) {
                                                                            label += ': ';
                                                                        }
                                                                        if (context.parsed.y !== null) {
                                                                            label += context.parsed.y + ' items';
                                                                        }
                                                                        return label;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }}
                                                />
                                                
                                                <Table
                                                    style={{ marginTop: 16 }}
                                                    dataSource={category.subCategories}
                                                    columns={[
                                                        {
                                                            title: 'Subcategory',
                                                            dataIndex: 'name',
                                                            key: 'name',
                                                        },
                                                        {
                                                            title: 'Stock Amount',
                                                            dataIndex: 'stockAmount',
                                                            key: 'stockAmount',
                                                            sorter: (a, b) => a.stockAmount - b.stockAmount,
                                                        },
                                                        {
                                                            title: 'Percentage',
                                                            dataIndex: 'percentage',
                                                            key: 'percentage',
                                                            render: (value) => (
                                                                <Progress 
                                                                    percent={Math.round(value)} 
                                                                    size="small"
                                                                    status={value > 0 ? "normal" : "exception"}
                                                                />
                                                            ),
                                                            sorter: (a, b) => a.percentage - b.percentage,
                                                        }
                                                    ]}
                                                    pagination={false}
                                                    size="small"
                                                />
                                            </>
                                        ) : (
                                            <div style={{ height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Typography.Text>No subcategories available for {category.name}</Typography.Text>
                                            </div>
                                        )}
                                    </Tabs.TabPane>
                                ))}
                            </Tabs>
                        )}
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Dashboard;
