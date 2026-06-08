import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  CarOutlined,
  BankOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
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

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider width={200} style={{ background: '#fff' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f0f0f0', fontSize: 16, fontWeight: 500 }}>
          纸箱 ERP
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ height: '100%', borderRight: 0 }}
        />
      </Sider>
      <AntLayout>
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 14, color: '#666' }}>纸箱 ERP</span>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', minHeight: 280 }}>
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
