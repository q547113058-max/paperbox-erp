import React, { useEffect, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form,
  DatePicker, Select, InputNumber, Progress, Tooltip, Row, Col, Divider, Descriptions,
} from 'antd';
import { EyeOutlined, PrinterOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import type { WorkOrder } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';
import dayjs from 'dayjs';

const BRAND_COLOR = '#2c5282';

/**
 * 计算完成进度（百分比），安全处理分母为零
 */
function calcProgress(wo: WorkOrder): number {
  const total = Number(wo.quantity || 0);
  if (total <= 0) return 0;
  const done = Number(wo.completed_qty || 0);
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

/**
 * 进度条颜色：<30% 红色, 30-70% 橙色, >70% 绿色
 */
function progressColor(pct: number): string {
  if (pct < 30) return '#f5222d';
  if (pct <= 70) return '#faad14';
  return '#52c41a';
}

/**
 * 格式化时间字段，空值兜底 '-'
 */
function fmtTime(v: string | null | undefined): string {
  if (!v) return '-';
  // ISO 时间只取日期部分，长时间原样
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.replace('T', ' ').slice(0, 19);
  return v;
}

export default function WorkOrders() {
  const [data, setData] = useState<WorkOrder[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentWo, setCurrentWo] = useState<WorkOrder | null>(null);
  const [detailWo, setDetailWo] = useState<WorkOrder | null>(null);
  const [form] = Form.useForm();

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/work_orders'),
      api.get('/products').catch(() => ({ data: [] })),
    ])
      .then(([wo, p]) => {
        setData(wo.data || []);
        setProducts(p.data || []);
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const productMap = Object.fromEntries(products.map((p: any) => [p.id, p.name || p.code || `产品#${p.id}`]));

  const filtered = data.filter((w) =>
    !keyword || w.prod_no?.includes(keyword) || String(w.order_id).includes(keyword)
  );

  const openSchedule = (wo: WorkOrder) => {
    setCurrentWo(wo);
    form.setFieldsValue({
      worker: wo.worker || '',
      start_time: wo.start_time ? dayjs(wo.start_time) : null,
      end_time: wo.end_time ? dayjs(wo.end_time) : null,
      priority: wo.priority || 'normal',
    });
    setScheduleModalOpen(true);
  };

  const handleSchedule = async () => {
    try {
      const v = await form.validateFields();
      const payload = {
        worker: v.worker,
        start_time: v.start_time?.format('YYYY-MM-DD HH:mm:ss'),
        end_time: v.end_time?.format('YYYY-MM-DD HH:mm:ss'),
        priority: v.priority,
      };
      await api.put(`/work_orders/${currentWo!.id}/schedule`, payload);
      message.success('排产成功');
      setScheduleModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return; // 表单校验失败静默
      if (!e.response) message.error('保存失败');
      else message.error(e.response?.data?.message || '排产失败');
    }
  };

  // 全部 POST/PUT 操作统一 Modal.confirm 包裹（防误触）
  const handleStart = (wo: WorkOrder) => {
    Modal.confirm({
      title: `开始生产 - ${wo.prod_no || `#${wo.id}`}`,
      content: `确认开始工单 ${wo.prod_no || `#${wo.id}`} 的生产？状态将变为「生产中」。`,
      okText: '确认开始',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.put(`/work_orders/${wo.id}/start`);
          message.success('已开始生产');
          fetchAll();
        } catch (e: any) {
          message.error(e?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  const handleComplete = (wo: WorkOrder) => {
    Modal.confirm({
      title: `完工工单 - ${wo.prod_no || `#${wo.id}`}`,
      content: (
        <div>
          <p>确认完工？将自动入库 {wo.quantity || 0} 个到车间库存。</p>
          <InputNumber
            id="complete-qty"
            min={0}
            defaultValue={wo.quantity || 0}
            addonAfter="数量"
            style={{ width: '100%' }}
          />
        </div>
      ),
      okText: '确认完工',
      cancelText: '取消',
      onOk: async () => {
        const qty = (document.getElementById('complete-qty') as any)?.value || wo.quantity;
        try {
          await api.post(`/work_orders/${wo.id}/complete`, {
            completed_qty: qty,
            entry_code: `WC-${Date.now()}`,
          });
          message.success('已完工并入库');
          fetchAll();
        } catch (e: any) {
          message.error(e?.response?.data?.message || '完工失败');
        }
      },
    });
  };

  const handleCancel = (wo: WorkOrder) => {
    let reason = '';
    Modal.confirm({
      title: `取消工单 - ${wo.prod_no || `#${wo.id}`}`,
      content: (
        <Input
          id="cancel-reason"
          placeholder="请输入取消原因（必填）"
          onChange={(e) => { reason = e.target.value; }}
        />
      ),
      okText: '确认取消',
      okButtonProps: { danger: true },
      cancelText: '不取消',
      onOk: async () => {
        if (!reason) { message.warning('请填写取消原因'); return Promise.reject(); }
        try {
          await api.post(`/work_orders/${wo.id}/cancel`, { reason });
          message.success('已取消');
          fetchAll();
        } catch (e: any) {
          message.error(e?.response?.data?.message || '取消失败');
        }
      },
    });
  };

  // ========== 详情 & 打印 ==========

  const openDetail = (wo: WorkOrder) => {
    setDetailWo(wo);
    setDetailModalOpen(true);
  };

  const handlePrint = (wo: WorkOrder) => {
    const printUrl = `/api/print/work_order/${wo.id}`;
    const w = window.open(printUrl, '_blank', 'width=900,height=700');
    if (!w) message.warning('请允许弹窗以查看打印');
  };

  const copyProdNo = async (prodNo: string | null) => {
    if (!prodNo) return;
    try {
      await navigator.clipboard.writeText(prodNo);
      message.success(`已复制：${prodNo}`);
    } catch {
      // 兜底：旧浏览器
      const ta = document.createElement('textarea');
      ta.value = prodNo;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); message.success(`已复制：${prodNo}`); }
      catch { message.error('复制失败，请手动选择'); }
      document.body.removeChild(ta);
    }
  };

  // ========== 表格列定义 ==========

  const columns = [
    {
      title: '工单号', dataIndex: 'prod_no', key: 'prod_no', width: 160, fixed: 'left' as const,
      render: (v: string | null, r: WorkOrder) => v ? (
        <Tooltip title="点击复制">
          <span
            onClick={() => copyProdNo(v)}
            style={{
              fontFamily: 'monospace',
              color: BRAND_COLOR,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <CopyOutlined style={{ marginRight: 4, fontSize: 11, opacity: 0.6 }} />
            {v}
          </span>
        </Tooltip>
      ) : <span style={{ color: '#bfbfbf' }}>TMP-{r.id}</span>,
    },
    { title: '订单ID', dataIndex: 'order_id', key: 'order_id', width: 80 },
    { title: '产品名称', dataIndex: 'product_id', key: 'product_id', width: 120,
      render: (id: number) => productMap[id] || `产品#${id}` },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'right' as const,
      render: (v: number | null) => v ?? '-' },
    { title: '工人', dataIndex: 'worker', key: 'worker', width: 90,
      render: (v: string) => v || '-' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80, align: 'center' as const,
      render: (p: string) => {
        const map: Record<string, { c: string; t: string }> = {
          low: { c: 'default', t: '低' },
          normal: { c: 'blue', t: '普通' },
          high: { c: 'orange', t: '高' },
          urgent: { c: 'red', t: '紧急' },
        };
        const v = map[p || 'normal'] || map.normal;
        return <Tag color={v.c}>{v.t}</Tag>;
      } },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    // 已发数量 / 待发数量
    { title: '已发数量', key: 'delivered_qty', width: 90, align: 'right' as const,
      render: (_: any, r: WorkOrder) => {
        // 已完成时显示 completed_qty，否则 '-'
        if (r.status === '已完成') return Number(r.completed_qty || 0);
        return <span style={{ color: '#bfbfbf' }}>-</span>;
      } },
    { title: '待发数量', key: 'pending_qty', width: 90, align: 'right' as const,
      render: (_: any, r: WorkOrder) => {
        const total = Number(r.quantity || 0);
        const done = Number(r.completed_qty || 0);
        const pending = Math.max(0, total - done);
        if (r.status === '已取消') return <span style={{ color: '#bfbfbf' }}>-</span>;
        return <span style={{ color: pending > 0 ? '#fa8c16' : '#52c41a' }}>{pending}</span>;
      } },
    { title: '进仓码', dataIndex: 'entry_code', key: 'entry_code', width: 140,
      render: (v: string) => v || '-' },
    { title: '开始', dataIndex: 'start_time', key: 'start_time', width: 140,
      render: (v: string) => fmtTime(v) },
    { title: '结束', dataIndex: 'end_time', key: 'end_time', width: 140,
      render: (v: string) => fmtTime(v) },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v: string) => (v || '').split('T')[0] || v || '-' },
    {
      title: '操作', key: 'action', width: 260, fixed: 'right' as const,
      render: (_: any, r: WorkOrder) => (
        <Space size={2} wrap>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
            详情
          </Button>
          {r.status === '待排产' && (
            <Button size="small" type="link" onClick={() => openSchedule(r)}>排产</Button>
          )}
          {r.status === '已排产' && (
            <Button size="small" type="link" onClick={() => handleStart(r)}>开始</Button>
          )}
          {(r.status === '生产中' || r.status === '已排产') && (
            <Button size="small" type="link" onClick={() => handleComplete(r)}>完工</Button>
          )}
          {r.status !== '已完成' && r.status !== '已取消' && (
            <Button size="small" type="link" danger onClick={() => handleCancel(r)}>取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>工单管理</h2>
        <Space>
          <Input
            placeholder="搜索工单号/订单ID"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
        </Space>
      </div>
      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1600 }}
        locale={{
          emptyText: (
            <TableEmptyCell
              resource="工单"
              keyword={keyword}
              isDataEmpty={data.length === 0}
              hint="工单通常由销售订单自动生成，无需手动创建"
            />
          ),
        }}
      />

      {/* 排产弹窗 */}
      <Modal
        title={`排产 - ${currentWo?.prod_no || (currentWo ? `#${currentWo.id}` : '')}`}
        open={scheduleModalOpen}
        onOk={handleSchedule}
        onCancel={() => setScheduleModalOpen(false)}
        okText="确认排产"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="worker" label="指派工人" rules={[{ required: true }]}>
            <Input placeholder="工人姓名" />
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select
              options={[
                { value: 'low', label: '低' },
                { value: 'normal', label: '普通' },
                { value: 'high', label: '高' },
                { value: 'urgent', label: '紧急' },
              ]}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="计划开始" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="计划结束" rules={[{ required: true }]}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={`工单详情 - ${detailWo?.prod_no || (detailWo ? `TMP-${detailWo.id}` : '')}`}
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => detailWo && handlePrint(detailWo)}>
            打印工单
          </Button>,
          <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
        ]}
        width={800}
      >
        {detailWo && (
          <>
            {/* 基本信息 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0' }}>
              基本信息
            </Divider>
            <Descriptions size="small" column={2} bordered colon={false} labelStyle={{ width: 100, color: '#64748b' }}>
              <Descriptions.Item label="工单号">
                <span style={{ fontFamily: 'monospace', color: BRAND_COLOR, fontWeight: 500 }}>
                  {detailWo.prod_no || `TMP-${detailWo.id}`}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailWo.status)}>{detailWo.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                {detailWo.priority ? <Tag>{detailWo.priority}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="指派工人">
                {detailWo.worker || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                {detailWo.order_id ? `#${detailWo.order_id}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="产品名称">
                {detailWo.product_id ? (productMap[detailWo.product_id] || `产品#${detailWo.product_id}`) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {fmtTime(detailWo.created_at)}
              </Descriptions.Item>
            </Descriptions>

            {/* 规格尺寸 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '16px 0 12px 0' }}>
              规格尺寸
            </Divider>
            <Descriptions size="small" column={2} bordered colon={false} labelStyle={{ width: 100, color: '#64748b' }}>
              <Descriptions.Item label="成品规格">
                {detailWo.finished_spec || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="板长 (mm)">
                {detailWo.board_length || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="板宽 (mm)">
                {detailWo.board_width || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="板面积 (m²)">
                {detailWo.board_area != null ? Number(detailWo.board_area).toFixed(4) : '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* 生产信息 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '16px 0 12px 0' }}>
              生产信息
            </Divider>
            <Descriptions size="small" column={2} bordered colon={false} labelStyle={{ width: 100, color: '#64748b' }}>
              <Descriptions.Item label="计划数量">
                {detailWo.quantity ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="完成数量">
                <span style={{ color: progressColor(calcProgress(detailWo)), fontWeight: 600 }}>
                  {detailWo.completed_qty ?? 0}
                </span>
                <span style={{ marginLeft: 8, color: '#8c8c8c', fontSize: 12 }}>
                  ({calcProgress(detailWo)}%)
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="工时">
                {detailWo.labor_hours != null ? `${detailWo.labor_hours} 小时` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="进仓码">
                <span style={{ fontFamily: 'monospace' }}>{detailWo.entry_code || '-'}</span>
              </Descriptions.Item>
            </Descriptions>

            {/* 时间 */}
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '16px 0 12px 0' }}>
              时间
            </Divider>
            <Descriptions size="small" column={2} bordered colon={false} labelStyle={{ width: 100, color: '#64748b' }}>
              <Descriptions.Item label="计划开始">
                {fmtTime(detailWo.start_time)}
              </Descriptions.Item>
              <Descriptions.Item label="计划结束">
                {fmtTime(detailWo.end_time)}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
}
