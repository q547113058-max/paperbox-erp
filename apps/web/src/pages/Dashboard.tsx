import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>概览</h2>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="产品数量" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="订单数量" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="待发货" value={0} /></Card></Col>
        <Col span={6}><Card><Statistic title="应付账款" value={0} /></Card></Col>
      </Row>
    </div>
  );
}
