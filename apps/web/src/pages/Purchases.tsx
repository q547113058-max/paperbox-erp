import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form,
  Select, DatePicker, InputNumber, Popconfirm,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, DownloadOutlined, EyeOutlined, CheckOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Purchase, Supplier } from '../types/api';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

const STATUS_OPTIONS = ['待审批', '已审批', '已驳回', '已入库', '已取消', '已出单'];

interface PurchaseItemRow {
  key: string;
  material_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount: number;
  paper_type: string;
  unit: string;
  ref_info: string;
  delivery_address: string;
}

export default function Purchases() {
  const [data, setData] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // 弹窗
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [headerForm] = Form.useForm();

  // 明细
  const [items, setItems] = useState<PurchaseItemRow[]>([]);
  const [searchMaterial, setSearchMaterial] = useState('');
  const [addSpec, setAddSpec] = useState('');
  const [addQty, setAddQty] = useState<number>(1);
  const [addPrice, setAddPrice] = useState<number>(0);
  const [addAmount, setAddAmount] = useState<number>(0);
  const [addPaperType, setAddPaperType] = useState('');
  const [addUnit, setAddUnit] = useState('');

  // 详情
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/purchases'),
      api.get('/suppliers').catch(() => ({ data: [] })),
      api.get('/materials').catch(() => ({ data: [] })),
    ]).then(([p, s, m]) => {
      setData(p.data || []);
      setSuppliers(s.data || []);
      setMaterials(m.data || []);
    }).catch(() => message.error('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const supplierMap = useMemo(() =>
    Object.fromEntries(suppliers.map(s => [s.id, s.name || s.contact || `ID:${s.id}`])),
  [suppliers]);

  const filtered = useMemo(() => data.filter(p => {
    if (keyword) {
      const k = keyword.toLowerCase();
      if (!(p.purchase_no || '').toLowerCase().includes(k) &&
          !(p.remark || '').toLowerCase().includes(k)) return false;
    }
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  }), [data, keyword, filterStatus]);

  const kpi = useMemo(() => ({
    total: data.length,
    pending: data.filter(p => p.status === '待审批').length,
    approved: data.filter(p => p.status === '已审批').length,
    received: data.filter(p => p.status === '已入库').length,
    totalAmount: data.filter(p => p.status !== '已取消').reduce((s, p) => s + Number(p.total_amount || 0), 0),
  }), [data]);

  // 材料选项
  const materialOptions = useMemo(() =>
    materials.map((m: any) => ({
      value: m.name || '',
      label: `${m.name || ''} ${m.spec || ''} ${m.material_type || ''}`.trim(),
    })), [materials]);

  // ---- 明细操作 ----
  const handleAddItem = () => {
    if (!searchMaterial) { message.warning('请输入材料名称'); return; }
    const newItem: PurchaseItemRow = {
      key: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      material_name: searchMaterial,
      spec: addSpec,
      quantity: addQty || 1,
      unit_price: addPrice || 0,
      amount: addAmount || (addQty || 1) * (addPrice || 0),
      paper_type: addPaperType,
      unit: addUnit,
      ref_info: '',
      delivery_address: '',
    };
    setItems(prev => [...prev, newItem]);
    setSearchMaterial('');
    setAddSpec('');
    setAddQty(1);
    setAddPrice(0);
    setAddAmount(0);
    setAddPaperType('');
    setAddUnit('');
  };

  const handleRemoveItem = (key: string) => setItems(prev => prev.filter(it => it.key !== key));

  const totalAmount = useMemo(() =>
    items.reduce((s, it) => s + (it.amount || it.quantity * (it.unit_price || 0)), 0),
  [items]);

  // ---- 弹窗 ----
  const openCreate = () => {
    setEditingId(null);
    headerForm.resetFields();
    headerForm.setFieldsValue({ status: '待审批' });
    setItems([]);
    setModalOpen(true);
  };

  const openEdit = async (p: Purchase) => {
    setEditingId(p.id);
    setModalOpen(true);
    headerForm.setFieldsValue({
      supplier_id: p.supplier_id,
      delivery_date: p.delivery_date ? dayjs(p.delivery_date) : null,
      remark: p.remark || '',
    });
    try {
      const res = await api.get(`/purchases/${p.id}/items`);
      const exItems: PurchaseItemRow[] = (res.data || []).map((it: any, idx: number) => ({
        key: `edit_${it.id || idx}`,
        material_name: it.material_name || '',
        spec: it.spec || '',
        quantity: it.quantity || 0,
        unit_price: it.unit_price || 0,
        amount: it.amount || 0,
        paper_type: it.paper_type || '',
        unit: it.unit || '',
        ref_info: it.ref_info || '',
        delivery_address: it.delivery_address || '',
      }));
      setItems(exItems);
    } catch { setItems([]); }
  };

  const handleSave = async () => {
    try {
      const values = await headerForm.validateFields();
      const payload = {
        supplier_id: values.supplier_id,
        delivery_date: values.delivery_date?.format?.('YYYY-MM-DD') || values.delivery_date,
        remark: values.remark || '',
        status: '待审批',
        total_amount: totalAmount,
        items: items.map(it => ({
          material_name: it.material_name,
          spec: it.spec,
          quantity: it.quantity,
          unit_price: it.unit_price,
          amount: it.amount || it.quantity * it.unit_price,
          paper_type: it.paper_type,
          unit: it.unit,
          ref_info: it.ref_info,
          delivery_address: it.delivery_address,
        })),
      };

      if (editingId) {
        // 更新头部
        await api.put(`/purchases/${editingId}`, {
          supplier_id: values.supplier_id,
          delivery_date: values.delivery_date?.format?.('YYYY-MM-DD') || values.delivery_date,
          remark: values.remark || '',
          total_amount: totalAmount,
        });
        message.success('采购单已更新');
      } else {
        await api.post('/purchases', payload);
        message.success('采购单已创建');
      }
      setModalOpen(false);
      fetchAll();
    } catch (e: any) {
      if (!e.errorFields) message.error(e?.response?.data?.message || '保存失败');
    }
  };

  const openDetail = async (p: Purchase) => {
    try {
      const res = await api.get(`/purchases/${p.id}/items`);
      setDetailData({ ...p, items: res.data || [] });
      setDetailOpen(true);
    } catch { message.error('加载明细失败'); }
  };

  const handleDelete = async (p: Purchase) => {
    try { await api.delete(`/purchases/${p.id}`); message.success('已删除'); fetchAll(); }
    catch (e: any) { message.error(e?.response?.data?.message || '删除失败'); }
  };

  const handleApprove = async (p: Purchase) => {
    try { await api.post(`/purchases/${p.id}/approve`, { approved: true }); message.success('已审批'); fetchAll(); }
    catch (e: any) { message.error(e?.response?.data?.message || '审批失败'); }
  };

  const handleReceive = async (p: Purchase) => {
    try { await api.post(`/purchases/${p.id}/receive`, {}); message.success('已入库'); fetchAll(); }
    catch (e: any) { message.error(e?.response?.data?.message || '入库失败'); }
  };

  const handleCancel = async (p: Purchase) => {
    Modal.confirm({
      title: `取消采购单 - ${p.purchase_no || p.id}`,
      content: <Input id="cancel-reason" placeholder="取消原因（必填）" />,
      onOk: async () => {
        const reason = (document.getElementById('cancel-reason') as HTMLInputElement)?.value;
        if (!reason) { message.warning('请填写取消原因'); return Promise.reject(); }
        try { await api.post(`/purchases/${p.id}/cancel`, { reason }); message.success('已取消'); fetchAll(); }
        catch (e: any) { message.error(e?.response?.data?.message || '取消失败'); }
      },
    });
  };

  const handleExport = () => {
    if (!filtered.length) { message.warning('无数据'); return; }
    const headers = ['采购单号', '供应商', '金额', '状态', '交货日期', '创建日期'];
    const rows = filtered.map(p => [
      p.purchase_no || `TMP-${p.id}`, supplierMap[p.supplier_id] || '',
      p.total_amount, p.status, p.delivery_date || '', (p.created_at || '').split('T')[0],
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `采购单-${dayjs().format('YYYYMMDD-HHmm')}.csv`; a.click();
  };

  // 表格列
  const columns = [
    {
      title: '采购单号', dataIndex: 'purchase_no', width: 160, fixed: 'left' as const,
      render: (v: string | null, r: Purchase) => v
        ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
        : <Tag color="orange" style={{ margin: 0 }}>TMP-{r.id}</Tag>,
    },
    { title: '供应商', dataIndex: 'supplier_id', width: 130, render: (id: number) => supplierMap[id] || '-' },
    {
      title: '金额', dataIndex: 'total_amount', width: 100, align: 'right' as const,
      render: (v: number) => <span style={{ fontWeight: 600, color: v > 0 ? '#dc2626' : '#94a3b8' }}>¥{Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>,
    },
    { title: '状态', dataIndex: 'status', width: 80, align: 'center' as const, render: (s: string) => <Tag color={getStatusColor(s)}>{s}</Tag> },
    { title: '交货日期', dataIndex: 'delivery_date', width: 100, render: (v: string) => v || '-' },
    { title: '创建日期', dataIndex: 'created_at', width: 100, render: (v: string) => (v || '').split('T')[0] || '-' },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right' as const,
      render: (_: any, r: Purchase) => (
        <Space size={2}>
          <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>明细</Button>
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          {r.status === '待审批' && (
            <Popconfirm title="确认审批通过？" onConfirm={() => handleApprove(r)}>
              <Button size="small" type="link" icon={<CheckOutlined />}>审批</Button>
            </Popconfirm>
          )}
          {(r.status === '待审批' || r.status === '已审批') && (
            <Popconfirm title="确认入库？" onConfirm={() => handleReceive(r)}>
              <Button size="small" type="link" icon={<InboxOutlined />}>入库</Button>
            </Popconfirm>
          )}
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r)}>
            <Button size="small" type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 明细列
  const itemColumns = [
    { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
    { title: '材料名称', dataIndex: 'material_name', width: 120 },
    { title: '规格', dataIndex: 'spec', width: 100, render: (v: string) => v || '-' },
    {
      title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const,
      render: (v: number, r: PurchaseItemRow) => (
        <InputNumber size="small" min={0} value={v} style={{ width: 70 }}
          onChange={val => {
            const q = val || 0;
            setItems(prev => prev.map(it => it.key === r.key ? { ...it, quantity: q, amount: q * (it.unit_price || 0) } : it));
          }} />
      ),
    },
    {
      title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const,
      render: (v: number, r: PurchaseItemRow) => (
        <InputNumber size="small" min={0} step={0.01} value={v} style={{ width: 85 }}
          onChange={val => {
            const up = val || 0;
            setItems(prev => prev.map(it => it.key === r.key ? { ...it, unit_price: up, amount: it.quantity * up } : it));
          }} />
      ),
    },
    { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const,
      render: (_: number, r: PurchaseItemRow) =>
        <span style={{ fontWeight: 600, color: '#dc2626' }}>¥{(r.amount || r.quantity * (r.unit_price || 0)).toFixed(2)}</span> },
    { title: '纸板类型', dataIndex: 'paper_type', width: 90, render: (v: string) => v || '-' },
    { title: '单位', dataIndex: 'unit', width: 60, render: (v: string) => v || '-' },
    {
      title: '操作', width: 60, render: (_: any, r: PurchaseItemRow) => (
        <Button size="small" type="link" danger onClick={() => handleRemoveItem(r.key)}>删除</Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, background: '#fff', padding: '10px 16px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
        <h2 style={{ margin: 0, fontSize: 18, color: '#1e40af' }}>采购单</h2>
        <Space>
          <Input placeholder="搜索单号" value={keyword} onChange={e => setKeyword(e.target.value)}
            style={{ width: 180 }} allowClear prefix={<SearchOutlined />} size="small" />
          <Button size="small" icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>新增采购单</Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '6px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 4, flexWrap: 'wrap', fontSize: 13 }}>
        <span>总计 <b style={{ color: '#1e40af' }}>{kpi.total}</b> 单</span>
        <span style={{ color: '#d97706' }}>待审批 <b>{kpi.pending}</b></span>
        <span style={{ color: '#2563eb' }}>已审批 <b>{kpi.approved}</b></span>
        <span style={{ color: '#16a34a' }}>已入库 <b>{kpi.received}</b></span>
        <span style={{ marginLeft: 'auto', fontWeight: 600 }}>
          总金额 <b style={{ color: '#dc2626', fontSize: 16 }}>¥{kpi.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</b>
        </span>
      </div>

      <div style={{ marginBottom: 10, display: 'flex', gap: 8, fontSize: 12 }}>
        <Select allowClear placeholder="状态" value={filterStatus} onChange={setFilterStatus}
          style={{ width: 110 }} size="small"
          options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); }}>清除</Button>
      </div>

      <Table rowKey="id" size="small" loading={loading} columns={columns} dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条`, size: 'small' }}
        scroll={{ x: 1100 }}
        locale={{ emptyText: <TableEmptyCell resource="采购单" actionText="新增采购单" onAction={openCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }} />

      {/* ====== 创建/编辑弹窗 ====== */}
      <Modal title={editingId ? `编辑采购单 #${editingId}` : '新增采购单'} open={modalOpen}
        onCancel={() => setModalOpen(false)} width={1100} footer={null} destroyOnClose>
        <div style={{ background: '#f0f5ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
          <Form form={headerForm} layout="inline" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Form.Item name="supplier_id" label="供应商" rules={[{ required: true, message: '请选择供应商' }]}>
              <Select showSearch placeholder="选择供应商" style={{ width: 180 }} optionFilterProp="label"
                options={suppliers.map(s => ({ value: s.id, label: s.name || s.contact || `ID:${s.id}` }))} />
            </Form.Item>
            <Form.Item name="delivery_date" label="交货日期">
              <DatePicker style={{ width: 130 }} />
            </Form.Item>
            <Form.Item name="remark" label="备注">
              <Input style={{ width: 250 }} placeholder="备注" />
            </Form.Item>
          </Form>
        </div>

        {/* 操作条 */}
        <div style={{ background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 6, padding: '8px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0050b3', whiteSpace: 'nowrap' }}>添加材料明细</span>
          <Select showSearch value={searchMaterial || undefined} onChange={v => setSearchMaterial(v || '')}
            placeholder="搜索/输入材料名称" style={{ minWidth: 220 }} optionFilterProp="label"
            options={materialOptions} allowClear
            onSearch={v => setSearchMaterial(v)}
            onSelect={v => setSearchMaterial(v)}
          />
          <Input placeholder="规格" value={addSpec} onChange={e => setAddSpec(e.target.value)} style={{ width: 100 }} />
          <InputNumber min={1} value={addQty} onChange={v => setAddQty(v || 1)} style={{ width: 80 }} placeholder="数量" />
          <InputNumber min={0} step={0.01} value={addPrice} onChange={v => setAddPrice(v || 0)} style={{ width: 90 }} placeholder="单价" />
          <InputNumber min={0} step={0.01} value={addAmount} onChange={v => setAddAmount(v || 0)} style={{ width: 90 }} placeholder="金额" />
          <Input placeholder="纸板类型" value={addPaperType} onChange={e => setAddPaperType(e.target.value)} style={{ width: 90 }} />
          <Input placeholder="单位" value={addUnit} onChange={e => setAddUnit(e.target.value)} style={{ width: 60 }} />
          <Button type="primary" onClick={handleAddItem} icon={<PlusOutlined />}>添加</Button>
        </div>

        <Table rowKey="key" size="small" columns={itemColumns} dataSource={items} pagination={false}
          scroll={{ y: 300 }}
          locale={{ emptyText: '暂无明细，请在上方搜索材料后添加' }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}><b style={{ fontSize: 14 }}>合计</b></Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right"><b>{items.reduce((s, it) => s + it.quantity, 0)}</b></Table.Summary.Cell>
              <Table.Summary.Cell index={4} colSpan={2}>
                <b style={{ fontSize: 15, color: '#dc2626' }}>¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} colSpan={3} />
            </Table.Summary.Row>
          )} />

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>{editingId ? '保存修改' : '创建采购单'}</Button>
          </Space>
        </div>
      </Modal>

      {/* ====== 详情弹窗 ====== */}
      <Modal title={detailData ? `采购单详情 - ${detailData.purchase_no || `#${detailData.id}`}` : '详情'}
        open={detailOpen} onCancel={() => setDetailOpen(false)} width={1000} footer={null}>
        {detailData && (
          <div>
            <div style={{ display: 'flex', gap: 24, marginBottom: 16, fontSize: 13, flexWrap: 'wrap' }}>
              <div><b>单号：</b>{detailData.purchase_no || `TMP-${detailData.id}`}</div>
              <div><b>状态：</b><Tag color={getStatusColor(detailData.status)}>{detailData.status}</Tag></div>
              <div><b>金额：</b><span style={{ color: '#dc2626', fontWeight: 600 }}>¥{Number(detailData.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span></div>
              <div><b>交货日期：</b>{detailData.delivery_date || '-'}</div>
              <div><b>备注：</b>{detailData.remark || '-'}</div>
            </div>
            <Table rowKey="id" size="small" dataSource={detailData.items || []} pagination={false}
              columns={[
                { title: '序号', width: 50, render: (_: any, __: any, idx: number) => idx + 1 },
                { title: '材料名称', dataIndex: 'material_name', width: 120 },
                { title: '规格', dataIndex: 'spec', width: 100 },
                { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' as const },
                { title: '单价', dataIndex: 'unit_price', width: 90, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
                { title: '金额', dataIndex: 'amount', width: 100, align: 'right' as const, render: (v: number) => `¥${Number(v || 0).toFixed(2)}` },
                { title: '纸板类型', dataIndex: 'paper_type', width: 90 },
                { title: '单位', dataIndex: 'unit', width: 60 },
                { title: '送货地址', dataIndex: 'delivery_address', width: 120, ellipsis: true },
              ]} />
          </div>
        )}
      </Modal>
    </div>
  );
}
