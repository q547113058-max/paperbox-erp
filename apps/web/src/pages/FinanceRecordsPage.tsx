import React, { useEffect, useMemo, useState } from 'react';
import {
  Table, Input, Button, Space, Tag, message, Modal, Form, InputNumber,
  Select, DatePicker, Row, Col, Divider, Card, Statistic, Tooltip, Dropdown,
} from 'antd';
import {
  PlusOutlined, EyeOutlined, CheckOutlined, DownloadOutlined,
  StopOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, MoreOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../utils/axios';
import { FinanceRecord } from '../types/api';
import { TableEmptyCell } from '../components/TableEmptyCell';
import { getStatusColor } from '../utils/statusColor';

const STATUS_OPTIONS = ['未结清', '已结清', '已冲正'];
const PERIOD_OPTIONS = ['现结', '月结', '季度结', '年结'];
const RECEIVABLE_CATEGORIES = ['销售货款', '加工费', '运费', '其他应收'];
const PAYABLE_CATEGORIES = ['采购货款', '委外加工费', '运费', '工资', '其他应付'];

type FinanceType = '应收' | '应付';

interface Props {
  type: FinanceType;
  title: string;
  partyLabel: string;
  partyPlaceholder: string;
  amountColor: string;
  categories: string[];
}

// 后端 controller 当前实际是 finance_records，但旧注释/老前端曾使用 finance-records。
// 这里保留 fallback，避免路由命名不一致导致页面空白。
async function financeGet(path = '') {
  try { return await api.get(`/finance_records${path}`); }
  catch (e) { return api.get(`/finance-records${path}`); }
}
async function financePost(path: string, data?: any) {
  try { return await api.post(`/finance_records${path}`, data); }
  catch (e) { return api.post(`/finance-records${path}`, data); }
}
async function financePut(path: string, data?: any) {
  try { return await api.put(`/finance_records${path}`, data); }
  catch (e) { return api.put(`/finance-records${path}`, data); }
}
async function financeDelete(path: string) {
  try { return await api.delete(`/finance_records${path}`); }
  catch (e) { return api.delete(`/finance-records${path}`); }
}

function fmtMoney(v: number | string | null | undefined) {
  return `¥${Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(v?: string | null) {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 19);
}

export default function FinanceRecordsPage({ type, title, partyLabel, partyPlaceholder, amountColor, categories }: Props) {
  const [data, setData] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceRecord | null>(null);
  const [detail, setDetail] = useState<FinanceRecord | null>(null);
  const [form] = Form.useForm();

  const fetchAll = () => {
    setLoading(true);
    financeGet()
      .then((r) => setData((r.data || []).filter((x: FinanceRecord) => x.type === type)))
      .catch((e) => message.error(e?.response?.data?.message || `加载${title}失败`))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, [type]);

  const filtered = useMemo(() => data.filter((r) => {
    if (keyword) {
      const k = keyword.toLowerCase();
      const text = [r.ref_no, r.ref_type, r.party_name, r.category, r.description, r.status]
        .filter(Boolean).join(' ').toLowerCase();
      if (!text.includes(k)) return false;
    }
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterPeriod && r.period_type !== filterPeriod) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    return true;
  }), [data, keyword, filterStatus, filterPeriod, filterCategory]);

  const kpi = useMemo(() => {
    const valid = data.filter((r) => r.status !== '已冲正');
    const unsettled = valid.filter((r) => r.status !== '已结清');
    const settled = valid.filter((r) => r.status === '已结清');
    const overdue = unsettled.filter((r) => r.due_date && dayjs(r.due_date).isBefore(dayjs(), 'day'));
    const totalAmount = valid.reduce((s, r) => s + Number(r.amount || 0), 0);
    const unsettledAmount = unsettled.reduce((s, r) => s + Number(r.amount || 0), 0);
    return {
      total: data.length,
      unsettled: unsettled.length,
      settled: settled.length,
      overdue: overdue.length,
      totalAmount,
      unsettledAmount,
    };
  }, [data]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      type,
      status: '未结清',
      period_type: '月结',
      category: categories[0],
      due_date: dayjs().add(30, 'day'),
      amount: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (record: FinanceRecord) => {
    setEditing(record);
    form.resetFields();
    form.setFieldsValue({
      ...record,
      due_date: record.due_date ? dayjs(record.due_date) : null,
      paid_at: record.paid_at ? dayjs(record.paid_at) : null,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const v = await form.validateFields();
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
      const payload: Partial<FinanceRecord> = {
        ...v,
        type,
        amount: Number(v.amount || 0),
        due_date: v.due_date ? v.due_date.format('YYYY-MM-DD') : '',
        paid_at: v.status === '已结清'
          ? (v.paid_at ? v.paid_at.format('YYYY-MM-DD HH:mm:ss') : now)
          : (v.paid_at ? v.paid_at.format('YYYY-MM-DD HH:mm:ss') : ''),
        created_at: editing?.created_at || now,
        canceled_at: editing?.canceled_at || '',
        canceled_reason: editing?.canceled_reason || '',
        canceled_by: editing?.canceled_by || '',
      };
      if (editing) {
        await financePut(`/${editing.id}`, payload);
        message.success('更新成功');
      } else {
        await financePost('', payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || '保存失败');
    }
  };

  const handleSettle = async (record: FinanceRecord) => {
    try {
      await financePut(`/${record.id}/settle`);
      message.success('已结清');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '结算失败');
    }
  };

  const handleCancelRecord = async (record: FinanceRecord) => {
    const reason = window.prompt('请输入冲正原因（必填）');
    if (!reason) return message.warning('冲正必须填写原因');
    try {
      await financePost(`/${record.id}/cancel`, { reason, username: 'boss' });
      message.success('已冲正并生成反向记录');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '冲正失败');
    }
  };

  const handleDelete = async (record: FinanceRecord) => {
    try {
      await financeDelete(`/${record.id}`);
      message.success('已删除');
      fetchAll();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  const openDetail = async (record: FinanceRecord) => {
    setDetail(record);
    setDetailOpen(true);
    try {
      const r = await financeGet(`/${record.id}`);
      if (r.data) setDetail(r.data);
    } catch {
      // 列表数据已经足够展示，详情拉取失败不阻塞弹窗
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) return message.warning('当前筛选无数据');
    const headers = ['类型', '单号', '来源', partyLabel, '金额', '状态', '到期日', '结清时间', '账期', '类别', '说明', '创建时间', '冲正原因'];
    const rows = filtered.map((r) => [
      r.type, r.ref_no || '', r.ref_type || '', r.party_name || '', Number(r.amount || 0).toFixed(2),
      r.status || '', r.due_date || '', r.paid_at || '', r.period_type || '', r.category || '',
      (r.description || '').replace(/[\n,"]/g, ' '), r.created_at || '', (r.canceled_reason || '').replace(/[\n,"]/g, ' '),
    ]);
    const csv = '\ufeff' + [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条`);
  };

  const columns = [
    { title: '单号', dataIndex: 'ref_no', key: 'ref_no', width: 150, fixed: 'left' as const,
      render: (v: string, r: FinanceRecord) => v ? <Tooltip title={v}><span style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{v}</span></Tooltip> : <Tag color="orange">FIN-{r.id}</Tag> },
    { title: '来源', dataIndex: 'ref_type', key: 'ref_type', width: 110, render: (v: string) => v || '-' },
    { title: partyLabel, dataIndex: 'party_name', key: 'party_name', width: 160, render: (v: string) => v || '-' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right' as const,
      render: (v: number, r: FinanceRecord) => <span style={{ fontWeight: 700, color: r.status === '已冲正' ? '#94a3b8' : amountColor }}>{fmtMoney(v)}</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, align: 'center' as const,
      render: (s: string) => <Tag color={getStatusColor(s)}>{s || '-'}</Tag> },
    { title: '到期日', dataIndex: 'due_date', key: 'due_date', width: 130,
      render: (v: string, r: FinanceRecord) => {
        const overdue = r.status !== '已结清' && r.status !== '已冲正' && v && dayjs(v).isBefore(dayjs(), 'day');
        return <span style={{ color: overdue ? '#cf1322' : undefined, fontWeight: overdue ? 600 : undefined, whiteSpace: 'nowrap' }}>{v || '-'}</span>;
      } },
    { title: '账期', dataIndex: 'period_type', key: 'period_type', width: 90, render: (v: string) => v || '-' },
    { title: '类别', dataIndex: 'category', key: 'category', width: 120, render: (v: string) => v || '-' },
    { title: '说明', dataIndex: 'description', key: 'description', width: 220, ellipsis: true, render: (v: string) => v || '-' },
    { title: '结清时间', dataIndex: 'paid_at', key: 'paid_at', width: 150, render: fmtDate },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 150, render: fmtDate },
    {
      title: '操作', key: 'action', width: 210, fixed: 'right' as const,
      render: (_: any, r: FinanceRecord) => {
        const moreItems = [
          ...(r.status !== '已冲正' ? [{ key: 'cancel', label: '冲正', icon: <StopOutlined />, danger: true }] : []),
          ...(r.status !== '已冲正' ? [{ key: 'edit', label: '编辑', icon: <EditOutlined /> }] : []),
          ...(r.status === '未结清' ? [{ key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true }] : []),
        ];
        return (
          <Space size={4}>
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
            {r.status !== '已结清' && r.status !== '已冲正' && (
              <Button size="small" type="link" icon={<CheckOutlined />} onClick={() => Modal.confirm({ title: '确认结清？', content: `${r.ref_no || `#${r.id}`}（¥${Number(r.amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}）将标记为已结清`, okText: '结清', cancelText: '取消', onOk: () => handleSettle(r) })}>结清</Button>
            )}
            {moreItems.length > 0 && (
              <Dropdown
                trigger={['click']}
                placement="bottomRight"
                menu={{
                  items: moreItems,
                  onClick: ({ key }) => {
                    if (key === 'cancel') handleCancelRecord(r);
                    if (key === 'edit') openEdit(r);
                    if (key === 'delete') {
                      Modal.confirm({ title: '确认删除此财务记录？', okText: '删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => handleDelete(r) });
                    }
                  },
                }}
              >
                <Button size="small" type="link" icon={<MoreOutlined />} style={{ paddingRight: 4 }}>更多</Button>
              </Dropdown>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <Space>
          <Input
            placeholder={`搜索单号/${partyLabel}/类别/说明`}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchAll}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出 ({filtered.length})</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建{type}</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}><Card size="small" style={{ borderTop: '3px solid #2c5282' }}>
          <Statistic title={`总${type}单`} value={kpi.total} valueStyle={{ color: '#2c5282' }} /></Card></Col>
        <Col span={5}><Card size="small" style={{ borderTop: '3px solid #faad14' }}>
          <Statistic title="未结清" value={kpi.unsettled} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={5}><Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
          <Statistic title="已结清" value={kpi.settled} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card size="small" style={{ borderTop: '3px solid #cf1322' }}>
          <Statistic title="逾期" value={kpi.overdue} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        <Col span={5}><Card size="small" style={{ borderTop: `3px solid ${amountColor}` }}>
          <Statistic title="未结清金额" value={kpi.unsettledAmount} precision={2} prefix="¥" valueStyle={{ color: amountColor, fontSize: 18 }} /></Card></Col>
      </Row>

      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>状态：</span>
        <Select allowClear placeholder="全部状态" value={filterStatus} onChange={setFilterStatus}
          style={{ width: 140 }} options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} />
        <span>账期：</span>
        <Select allowClear placeholder="全部账期" value={filterPeriod} onChange={setFilterPeriod}
          style={{ width: 140 }} options={PERIOD_OPTIONS.map((s) => ({ value: s, label: s }))} />
        <span>类别：</span>
        <Select allowClear placeholder="全部类别" value={filterCategory} onChange={setFilterCategory}
          style={{ width: 160 }} options={categories.map((s) => ({ value: s, label: s }))} />
        <Button size="small" onClick={() => { setKeyword(''); setFilterStatus(null); setFilterPeriod(null); setFilterCategory(null); }}>清除筛选</Button>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1700 }}
        rowClassName={(r) => r.status === '已冲正' ? 'finance-row-cancelled' : ''}
        locale={{ emptyText: <TableEmptyCell resource={title} actionText={`新建${type}`} onAction={openCreate} keyword={keyword} isDataEmpty={data.length === 0} /> }}
      />

      <Modal
        title={editing ? `编辑${type} - ${editing.ref_no || `FIN-${editing.id}`}` : `新建${type}`}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => { setModalOpen(false); setEditing(null); }}
        width={760}
        style={{ top: 20 }}
        okText="保存"
        cancelText="取消"
        destroyOnClose
        styles={{ body: { maxHeight: '58vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>基本信息</Divider>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="ref_no" label="关联单号" rules={[{ required: true, message: '请输入关联单号' }]}>
              <Input placeholder="如 SO/PO/OUT 单号" /></Form.Item></Col>
            <Col span={8}><Form.Item name="ref_type" label="来源类型" rules={[{ required: true, message: '请输入来源类型' }]}>
              <Input placeholder={type === '应收' ? '销售订单/对账单' : '采购单/委外单'} /></Form.Item></Col>
            <Col span={8}><Form.Item name="party_name" label={partyLabel} rules={[{ required: true, message: `请输入${partyLabel}` }]}>
              <Input placeholder={partyPlaceholder} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
              <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="due_date" label="到期日">
              <DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="period_type" label="账期">
              <Select options={PERIOD_OPTIONS.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="category" label="类别">
              <Select showSearch options={categories.map((s) => ({ value: s, label: s }))} /></Form.Item></Col>
            <Col span={8}><Form.Item name="paid_at" label="结清时间">
              <DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="说明"><Input.TextArea rows={3} placeholder="业务说明、结算备注、开票情况等" /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${title}详情 - ${detail?.ref_no || `FIN-${detail?.id}`}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        width={820}
        footer={[<Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>]}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        {detail && (
          <>
            <Row gutter={[16, 10]}>
              <Col span={8}><b>类型：</b><Tag color={type === '应收' ? 'blue' : 'purple'}>{detail.type}</Tag></Col>
              <Col span={8}><b>单号：</b>{detail.ref_no || `FIN-${detail.id}`}</Col>
              <Col span={8}><b>来源：</b>{detail.ref_type || '-'}</Col>
              <Col span={8}><b>{partyLabel}：</b>{detail.party_name || '-'}</Col>
              <Col span={8}><b>金额：</b><span style={{ color: amountColor, fontWeight: 700 }}>{fmtMoney(detail.amount)}</span></Col>
              <Col span={8}><b>状态：</b><Tag color={getStatusColor(detail.status)}>{detail.status || '-'}</Tag></Col>
              <Col span={8}><b>到期日：</b>{detail.due_date || '-'}</Col>
              <Col span={8}><b>结清时间：</b>{fmtDate(detail.paid_at)}</Col>
              <Col span={8}><b>账期：</b>{detail.period_type || '-'}</Col>
              <Col span={8}><b>类别：</b>{detail.category || '-'}</Col>
              <Col span={8}><b>创建时间：</b>{fmtDate(detail.created_at)}</Col>
              <Col span={8}><b>冲正人：</b>{detail.canceled_by || '-'}</Col>
              <Col span={24}><b>说明：</b>{detail.description || '-'}</Col>
              {detail.status === '已冲正' && (
                <>
                  <Col span={12}><b>冲正时间：</b>{fmtDate(detail.canceled_at)}</Col>
                  <Col span={12}><b>冲正原因：</b>{detail.canceled_reason || '-'}</Col>
                </>
              )}
            </Row>
            <Divider orientation="left" plain style={{ fontSize: 13, color: '#64748b' }}>业务提示</Divider>
            <Card size="small" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
              <Space>
                <FileTextOutlined style={{ color: '#2c5282' }} />
                <span style={{ color: '#475569' }}>
                  {type === '应收' ? '应收记录通常来自销售订单/对账单，结清后可作为收入确认依据。' : '应付记录通常来自采购单/委外单，结清后可作为成本支出依据。'}
                </span>
              </Space>
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
}
