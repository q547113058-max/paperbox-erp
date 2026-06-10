import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Input, Tabs, Table, Tag, Spin, Empty, Card, Button,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined,
  FileTextOutlined, ToolOutlined, CarOutlined, AppstoreOutlined, TeamOutlined, BankOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../utils/axios';
import { TableEmptyCell } from '../components/TableEmptyCell';

const BRAND = '#2c5282';
const PER_MODULE_LIMIT = 5;        // 每个 Tab 最多显示 5 条
const RECENT_DAYS = 7;              // 空查询时拉取最近 7 天数据
const RECENT_PER_MODULE_LIMIT = 3;  // 空查询时每个模块 3 条
const DEBOUNCE_MS = 350;

// ============ 模块配置 ============
type ModuleKey = 'orders' | 'work_orders' | 'deliveries' | 'products' | 'customers' | 'finance_records';

interface ModuleConfig {
  key: ModuleKey;
  label: string;
  icon: React.ReactNode;
  endpoint: string;                 // 列表端点（不带 ?...）
  detailPath: (id: number | string) => string; // 跳详情页
  searchFields: (row: any) => string[];       // 参与匹配的字段提取
  dateField?: (row: any) => string | null | undefined; // 用于"最近 7 天"
  columns: any[];                   // 列表展示列
  rowKey: (row: any) => string | number;
}

const STATUS_COLORS: Record<string, string> = {
  '待确认': 'default', '已确认': 'blue', '生产中': 'orange',
  '待发货': 'purple', '已完成': 'green', '已取消': 'red',
  '未结清': 'orange', '已结清': 'green', '已冲正': 'red',
  '正常生产': 'green', '已停产': 'red', '开发中': 'blue', '打样': 'purple',
  '活跃': 'green', '暂停': 'orange', '流失': 'red',
};

const fmtMoney = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === '') return '-';
  const n = Number(v);
  if (Number.isNaN(n)) return '-';
  return `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (v?: string | null) => {
  if (!v) return '-';
  return String(v).replace('T', ' ').slice(0, 19);
};

const calcMatch = (row: any, fields: string[], keyword: string): boolean => {
  if (!keyword) return true;
  const k = keyword.toLowerCase();
  return fields.some((f) => String(f ?? '').toLowerCase().includes(k));
};

// ============ 6 个模块的列定义 ============
const orderColumns: any[] = [
  { title: '订单号', dataIndex: 'order_no', width: 150, render: (v: string) => v || <span style={{ color: '#bfbfbf' }}>未编号</span> },
  {
    title: '状态', dataIndex: 'status', width: 90,
    render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v || '-'}</Tag>,
  },
  {
    title: '金额', dataIndex: 'total_amount', width: 120, align: 'right' as const,
    render: (v: number) => fmtMoney(v),
  },
  { title: '交货日期', dataIndex: 'delivery_date', width: 160, render: (v: string) => fmtDate(v) },
  { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => fmtDate(v) },
];

const workOrderColumns: any[] = [
  { title: '工单号', dataIndex: 'work_order_no', width: 150, render: (v: string) => v || '-' },
  {
    title: '状态', dataIndex: 'status', width: 90,
    render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v || '-'}</Tag>,
  },
  { title: '数量', dataIndex: 'quantity', width: 90, align: 'right' as const },
  { title: '已完成', dataIndex: 'completed_qty', width: 90, align: 'right' as const },
  { title: '操作员', dataIndex: 'worker', width: 100 },
  { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => fmtDate(v) },
];

const deliveryColumns: any[] = [
  { title: '送货单号', dataIndex: 'delivery_no', width: 150, render: (v: string) => v || '-' },
  {
    title: '状态', dataIndex: 'status', width: 90,
    render: (v: string, r: any) => {
      const text = r.signed ? '已签收' : v || '-';
      const color = r.signed ? 'green' : STATUS_COLORS[v] || 'default';
      return <Tag color={color}>{text}</Tag>;
    },
  },
  { title: '送货人', dataIndex: 'delivery_person', width: 100 },
  { title: '送货时间', dataIndex: 'delivery_time', width: 160, render: (v: string) => fmtDate(v) },
  { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => fmtDate(v) },
];

const productColumns: any[] = [
  { title: '产品编码', dataIndex: 'code', width: 140, render: (v: string) => v || '-' },
  { title: '名称', dataIndex: 'name', width: 200, ellipsis: true, render: (v: string) => v || '-' },
  { title: '规格', dataIndex: 'spec', width: 200, ellipsis: true, render: (v: string) => v || '-' },
  { title: '单位', dataIndex: 'unit', width: 70 },
  {
    title: '状态', dataIndex: 'status', width: 90,
    render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v || '-'}</Tag>,
  },
];

const customerColumns: any[] = [
  { title: '客户名称', dataIndex: 'name', width: 180, render: (v: string) => v || '-' },
  { title: '联系人', dataIndex: 'contact', width: 100 },
  { title: '电话', dataIndex: 'phone', width: 130 },
  { title: '业务员', dataIndex: 'salesman', width: 100 },
  {
    title: '状态', dataIndex: 'status', width: 80,
    render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v || '活跃'}</Tag>,
  },
];

const financeColumns: any[] = [
  { title: '单据编号', dataIndex: 'ref_no', width: 150, render: (v: string) => v || '-' },
  {
    title: '类型', dataIndex: 'type', width: 70,
    render: (v: string) => <Tag color={v === '应收' ? 'blue' : v === '应付' ? 'orange' : 'default'}>{v || '-'}</Tag>,
  },
  { title: '对方单位', dataIndex: 'party_name', width: 180, ellipsis: true },
  {
    title: '金额', dataIndex: 'amount', width: 130, align: 'right' as const,
    render: (v: number) => fmtMoney(v),
  },
  {
    title: '状态', dataIndex: 'status', width: 90,
    render: (v: string) => <Tag color={STATUS_COLORS[v] || 'default'}>{v || '-'}</Tag>,
  },
  { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => fmtDate(v) },
];

// ============ 模块元信息 ============
const MODULES: ModuleConfig[] = [
  {
    key: 'orders', label: '订单', icon: <FileTextOutlined />,
    endpoint: '/orders', detailPath: (id) => `/orders?focus=${id}`,
    searchFields: (r) => [r.order_no, r.customer_order_no, r.print_name, r.remark, r.face_supplier, r.face_material, r.medium_supplier, r.medium_material],
    dateField: (r) => r.created_at,
    columns: orderColumns, rowKey: (r) => r.id,
  },
  {
    key: 'work_orders', label: '工单', icon: <ToolOutlined />,
    endpoint: '/work_orders', detailPath: (id) => `/work_orders?focus=${id}`,
    searchFields: (r) => [r.work_order_no, r.prod_no, r.worker, r.material, r.box_type, r.process_name, r.remark],
    dateField: (r) => r.created_at,
    columns: workOrderColumns, rowKey: (r) => r.id,
  },
  {
    key: 'deliveries', label: '发货', icon: <CarOutlined />,
    endpoint: '/deliveries', detailPath: (id) => `/deliveries?focus=${id}`,
    searchFields: (r) => [r.delivery_no, r.delivery_person, r.address, r.work_order_nos, r.remark],
    dateField: (r) => r.created_at,
    columns: deliveryColumns, rowKey: (r) => r.id,
  },
  {
    key: 'products', label: '产品', icon: <AppstoreOutlined />,
    endpoint: '/products', detailPath: (id) => `/products?focus=${id}`,
    searchFields: (r) => [r.code, r.name, r.spec, r.material, r.box_type, r.knife_die],
    dateField: (r) => r.created_at,
    columns: productColumns, rowKey: (r) => r.id,
  },
  {
    key: 'customers', label: '客户', icon: <TeamOutlined />,
    endpoint: '/customers', detailPath: (id) => `/customers?focus=${id}`,
    searchFields: (r) => [r.name, r.contact, r.phone, r.address, r.salesman, r.remark],
    dateField: (r) => r.created_at,
    columns: customerColumns, rowKey: (r) => r.id,
  },
  {
    key: 'finance_records', label: '财务', icon: <BankOutlined />,
    endpoint: '/finance_records', detailPath: (id) => `/finance?focus=${id}`,
    searchFields: (r) => [r.ref_no, r.type, r.party_name, r.category, r.description, r.period_type],
    dateField: (r) => r.created_at,
    columns: financeColumns, rowKey: (r) => r.id,
  },
];

// ============ 兜底 fallback：finance_records → finance-records ============
async function safeGet(path: string) {
  try {
    return await api.get(path);
  } catch (err: any) {
    if (path === '/finance_records' && err?.response?.status === 404) {
      return await api.get('/finance-records');
    }
    throw err;
  }
}

interface ModuleState {
  data: any[];
  totalRaw: number;     // 接口返回的总条数（不过滤前）
  matched: number;      // 关键词匹配后的条数
  loading: boolean;
  error: string | null;
  elapsed: number;      // 加载耗时 ms
}

const initialModuleState = (): ModuleState => ({
  data: [], totalRaw: 0, matched: 0, loading: false, error: null, elapsed: 0,
});

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQ = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(urlQ);
  const [appliedKeyword, setAppliedKeyword] = useState(urlQ); // 真正触发搜索的关键词（防抖后）
  const [activeTab, setActiveTab] = useState<ModuleKey>('orders');
  const [states, setStates] = useState<Record<ModuleKey, ModuleState>>(() => {
    const o = {} as Record<ModuleKey, ModuleState>;
    MODULES.forEach((m) => { o[m.key] = initialModuleState(); });
    return o;
  });
  const [globalLoading, setGlobalLoading] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const reqIdRef = useRef(0);

  // 防抖：输入时延迟 350ms 应用
  useEffect(() => {
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = window.setTimeout(() => {
      setAppliedKeyword(keyword.trim());
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [keyword]);

  // 核心：并行拉取 6 个模块
  useEffect(() => {
    const myReqId = ++reqIdRef.current;
    setGlobalLoading(true);
    // 重置每个 module 状态（loading=true）
    setStates((prev) => {
      const next = { ...prev };
      MODULES.forEach((m) => { next[m.key] = { ...initialModuleState(), loading: true }; });
      return next;
    });

    const promises = MODULES.map(async (m) => {
      const t0 = performance.now();
      try {
        const res = await safeGet(m.endpoint);
        const elapsed = Math.round(performance.now() - t0);
        const list: any[] = Array.isArray(res.data) ? res.data : [];
        // 忽略过期请求
        if (reqIdRef.current !== myReqId) return;
        setStates((prev) => ({
          ...prev,
          [m.key]: { data: list, totalRaw: list.length, matched: 0, loading: false, error: null, elapsed },
        }));
      } catch (e: any) {
        const elapsed = Math.round(performance.now() - t0);
        if (reqIdRef.current !== myReqId) return;
        setStates((prev) => ({
          ...prev,
          [m.key]: { data: [], totalRaw: 0, matched: 0, loading: false, error: e?.message || '加载失败', elapsed },
        }));
      }
    });
    Promise.allSettled(promises).then(() => {
      if (reqIdRef.current === myReqId) setGlobalLoading(false);
    });
  }, []); // 仅首次进入页面拉一次全量，后续只做客户端过滤

  // 客户端过滤：关键词 + 限制条数
  const filteredByModule = useMemo(() => {
    const out: Record<ModuleKey, { rows: any[]; total: number; matched: number }> = {} as any;
    MODULES.forEach((m) => {
      const st = states[m.key];
      const isEmpty = !appliedKeyword;
      const all = st.data || [];
      let matched: any[];

      if (isEmpty) {
        // 空查询：取最近 7 天
        const cutoff = dayjs().subtract(RECENT_DAYS, 'day').startOf('day');
        matched = all.filter((r) => {
          const d = m.dateField?.(r);
          if (!d) return false;
          const dt = dayjs(d);
          return dt.isValid() && dt.isAfter(cutoff);
        });
        // 按时间倒序，取前 RECENT_PER_MODULE_LIMIT
        matched.sort((a, b) => {
          const da = m.dateField?.(a) || '';
          const db = m.dateField?.(b) || '';
          return String(db).localeCompare(String(da));
        });
        matched = matched.slice(0, RECENT_PER_MODULE_LIMIT);
      } else {
        // 关键词匹配
        matched = all.filter((r) => calcMatch(r, m.searchFields(r), appliedKeyword));
        matched = matched.slice(0, PER_MODULE_LIMIT);
      }

      out[m.key] = { rows: matched, total: matched.length, matched: matched.length };
    });
    return out;
  }, [states, appliedKeyword]);

  // KPI 统计
  const kpi = useMemo(() => {
    const totalResults = MODULES.reduce((sum, m) => sum + (filteredByModule[m.key]?.total || 0), 0);
    return { totalResults };
  }, [filteredByModule]);

  const handleRowClick = (mod: ModuleConfig, row: any) => {
    const id = mod.rowKey(row);
    navigate(mod.detailPath(id));
  };

  const handleReset = () => {
    setKeyword('');
    setAppliedKeyword('');
  };

  const handleRefresh = () => {
    // 触发重新拉取：递增 reqId 并重新发起 effect
    reqIdRef.current++;
    setGlobalLoading(true);
    setStates((prev) => {
      const next = { ...prev };
      MODULES.forEach((m) => { next[m.key] = { ...initialModuleState(), loading: true }; });
      return next;
    });
    const myReqId = reqIdRef.current;
    MODULES.forEach(async (m) => {
      const t0 = performance.now();
      try {
        const res = await safeGet(m.endpoint);
        const elapsed = Math.round(performance.now() - t0);
        if (reqIdRef.current !== myReqId) return;
        setStates((prev) => ({
          ...prev,
          [m.key]: { data: res.data || [], totalRaw: (res.data || []).length, matched: 0, loading: false, error: null, elapsed },
        }));
      } catch (e: any) {
        const elapsed = Math.round(performance.now() - t0);
        if (reqIdRef.current !== myReqId) return;
        setStates((prev) => ({
          ...prev,
          [m.key]: { data: [], totalRaw: 0, matched: 0, loading: false, error: e?.message || '加载失败', elapsed },
        }));
      }
    });
    Promise.allSettled(MODULES.map((m) => safeGet(m.endpoint))).then(() => {
      if (reqIdRef.current === myReqId) setGlobalLoading(false);
    });
  };

  // Tab 标题：模块名 + 数量
  const renderTabTitle = (m: ModuleConfig) => {
    const count = filteredByModule[m.key]?.total || 0;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {m.icon}
        <span>{m.label}</span>
        {count > 0 && (
          <span
            style={{
              background: appliedKeyword ? BRAND : '#94a3b8',
              color: '#fff',
              borderRadius: 10,
              fontSize: 11,
              padding: '0 7px',
              minWidth: 18,
              textAlign: 'center' as const,
              fontWeight: 500,
            }}
          >
            {count}
          </span>
        )}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* 搜索框 */}
      <Card
        bordered={false}
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #f0f5fb 0%, #ffffff 100%)',
          boxShadow: '0 1px 4px rgba(44,82,130,0.08)',
        }}
        bodyStyle={{ padding: '24px 24px 20px' }}
      >
        <div style={{ position: 'relative' }}>
          <Input
            allowClear
            size="large"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => setAppliedKeyword(keyword.trim())}
            placeholder="搜索订单号 / 工单号 / 送货单号 / 产品编号 / 客户名 / 对方单位..."
            prefix={
              <SearchOutlined style={{ color: BRAND, fontSize: 18, marginRight: 6 }} />
            }
            suffix={
              globalLoading || appliedKeyword !== keyword.trim() ? (
                <Spin indicator={<LoadingOutlined style={{ fontSize: 18, color: BRAND }} spin />} />
              ) : null
            }
            style={{
              fontSize: 16,
              height: 52,
              borderRadius: 8,
              borderColor: BRAND,
              boxShadow: `0 0 0 2px ${BRAND}1A`,
            }}
          />
        </div>
      </Card>

      {/* Tabs 结果区 */}
      <Card
        bordered={false}
        bodyStyle={{ padding: 0 }}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as ModuleKey)}
          type="line"
          size="large"
          tabBarStyle={{
            margin: 0,
            padding: '0 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fafbfc',
          }}
          items={MODULES.map((m) => {
            const st = states[m.key];
            const rows = filteredByModule[m.key]?.rows || [];
            return {
              key: m.key,
              label: renderTabTitle(m),
              children: (
                <div style={{ padding: '8px 16px 16px' }}>
                  {st.error ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <span style={{ color: '#f5222d' }}>
                          {m.label}模块加载失败：{st.error}
                        </span>
                      }
                    >
                      <Button onClick={handleRefresh} icon={<ReloadOutlined />}>重试</Button>
                    </Empty>
                  ) : (
                    <Table
                      rowKey={m.rowKey}
                      size="small"
                      loading={st.loading && st.data.length === 0}
                      columns={m.columns.map((col: any) => ({
                        ...col,
                        // 高亮匹配关键词
                        render: col.render || ((v: any) => v ?? '-'),
                      }))}
                      dataSource={rows}
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        onClick: () => handleRowClick(m, record),
                        style: { cursor: 'pointer' },
                      })}
                      rowClassName={() => 'global-search-row'}
                      locale={{
                        emptyText: (
                          <TableEmptyCell
                            resource={m.label}
                            keyword={appliedKeyword}
                            isDataEmpty={st.data.length === 0}
                            preset="minimal"
                            hint={st.data.length === 0 ? '该模块暂无数据' : '试试其他关键词或清除搜索条件'}
                          />
                        ),
                      }}
                      summary={() => {
                        if (rows.length === 0) return null;
                        return (
                          <Table.Summary fixed>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={m.columns.length}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12 }}>
                                  <span>
                                    显示 <b style={{ color: BRAND }}>{rows.length}</b> 条
                                    {appliedKeyword && <>，共匹配 <b style={{ color: BRAND }}>{st.data.filter((r) => calcMatch(r, m.searchFields(r), appliedKeyword)).length}</b> 条</>}
                                  </span>
                                  {rows.length > 0 && (
                                    <Button type="link" size="small" onClick={() => navigate(m.endpoint)}>
                                      查看全部 {m.label} →
                                    </Button>
                                  )}
                                </div>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        );
                      }}
                    />
                  )}
                </div>
              ),
            };
          })}
        />
      </Card>

      {/* 全局 loading 覆盖 */}
      {globalLoading && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.35)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <Spin size="large" tip="正在并行加载 6 个模块..." />
        </div>
      )}

      <style>{`
        .global-search-row:hover > td {
          background: ${BRAND}0D !important;
        }
      `}</style>
    </div>
  );
}
