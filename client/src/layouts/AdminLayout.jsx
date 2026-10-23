import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Settings, 
  Gift, 
  Users, 
  CreditCard, 
  LogOut, 
  Menu as MenuIcon 
} from 'lucide-react';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <LayoutDashboard size={18} />,
      label: 'Dashboard',
    },
    {
      key: '/admin/events',
      icon: <Settings size={18} />,
      label: 'Event Config',
    },
    {
      key: '/admin/prizes',
      icon: <Gift size={18} />,
      label: 'Prizes',
    },
    {
      key: '/admin/import',
      icon: <Users size={18} />,
      label: 'Employee Import',
    },
    {
      key: '/admin/cards',
      icon: <CreditCard size={18} />,
      label: 'Card Management',
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: '#001529', 
          color: 'white',
          fontWeight: 'bold',
          fontSize: '1.2rem'
        }}>
          {!collapsed && 'Diwali Lucky Draw'}
          {collapsed && 'DLD'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          <Button 
            type="text" 
            icon={<MenuIcon size={18} />} 
            onClick={() => setCollapsed(!collapsed)} 
          />
          <Button type="text" icon={<LogOut size={18} />} onClick={handleLogout}>
            Logout
          </Button>
        </Header>
        <Content style={{ margin: '24px', overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
