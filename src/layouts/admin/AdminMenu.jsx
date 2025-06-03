import { DashboardOutlined, ShoppingOutlined, ShoppingCartOutlined, UserOutlined, StockOutlined, AppstoreOutlined, CloudOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'antd';




const AdminMenu = ({ onMenuItemClick }) => {
    const navigate = useNavigate();
    
    const handleMenuClick = (path) => {
        navigate(path);
        if (onMenuItemClick) {
            onMenuItemClick();
        }
    };
    
    const menuItems = [
        {
            key: 'dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => handleMenuClick('/admin/dashboard'),
        },
        {
            key: 'products',
            icon: <ShoppingOutlined />,
            label: 'Products',
            onClick: () => handleMenuClick('/admin/products'),
        },
        {
            key: 'inventory',
            icon: <StockOutlined />,    
            label: 'Inventory',
            onClick: () => handleMenuClick('/admin/inventory'),
        },
        {
            key: 'orders',
            icon: <ShoppingCartOutlined />,
            label: 'Orders',
            onClick: () => handleMenuClick('/admin/orders'),
        },
        {
            key: 'application',
            icon: <AppstoreOutlined />,
            label: 'Application',
            children: [
                {
                    key: 'applications-categories',
                    label: 'Categories & Placement',
                    onClick: () => handleMenuClick('/admin/application/categories'),
                },
                {
                    key: 'applications-attributes',
                    label: 'Product Attributes',
                    onClick: () => handleMenuClick('/admin/application/attributes'),
                },
                {
                    key: 'applications-banners',
                    label: 'Banner Settings',
                    onClick: () => handleMenuClick('/admin/application/banners'),
                }
            ]
        },
        {
            key: 'customers',
            icon: <UserOutlined />,
            label: 'Customers',
            onClick: () => handleMenuClick('/admin/customers'),
        },
        {
            key: 'test-cors',
            icon: <CloudOutlined />,
            label: 'Test CORS',
            onClick: () => handleMenuClick('/admin/test-cors'),
        },
        {
            key: 'promotions',
            icon: <UserOutlined />,
            label: 'Promotions',
            onClick: () => handleMenuClick('/admin/promotions'),
        },

    ];


    return (
        <Menu mode="inline">
            {menuItems.map(item => {
                if (item.children) {
                    return (
                        <Menu.SubMenu key={item.key} icon={item.icon} title={item.label}>
                            {item.children.map(child => (
                                <Menu.Item key={child.key} onClick={child.onClick}>
                                    {child.label}
                                </Menu.Item>
                            ))}
                        </Menu.SubMenu>
                    );
                }
                return (
                    <Menu.Item key={item.key} icon={item.icon} onClick={item.onClick}>
                        {item.label}
                    </Menu.Item>
                );
            })}
        </Menu>
    );
};

export default AdminMenu;