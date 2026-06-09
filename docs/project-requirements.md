# 纸箱 ERP 重构需求文档

## 项目信息

| 项目 | 值 |
|------|-----|
| 项目名称 | 纸箱 ERP v2 |
| 公司 | 开平市丰晟达食品有限公司 |
| 地址 | 开平市水口镇寺前西路56号之2号A区5号 |
| 电话 | 13427433044 |
| 目标用户 | 内部员工（boss/finance/warehouse/sales） |

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS + TypeORM + better-sqlite3 + TypeScript |
| 前端 | React 18 + Ant Design 5 + Vite + TypeScript |
| 部署 | PM2 + Nginx 反代 |
| 数据库 | SQLite (erp.db) |

## 核心功能

### 已实现 ✅

1. **认证授权**
   - JWT 登录
   - 角色权限（boss/finance/warehouse/sales）
   - 菜单权限过滤

2. **业务模块**
   - 产品管理（CRUD + 图片上传）
   - 订单管理（CRUD + 状态流转）
   - 客户管理（CRUD）
   - 供应商管理（CRUD）
   - 人员管理（CRUD）
   - 采购管理（只读）
   - 仓库管理（只读）
   - 发货管理（只读）
   - 财务管理（只读）

3. **数据功能**
   - Excel 导入导出
   - 打印功能（送货单/对账单/订单）
   - 报表功能（销售/财务/产品/客户）

4. **部署**
   - PM2 进程管理
   - Nginx 反向代理
   - 开机自启

## 设计规范

| 项目 | 规范 |
|------|------|
| 设计风格 | 白色背景 + AntD 默认蓝，专业商务风 |
| 字体 | 思源黑体（Noto Sans SC） |
| 主色 | #1677ff |
| 圆角 | 2px |
| 响应式 | 支持移动端（Drawer 菜单） |

## 端口分配

| 服务 | 端口 |
|------|------|
| Nginx 统一入口 | 3003 |
| NestJS API | 3005 |
| Vite 前端 | 4173 |

## 登录账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| boss | demo | 管理员 |
| demo | demo | 仓库 |

## 数据库

- 路径：`/data/erp-data/erp-system/erp.db`
- 模式：SQLite WAL
- 表数量：40 张
- synchronize: false（不自动建表）

## GitHub

- 仓库：https://github.com/q547113058-max/paperbox-erp
- 分支：main
