import { Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { URLS } from '../../constants/urls';  

const CustomerMenu = () => {
  const navigate = useNavigate();

  const menuItems = [
    { key: 'home', label: 'HOME', onClick: () => navigate(URLS.CUSTOMER.HOME) },
    { key: 'products', label: 'PRODUCTS', onClick: () => navigate(URLS.CUSTOMER.PRODUCTS) },
    { key: 'about', label: 'ABOUT US', onClick: () => navigate(URLS.CUSTOMER.ABOUT) },
    { key: 'contact', label: 'CONTACT', onClick: () => navigate(URLS.CUSTOMER.CONTACT) },
    { key: 'order-tracking', label: 'ORDER TRACKING', onClick: () => navigate(URLS.CUSTOMER.ORDER_TRACKING) },
    { key: 'vr-placement', label: 'VR PLACEMENT', onClick: () => navigate(URLS.CUSTOMER.VR_PLACEMENT) },
  ];

  return (
    <Menu
      mode="horizontal"
      defaultSelectedKeys={['home']}
      items={menuItems}
      style={{ border: 'none' }}
    />
  );
};

export default CustomerMenu;
