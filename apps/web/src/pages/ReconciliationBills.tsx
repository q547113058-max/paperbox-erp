import React, { useEffect, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form,
  DatePicker, Tooltip, Dropdown, Descriptions, Empty,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ReconciliationBill, ReconciliationItem } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';
import dayjs from 'dayjs';

const STATUS_COLOR: Record<string, string> = {
  '待确认': 'orange',
  '已确认': 'green',
  '已取消': 'default',
};

export default function ReconciliationBills() {
  const [data, setData] = useState<ReconciliationBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [detail, setDetail] = useState<{ bill: ReconciliationBill; items: ReconciliationItem[] } | null>(null);
  const [form] = Form.useForm();
  const [customerMap, setCustomerMap] = useState<Record<number, string>>({});

  const fetchAll = () => {
    setLoading(true);
    api.get('/reconciliation_bills').then((r) => setData(r.data))
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      const map: Record<number, string> = {};
      (res.data || []).forEach((c: any) => {
        map[c.id] = c.name || c.company_name || c.customer_name || `客户#${c.id}`;
      });
      setCustomerMap(map);
    } catch {
      // silently fail — fallback will show ID
    }
  };

  useEffect(() => { fetchAll(); fetchCustomers(); }, []);

  const filtered = data.filter((b) => {
    if (!keyword) return true;
    const name = customerMap[b.customer_id] || '';
    return b.bill_no?.includes(keyword)
      || String(b.customer_id).includes(keyword)
      || name.includes(keyword);
  });

  const openGenerate = () => {
    form.resetFields();
    form.setFieldsValue({
      period_start: dayjs().subtract(1, 'month'),
      period_end: dayjs(),
    });
    setGenModalOpen(true);
  };

  const handleGenerate = async () => {
    try {
      const v = await form.validateFields();
      const res = await api.post('/reconciliation_bills/generate', {
        customer_id: v.customer_id,
        period_start: v.period_start?.format('YYYY-MM-DD'),
        period_end: v.period_end?.format('YYYY-MM-DD'),
        remark: v.remark,
      });
      message.success(`已生成对账单 ${res.data.bill_no}，金额 ¥${res.data.total_amount}`);
      setGenModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (!e.response) message.error('保存失败');
      else message.error(e.response?.data?.message || '生成失败');
    }
  };

  const handleConfirm = async (b: ReconciliationBill) => {
    try {
      await api.post(`/reconciliation_bills/${b.id}/confirm`, { remark: '财务确认' });
      message.success('已确认');
      fetchAll();
    } catch (e: any) {
      message.error(e.response?.data?.message || '操作失败');
    }
  };

  const confirmWithModal = (b: ReconciliationBill) => {
    Modal.confirm({
      title: '确认对账',
      content: `确定要确认对账单 ${b.bill_no} 吗？确认后金额 ¥${Number(b.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 将生效。`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { style: { background: '#2c5282', borderColor: '#2c5282' } },
      onOk: () => handleConfirm(b),
    });
  };

  const handleCancel = async (b: ReconciliationBill) => {
    let reason = '';
    Modal.confirm({
      title: `取消对账单 ${b.bill_no}`,
      content: (
        <Input placeholder="取消原因" onChange={(e) => { reason = e.target.value; }} />
      ),
      onOk: async () => {
        if (!reason) { message.warning('请填写原因'); return Promise.reject(); }
        try {
          await api.post(`/reconciliation_bills/${b.id}/cancel`, { reason });
          message.success('已取消');
          fetchAll();
        } catch (e: any) {
          message.error(e.response?.data?.message || '取消失败');
        }
      },
    });
  };

  const showDetail = async (b: ReconciliationBill) => {
    try {
      const res = await api.get(`/reconciliation_bills/${b.id}`);
      setDetail({ bill: res.data, items: res.data.items || [] });
    } catch {
      message.error('加载详情失败');
    }
  };

  const amountRender = (v: number) => {
    const text = `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
    return (
      <Tooltip title={text}>
        <span style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{text}</span>
      </Tooltip>
    );
  };

  const columns = [
    { title: '对账单号', dataIndex: 'bill_no', key: 'bill_no', width: 160, render: (v: string, r: ReconciliationBill) => <a onClick={() => showDetail(r)}>{v}</a> },
    {
      title: '客户', dataIndex: 'customer_id', key: 'customer_id', width: 120,
      render: (id: number) => customerMap[id] || <span style={{ color: '#999' }}>未关联</span>,
    },
    { title: '账期起', dataIndex: 'period_start', key: 'period_start', width: 120 },
    { title: '账期止', dataIndex: 'period_end', key: 'period_end', width: 120 },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', width: 140, align: 'right' as const, render: amountRender },
    { title: '数量', dataIndex: 'total_qty', key: 'total_qty', width: 100, align: 'right' as const },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, align: 'center' as const, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '确认时间', dataIndex: 'confirmed_at', key: 'confirmed_at', width: 140, render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 140 },
    {
      title: '操作', key: 'action', width: 100, fixed: 'right' as const,
      render: (_: any, r: ReconciliationBill) => {
        const items: MenuProps['items'] = [
          { key: 'detail', label: '查看详情', onClick: () => showDetail(r) },
          ...(r.status === '待确认'
            ? [{ key: 'confirm', label: '确认对账', onClick: () => confirmWithModal(r) }]
            : []),
          ...(r.status !== '已确认' && r.status !== '已取消'
            ? [{ key: 'cancel', label: '取消', danger: true, onClick: () => handleCancel(r) }]
            : []),
        ];
        return (
          <Dropdown menu={{ items }} trigger={['click']}>
            <Button size="small" type="link" style={{ color: '#2c5282' }}>
              操作 <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  const detailColumns = [
    { title: '发货单号', dataIndex: 'delivery_no', key: 'delivery_no', width: 160 },
    { title: '产品', dataIndex: 'product_name', key: 'product_name', width: 160 },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 110, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '发货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 130 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>对账管理</h2>
        <Space>
          <Input placeholder="搜索单号/客户名" value={keyword} onChange={(e) => setKeyword(e.target.value)} style={{ width: 200 }} allowClear />
          <Button type="primary" onClick={openGenerate} style={{ background: '#2c5282', borderColor: '#2c5282' }}>生成对账单</Button>
        </Space>
      </div>
      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered} pagination={{ pageSize: 15 }} scroll={{ x: 1400 }}
        locale={{ emptyText: <TableEmptyCell resource="对账单" actionText="生成对账单" onAction={() => setGenModalOpen(true)} keyword={keyword} isDataEmpty={data.length === 0} /> }}
      />

      <Modal title="生成对账单" open={genModalOpen} onOk={handleGenerate} onCancel={() => setGenModalOpen(false)} okText="生成" cancelText="取消" width={600} destroyOnClose
        okButtonProps={{ style: { background: '#2c5282', borderColor: '#2c5282' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customer_id" label="客户ID" rules={[{ required: true }]}>
            <Input type="number" placeholder="客户ID" />
          </Form.Item>
          <Form.Item name="period_start" label="账期起" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="period_end" label="账期止" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <p style={{ color: '#999', fontSize: 12 }}>系统将自动拉取该客户在账期内的<strong>已签收</strong>发货单生成对账单。</p>
        </Form>
      </Modal>

      <Modal
        title={`对账单详情 - ${detail?.bill.bill_no || ''}`}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={900}
        destroyOnClose
      >
        {detail && (
          <div>
            <Descriptions
              bordered
              column={3}
              size="small"
              style={{ marginBottom: 16 }}
              labelStyle={{ fontWeight: 600, width: 100 }}
            >
              <Descriptions.Item label="客户">
                {customerMap[detail.bill.customer_id] || detail.bill.customer_id}
              </Descriptions.Item>
              <Descriptions.Item label="账期起">
                {detail.bill.period_start}
              </Descriptions.Item>
              <Descriptions.Item label="账期止">
                {detail.bill.period_end}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detail.bill.status)}>{detail.bill.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="金额">
                <span style={{ fontWeight: 600, color: '#2c5282' }}>
                  ¥{Number(detail.bill.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </Descriptions.Item>
            </Descriptions>
            <Table
              rowKey="id"
              size="small"
              columns={detailColumns}
              dataSource={detail.items}
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="暂无对账明细"
                    style={{ padding: '32px 0' }}
                  />
                ),
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
