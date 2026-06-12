import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Tooltip,
} from 'antd';
import {
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import api from '../utils/axios';
import { useAuthStore } from '../stores/auth';

interface Setting {
  id: number;
  key: string | null;
  value: string;
  created_at: string;
}

// ===== 品牌色（与 design-tokens.md §1.1 一致） =====
const BRAND = '#2c5282';

// ===== 键名分组（按 key 前缀自动聚合） =====
// prefix -> { label, color }
// 未匹配的 key 归入 "other"
const PREFIX_GROUPS: { prefix: string; label: string; color: string }[] = [
  { prefix: 'system_', label: '系统设置', color: 'blue' },
  { prefix: 'business_', label: '业务参数', color: 'geekblue' },
  { prefix: 'notification_', label: '通知配置', color: 'cyan' },
  { prefix: 'finance_', label: '财务配置', color: 'gold' },
  { prefix: 'print_', label: '打印配置', color: 'purple' },
  { prefix: 'order_', label: '订单配置', color: 'magenta' },
];

function getGroupFor(key: string | null) {
  const k = key || '';
  return PREFIX_GROUPS.find((g) => k.startsWith(g.prefix)) || { prefix: '', label: '其他', color: 'default' };
}

// ===== 常用配置快捷区（点击即编辑/创建） =====
interface QuickItem {
  key: string;
  label: string;
  hint?: string;
}
const QUICK_ITEMS: QuickItem[] = [
  { key: 'system_company_name', label: '公司名称', hint: '开票抬头 / 打印抬头' },
  { key: 'system_company_phone', label: '联系电话', hint: '客户联系用' },
  { key: 'system_tax_no', label: '税号', hint: '开票税号' },
  { key: 'system_company_address', label: '公司地址', hint: '开票地址' },
  { key: 'business_default_payment_days', label: '默认账期(天)', hint: '新建客户时默认值' },
  { key: 'business_default_payment_cycle', label: '默认付款方式', hint: '月结 / 现结 / 季结' },
  { key: 'business_default_settlement', label: '默认结算方式', hint: '公户 / 私户 / 现金' },
  { key: 'business_default_tax_included', label: '默认含税', hint: '1=含税 0=不含税' },
];

// 键名校验：只允许字母数字下划线
const KEY_PATTERN = /^[A-Za-z0-9_]+$/;

export default function Settings() {
  const [data, setData] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Setting | null>(null);
  const [form] = Form.useForm();

  const role = useAuthStore((s) => s.user?.role);
  const isBoss = role === 'boss';

  const fetchData = () => {
    setLoading(true);
    api
      .get('/settings')
      .then((r) => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => message.error('加载配置失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== KPI =====
  const kpi = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let last7 = 0;
    let thisMonth = 0;
    for (const s of data) {
      const t = s.created_at ? new Date(s.created_at) : null;
      if (!t || isNaN(t.getTime())) continue;
      if (t >= sevenDaysAgo) last7 += 1;
      if (t >= monthStart) thisMonth += 1;
    }
    return { total: data.length, last7, thisMonth };
  }, [data]);

  // ===== 过滤 =====
  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return data;
    return data.filter((s) => (s.key || '').toLowerCase().includes(kw) || (s.value || '').toLowerCase().includes(kw));
  }, [data, keyword]);

  // ===== 按 key 前缀分组聚合 =====
  const groups = useMemo(() => {
    const map = new Map<string, Setting[]>();
    for (const s of filtered) {
      const g = getGroupFor(s.key);
      if (!map.has(g.label)) map.set(g.label, []);
      map.get(g.label)!.push(s);
    }
    // 固定分组顺序：先按 PREFIX_GROUPS 顺序，再追加 "其他"
    const ordered: { label: string; color: string; items: Setting[] }[] = [];
    for (const g of PREFIX_GROUPS) {
      if (map.has(g.label)) {
        ordered.push({ label: g.label, color: g.color, items: map.get(g.label)! });
        map.delete(g.label);
      }
    }
    for (const [label, items] of map.entries()) {
      ordered.push({ label, color: 'default', items });
    }
    return ordered;
  }, [filtered]);

  // ===== 快捷区数据：把 QUICK_ITEMS 与现有 data 合并 =====
  const quickList = useMemo(() => {
    const byKey = new Map<string, Setting>();
    for (const s of data) {
      if (s.key) byKey.set(s.key, s);
    }
    return QUICK_ITEMS.map((q) => ({ ...q, current: byKey.get(q.key) || null }));
  }, [data]);

  // ===== Modal 操作 =====
  const handleCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (s: Setting) => {
    setEditing(s);
    form.setFieldsValue({ key: s.key || '', value: s.value || '' });
    setModalOpen(true);
  };

  // 快捷区点击：存在则编辑，不存在则提示后创建
  const handleQuickEdit = (q: QuickItem, current: Setting | null) => {
    setEditing(current);
    if (current) {
      form.setFieldsValue({ key: current.key || '', value: current.value || '' });
    } else {
      form.resetFields();
      form.setFieldsValue({ key: q.key, value: '' });
    }
    setModalOpen(true);
    if (!current) {
      message.info(`该配置尚未创建，已填入建议键名 "${q.key}"，请填写值后保存`);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = { key: values.key, value: values.value };
      if (editing) {
        await api.put(`/settings/${editing.id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/settings', payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchData();
    } catch (e: any) {
      if (!e?.errorFields) {
        const status = e?.response?.status;
        if (status === 403) message.error('无权操作：仅 boss 角色可修改');
        else if (!e?.response) message.error('保存失败');
      }
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/settings/${id}`);
      message.success('已删除');
      fetchData();
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) message.error('无权操作：仅 boss 角色可删除');
      else message.error('删除失败');
    }
  };

  // ===== 表格列 =====
  const columns = [
    {
      title: '键 (key)',
      dataIndex: 'key',
      key: 'key',
      width: 240,
      render: (v: string | null) => {
        if (!v) return <span style={{ color: '#bfbfbf' }}>-</span>;
        const g = getGroupFor(v);
        return (
          <Space size={6}>
            <Tag color={g.color}>{g.label}</Tag>
            <code style={{ background: '#f5f5f5', padding: '1px 6px', borderRadius: 2, fontSize: 12 }}>{v}</code>
          </Space>
        );
      },
    },
    {
      title: '值 (value)',
      dataIndex: 'value',
      key: 'value',
      ellipsis: true,
      render: (v: string) => {
        if (v === '' || v === null || v === undefined) return <span style={{ color: '#bfbfbf' }}>(空)</span>;
        return <span style={{ color: '#262626' }}>{v}</span>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => (v ? v.split('T').join(' ').slice(0, 19) : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, r: Setting) => (
        <Space size={4}>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            disabled={!isBoss}
            onClick={() => handleEdit(r)}
          >
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            danger
            disabled={!isBoss}
            onClick={() =>
              Modal.confirm({
                title: '确认删除该配置？',
                content: (
                  <div>
                    <div>键：<code>{r.key || `#${r.id}`}</code></div>
                    <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>删除后不可恢复</div>
                  </div>
                ),
                okText: '删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: () => handleDelete(r.id),
              })
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* 页头 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingOutlined style={{ color: BRAND }} />
          系统设置
        </h2>
        <Space wrap>
          <Input
            placeholder="搜索 key / value"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          />
          <Tooltip title="刷新">
            <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} disabled={!isBoss} onClick={handleCreate}>
            新增配置
          </Button>
        </Space>
      </div>

      {!isBoss && (
        <div
          style={{
            background: '#fffbe6',
            border: '1px solid #ffe58f',
            padding: '6px 12px',
            borderRadius: 2,
            marginBottom: 12,
            fontSize: 12,
            color: '#874d00',
          }}
        >
          当前角色 <Tag color="default">{role || '未登录'}</Tag> 仅有查看权限，新增/编辑/删除需 boss 角色。
        </div>
      )}

      {/* KPI */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" bordered>
            <Statistic title="配置总数" value={kpi.total} suffix="项" valueStyle={{ color: BRAND, fontSize: 24 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered>
            <Statistic title="近 7 天新增" value={kpi.last7} suffix="项" valueStyle={{ color: '#08979c', fontSize: 24 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" bordered>
            <Statistic
              title="本月新增"
              value={kpi.thisMonth}
              suffix="项"
              valueStyle={{ color: '#d48806', fontSize: 24 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 常用配置快捷区 */}
      <Card
        size="small"
        title={<span style={{ fontSize: 14, fontWeight: 500 }}>常用配置</span>}
        style={{ marginBottom: 16 }}
        extra={
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
            点击直接编辑（若不存在则创建）
          </span>
        }
      >
        <Row gutter={[12, 12]}>
          {quickList.map((q) => {
            const group = getGroupFor(q.key);
            const hasValue = q.current && q.current.value !== '' && q.current.value != null;
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={q.key}>
                <div
                  onClick={() => isBoss && handleQuickEdit(q, q.current)}
                  style={{
                    cursor: isBoss ? 'pointer' : 'not-allowed',
                    border: '1px solid #f0f0f0',
                    borderRadius: 2,
                    padding: '8px 12px',
                    background: hasValue ? '#fafbfc' : '#fffbe6',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (isBoss) (e.currentTarget as HTMLDivElement).style.borderColor = BRAND;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = '#f0f0f0';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{q.label}</span>
                    <Tag color={hasValue ? group.color : 'warning'} style={{ margin: 0, fontSize: 11 }}>
                      {hasValue ? '已设置' : '未设置'}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#262626', minHeight: 18, wordBreak: 'break-all' }}>
                    {hasValue ? q.current!.value : <span style={{ color: '#bfbfbf' }}>—</span>}
                  </div>
                  {q.hint && (
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{q.hint}</div>
                  )}
                  <div style={{ fontSize: 10, color: '#bfbfbf', marginTop: 4 }}>
                    <code>{q.key}</code>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* 分组表格 */}
      {filtered.length === 0 ? (
        <Card size="small">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={keyword ? '没有匹配的配置项' : '暂无配置项，点击右上角"新增配置"开始'}
          />
        </Card>
      ) : (
        groups.map((g) => (
          <div key={g.label} style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                paddingLeft: 4,
              }}
            >
              <Tag color={g.color} style={{ margin: 0 }}>
                {g.label}
              </Tag>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>共 {g.items.length} 项</span>
            </div>
            <Table
              rowKey="id"
              size="small"
              loading={loading}
              columns={columns}
              dataSource={g.items}
              pagination={g.items.length > 10 ? { pageSize: 10, size: 'small' } : false}
              bordered
            />
          </div>
        ))
      )}

      {/* 新增 / 编辑 Modal */}
      <Modal
        title={editing ? '编辑配置' : '新增配置'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <Form.Item
            name="key"
            label="键 (key)"
            rules={[
              { required: true, message: '请输入键名' },
              {
                pattern: KEY_PATTERN,
                message: '只允许字母、数字、下划线',
              },
              { max: 64, message: '键名长度不能超过 64' },
            ]}
            extra={
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                建议使用前缀分组，例如 <code>system_company_name</code> / <code>business_default_payment_days</code>
              </span>
            }
          >
            <Input
              placeholder="例如：system_company_name"
              disabled={!!editing}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>
          <Form.Item
            name="value"
            label="值 (value)"
            rules={[{ required: true, message: '请输入值' }, { max: 1000, message: '值长度不能超过 1000' }]}
          >
            <Input.TextArea rows={3} placeholder="配置的值（任意字符串）" />
          </Form.Item>
          {editing && (
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              创建时间：{editing.created_at ? editing.created_at.split('T').join(' ').slice(0, 19) : '-'}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}
