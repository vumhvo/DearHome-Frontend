import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Card, Typography, Descriptions, Table, Image, message, Spin } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { orderApiRequest } from '../../../api/ApiRequests';

const { Title, Text } = Typography;

// Improved resolveRefs to handle cycles
function resolveRefs(obj) {
  const idMap = new Map();

  function collect(obj) {
    if (obj && typeof obj === 'object') {
      if (obj.$id) idMap.set(obj.$id, obj);
      for (const key in obj) {
        if (typeof obj[key] === 'object') collect(obj[key]);
      }
    }
  }

  function deref(obj, seen = new Map()) {
    if (Array.isArray(obj)) {
      if (seen.has(obj)) return seen.get(obj);
      const arr = [];
      seen.set(obj, arr);
      for (const item of obj) arr.push(deref(item, seen));
      return arr;
    } else if (obj && typeof obj === 'object') {
      if (obj.$ref) return deref(idMap.get(obj.$ref), seen);
      if (seen.has(obj)) return seen.get(obj);
      const result = {};
      seen.set(obj, result);
      for (const key in obj) {
        if (key !== '$id' && key !== '$ref') {
          if (key === '$values') {
            return deref(obj[key], seen);
          }
          result[key] = deref(obj[key], seen);
        }
      }
      return result;
    }
    return obj;
  }

  collect(obj);
  return deref(obj);
}

const PrintOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get order data from navigation state first
    const stateOrder = location.state?.order;
    const stateAddress = location.state?.formattedAddress;
    
    if (stateOrder) {
      // If order data is passed via state, use it directly
      const orderWithAddress = {
        ...stateOrder,
        address: stateAddress || stateOrder.address
      };
      setOrder(orderWithAddress);
      setLoading(false);
      console.log('Using order data from state:', orderWithAddress);
      
      // Set page title for printing
      document.title = `Order #${stateOrder.id} - Print`;
    } else if (orderId) {
      // Fallback to fetching if no state data is available
      console.log('No state data available, fetching order details...');
      fetchOrderDetail();
    } else {
      setLoading(false);
      message.error('No order data available');
    }
  }, [orderId, location.state]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await orderApiRequest.getOrderById(orderId);
      const resolvedOrderDetail = resolveRefs(response.data);
      setOrder(resolvedOrderDetail);
      
      // Set page title for printing
      document.title = `Order #${resolvedOrderDetail.id} - Print`;
    } catch (error) {
      console.error('Error fetching order detail:', error);
      message.error('Failed to fetch order detail');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Add a small delay to ensure all content is rendered
    setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        console.error('Print error:', error);
        message.error('Failed to print. Please try using your browser\'s print function (Ctrl+P or Cmd+P)');
      }
    }, 100);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text>Order not found or no order data available</Text>
        <br />
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginTop: '10px' }}
        >
          Back to Orders
        </Button>
      </div>
    );
  }

  const total = (order.orderDetails || []).reduce((sum, item) => sum + (item.totalPrice ?? 0), 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Print-only header */}
      <div className="print-only">
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
          Order #{order.id}
        </Title>
      </div>

      {/* Screen-only controls */}
      <div className="print-hide" style={{ marginBottom: '20px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: '10px' }}
        >
          Back
        </Button>
        <Button 
          type="primary" 
          icon={<PrinterOutlined />} 
          onClick={handlePrint}
        >
          Print Order
        </Button>
      </div>

      <Card className="print-card">
        <Descriptions title="Order Information" bordered column={2}>
          <Descriptions.Item label="Order ID">#{order.id}</Descriptions.Item>
          <Descriptions.Item label="Order Date">
            {new Date(order.orderDate).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Customer">{order.user?.name || ''}</Descriptions.Item>
          <Descriptions.Item label="Status">{order.status}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="Shipping Address" bordered column={1} style={{ marginTop: '20px' }}>
          <Descriptions.Item label="Address">
            {order.address?.street || ''}<br/>
            {order.address?.city || ''}, {order.address?.district || ''}<br/>
            {order.address?.country || ''} {order.address?.postalCode || ''}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: '20px' }}>
          <Title level={4}>Order Items</Title>
          <Table
            dataSource={order.orderDetails || []}
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
                title: 'Unit Price',
                dataIndex: 'unitPrice',
                key: 'unitPrice',
                render: (price) => `${(price ?? 0).toLocaleString('vi-VN')} VND`,
              },
              {
                title: 'Subtotal',
                key: 'totalPrice',
                dataIndex: 'totalPrice',
                render: (totalPrice) => `${(totalPrice ?? 0).toLocaleString('vi-VN')} VND`,
              },
            ]}
            summary={(pageData) => {
              return (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} style={{ textAlign: 'right' }}>
                    <strong>Total:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{total.toLocaleString('vi-VN')} VND</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              );
            }}
          />
        </div>
      </Card>

      {/* Print styles */}
      <style>{`
        @media print {
          .ant-btn, .print-hide {
            display: none !important;
          }
          .ant-card, .print-card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            background: white !important;
          }
          .ant-card-body {
            padding: 20px !important;
          }
          .ant-descriptions-bordered .ant-descriptions-item-label,
          .ant-descriptions-bordered .ant-descriptions-item-content {
            border: 1px solid #000 !important;
            padding: 8px !important;
            background: white !important;
          }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td,
          .ant-table tfoot > tr > th,
          .ant-table tfoot > tr > td {
            border: 1px solid #000 !important;
            padding: 8px !important;
            background: white !important;
          }
          .ant-table-container {
            border: 1px solid #000 !important;
          }
          .ant-image {
            border: 1px solid #ccc !important;
          }
          .print-only {
            display: block !important;
          }
          body, html {
            margin: 0 !important;
            padding: 20px !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: 12pt !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: black !important;
          }
          .ant-typography {
            color: black !important;
          }
        }
        .print-only {
          display: none;
        }
        @media screen {
          .print-hide {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintOrder;