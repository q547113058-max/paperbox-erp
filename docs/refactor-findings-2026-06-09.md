# 重构发现 - 2026-06-09

## 项目信息

- 项目：纸箱 ERP v2
- 重构类型：Express + vanilla JS → NestJS + React + AntD + TypeScript
- 日期：2026-06-09

## P0 已修复

### 1. SQLite 数据不持久化
- **现象**：编辑/创建数据后重启 server，数据被还原
- **根因**：SQLite WAL 模式未启用，重启时 WAL 文件未 checkpoint
- **修复**：在 AppModule.onModuleInit 中配置 `journal_mode=WAL`, `synchronous=NORMAL`, `busy_timeout=5000`
- **验证**：创建产品 → 重启 → 查询确认存在

### 2. better-sqlite3 native binding 路径错误
- **现象**：`Error: Could not locate the bindings file ... better_sqlite3.node`
- **根因**：bindings 包从 `/root/node_modules/` 解析，而非项目 `node_modules/`
- **修复**：`npm rebuild --build-from-source` + 复制到全局路径
- **验证**：server 启动成功

### 3. 端口 3003 被旧 Express 进程抢占
- **现象**：curl 返回 401 + `X-Powered-By: Express`
- **根因**：旧纸箱 ERP Express 进程占用 3003
- **修复**：`kill <PID>` 旧进程
- **验证**：curl 返回 200

### 4. accounts 表为空
- **现象**：JWT 登录返回 "用户名或密码错误"
- **根因**：accounts 表无数据
- **修复**：seed boss/demo 测试账号
- **验证**：登录成功返回 token

### 5. Orders 创建失败
- **现象**：`POST /api/orders` 返回 500
- **根因**：Service 期望 `{ order: {...} }` 格式，前端发送扁平数据
- **修复**：修改 Service 支持两种格式
- **验证**：创建订单成功

## P1 待办

### 1. Nginx MIME 类型问题
- **现象**：CSS 文件返回 HTML，控制台报错 "MIME type not supported"
- **风险**：页面样式丢失
- **建议**：检查 Nginx 代理配置，添加静态资源 location 块

### 2. jest 配置误识别 .d.ts 文件
- **现象**：`app.e2e-spec.d.ts` 被当作测试运行
- **风险**：测试报告显示 1 failed
- **建议**：修改 testMatch 只匹配 `*.spec.ts` 和 `*.test.ts`

## P2 可选

### 1. ESLint warnings (27个)
- **现象**：`no-explicit-any` 警告
- **风险**：低（类型安全不影响运行）
- **建议**：逐步添加类型定义

### 2. 前端代码分割
- **现象**：主包 1MB+
- **风险**：首屏加载慢
- **建议**：已实现 React.lazy() 懒加载

## 工作流反馈

### 成功经验
1. 小步迭代：每个功能独立 commit，便于回滚
2. 质量门禁：typecheck + test + lint 一键执行
3. 端到端验证：浏览器测试 + API 测试双重确认

### 改进建议
1. 先写 smoke.sh 再开发，避免遗漏验证
2. 每个 PR 附带 refactor-findings，记录决策
3. 需求文档要及时更新，不只放在聊天里

## 5 档投票

| 档位 | 建议 |
|------|------|
| A | 继续开发新功能（图片上传、报表、打印） |
| B | 修复 P1 问题（Nginx MIME、jest 配置） |
| C | 补充单元测试覆盖率 |
| D | 部署到正式服 |
| E | 暂停，等待用户反馈 |

**当前选择**：A（已完成图片上传、报表、打印）
