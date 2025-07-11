import { useState, useEffect } from 'react';
import { Typography, Row, Col, Button, InputNumber, Empty, Flex, Image, Table, Form, Input, Breadcrumb, Card } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined, ShoppingOutlined } from '@ant-design/icons';
import { URLS } from '../../constants/urls';
import { useDispatch, useSelector } from 'react-redux';
import { removeFromCart, updateQuantity } from '../../store/actions/CartAction';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
const { TextArea } = Input;

const Cart = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const cartItems = useSelector(state => state.cart.items);
    const isMobile = useMediaQuery({ maxWidth: 768 });
    
    const formatPrice = (price) => {
        return (price).toLocaleString('vi-VN');
    };

    const navigateCheckout = () => {
        if (cartItems.length) {
            navigate(URLS.CUSTOMER.CHECKOUT);
        }
    }
    
    const renderVariantAttributes = (record) => {
        const variantAttributes = record.item?.selectedVariant?.variantAttributes?.$values;
        if (!variantAttributes || variantAttributes.length === 0) return null;
        
        return (
            <Flex gap={8} wrap="wrap">
                {variantAttributes.map((attr, index, array) => {
                    const value = attr.attributeValue.value;
                    const isLastItem = index === array.length - 1;
                    
                    // If it's a color attribute, display color swatch
                    if (value.startsWith('#')) {
                        return (
                            <Flex key={attr.id} align="center" gap={4}>
                                <div 
                                    style={{ 
                                        width: 20, 
                                        height: 20, 
                                        backgroundColor: value, 
                                        borderRadius: '50%',
                                        border: '1px solid #ddd'
                                    }} 
                                />
                                {!isLastItem && <Typography.Text>,</Typography.Text>}
                            </Flex>
                        );
                    }
                    
                    return (
                        <Flex key={attr.id} align="center" gap={4}>
                            <Typography.Text>{value}</Typography.Text>
                            {!isLastItem && <Typography.Text>,</Typography.Text>}
                        </Flex>
                    );
                })}
            </Flex>
        );
    };
        
    const columns = [
        {
            title: 'Product',
            dataIndex: ['item', 'product', 'name'],
            key: 'product.name',
            render: (text, record) => {
                const imageUrl = record.item.imageUrls?.$values?.[0] || record.item.product.imageUrl;
                return (
                    <Flex gap={16} align="start">
                        <Image 
                            src={imageUrl} 
                            width={isMobile ? 80 : 100} 
                            height={isMobile ? 80 : 100} 
                            style={{
                                objectFit: 'cover',
                                borderRadius: '8px'
                            }} 
                        />
                        <Flex vertical justify="start" gap={8} style={{flex: 1, minWidth: isMobile ? 'auto' : 200}}>
                            <Typography.Text 
                                style={{
                                    fontSize: isMobile ? 14 : 16, 
                                    fontWeight: 500
                                }}
                            >
                                {text?.toUpperCase()}
                            </Typography.Text>
                            {renderVariantAttributes(record)}
                            <Typography.Text type="secondary" style={{fontSize: isMobile ? 12 : 14}}>
                                SKU: {record.item.sku}
                            </Typography.Text>
                            {isMobile && (
                                <Flex vertical gap={8}>
                                    <Typography.Text strong>
                                        {formatPrice(record.item.product.price + record.item.selectedVariant.priceAdjustment)}₫
                                    </Typography.Text>
                                    <Flex gap={2} align="center">
                                        <Button 
                                            size="small"
                                            icon={<MinusOutlined />} 
                                            onClick={() => handleQuantityChange(record.item, Math.max(1, record.quantity - 1))}
                                            disabled={record.quantity <= 1}
                                        />
                                        <InputNumber 
                                            size="small"
                                            value={record.quantity}
                                            min={1}
                                            max={record.item.stock}
                                            style={{width: 50}}
                                            onChange={(value) => handleQuantityChange(record.item, value)}
                                        />
                                        <Button 
                                            size="small"
                                            icon={<PlusOutlined />} 
                                            onClick={() => handleQuantityChange(record.item, record.quantity + 1)}
                                            disabled={record.quantity >= record.item.stock}
                                        />
                                    </Flex>
                                </Flex>
                            )}
                        </Flex>
                    </Flex>
                );
            },
            width: isMobile ? '100%' : '40%'
        },
        {
            title: 'Price',
            dataIndex: ['item', 'price'],
            key: 'price',
            render: (text, record) => {
                const price = record.item.product.price + record.item.selectedVariant.priceAdjustment;
                return <Typography.Text strong>{formatPrice(price)}₫</Typography.Text>;
            },
            responsive: ['sm', 'md', 'lg', 'xl']
        },
        {
            title: 'Quantity',
            dataIndex: 'quantity',
            key: 'quantity',
            render: (quantity, record) => (
                <Flex gap={2} align="center">
                    <Button 
                        icon={<MinusOutlined />} 
                        onClick={() => handleQuantityChange(record.item, Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                    />
                    <InputNumber 
                        value={quantity}
                        min={1}
                        max={record.item.stock}
                        style={{width: 60}}
                        onChange={(value) => handleQuantityChange(record.item, value)}
                    />
                    <Button 
                        icon={<PlusOutlined />} 
                        onClick={() => handleQuantityChange(record.item, quantity + 1)}
                        disabled={quantity >= record.item.stock}
                    />
                </Flex>
            ),
            responsive: ['sm', 'md', 'lg', 'xl']
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (text, record) => {
                const unitPrice = record.item.product.price + record.item.selectedVariant.priceAdjustment;
                const total = unitPrice * record.quantity;
                return <Typography.Text strong>{formatPrice(total)}₫</Typography.Text>;
            },
            responsive: ['sm', 'md', 'lg', 'xl']
        },
        {
            title: '',
            key: 'action',
            render: (_, record) => (
                <Button 
                    danger
                    type="text"
                    icon={<DeleteOutlined />} 
                    onClick={() => handleRemoveItem(record.item.selectedVariant.id)}
                />
            ),
            width: 60
        }
    ];

    const handleQuantityChange = (item, value) => {
        if (value && value > 0) {
            dispatch(updateQuantity({ 
                item: item, 
                quantity: value 
            }));
        }
    };

    const handleRemoveItem = (id) => {
        dispatch(removeFromCart({ id }));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            const unitPrice = item.item.product.price + item.item.selectedVariant.priceAdjustment;
            return total + (unitPrice * item.quantity);
        }, 0);
    };
    
    const calculateTotalQuantity = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <Flex vertical align="center" justify="center" style={{ minHeight: '60vh' }}>
                <Empty 
                    image={<ShoppingOutlined style={{ fontSize: 48 }} />}
                    description={
                        <Typography.Text style={{ fontSize: 16 }}>
                            Your cart is empty
                        </Typography.Text>
                    }
                />
                <Button type="primary" style={{ marginTop: 16 }} href={URLS.CUSTOMER.HOME}>
                    Continue Shopping
                </Button>
            </Flex>
        );
    }

    return (
        <Flex vertical gap={32}>
            <Breadcrumb style={{ marginBottom: isMobile ? 16 : 32 }}>
                <Breadcrumb.Item href={URLS.CUSTOMER.HOME}>Home</Breadcrumb.Item>
                <Breadcrumb.Item>Cart</Breadcrumb.Item>
            </Breadcrumb>
            
            <Row gutter={[32, 32]}>
                <Col xs={24} lg={24}>
                    <Card bordered={false}>
                        <Table 
                            dataSource={cartItems}
                            pagination={false}
                            columns={isMobile ? columns.filter(col => !col.responsive) : columns}
                            scroll={{ x: isMobile ? undefined : 'max-content' }}
                            style={{ 
                                overflowX: 'auto',
                                background: 'transparent'
                            }}
                            rowKey={record => record.item.id}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={24}>
                    <Card bordered={false}>
                        <Flex vertical gap={24}>
                            <Form.Item 
                                layout='vertical' 
                                label={
                                    <Typography.Text strong>
                                        Order Note
                                    </Typography.Text>
                                }
                            >
                                <TextArea 
                                    rows={4} 
                                    placeholder='Enter special instructions for your order' 
                                    style={{ resize: 'none' }}
                                />
                            </Form.Item>
                            
                            <Flex vertical gap={16}>
                                <Flex justify="space-between" align="center">
                                    <Typography.Text>Total Items</Typography.Text>
                                    <Typography.Text strong>{calculateTotalQuantity()}</Typography.Text>
                                </Flex>
                                <Flex justify="space-between" align="center">
                                    <Typography.Title level={5} style={{ margin: 0 }}>Total</Typography.Title>
                                    <Typography.Title level={5} style={{ margin: 0 }}>
                                        {formatPrice(calculateTotal())}₫
                                    </Typography.Title>
                                </Flex>
                                <Button 
                                    disabled={cartItems.length <= 0} 
                                    onClick={navigateCheckout} 
                                    type="primary" 
                                    size="large"
                                    style={{
                                        marginTop: 8,
                                        height: 48
                                    }}
                                >
                                    Proceed to Checkout
                                </Button>
                            </Flex>
                        </Flex>
                    </Card>
                </Col>
            </Row>
        </Flex>
    );
};

export default Cart;
