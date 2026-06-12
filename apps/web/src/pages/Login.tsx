import React from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import api from '../utils/axios';
import { BrandLogo } from '../components/BrandLogo';
import {
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const BRAND = '#2c5282';
const SIDER_BG = '#1e293b';

const features = [
  { icon: <SafetyCertificateOutlined />, title: '安全可靠', desc: '数据本地存储，权限精细控制' },
  { icon: <ThunderboltOutlined />, title: '高效流转', desc: '订单→工单→发货全链路自动化' },
  { icon: <TeamOutlined />, title: '多角色协作', desc: '老板/销售/仓库/财务各司其职' },
];

export default function Login() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await api.post('/auth/login', values);
      setAuth(res.data.access_token, res.data.user);
      navigate('/', { replace: true });
    } catch (e: any) {
      message.error(e.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#f8fafc',
    }}>
      {/* 左侧品牌区 */}
      <div style={{
        flex: '0 0 45%',
        background: `linear-gradient(135deg, ${SIDER_BG} 0%, #0f172a 100%)`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* 装饰性背景元素 */}
        <div style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.03)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -80,
          left: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.02)',
        }} />

        {/* Logo + 品牌名 */}
        <div style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <BrandLogo size={48} dark withText={false} />
          <h1 style={{
            color: '#f1f5f9',
            fontSize: 28,
            fontWeight: 700,
            margin: '16px 0 8px',
            letterSpacing: 1,
          }}>
            丰晟达 ERP
          </h1>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
            开平市丰晟达食品 · 纸箱业务管理系统
          </Text>
        </div>

        {/* 特性介绍 */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>
          {features.map((f, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 16,
              marginBottom: 24,
              padding: '16px 20px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(251,191,36,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                color: '#fbbf24',
                flexShrink: 0,
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{f.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 底部版权 */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          color: 'rgba(255,255,255,0.2)',
          fontSize: 11,
        }}>
          © 2026 丰晟达食品 · v1.0
        </div>
      </div>

      {/* 右侧表单区 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 32px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
              欢迎回来
            </h2>
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>
              登录您的账号继续使用
            </Text>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ username: 'boss', password: 'demo' }}
            size="large"
          >
            <Form.Item name="username" label="账号" rules={[{ required: true }]}>
              <Input placeholder="请输入账号" />
            </Form.Item>
            <Form.Item name="password" label="密码" rules={[{ required: true }]}>
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item style={{ marginTop: 8 }}>
              <Button type="primary" htmlType="submit" block style={{ height: 44, fontSize: 15, fontWeight: 500 }}>
                登 录
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Text style={{ color: '#cbd5e1', fontSize: 12 }}>
              测试账号：boss / demo
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
