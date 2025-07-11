import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Space, Typography, Button, Drawer } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import AdminMenu from './AdminMenu';
import { useSelector } from 'react-redux';
import { URLS } from '../../constants/urls';


const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const avatar = user?.imageUrl ? user.imageUrl : "https://cdn1.iconfinder.com/data/icons/user-pictures/100/male3-512.png";

  console.log("AdminLayout user", user);

  // Check if the screen is mobile size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider 
          style={{
            background: '#fff',
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
          trigger={null} 
          collapsible 
          collapsed={collapsed}
        >
          <AdminMenu collapsed={collapsed} />
        </Sider>
      )}

      {/* Mobile Drawer Menu */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileMenuOpen(false)}
        open={isMobile && mobileMenuOpen}
        width={250}
        bodyStyle={{ padding: 0, background: '#fff' }}
      >
        <AdminMenu onMenuItemClick={() => setMobileMenuOpen(false)} collapsed={false} />
      </Drawer>

      <Layout style={{ marginLeft: isMobile ? 0 : (collapsed ? 70 : 190) }}>
        <Header
          style={{
            padding: 0,
            background: '#fff',
            position: 'fixed',
            zIndex: 1,
            width: isMobile ? '100%' : `calc(100% - ${collapsed ? 70 : 190}px)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}
              />
            ) : collapsed ? (
              <MenuUnfoldOutlined
                className="trigger"
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}
              />
            ) : (
              <MenuFoldOutlined
                className="trigger"
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '18px', padding: '0 24px', cursor: 'pointer' }}
              />
            )}
          </div>
            <Space style={{ marginRight: 20 }} onClick={() => navigate(URLS.ADMIN.PROFILE)}>
              <Avatar 
                size={32}
                src={avatar}
                style={{ backgroundColor: avatar ? 'transparent' : '#1890ff' }}
              />
              {(!isMobile || (isMobile && !mobileMenuOpen)) && (
                <Text strong>{user.unique_name}</Text>
              )}
            </Space>
        </Header>
        <Content
          style={{
            margin: '80px 12px 24px',
            padding: isMobile ? '4px' : '4px',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
