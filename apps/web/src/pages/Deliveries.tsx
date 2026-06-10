import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber,
  Select, DatePicker, Popconfirm, Row, Col, Divider, Card, Statistic,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CarOutlined, CheckCircleOutlined,
  PrinterOutlined, DownloadOutlined, StopOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, ReloadOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Delivery, DeliveryItem, Order, Product, Customer } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

/**
 * 发货管理（P0 业务页）
 *
 * 业务闭环：
 *   1. 从订单生成发货单（待发货，自动扣产品库存 + 写发货明细）
 *   2. 发货（待发货 → 已发货，填送货人/送货时间；自动更新订单的已发货数量）
 *   3. 签收（已发货 → 已签收；自动判断订单是否全部签收，更新订单状态为已发货）
 *   4. 打印（跳打印服务）
 *   5. 取消（任何未签收前可取消）
 *
 * 后端端点（11 个）：
 *   GET    /api/deliveries                  列表
 *   GET    /api/deliveries/:id              详情
 *   GET    /api/deliveries/by-no/:no        按单号查
 *   POST   /api/deliveries                  创建
 *   PUT    /api/deliveries/:id              更新
 *   DELETE /api/deliveries/:id              删除
 *   POST   /api/deliveries/from-order       从订单生成（含自动扣库存）
 *   POST   /api/deliveries/from-work-order  从工单生成（领料 + 写库存日志）
 *   PUT    /api/deliveries/:id/ship         发货
 *   POST   /api/deliveries/:id/sign         签收
 *   POST   /api/deliveries/batch-ship       批量发货
 */

export default function Deliveries() {
  const [data, setData] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // 筛选
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterCustomer, setFilterCustomer] = useState<number | null>(null);

  // 弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Delivery | null>(null);
  const [detail, setDetail] = useState<Delivery | null>(null);
  const [detailItems, setDetailItems] = useState<DeliveryItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ========== 数据加载 ==========

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/deliveries'),
      api.get('/orders').catch(() => ({ data: [] })),
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/customers').catch(() => ({ data: [] })),
    ])
      .then(([d, o, p, c]) => {
        setData(d.data || []);
        setOrders(o.data || []);
        setProducts(p.data || []);
        setCustomers(c.data || []);
      })
      .catch(() => message.error('加载发货单失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const orderMap = useMemo(
    () => Object.fromEntries(orders.map((o) => [o.id, o.order_no || `ID:${o.id}`])),
    [orders]
  );
  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name || c.contact || `ID:${c.id}`])),
    [customers]
  );
  const productMap = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p.name || p.code || `ID:${p.id}`])),
    [products]
  );

  const filtered = useMemo(() => data.filter((d) => {
    if (keyword) {
      const k = keyword.toLowerCase();
      const matchNo = (d.delivery_no || '').toLowerCase().includes(k);
      const matchPerson = (d.delivery_person || '').toLowerCase().includes(k);
      const matchAddr = (d.address || '').toLowerCase().includes(k);
      if (!matchNo && !matchPerson && !matchAddr) return false;
    }
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterCustomer && d.customer_id !== filterCustomer) return false;
    return true;
  }), [data, keyword, filterStatus, filterCustomer]);

  // ========== KPI 统计 ==========

  const kpi = useMemo(() => {
    const total = data.length;
    const pending = data.filter((d) => d.status === '待发货').length;
    const shipped = data.filter((d) => d.status === '已发货').length;
    const signed = data.filter((d) => d.status === '已签收').length;
    const signedRate = total > 0 ? Math.round((signed / total) * 100) : 0;
    return { total, pending, shipped, signed, signedRate };
  }, [data]);

  // ========== 详情 ==========

  const handleViewDetail = async (d: Delivery) => {
    setDetail(d);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      // 调详情接口（含 items）
      const res = await api.get(`/deliveries/${d.id}`);
      const items = res.data?.items || [];
      setDetailItems(items);
    } catch {
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // ========== 业务操作 ==========

  const handleShip = async (d: Delivery) => {
    let person = d.delivery_person || '';
    Modal.confirm({
      title: `发货确认 - ${d.delivery_no || `#${d.id}`}`,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>请输入送货人：</p>
          <Input
            placeholder="送货人姓名"
            defaultValue={person}
            onChange={(e) => { person = e.target.value; }}
          />
        </div>
      ),
      onOk: async () => {
        if (!person) {
          message.warning('请填写送货人');
          return Promise.reject();
        }
        try {
          await api.put(`/deliveries/${d.id}/ship`, {
            delivery_person: person,
            delivery_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
          });
          message.success('已发货');
          fetchAll();
        } catch (e: any) {
          message.error(e?.response?.data?.message || '发货失败');
        }
      },
    });
  };

  const handleSign = async (d: Delivery) => {
    let remark = '';
    Modal.confirm({
      title: `客户签收 - ${d.delivery_no || `#${d.id}`}`,
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>签收备注（选填）：</p>
          <Input.TextArea
            rows={2}
            placeholder="如：客户已签收 / 拒收原因"
            onChange={(e) => { remark = e.target.value; }}
          />
        </div>
      ),
      onOk: async () => {
        try {
          await api.post(`/deliveries/${d.id}/sign`, { remark });
          message.success('已签收');
          fetchAll();
        } catch (e: any) {
          message.error(e?.response?.data?.message || '签收失败');
        }
      },
    });
  };

  const handlePrint = (d: Delivery) => {
    const printUrl = `/api/print/delivery/${d.id}`;
    const w = window.open(printUrl, '_blank', 'width=900,height=700');
    if (!w) message.warning('请允许弹窗以查看打印');
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      message.warning('当前筛选无数据可导出');
      return;
    }
    const headers = ['发货单号', '关联订单', '客户', '送货人', '送货地址', '状态', '签收', '送货日期'];
    const rows = filtered.map((d) => [
      d.delivery_no || `#${d.id}`,
      orderMap[d.order_id] || d.order_id,
      customerMap[d.customer_id] || d.customer_id,
      d.delivery_person || '',
      d.address || '',
      d.status,
      d.signed === 1 ? '已签收' : '未签收',
      d.delivery_date || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `发货单-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条`);
  };

  const handleDelete = async (d: Delivery) => {
    try {
      await api.delete(`/deliveries/${d.id}`);
      message.success('已删除');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  // ========== 新建：从订单生成 ==========

  const handleCreate = () => {
    setCreateOpen(true);
  };

  const handleSaveCreate = async () => {
    try {
      const v = await createForm.validateFields();
      // 必须有 order_id 和 items
      if (!v.order_id) {
        message.error('请选择关联订单');
        return;
      }
      if (!v.items || v.items.length === 0) {
        message.error('请至少添加一项发货明细');
        return;
      }
      const payload = {
        order_id: Number(v.order_id),
        delivery_date: v.delivery_date ? v.delivery_date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        address: v.address || '',
        remark: v.remark || '',
        items: v.items.map((it: any) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity || 0),
        })),
      };
      await api.post('/deliveries/from-order', payload);
      message.success('发货单创建成功');
      setCreateOpen(false);
      createForm.resetFields();
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  // ========== 编辑 ==========

  const handleEdit = (d: Delivery) => {
    setEditing(d);
    editForm.setFieldsValue({
      ...d,
      delivery_date: d.delivery_date ? dayjs(d.delivery_date) : null,
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    try {
      const v = await editForm.validateFields();
      const payload = {
        ...v,
        delivery_date: v.delivery_date ? v.delivery_date.format('YYYY-MM-DD') : '',
      };
      await api.put(`/deliveries/${editing.id}`, payload);
      message.success('更新成功');
      setEditOpen(false);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '更新失败');
    }
  };

  // ========== 表格列定义 ==========

  const columns = [
    { title: '发货单号', dataIndex: 'delivery_no', key: 'delivery_no', width: 160, fixed: 'left' as const,
      render: (v: string | null, r: Delivery) => v ? v : <Tag color="orange">TMP#{r.id}</Tag> },
    { title: '关联订单', dataIndex: 'order_id', key: 'order_id', width: 150,
      render: (id: number) => orderMap[id] || `ID:${id}` },
    { title: '客户', dataIndex: 'customer_id', key: 'customer_id', width: 120,
      render: (id: number) => customerMap[id] || `ID:${id}` },
    { title: '送货人', dataIndex: 'delivery_person', key: 'delivery_person', width: 100,
      render: (v: string) => v || '-' },
    { title: '送货地址', dataIndex: 'address', key: 'address', width: 200, ellipsis: true,
      render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '签收', dataIndex: 'signed', key: 'signed', width: 80, align: 'center' as const,
      render: (v: number, r: Delivery) => v === 1
        ? <Tag color="green">已签收</Tag>
        : <Tag color="orange">未签收</Tag> },
    { title: '送货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110,
      render: (v: string) => v || '-' },
    { title: '送货时间', dataIndex: 'delivery_time', key: 'delivery_time', width: 150,
      render: (v: string) => v || '-' },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v: string) => (v || '').split('T')[0] || v || '-' },
    {
      title: '操作', key: 'action', width: 320, fixed: 'right' as const,
      render: (_: any, r: Delivery) => (
        <Space size={4} wrap>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === '待发货' && (
            <Button size="small" type="link" icon={<CarOutlined />} onClick={() => handleShip(r)}>发货</Button>
          )}
          {r.status === '已发货' && (
            <Button size="small" type="link" icon={<CheckCircleOutlined />} onClick={() => handleSign(r)}>签收</Button>
          )}
          <Button size="small" type="link" icon={<PrinterOutlined />} onClick={() => handlePrint(r)}>打印</Button>
          {r.status === '待发货' && (
            <>
              <Button size="small" type="link" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
              <Popconfirm title="确认删除？" okText="删除" cancelText="取消" onConfirm={() => handleDelete(r)}>
                <Button size="small" type="link" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ========== 渲染 ==========

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>发货管理</h2>
        <Space>
          <Input
            placeholder="搜索单号/送货人/地址"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 220 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 ({filtered.length})</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建发货单</Button>
        </Space>
      </div>

      {/* KPI 卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #2c5282' }}>
            <Statistic title="总发货单" value={kpi.total} valueStyle={{ color: '#2c5282' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="待发货" value={kpi.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #13c2c2' }}>
            <Statistic title="已发货" value={kpi.shipped} valueStyle={{ color: '#13c2c2' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic title="已签收" value={kpi.signed} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
            <Statistic
              title="签收率"
              value={kpi.signedRate}
              suffix="%"
              valueStyle={{ color: '#1677ff', fontSize: 18 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选条 */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>状态：</span>
        <Select
          allowClear
          placeholder="全部状态"
          value={filterStatus}
          onChange={setFilterStatus}
          style={{ width: 140 }}
          options={[
            { value: '待发货', label: '待发货' },
            { value: '已发货', label: '已发货' },
            { value: '已签收', label: '已签收' },
            { value: '已取消', label: '已取消' },
          ]}
        />
        <span>客户：</span>
        <Select
          allowClear
          showSearch
          placeholder="全部客户"
          value={filterCustomer}
          onChange={setFilterCustomer}
          style={{ width: 180 }}
          optionFilterProp="label"
          options={customers.map((c) => ({
            value: c.id,
            label: c.name || c.contact || `ID:${c.id}`,
          }))}
        />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); setFilterCustomer(null); }}>清除筛选</Button>
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
              resource="发货单"
              actionText="新建发货单"
              onAction={handleCreate}
              keyword={keyword}
              isDataEmpty={data.length === 0}
            />
          ),
        }}
      />

      {/* 新建发货单弹窗（从订单生成） */}
      <Modal
        title="新建发货单（从订单生成）"
        open={createOpen}
        onOk={handleSaveCreate}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        okText="生成发货单"
        cancelText="取消"
        width={840}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="order_id" label="关联订单" rules={[{ required: true, message: '请选择订单' }]}>
                <Select
                  showSearch
                  placeholder="选择订单（按订单号搜索）"
                  optionFilterProp="label"
                  options={orders.map((o) => ({
                    value: o.id,
                    label: `${o.order_no || `#${o.id}`} - ¥${Number(o.total_amount || 0).toFixed(2)}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="送货日期" initialValue={dayjs()}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="送货地址">
            <Input placeholder="如未填，默认使用订单客户的地址" />
          </Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>发货明细</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={8} key={key} align="top" style={{ marginBottom: 8 }}>
                    <Col span={12}>
                      <Form.Item {...restField} name={[name, 'product_id']} rules={[{ required: true, message: '请选择产品' }]} noStyle>
                        <Select
                          showSearch
                          placeholder="选择产品（按名称/编码搜索）"
                          optionFilterProp="label"
                          options={products.map((p) => ({
                            value: p.id,
                            label: `${p.code || ''} ${p.name || ''} (库存 ${p.stock_qty || 0})`.trim(),
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '请输入数量' }]} noStyle>
                        <InputNumber min={1} placeholder="数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Button danger size="small" onClick={() => remove(name)} block icon={<DeleteOutlined />}>
                        删除此行
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => add({ product_id: undefined, quantity: 1 })}
                >
                  + 添加产品
                </Button>
              </>
            )}
          </Form.List>

          <div style={{ marginTop: 16 }}>
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="选填" />
            </Form.Item>
          </div>

          <div style={{ background: '#f6f8fa', padding: 8, borderRadius: 4, fontSize: 12, color: '#64748b' }}>
            <ThunderboltOutlined style={{ color: '#faad14' }} /> 系统将自动从产品库存中扣减发货数量
          </div>
        </Form>
      </Modal>

      {/* 编辑弹窗 */}
      <Modal
        title={`编辑发货单 - ${editing?.delivery_no || `#${editing?.id}`}`}
        open={editOpen}
        onOk={handleSaveEdit}
        onCancel={() => { setEditOpen(false); setEditing(null); }}
        okText="保存"
        cancelText="取消"
        width={640}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="delivery_person" label="送货人">
                <Input placeholder="送货人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="送货日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="送货地址">
            <Input placeholder="送货地址" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={`发货单详情 - ${detail?.delivery_no || `#${detail?.id}`}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => detail && handlePrint(detail)}>打印</Button>,
          <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>,
        ]}
        width={840}
      >
        {detail && (
          <>
            <Row gutter={[16, 8]}>
              <Col span={8}><b>发货单号：</b>{detail.delivery_no || `#${detail.id}`}</Col>
              <Col span={8}><b>关联订单：</b>{orderMap[detail.order_id] || `ID:${detail.order_id}`}</Col>
              <Col span={8}><b>客户：</b>{customerMap[detail.customer_id] || `ID:${detail.customer_id}`}</Col>
              <Col span={8}><b>状态：</b><Tag color={getStatusColor(detail.status)}>{detail.status}</Tag></Col>
              <Col span={8}><b>签收：</b>{detail.signed === 1
                ? <Tag color="green">已签收 {detail.signed_at || ''}</Tag>
                : <Tag color="orange">未签收</Tag>}</Col>
              <Col span={8}><b>送货人：</b>{detail.delivery_person || '-'}</Col>
              <Col span={16}><b>送货地址：</b>{detail.address || '-'}</Col>
              <Col span={8}><b>送货时间：</b>{detail.delivery_time || '-'}</Col>
              <Col span={8}><b>送货日期：</b>{detail.delivery_date || '-'}</Col>
              <Col span={8}><b>创建日期：</b>{(detail.created_at || '').split('T')[0]}</Col>
              <Col span={24}><b>备注：</b>{detail.remark || '-'}</Col>
            </Row>
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>发货明细</Divider>
            <Table
              size="small"
              rowKey="id"
              loading={detailLoading}
              dataSource={detailItems}
              pagination={false}
              columns={[
                { title: '产品', dataIndex: 'product_id', width: 250, render: (id: number) => productMap[id] || `ID:${id}` },
                { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: '单价', dataIndex: 'unit_price', width: 100, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
                { title: '小计', key: 'subtotal', width: 120, align: 'right' as const, render: (_: any, r: DeliveryItem) => <b>¥{(Number(r.quantity || 0) * Number(r.unit_price || 0)).toFixed(2)}</b> },
                { title: '备注', dataIndex: 'remark', ellipsis: true },
              ]}
              summary={(items) => {
                const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                const totalAmt = items.reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0}>合计（{items.length} 项）</Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">{totalQty}</Table.Summary.Cell>
                      <Table.Summary.Cell index={2} />
                      <Table.Summary.Cell index={3} align="right"><span style={{ color: '#cf1322' }}>¥{totalAmt.toFixed(2)}</span></Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                    </Table.Summary.Row>
                  </Table.Summary>
                );
              }}
            />
          </>
        )}
      </Modal>
    </div>
  );
}
