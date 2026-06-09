import React, { useMemo, useState } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  CarOutlined,
  BankOutlined,
  TeamOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';

const { Header, Sider, Content } = AntLayout;

// 角色权限配置
const ROLE_PERMISSIONS: Record<string, string[]> = {
  boss: ['/', '/products', '/orders', '/purchases', '/warehouse', '/deliveries', '/finance', '/customers', '/suppliers', '/personnel'],
  finance: ['/', '/orders', '/purchases', '/finance', '/customers', '/suppliers'],
  warehouse: ['/', '/products', '/orders', '/warehouse', '/deliveries', '/materials'],
  sales: ['/', '/products', '/orders', '/customers', '/deliveries'],
  default: ['/'],
};

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/products', icon: <AppstoreOutlined />, label: '产品' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '销售订单' },
  { key: '/purchases', icon: <InboxOutlined />, label: '采购' },
  { key: '/warehouse', icon: <InboxOutlined />, label: '仓库' },
  { key: '/deliveries', icon: <CarOutlined />, label: '发货' },
  { key: '/finance', icon: <BankOutlined />, label: '财务' },
  { key: '/customers', icon: <TeamOutlined />, label: '客户' },
  { key: '/suppliers', icon: <TeamOutlined />, label: '供应商' },
  { key: '/personnel', icon: <SettingOutlined />, label: '人员' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 监听窗口大小
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 根据角色过滤菜单
  const menuItems = useMemo(() => {
    const role = user?.role || 'default';
    const allowedPaths = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.default;
    return allMenuItems.filter((item) => allowedPaths.includes(item.key));
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    if (isMobile) setDrawerOpen(false);
  };

  const userMenuItems = [
    { key: 'role', label: `角色: ${user?.role || '-'}`, disabled: true },
    { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, onClick: handleLogout },
  ];

  const siderContent = (
    <>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0', fontSize: 16, fontWeight: 500 }}>
        纸箱 ERP
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ height: '100%', borderRight: 0 }}
      />
    </>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 移动端：抽屉式侧边栏 */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={200}
          styles={{ body: { padding: 0 } }}
        >
          {siderContent}
        </Drawer>
      ) : (
        <Sider width={200} style={{ background: '#fff' }}>
          {siderContent}
        </Sider>
      )}
      
      <AntLayout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 16px', 
          borderBottom: '1px solid #f0f0f0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile && (
              <Button 
                type="text" 
                icon={<MenuOutlined />} 
                onClick={() => setDrawerOpen(true)}
              />
            )}
            <span style={{ fontSize: 14, color: '#666' }}>纸箱 ERP</span>
          </div>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Button type="text" icon={<UserOutlined />}>
              {user?.real_name || user?.username || '用户'}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ 
          margin: isMobile ? 8 : 16, 
          padding: isMobile ? 12 : 24, 
          background: '#fff', 
          minHeight: 280 
        }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
