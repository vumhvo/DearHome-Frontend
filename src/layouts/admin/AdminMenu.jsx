import { 
    DashboardOutlined, 
    ShoppingOutlined, 
    ShoppingCartOutlined, 
    UserOutlined, 
    StockOutlined, 
    AppstoreOutlined, 
    SettingOutlined,
    TagsOutlined,
    BellOutlined,
    GiftOutlined,
    BarChartOutlined,
    TeamOutlined,
    BankOutlined,
    PictureOutlined,
    SearchOutlined,
    HomeFilled
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Badge, Tooltip, Input, Space, Typography, Divider } from 'antd';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;
const { Search } = Input;

// Custom styles for enhanced menu appearance
const menuStyles = `
    .enhanced-admin-menu .ant-menu-item {
        margin: 4px 0;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        height: 44px;
        line-height: 44px;
        position: relative;
        overflow: hidden;
    }
    
    .enhanced-admin-menu .ant-menu-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 100%;
        background: linear-gradient(135deg, #fadb1420 0%, #f1c40f20 100%);
        transition: width 0.3s ease;
        z-index: -1;
    }
    
    .enhanced-admin-menu .ant-menu-item:hover::before {
        width: 100%;
    }
    
    .enhanced-admin-menu .ant-menu-item:hover {
        transform: translateX(6px) scale(1.02);
        box-shadow: 0 4px 20px rgba(250, 219, 20, 0.15);
        border-left: 3px solid #fadb14;
    }
    
    .enhanced-admin-menu .ant-menu-item-selected {
        background: linear-gradient(135deg, #fadb14 0%, #f1c40f 100%);
        color: #2c3e50 !important;
        font-weight: bold;
        box-shadow: 0 6px 20px rgba(250, 219, 20, 0.4);
        transform: translateX(4px);
        border-left: 4px solid #2c3e50;
    }
    
    .enhanced-admin-menu .ant-menu-item-selected::before {
        width: 100%;
        background: linear-gradient(135deg, rgba(44,62,80,0.1) 0%, rgba(44,62,80,0.2) 100%);
    }
    
    .enhanced-admin-menu .ant-menu-item-selected .anticon {
        color: #2c3e50 !important;
        animation: pulse 2s infinite;
    }
    
    .enhanced-admin-menu .ant-menu-item-selected span {
        color: #2c3e50 !important;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-title {
        margin: 4px 0;
        border-radius: 12px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        height: 44px;
        line-height: 44px;
        position: relative;
        overflow: hidden;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-title::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 100%;
        background: linear-gradient(135deg, #f39c1220 0%, #e67e2220 100%);
        transition: width 0.3s ease;
        z-index: -1;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-title:hover::before {
        width: 100%;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-title:hover {
        transform: translateX(4px) scale(1.02);
        border-left: 3px solid #f39c12;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-open .ant-menu-submenu-title {
        background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
        color: white !important;
        transform: translateX(4px);
        box-shadow: 0 4px 16px rgba(243, 156, 18, 0.3);
        border-left: 4px solid #ffffff;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-open .ant-menu-submenu-title .anticon {
        color: white !important;
    }
    
    .enhanced-admin-menu .ant-menu-submenu-open .ant-menu-submenu-title span {
        color: white !important;
    }
    
    .enhanced-admin-menu .ant-menu-sub {
        background: linear-gradient(135deg, rgba(243, 156, 18, 0.05) 0%, rgba(230, 126, 34, 0.05) 100%);
        border-radius: 12px;
        margin: 4px 0;
        border: 1px solid rgba(243, 156, 18, 0.1);
        backdrop-filter: blur(10px);
    }
    
    .enhanced-admin-menu .ant-menu-sub .ant-menu-item {
        margin: 2px 8px;
        border-radius: 8px;
        height: 36px;
        line-height: 36px;
    }
    
    .enhanced-admin-menu .ant-menu-item-divider {
        background: linear-gradient(90deg, transparent 0%, #d9d9d9 30%, #fadb14 50%, #d9d9d9 70%, transparent 100%);
        height: 2px;
        margin: 12px 16px;
        border-radius: 1px;
    }
    
    .enhanced-admin-menu::-webkit-scrollbar {
        width: 4px;
    }
    
    .enhanced-admin-menu::-webkit-scrollbar-track {
        background: transparent;
    }
    
    .enhanced-admin-menu::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #fadb14 0%, #f39c12 100%);
        border-radius: 4px;
    }
    
    .enhanced-admin-menu::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #f1c40f 0%, #e67e22 100%);
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
    }
    
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    .enhanced-admin-menu .ant-menu-item,
    .enhanced-admin-menu .ant-menu-submenu-title {
        animation: slideIn 0.3s ease forwards;
    }
    
    .enhanced-admin-menu .ant-badge {
        animation: pulse 2s infinite;
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = menuStyles;
    document.head.appendChild(styleSheet);
}




const AdminMenu = ({ onMenuItemClick, collapsed = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [searchValue, setSearchValue] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    
    const handleMenuClick = (path) => {
        navigate(path);
        if (onMenuItemClick) {
            onMenuItemClick();
        }
    };
    
    // Function to determine the active menu key based on current path
    const getActiveMenuKey = (pathname) => {
        if (!pathname) return '';
        
        // Dashboard
        if (pathname === '/admin/dashboard' || pathname === '/admin' || pathname === '/admin/') return 'dashboard';
        
        // Products (including edit product, add product, variants)
        if (pathname.startsWith('/admin/products')) return 'products';
        
        // Inventory (including add/edit good received notes)
        if (pathname.startsWith('/admin/inventory')) return 'inventory';
        
        // Orders (including order details, print)
        if (pathname.startsWith('/admin/orders') || pathname.startsWith('/admin/print-order')) return 'orders';
        
        // Customers (including customer details, edit)
        if (pathname.startsWith('/admin/customers')) return 'customers';
        
        // Promotions
        if (pathname.startsWith('/admin/promotions')) return 'promotions';
        
        // Application submenu items
        if (pathname.includes('/admin/application/categories')) return 'applications-categories';
        if (pathname.includes('/admin/application/attributes')) return 'applications-attributes';
        if (pathname.includes('/admin/application/banners')) return 'applications-banners';
        
        // Default application if no specific submenu matches
        if (pathname.startsWith('/admin/application')) return 'application';
        
        return '';
    };
    
    // Function to determine which submenus should be open
    const getOpenKeys = (pathname) => {
        if (!pathname) return [];
        
        const openKeys = [];
        
        // Open application submenu if any application route is active
        if (pathname.startsWith('/admin/application')) {
            openKeys.push('application');
        }
        
        return openKeys;
    };
    
    // Update selected and open keys when location changes
    useEffect(() => {
        const pathname = location.pathname;
        const activeKey = getActiveMenuKey(pathname);
        const openKeysArray = getOpenKeys(pathname);
        
        if (activeKey) {
            setSelectedKeys([activeKey]);
        } else {
            setSelectedKeys([]);
        }
        setOpenKeys(openKeysArray);
    }, [location.pathname]);

    // Define menu items first
    const menuItems = [
        {
            key: 'dashboard',
            icon: <BarChartOutlined style={{ fontSize: '16px', color: '#f39c12' }} />,
            label: (
                <Tooltip title={collapsed ? 'Dashboard' : ''} placement="right">
                    <span style={{ fontWeight: 500 }}>Dashboard</span>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/dashboard'),
            style: { marginBottom: '4px' }
        },
        {
            type: 'divider',
        },
        {
            key: 'products',
            icon: <ShoppingOutlined style={{ fontSize: '16px', color: '#fadb14' }} />,
            label: (
                <Tooltip title={collapsed ? 'Products Management' : ''} placement="right">
                    <Space>
                        <span style={{ fontWeight: 500 }}>Products</span>
                        <Badge count={0} size="small" style={{ backgroundColor: '#f39c12' }} />
                    </Space>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/products'),
        },
        {
            key: 'inventory',
            icon: <StockOutlined style={{ fontSize: '16px', color: '#e67e22' }} />,    
            label: (
                <Tooltip title={collapsed ? 'Inventory Management' : ''} placement="right">
                    <Space>
                        <span style={{ fontWeight: 500 }}>Inventory</span>
                        <Badge dot status="warning" />
                    </Space>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/inventory'),
        },
        {
            key: 'orders',
            icon: <ShoppingCartOutlined style={{ fontSize: '16px', color: '#f1c40f' }} />,
            label: (
                <Tooltip title={collapsed ? 'Orders Management' : ''} placement="right">
                    <Space>
                        <span style={{ fontWeight: 500 }}>Orders</span>
                    </Space>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/orders'),
        },
        {
            key: 'customers',
            icon: <TeamOutlined style={{ fontSize: '16px', color: '#d68910' }} />,
            label: (
                <Tooltip title={collapsed ? 'Customer Management' : ''} placement="right">
                    <span style={{ fontWeight: 500 }}>Customers</span>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/customers'),
        },
        {
            type: 'divider',
        },
        {
            key: 'application',
            icon: <SettingOutlined style={{ fontSize: '16px', color: '#f39c12' }} />,
            label: (
                <Tooltip title={collapsed ? 'Application Settings' : ''} placement="right">
                    <span style={{ fontWeight: 500 }}>Settings</span>
                </Tooltip>
            ),
            children: [
                {
                    key: 'applications-categories',
                    icon: <TagsOutlined style={{ fontSize: '14px' }} />,
                    label: (
                        <Space>
                            <span>Categories & Placement</span>
                            <BellOutlined style={{ fontSize: '12px', color: '#fadb14' }} />
                        </Space>
                    ),
                    onClick: () => handleMenuClick('/admin/application/categories'),
                },
                {
                    key: 'applications-attributes',
                    icon: <AppstoreOutlined style={{ fontSize: '14px' }} />,
                    label: 'Product Attributes',
                    onClick: () => handleMenuClick('/admin/application/attributes'),
                },
                {
                    key: 'applications-banners',
                    icon: <PictureOutlined style={{ fontSize: '14px' }} />,
                    label: 'Banner Settings',
                    onClick: () => handleMenuClick('/admin/application/banners'),
                }
            ]
        },
        {
            key: 'promotions',
            icon: <GiftOutlined style={{ fontSize: '16px', color: '#f1c40f' }} />,
            label: (
                <Tooltip title={collapsed ? 'Promotions & Marketing' : ''} placement="right">
                    <Space>
                        <span style={{ fontWeight: 500 }}>Promotions</span>
                        <Badge count={2} size="small" style={{ backgroundColor: '#f39c12' }} />
                    </Space>
                </Tooltip>
            ),
            onClick: () => handleMenuClick('/admin/promotions'),
        },
    ];
    
    // Search functionality
    const handleSearch = (value) => {
        setSearchValue(value);
        if (!value) {
            setFilteredItems(menuItems);
            return;
        }
        
        const filterItems = (items) => {
            return items.filter(item => {
                if (item.type === 'divider') return false;
                
                const labelText = typeof item.label === 'string' ? item.label : 
                    item.label?.props?.children?.props?.children || '';
                
                const matchesSearch = labelText.toLowerCase().includes(value.toLowerCase());
                
                if (item.children) {
                    const filteredChildren = filterItems(item.children);
                    if (filteredChildren.length > 0) {
                        return true;
                    }
                }
                
                return matchesSearch;
            }).map(item => {
                if (item.children) {
                    return {
                        ...item,
                        children: filterItems(item.children)
                    };
                }
                return item;
            });
        };
        
        setFilteredItems(filterItems(menuItems));
    };

    // Initialize filtered items
    useEffect(() => {
        setFilteredItems(menuItems);
    }, []);

    const displayItems = searchValue ? filteredItems : menuItems;


    return (
        <div style={{ 
            padding: collapsed ? '8px 4px' : '16px 8px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
            height: '100%',
            borderRight: '1px solid #f0f0f0',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
            {!collapsed && (
                <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                    <Title level={4} style={{ 
                        margin: 0, 
                        background: 'linear-gradient(135deg, #fadb14 0%, #f39c12 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 'bold',
                        fontSize: '18px'
                    }}>
                        🏠 DearHome
                    </Title>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Admin Dashboard
                    </Text>
                </div>
            )}
            
            {/* Quick Actions for collapsed menu */}
            {collapsed && (
                <div style={{ 
                    marginBottom: '16px', 
                    textAlign: 'center',
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: '8px'
                }}>
                    <Tooltip title="Dashboard" placement="right">
                        <div style={{ 
                            fontSize: '24px', 
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleMenuClick('/admin/dashboard')}
                        onMouseEnter={(e) => e.target.style.background = '#fef9e7'}
                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                        >
                            <HomeFilled style={{ color: '#fadb14' }} />
                        </div>
                    </Tooltip>
                </div>
            )}
            
            {/* Search */}
            {!collapsed && (
                <div style={{ marginBottom: '16px' }}>
                    <Search
                        placeholder="Search menu..."
                        allowClear
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ width: '100%' }}
                        size="small"
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    />
                </div>
            )}
            
            {/* Menu */}
            <div className="enhanced-admin-menu" style={{ 
                maxHeight: collapsed ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)', 
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '4px'
            }}>
                <Menu 
                    mode="inline"
                    selectedKeys={selectedKeys}
                    openKeys={openKeys}
                    onOpenChange={setOpenKeys}
                    items={displayItems}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '14px'
                    }}
                    theme="light"
                    inlineIndent={20}
                />
            </div>
            
            {/* Footer */}
            {!collapsed && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '16px', 
                    left: '8px', 
                    right: '8px',
                    textAlign: 'center',
                    padding: '8px',
                    background: 'linear-gradient(135deg, rgba(250, 219, 20, 0.1) 0%, rgba(243, 156, 18, 0.1) 100%)',
                    borderRadius: '8px',
                    border: '1px solid rgba(250, 219, 20, 0.2)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        DearHome Admin v2.0
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '10px' }}>
                        ⭐ Golden Experience
                    </Text>
                </div>
            )}
            
            {/* Collapsed footer */}
            {collapsed && (
                <div style={{ 
                    position: 'absolute', 
                    bottom: '16px', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}>
                    <Tooltip title="DearHome Admin v2.0 - Golden Experience" placement="right">
                        <div style={{ fontSize: '16px' }}>⭐</div>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default AdminMenu;