import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './index.css';

// 品牌色（design-tokens §1.1）：钢蓝 #2c5282
const BRAND = '#2c5282';
const BRAND_HOVER = '#2b6cb0';
const BRAND_ACTIVE = '#1e3a5f';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          colorPrimary: BRAND,
          colorPrimaryHover: BRAND_HOVER,
          colorPrimaryActive: BRAND_ACTIVE,
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          boxShadowSecondary: '0 4px 12px rgba(0,0,0,0.08)',
          colorBgLayout: '#f8fafc',
          colorBgContainer: '#ffffff',
          colorBorder: '#e2e8f0',
          colorText: '#1e293b',
          colorTextSecondary: '#64748b',
          colorTextTertiary: '#94a3b8',
          controlHeight: 36,
          controlHeightLG: 40,
          controlHeightSM: 28,
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkSubMenuItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(255,255,255,0.1)',
            darkItemHoverBg: 'rgba(255,255,255,0.06)',
            darkItemColor: 'rgba(255,255,255,0.7)',
            darkItemSelectedColor: '#fbbf24',
            itemBorderRadius: 6,
            iconSize: 16,
            collapsedIconSize: 18,
          },
          Table: {
            headerBg: '#f8fafc',
            headerColor: '#475569',
            rowHoverBg: '#f1f5f9',
            borderColor: '#e2e8f0',
            cellPaddingBlock: 12,
            cellPaddingInline: 16,
          },
          Card: {
            paddingLG: 20,
            borderRadiusLG: 8,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Modal: {
            borderRadiusLG: 12,
            titleFontSize: 16,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
