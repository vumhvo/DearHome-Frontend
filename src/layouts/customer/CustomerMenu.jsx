import { Menu, Button, Drawer } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { URLS } from '../../constants/urls';
import { useMediaQuery } from 'react-responsive';
import { MenuOutlined } from '@ant-design/icons';
import { useState } from 'react';

const CustomerMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    { key: 'home', label: 'HOME', onClick: () => { 
      navigate(URLS.CUSTOMER.HOME);
      setMobileMenuVisible(false);
    }},
    { key: 'products', label: 'PRODUCTS', onClick: () => {
      navigate(URLS.CUSTOMER.PRODUCTS);
      setMobileMenuVisible(false);
    }},
    { key: 'about', label: 'ABOUT US', onClick: () => {
      navigate(URLS.CUSTOMER.ABOUT);
      setMobileMenuVisible(false);
    }},
    { key: 'contact', label: 'CONTACT', onClick: () => {
      navigate(URLS.CUSTOMER.CONTACT);
      setMobileMenuVisible(false);
    }},
    { key: 'order-tracking', label: 'ORDER TRACKING', onClick: () => {
      navigate(URLS.CUSTOMER.ORDER_TRACKING);
      setMobileMenuVisible(false);
    }},
    { key: 'vr-placement', label: 'VR PLACEMENT', onClick: () => {
      navigate(URLS.CUSTOMER.VR_PLACEMENT);
      setMobileMenuVisible(false);
    }},
  ];

  // Get current selected key based on path
  const getCurrentSelectedKey = () => {
    const path = location.pathname;
    if (path === '/' || path === '') return 'home';
    if (path.includes('/products')) return 'products';
    if (path.includes('/about')) return 'about';
    if (path.includes('/contact')) return 'contact';
    if (path.includes('/order-tracking')) return 'order-tracking';
    if (path.includes('/vr-placement')) return 'vr-placement';
    return '';
  };

  if (isMobile) {
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'start' }}>
        <Button
          icon={<MenuOutlined />}
          onClick={() => setMobileMenuVisible(true)}
          style={{ 
            border: 'none',
            padding: '4px 8px'
          }}
        >
          Menu
        </Button>
        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setMobileMenuVisible(false)}
          open={mobileMenuVisible}
          width={280}
        >
          <Menu
            mode="vertical"
            selectedKeys={[getCurrentSelectedKey()]}
            items={menuItems}
            style={{
              border: 'none',
              fontSize: '16px'
            }}
          />
        </Drawer>
      </div>
    );
  }

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[getCurrentSelectedKey()]}
      items={menuItems}
      style={{ 
        border: 'none',
        flex: 1,
        justifyContent: 'center',
        minWidth: 520
      }}
    />
  );
};

export default CustomerMenu;
