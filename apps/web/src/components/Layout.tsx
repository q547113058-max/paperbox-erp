import React, { useMemo, useState } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Button, Drawer, Breadcrumb, Avatar, Space, Input } from 'antd';
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
  ToolOutlined,
  ApiOutlined,
  FileTextOutlined,
  HomeOutlined,
  PictureOutlined,
  SearchOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { BrandLogo } from './BrandLogo';

const { Header, Sider, Content } = AntLayout;

// 品牌色常量
const BRAND = '#2c5282';
const SIDER_BG = '#1e293b';
const SIDER_HOVER = '#334155';
const SIDER_ACTIVE = '#0f172a';
const AMBER = '#d97706';

// 角色权限配置
const ROLE_PERMISSIONS: Record<string, string[]> = {
  boss: ['/', '/products', '/orders', '/purchases', '/warehouse', '/deliveries', '/finance', '/receivables', '/payables', '/customers', '/suppliers', '/personnel', '/work_orders', '/reconciliation_bills', '/knife_dies', '/color_prints', '/settings', '/action_logs', '/search'],
  finance: ['/', '/orders', '/purchases', '/finance', '/receivables', '/payables', '/customers', '/suppliers', '/reconciliation_bills'],
  warehouse: ['/', '/products', '/orders', '/purchases', '/warehouse', '/deliveries', '/work_orders', '/knife_dies', '/color_prints', '/materials'],
  sales: ['/', '/products', '/orders', '/customers', '/deliveries'],
  default: ['/'],
};

const allMenuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  {
    type: 'group' as const,
    label: '销售',
    children: [
      { key: '/orders', icon: <ShoppingCartOutlined />, label: '销售订单' },
      { key: '/work_orders', icon: <ToolOutlined />, label: '工单' },
      { key: '/deliveries', icon: <CarOutlined />, label: '发货' },
    ],
  },
  {
    type: 'group' as const,
    label: '委外',
    children: [
      { key: '/purchases', icon: <InboxOutlined />, label: '委外' },
      { key: '/warehouse', icon: <InboxOutlined />, label: '仓库' },
    ],
  },
  {
    type: 'group' as const,
    label: '生产',
    children: [
      { key: '/knife_dies', icon: <ToolOutlined />, label: '刀模' },
      { key: '/color_prints', icon: <PictureOutlined />, label: '彩印' },
    ],
  },
  {
    type: 'group' as const,
    label: '财务',
    children: [
      { key: '/reconciliation_bills', icon: <FileTextOutlined />, label: '对账' },
      { key: '/finance', icon: <BankOutlined />, label: '财务' },
      { key: '/receivables', icon: <BankOutlined />, label: '应收' },
      { key: '/payables', icon: <BankOutlined />, label: '应付' },
    ],
  },
  {
    type: 'group' as const,
    label: '基础数据',
    children: [
      { key: '/products', icon: <AppstoreOutlined />, label: '产品' },
      { key: '/customers', icon: <TeamOutlined />, label: '客户' },
      { key: '/suppliers', icon: <TeamOutlined />, label: '供应商' },
      { key: '/personnel', icon: <SettingOutlined />, label: '人员' },
    ],
  },
  {
    type: 'group' as const,
    label: '系统',
    children: [
      { key: '/action_logs', icon: <HistoryOutlined />, label: '操作日志' },
      { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
    ],
  },
];

// 路径 → 页面名称映射
const PAGE_NAMES: Record<string, string> = {
  '/': '概览',
  '/products': '产品管理',
  '/orders': '订单管理',
  '/work_orders': '工单管理',
  '/purchases': '委外管理',
  '/warehouse': '仓库管理',
  '/deliveries': '发货管理',
  '/reconciliation_bills': '对账管理',
  '/finance': '财务管理',
  '/receivables': '应收管理',
  '/payables': '应付管理',
  '/knife_dies': '刀模管理',
  '/color_prints': '彩印管理',
  '/customers': '客户管理',
  '/suppliers': '供应商管理',
  '/personnel': '人员管理',
  '/search': '全局搜索',
  '/action_logs': '操作日志',
  '/settings': '系统设置',
};

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

  // 根据角色过滤菜单（支持分组结构）
  const menuItems = useMemo(() => {
    const role = user?.role || 'default';
    const allowedPaths = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.default;
    return allMenuItems
      .map((item) => {
        if (item.type === 'group' && item.children) {
          const visibleChildren = item.children.filter((c: any) => allowedPaths.includes(c.key));
          return visibleChildren.length > 0 ? { ...item, children: visibleChildren } : null;
        }
        return allowedPaths.includes((item as any).key) ? item : null;
      })
      .filter(Boolean);
  }, [user?.role]);

  // 面包屑
  const breadcrumbItems = useMemo(() => {
    const pageName = PAGE_NAMES[location.pathname] || '未知页面';
    return [
      { title: <><HomeOutlined /> 首页</> },
      ...(location.pathname !== '/' ? [{ title: pageName }] : []),
    ];
  }, [location.pathname]);

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: SIDER_BG }}>
      {/* Logo 区 */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <BrandLogo size={24} dark />
      </div>

      {/* 菜单区 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          theme="dark"
          style={{
            background: 'transparent',
            borderRight: 0,
          }}
        />
        <style>{`
          .ant-menu-item-group-title {
            color: rgba(255,255,255,0.35) !important;
            font-size: 11px !important;
            letter-spacing: 1px !important;
            text-transform: uppercase !important;
            padding: 12px 16px 4px !important;
          }
          .ant-menu-item-group-title:not(:first-child) {
            border-top: 1px solid rgba(255,255,255,0.06);
            margin-top: 4px;
          }
        `}</style>
      </div>

      {/* 底部公司信息 */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.35)',
          lineHeight: 1.5,
        }}
      >
        <div>开平市丰晟达食品有限公司</div>
        <div style={{ fontSize: 10, opacity: 0.6 }}>v1.0 · 纸箱业务系统</div>
      </div>
    </div>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 移动端：抽屉式侧边栏 */}
      {isMobile ? (
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={220}
          styles={{ body: { padding: 0, background: SIDER_BG } }}
        >
          {siderContent}
        </Drawer>
      ) : (
        <Sider
          width={220}
          style={{
            background: SIDER_BG,
            boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          {siderContent}
        </Sider>
      )}

      <AntLayout style={{ marginLeft: isMobile ? 0 : 220, transition: 'margin-left 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            height: 56,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ fontSize: 18 }}
              />
            )}
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
            <Input.Search
              placeholder="搜索订单 / 工单 / 产品 / 客户..."
              allowClear
              onSearch={(v) => { if (v.trim()) navigate(`/search?q=${encodeURIComponent(v.trim())}`); }}
              style={{ maxWidth: 420, width: '100%' }}
              size="middle"
            />
          </div>
          <Space size={12}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}>
                <Avatar
                  size={28}
                  style={{ background: BRAND, fontSize: 13 }}
                  icon={<UserOutlined />}
                />
                <span style={{ fontSize: 13, color: '#374151' }}>
                  {user?.real_name || user?.username || '用户'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区 */}
        <Content
          style={{
            margin: isMobile ? 8 : 16,
            padding: isMobile ? 12 : 24,
            background: '#f8fafc',
            minHeight: 280,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
