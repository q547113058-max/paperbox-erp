import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber,
  Select, DatePicker, Row, Col, Divider, Card, Statistic, Tooltip, Dropdown,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckOutlined, InboxOutlined,
  PrinterOutlined, DownloadOutlined, StopOutlined, EditOutlined,
  DeleteOutlined, SearchOutlined, ReloadOutlined, MoreOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Purchase, PurchaseItem, Supplier } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

/**
 * 采购管理（P0 业务页）
 *
 * 业务闭环：
 *   1. 新建采购单（待审批）
 *   2. 审批（→ 已审批 / 已驳回）
 *   3. 入库（→ 已入库；写车间库存 + 库存流水）
 *   4. 打印（→ 触发 generate-no 替换 TMP 单号为正式 PO）
 *   5. 取消（任何未入库前可取消）
 *
 * 后端端点（11 个）：
 *   GET    /api/purchases                  列表
 *   GET    /api/purchases/:id              详情
 *   GET    /api/purchases/:id/items        明细
 *   POST   /api/purchases                  创建（含 items）
 *   PUT    /api/purchases/:id              更新
 *   DELETE /api/purchases/:id              删除
 *   POST   /api/purchases/:id/approve      审批
 *   POST   /api/purchases/:id/receive      入库
 *   POST   /api/purchases/:id/cancel       取消
 *   POST   /api/purchases/:id/generate-no  生成正式单号
 *   POST   /api/purchases/:id/update-no    更新单号
 *   GET    /api/purchases/by-no/:no        按单号查
 */

const STATUS_OPTIONS = ['待审批', '已审批', '已驳回', '已入库', '已取消', '已出单'];

const PAPER_TYPE_OPTIONS = [
  { value: '面纸', label: '面纸' },
  { value: '坑纸', label: '坑纸' },
  { value: '里纸', label: '里纸' },
  { value: '白板纸', label: '白板纸' },
  { value: '牛卡', label: '牛卡' },
];

export default function Purchases() {
  const [data, setData] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);

  // 筛选
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSupplier, setFilterSupplier] = useState<number | null>(null);

  // 弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [detail, setDetail] = useState<Purchase | null>(null);
  const [detailItems, setDetailItems] = useState<PurchaseItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // ========== 数据加载 ==========

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.get('/purchases'), api.get('/suppliers').catch(() => ({ data: [] }))])
      .then(([p, s]) => {
        setData(p.data || []);
        setSuppliers(s.data || []);
      })
      .catch(() => message.error('加载采购单失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map((s) => [s.id, s.name || s.contact || `ID:${s.id}`])),
    [suppliers]
  );

  const filtered = useMemo(() => data.filter((p) => {
    if (keyword) {
      const k = keyword.toLowerCase();
      const matchNo = (p.purchase_no || '').toLowerCase().includes(k);
      const matchRemark = (p.remark || '').toLowerCase().includes(k);
      if (!matchNo && !matchRemark) return false;
    }
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterSupplier && p.supplier_id !== filterSupplier) return false;
    return true;
  }), [data, keyword, filterStatus, filterSupplier]);

  // ========== KPI 统计 ==========

  const kpi = useMemo(() => {
    const total = data.length;
    const pending = data.filter((p) => p.status === '待审批').length;
    const approved = data.filter((p) => p.status === '已审批').length;
    const received = data.filter((p) => p.status === '已入库').length;
    const totalAmount = data
      .filter((p) => p.status !== '已取消')
      .reduce((s, p) => s + Number(p.total_amount || 0), 0);
    return { total, pending, approved, received, totalAmount };
  }, [data]);

  // ========== CRUD 操作 ==========

  const handleCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      status: '待审批',
      items: [{ material_name: '', spec: '', quantity: 1, unit_price: 0, unit: '张', paper_type: '面纸' }],
    });
    setCreateOpen(true);
  };

  const handleSaveCreate = async () => {
    try {
      const v = await createForm.validateFields();
      // 计算总金额 = 各项 amount 之和
      const items = (v.items || []).map((it: any) => ({
        ...it,
        amount: Number(it.quantity || 0) * Number(it.unit_price || 0),
      }));
      const total = items.reduce((s: number, it: any) => s + Number(it.amount || 0), 0);
      const payload = {
        ...v,
        items,
        total_amount: total,
        delivery_date: v.delivery_date ? v.delivery_date.format('YYYY-MM-DD') : '',
      };
      await api.post('/purchases', payload);
      message.success('采购单创建成功');
      setCreateOpen(false);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return; // 校验失败，不报错
      message.error(e?.response?.data?.message || '创建失败');
    }
  };

  const handleEdit = (p: Purchase) => {
    setEditing(p);
    editForm.setFieldsValue({
      ...p,
      delivery_date: p.delivery_date ? dayjs(p.delivery_date) : null,
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
      await api.put(`/purchases/${editing.id}`, payload);
      message.success('更新成功');
      setEditOpen(false);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '更新失败');
    }
  };

  const handleDelete = async (p: Purchase) => {
    try {
      await api.delete(`/purchases/${p.id}`);
      message.success('已删除');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  // ========== 业务操作 ==========

  const handleViewDetail = async (p: Purchase) => {
    setDetail(p);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const items = await api.get(`/purchases/${p.id}/items`);
      setDetailItems(items.data || []);
    } catch {
      setDetailItems([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async (p: Purchase, approved: boolean) => {
    let reason = '';
    if (!approved) {
      const result = await new Promise<string>((resolve) => {
        let val = '';
        Modal.confirm({
          title: `驳回采购单 - ${p.purchase_no || p.id}`,
          content: (
            <Input
              placeholder="驳回原因（必填）"
              onChange={(e) => { val = e.target.value; }}
            />
          ),
          onOk: () => resolve(val),
        });
      });
      reason = result;
      if (!reason) {
        message.warning('请填写驳回原因');
        return;
      }
    }
    try {
      await api.post(`/purchases/${p.id}/approve`, { approved, reason });
      message.success(approved ? '已审批' : '已驳回');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '操作失败');
    }
  };

  const handleReceive = async (p: Purchase) => {
    try {
      const res = await api.post(`/purchases/${p.id}/receive`, {});
      const invCount = res.data?.inventories?.length || 0;
      message.success(`已入库（写入 ${invCount} 条车间库存）`);
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '入库失败');
    }
  };

  const handlePrint = async (p: Purchase) => {
    try {
      // 打印前生成正式单号
      if (!p.purchase_no || p.purchase_no.startsWith('TMP')) {
        const res = await api.post(`/purchases/${p.id}/generate-no`, {});
        message.success(`已生成单号：${res.data?.purchase_no}`);
      }
      // 跳打印页面（用打印服务或新窗口）
      const printUrl = `/api/print/purchase/${p.id}`;
      const w = window.open(printUrl, '_blank', 'width=900,height=700');
      if (!w) message.warning('请允许弹窗以查看打印');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '打印失败');
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      message.warning('当前筛选无数据可导出');
      return;
    }
    const headers = ['采购单号', '供应商', '总金额', '状态', '交货日期', '备注', '创建日期'];
    const rows = filtered.map((p) => [
      p.purchase_no || `TMP-${p.id}`,
      supplierMap[p.supplier_id] || p.supplier_id,
      Number(p.total_amount || 0).toFixed(2),
      p.status,
      p.delivery_date || '',
      (p.remark || '').replace(/[\n,"]/g, ' '),
      (p.created_at || '').split('T')[0],
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `采购单-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条`);
  };

  const handleCancel = async (p: Purchase) => {
    let reason = '';
    const result = await new Promise<string>((resolve) => {
      let val = '';
      Modal.confirm({
        title: `取消采购单 - ${p.purchase_no || p.id}`,
        content: (
          <Input placeholder="取消原因（必填）" onChange={(e) => { val = e.target.value; }} />
        ),
        onOk: () => resolve(val),
      });
    });
    reason = result;
    if (!reason) {
      message.warning('请填写取消原因');
      return;
    }
    try {
      await api.post(`/purchases/${p.id}/cancel`, { reason });
      message.success('已取消');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '取消失败');
    }
  };

  // ========== 表格列定义 ==========

  const columns = [
    { title: '采购单号', dataIndex: 'purchase_no', key: 'purchase_no', width: 190, fixed: 'left' as const,
      render: (v: string | null, r: Purchase) => v ? <Tooltip title={v}><span style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{v}</span></Tooltip> : <Tag color="orange">TMP-{r.id}</Tag> },
    { title: '供应商', dataIndex: 'supplier_id', key: 'supplier_id', width: 130,
      render: (id: number) => supplierMap[id] || `ID:${id}` },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', width: 110, align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: Number(v) > 0 ? '#cf1322' : undefined }}>¥{Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '交货日期', dataIndex: 'delivery_date', key: 'delivery_date', width: 110,
      render: (v: string) => v || '-' },
    { title: '关联', key: 'ref', width: 110,
      render: (_: any, r: Purchase) => r.ref_type ? `${r.ref_type}#${r.ref_id}` : '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', width: 200, ellipsis: true },
    { title: '创建日期', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v: string) => (v || '').split('T')[0] || v || '-' },
    {
      title: '操作', key: 'action', width: 210, fixed: 'right' as const,
      render: (_: any, r: Purchase) => {
        const moreItems = [
          ...(r.status !== '已入库' && r.status !== '已取消' ? [{ key: 'edit', label: '编辑', icon: <EditOutlined /> }] : []),
          { key: 'print', label: '打印', icon: <PrinterOutlined /> },
          ...(r.status === '待审批' ? [{ key: 'reject', label: '驳回', danger: true }] : []),
          ...(r.status === '待审批' ? [{ key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true }] : []),
          ...(r.status !== '已入库' && r.status !== '已取消' ? [{ key: 'cancel', label: '取消', icon: <StopOutlined />, danger: true }] : []),
        ];
        return (
          <Space size={4}>
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
            {r.status === '待审批' && (
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => Modal.confirm({ title: '确认审批通过？', content: `采购单 ${r.purchase_no || `#${r.id}`} 将变为已审批`, okText: '通过', cancelText: '取消', onOk: () => handleApprove(r, true) })}>审批</Button>
            )}
            {(r.status === '待审批' || r.status === '已审批') && (
              <Button size="small" type="link" icon={<InboxOutlined />} onClick={() => Modal.confirm({ title: '确认入库？', content: `采购单 ${r.purchase_no || `#${r.id}`} 将标记为已入库并写入车间库存`, okText: '入库', cancelText: '取消', onOk: () => handleReceive(r) })}>入库</Button>
            )}
            {moreItems.length > 0 && (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: moreItems,
                  onClick: ({ key }) => {
                    if (key === 'edit') handleEdit(r);
                    if (key === 'print') handlePrint(r);
                    if (key === 'reject') handleApprove(r, false);
                    if (key === 'cancel') handleCancel(r);
                    if (key === 'delete') {
                      Modal.confirm({ title: '确认删除？', okText: '删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => handleDelete(r) });
                    }
                  },
                }}
              >
                <Button size="small" type="link" icon={<MoreOutlined />}>更多</Button>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  // ========== 渲染 ==========

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>采购管理</h2>
        <Space>
          <Input
            placeholder="搜索单号/备注"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 ({filtered.length})</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建采购单</Button>
        </Space>
      </div>

      {/* KPI 卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #2c5282' }}>
            <Statistic title="总采购单" value={kpi.total} valueStyle={{ color: '#2c5282' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="待审批" value={kpi.pending} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
            <Statistic title="已审批" value={kpi.approved} valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={5}>
          <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic title="已入库" value={kpi.received} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small" style={{ borderTop: '3px solid #cf1322' }}>
            <Statistic
              title="总金额（元）"
              value={kpi.totalAmount}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#cf1322', fontSize: 18 }}
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
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
        <span>供应商：</span>
        <Select
          allowClear
          showSearch
          placeholder="全部供应商"
          value={filterSupplier}
          onChange={setFilterSupplier}
          style={{ width: 180 }}
          optionFilterProp="label"
          options={suppliers.map((s) => ({
            value: s.id,
            label: s.name || s.contact || `ID:${s.id}`,
          }))}
        />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); setFilterSupplier(null); }}>清除筛选</Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1400 }}
        locale={{
          emptyText: (
            <TableEmptyCell
              resource="采购单"
              actionText="新建采购单"
              onAction={handleCreate}
              keyword={keyword}
              isDataEmpty={data.length === 0}
            />
          ),
        }}
      />

      {/* 新建采购单弹窗 */}
      <Modal
        title="新建采购单"
        open={createOpen}
        onOk={handleSaveCreate}
        onCancel={() => setCreateOpen(false)}
        okText="保存"
        cancelText="取消"
        width={840}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
                <Select
                  showSearch
                  placeholder="选择供应商"
                  optionFilterProp="label"
                  options={suppliers.map((s) => ({ value: s.id, label: s.name || s.contact || `ID:${s.id}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="delivery_date" label="交货日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="初始状态" initialValue="待审批">
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="选填" />
          </Form.Item>

          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>采购明细</Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={8} key={key} align="top" style={{ marginBottom: 8 }}>
                    <Col span={6}>
                      <Form.Item {...restField} name={[name, 'material_name']} rules={[{ required: true, message: '物料名' }]} noStyle>
                        <Input placeholder="物料名称" />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item {...restField} name={[name, 'spec']} noStyle>
                        <Input placeholder="规格" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item {...restField} name={[name, 'paper_type']} noStyle>
                        <Select placeholder="纸类型" options={PAPER_TYPE_OPTIONS} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: '数量' }]} noStyle>
                        <InputNumber min={0} placeholder="数量" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item {...restField} name={[name, 'unit']} noStyle>
                        <Input placeholder="单位" />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item {...restField} name={[name, 'unit_price']} noStyle>
                        <InputNumber min={0} step={0.01} placeholder="单价" style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Button danger size="small" onClick={() => remove(name)} block>删除此行</Button>
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add({ material_name: '', spec: '', quantity: 1, unit_price: 0, unit: '张', paper_type: '面纸' })}>
                  + 添加物料
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>

      {/* 编辑采购单弹窗 */}
      <Modal
        title={`编辑采购单 - ${editing?.purchase_no || editing?.id}`}
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
              <Form.Item name="supplier_id" label="供应商" rules={[{ required: true }]}>
                <Select
                  showSearch
                  placeholder="选择供应商"
                  optionFilterProp="label"
                  options={suppliers.map((s) => ({ value: s.id, label: s.name || s.contact || `ID:${s.id}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="total_amount" label="总金额">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="delivery_date" label="交货日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情弹窗 */}
      <Modal
        title={`采购单详情 - ${detail?.purchase_no || `TMP-${detail?.id}`}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>]}
        width={840}
      >
        {detail && (
          <>
            <Row gutter={[16, 8]}>
              <Col span={8}><b>采购单号：</b>{detail.purchase_no || `TMP-${detail.id}`}</Col>
              <Col span={8}><b>供应商：</b>{supplierMap[detail.supplier_id] || `ID:${detail.supplier_id}`}</Col>
              <Col span={8}><b>状态：</b><Tag color={getStatusColor(detail.status)}>{detail.status}</Tag></Col>
              <Col span={8}><b>总金额：</b>¥{Number(detail.total_amount || 0).toFixed(2)}</Col>
              <Col span={8}><b>交货日期：</b>{detail.delivery_date || '-'}</Col>
              <Col span={8}><b>关联：</b>{detail.ref_type ? `${detail.ref_type}#${detail.ref_id}` : '-'}</Col>
              <Col span={8}><b>创建日期：</b>{(detail.created_at || '').split('T')[0]}</Col>
              <Col span={16}><b>备注：</b>{detail.remark || '-'}</Col>
            </Row>
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>采购明细</Divider>
            <Table
              size="small"
              rowKey="id"
              loading={detailLoading}
              dataSource={detailItems}
              pagination={false}
              columns={[
                { title: '物料', dataIndex: 'material_name', width: 180 },
                { title: '规格', dataIndex: 'spec', width: 100 },
                { title: '纸类型', dataIndex: 'paper_type', width: 80 },
                { title: '数量', dataIndex: 'quantity', width: 70, align: 'right' as const },
                { title: '单位', dataIndex: 'unit', width: 60 },
                { title: '单价', dataIndex: 'unit_price', width: 80, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
                { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const, render: (v: number) => <b style={{ color: '#cf1322' }}>¥{Number(v || 0).toFixed(2)}</b> },
                { title: '关联', dataIndex: 'ref_info', ellipsis: true },
              ]}
              summary={(items) => {
                const totalQty = items.reduce((s, i) => s + Number(i.quantity || 0), 0);
                const totalAmt = items.reduce((s, i) => s + Number(i.amount || 0), 0);
                return (
                  <Table.Summary fixed>
                    <Table.Summary.Row style={{ background: '#fafafa', fontWeight: 600 }}>
                      <Table.Summary.Cell index={0} colSpan={3}>合计（{items.length} 项）</Table.Summary.Cell>
                      <Table.Summary.Cell index={3} align="right">{totalQty}</Table.Summary.Cell>
                      <Table.Summary.Cell index={4} />
                      <Table.Summary.Cell index={5} />
                      <Table.Summary.Cell index={6} align="right">¥{totalAmt.toFixed(2)}</Table.Summary.Cell>
                      <Table.Summary.Cell index={7} />
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
