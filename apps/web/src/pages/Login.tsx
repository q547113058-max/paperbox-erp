import React from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { useAuthStore } from '../stores/auth';
import axios from 'axios';

export default function Login() {
  const setAuth = useAuthStore((s) => s.setAuth);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const res = await axios.post('/api/auth/login', values);
      setAuth(res.data.token, res.data.user);
    } catch (e: any) {
      message.error(e.response?.data?.message || '登录失败');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontWeight: 600, marginBottom: 4 }}>纸箱 ERP</h2>
          <p style={{ color: '#666', fontSize: 14 }}>开平市丰晟达食品</p>
        </div>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: 'boss', password: 'demo' }}>
          <Form.Item name="username" label="账号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
