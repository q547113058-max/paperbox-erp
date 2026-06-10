import React, { useEffect, useMemo, useState } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Tag,
  message,
  Modal,
  Card,
  Statistic,
  Row,
  Col,
  Select,
  Segmented,
  Tooltip,
} from 'antd';
import {
  ReloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import api from '../utils/axios';
import { useAuthStore } from '../stores/auth';
import { TableEmptyCell } from '../components/TableEmptyCell';

// 与后端 entities/action_logs.ts 对齐
interface ActionLog {
  id: number;
  username: string;
  module: string | null;
  action: string | null;
  target_id: number;
  target_name: string;
  details: string;
  created_at: string;
}

type TimeRange = 'today' | '7d' | '30d' | 'all';

const BRAND = '#2c5282';

// 把后端 created_at 解析为 Date
function parseCreatedAt(s: string): Date | null {
  if (!s) return null;
  // 兼容 "2025-01-09 10:30:00" 与 ISO
  const normalized = s.includes('T') ? s : s.replace(' ', 'T');
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateTime(s: string): string {
  const d = parseCreatedAt(s);
  if (!d) return s || '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function rangeStart(range: TimeRange): number {
  const now = Date.now();
  if (range === 'today') return startOfToday();
  if (range === '7d') return now - 7 * 24 * 60 * 60 * 1000;
  if (range === '30d') return now - 30 * 24 * 60 * 60 * 1000;
  return 0; // all
}

// 操作类型 Tag 颜色
function actionColor(action?: string | null): string {
  if (!action) return 'default';
  const a = action.toLowerCase();
  if (a.includes('删除') || a.includes('delete') || a.includes('remove')) return 'red';
  if (a.includes('创建') || a.includes('新增') || a.includes('create') || a.includes('add')) return 'green';
  if (a.includes('更新') || a.includes('编辑') || a.includes('update') || a.includes('edit')) return 'blue';
  if (a.includes('登录') || a.includes('login')) return 'purple';
  if (a.includes('导出') || a.includes('export')) return 'gold';
  return 'default';
}

// CSV 单元格转义
function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export default function ActionLogs() {
  const [data, setData] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);

  const [detail, setDetail] = useState<ActionLog | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const isBoss = user?.role === 'boss';

  const fetchData = () => {
    setLoading(true);
    api
      .get('/action_logs')
      .then((r) => setData(Array.isArray(r.data) ? r.data : []))
      .catch(() => message.error('加载操作日志失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 模块下拉选项（来自当前数据集）
  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => {
      if (d.module) set.add(d.module);
    });
    return Array.from(set).sort().map((m) => ({ value: m, label: m }));
  }, [data]);

  // 排序：按 id 倒序（后端已 DESC），但用 created_at 再排一遍以防相同时间戳
  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      if (b.id !== a.id) return b.id - a.id;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [data]);

  // 过滤
  const filtered = useMemo(() => {
    const start = rangeStart(timeRange);
    const kw = keyword.trim().toLowerCase();
    return sorted.filter((r) => {
      if (moduleFilter && r.module !== moduleFilter) return false;
      if (start > 0) {
        const t = parseCreatedAt(r.created_at)?.getTime() ?? 0;
        if (t < start) return false;
      }
      if (kw) {
        const hay = `${r.username || ''} ${r.module || ''} ${r.action || ''} ${r.target_name || ''} ${r.details || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [sorted, timeRange, moduleFilter, keyword]);

  // KPI — 始终基于全量 data（按时间窗口筛过的快照）
  const kpi = useMemo(() => {
    const now = Date.now();
    const start7 = now - 7 * 24 * 60 * 60 * 1000;
    const startToday = startOfToday();
    let todayCount = 0;
    let sevenCount = 0;
    for (const r of data) {
      const t = parseCreatedAt(r.created_at)?.getTime() ?? 0;
      if (t >= startToday) todayCount += 1;
      if (t >= start7) sevenCount += 1;
    }
    return { total: data.length, today: todayCount, seven: sevenCount };
  }, [data]);

  // 详情：尝试把 details 解析为 JSON 友好显示
  const detailPretty = useMemo(() => {
    if (!detail) return '';
    const raw = detail.details || '';
    try {
      const obj = JSON.parse(raw);
      return JSON.stringify(obj, null, 2);
    } catch {
      return raw;
    }
  }, [detail]);

  const openDetail = (r: ActionLog) => {
    setDetail(r);
    setDetailOpen(true);
  };

  // 导出 CSV（按当前筛选结果）
  const handleExport = () => {
    if (filtered.length === 0) {
      message.warning('当前筛选结果为空，无可导出数据');
      return;
    }
    const header = ['时间', '用户', '模块', '操作', '对象ID', '对象名称', '详情'];
    const lines = [header.map(csvCell).join(',')];
    for (const r of filtered) {
      lines.push(
        [
          r.created_at,
          r.username,
          r.module || '',
          r.action || '',
          r.target_id,
          r.target_name,
          r.details,
        ]
          .map(csvCell)
          .join(','),
      );
    }
    // 加 BOM 让 Excel 识别 UTF-8
    const csv = '\ufeff' + lines.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    a.href = url;
    a.download = `action_logs_${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`已导出 ${filtered.length} 条日志`);
  };

  // 清空 — boss 限定，Modal.confirm 二次确认后逐条 DELETE
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清空所有操作日志？',
      content: (
        <div>
          <div style={{ color: '#cf1322', marginBottom: 8 }}>
            此操作不可恢复！将永久删除全部 <b>{data.length}</b> 条操作日志。
          </div>
          <div style={{ color: '#64748b', fontSize: 12 }}>
            仅 boss 角色可执行此操作。
          </div>
        </div>
      ),
      okText: '确认清空',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        if (data.length === 0) {
          message.info('当前无日志可清空');
          return;
        }
        setClearing(true);
        const hide = message.loading(`正在清空 ${data.length} 条日志...`, 0);
        try {
          // 顺序删除（后端无批量删除接口），并发上限 5 避免压垮服务器
          const ids = data.map((d) => d.id);
          const queue = [...ids];
          const concurrency = 5;
          let failed = 0;
          const workers = Array.from({ length: concurrency }, async () => {
            while (queue.length > 0) {
              const id = queue.shift();
              if (id === undefined) break;
              try {
                await api.delete(`/action_logs/${id}`);
              } catch {
                failed += 1;
              }
            }
          });
          await Promise.all(workers);
          hide();
          if (failed > 0) {
            message.warning(`清空完成，但有 ${failed} 条删除失败`);
          } else {
            message.success(`已清空 ${ids.length} 条日志`);
          }
          fetchData();
        } finally {
          setClearing(false);
        }
      },
    });
  };

  const columns: ColumnsType<ActionLog> = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (v: string) => (
        <span style={{ color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(v)}</span>
      ),
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 110,
      render: (v: string) => v || <span style={{ color: '#94a3b8' }}>未知用户</span>,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 110,
      render: (v: string | null) => (v ? <Tag color="blue">{v}</Tag> : <span style={{ color: '#94a3b8' }}>-</span>),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 110,
      render: (v: string | null) => (v ? <Tag color={actionColor(v)}>{v}</Tag> : <span style={{ color: '#94a3b8' }}>-</span>),
    },
    {
      title: '对象',
      key: 'target',
      width: 220,
      render: (_: any, r: ActionLog) => (
        <Tooltip title={`#${r.target_id} · ${r.target_name || '-'}`}>
          <span style={{ display: 'inline-block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'bottom' }}>
            <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>#{r.target_id}</span>
            <span style={{ margin: '0 6px', color: '#cbd5e1' }}>·</span>
            <span>{r.target_name || '-'}</span>
          </span>
        </Tooltip>
      ),
    },
    {
      title: '详情',
      dataIndex: 'details',
      key: 'details',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v || '—'} placement="topLeft">
          <span style={{ color: '#475569' }}>{v || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action_btn',
      width: 90,
      fixed: 'right',
      render: (_: any, r: ActionLog) => (
        <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 顶部标题 + 操作 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>
          <FileTextOutlined style={{ color: BRAND, marginRight: 8 }} />
          操作日志
        </h2>
        <Space wrap>
          <Input
            placeholder="搜索用户/模块/操作/对象/详情"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchData}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出 CSV ({filtered.length})
          </Button>
          {isBoss && (
            <Button danger icon={<DeleteOutlined />} onClick={handleClearAll} loading={clearing}>
              清空日志
            </Button>
          )}
        </Space>
      </div>

      {/* KPI */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" style={{ borderTop: `3px solid ${BRAND}` }}>
            <Statistic title="总日志数" value={kpi.total} valueStyle={{ color: BRAND }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic title="今日新增" value={kpi.today} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="7 天新增" value={kpi.seven} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      {/* 时间 + 模块筛选 */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b' }}>时间范围：</span>
        <Segmented
          value={timeRange}
          onChange={(v) => setTimeRange(v as TimeRange)}
          options={[
            { value: 'today', label: '今天' },
            { value: '7d', label: '近 7 天' },
            { value: '30d', label: '近 30 天' },
            { value: 'all', label: '全部' },
          ]}
        />
        <span style={{ color: '#64748b' }}>模块：</span>
        <Select
          allowClear
          placeholder="全部模块"
          value={moduleFilter}
          onChange={setModuleFilter}
          style={{ width: 180 }}
          options={moduleOptions}
          showSearch
        />
        <Button
          size="small"
          onClick={() => {
            setKeyword('');
            setModuleFilter(null);
            setTimeRange('7d');
          }}
        >
          清除筛选
        </Button>
        <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }}>
          当前显示 {filtered.length} / {data.length} 条
        </span>
      </div>

      <Table
        rowKey="id"
        size="small"
        loading={loading}
        columns={columns}
        dataSource={filtered}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: (
            <TableEmptyCell
              resource="操作日志"
              hint={keyword || moduleFilter || timeRange !== 'all' ? '试试调整或清除筛选条件' : '系统暂未产生任何操作日志'}
              keyword={keyword}
              isDataEmpty={data.length === 0}
              preset={keyword || moduleFilter ? 'no-match' : 'minimal'}
            />
          ),
        }}
      />

      {/* 详情 Modal */}
      <Modal
        title={
          detail ? (
            <span>
              <EyeOutlined style={{ color: BRAND, marginRight: 8 }} />
              日志详情 — <span style={{ color: BRAND, fontFamily: 'monospace' }}>#{detail.id}</span>
            </span>
          ) : (
            '日志详情'
          )
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {detail && (
          <div>
            <Row gutter={[16, 10]} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>时间</div>
                <div style={{ color: '#1f2937' }}>{formatDateTime(detail.created_at)}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>用户</div>
                <div>{detail.username || '未知用户'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>模块</div>
                <div>{detail.module ? <Tag color="blue">{detail.module}</Tag> : '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>操作</div>
                <div>
                  {detail.action ? <Tag color={actionColor(detail.action)}>{detail.action}</Tag> : '-'}
                </div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>对象 ID</div>
                <div style={{ fontFamily: 'monospace' }}>#{detail.target_id}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>对象名称</div>
                <div>{detail.target_name || '-'}</div>
              </Col>
            </Row>

            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>详情（JSON）</div>
            <pre
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: 12,
                borderRadius: 6,
                maxHeight: 360,
                overflow: 'auto',
                fontSize: 12,
                lineHeight: 1.6,
                margin: 0,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {detailPretty || '(空)'}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
