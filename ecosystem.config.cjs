/**
 * Paperbox ERP v2 - PM2 Ecosystem
 *
 * 启动：pm2 start ecosystem.config.cjs
 * 停止：pm2 stop ecosystem.config.cjs
 * 重启：pm2 restart ecosystem.config.cjs
 * 状态：pm2 status
 * 日志：pm2 logs
 *
 * 端口分配：
 *   server  → 3003  (NestJS API)
 *   preview → 4173  (Vite preview 静态前端)
 *   nginx  → 80/443 (反代 + HTTPS 终结)
 */

const path = require('path');

const ROOT = __dirname;

module.exports = {
  apps: [
    // ============== 后端 API (NestJS 服务静态前端) ==============
    {
      name: 'paperbox-server',
      script: 'node_modules/.bin/ts-node-dev',
      args: '--transpile-only --respawn src/main.ts',
      cwd: path.join(ROOT, 'apps/server'),
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
      max_memory_restart: '512M',
      kill_timeout: 5000,
      wait_ready: false,
      env: {
        NODE_ENV: 'production',
        PORT: '3005',
        JWT_SECRET: process.env.JWT_SECRET || 'paperbox-erp-v2-jwt-secret-change-in-production',
      },
      error_file: path.join(ROOT, 'logs/server-error.log'),
      out_file: path.join(ROOT, 'logs/server-out.log'),
      merge_logs: true,
      time: true,
    },
  ],

  // ============== 部署元数据 ==============
  deploy: {
    production: {
      user: 'root',
      host: ['193.112.246.85'],  // 测试服
      ref: 'origin/main',
      repo: 'https://github.com/q547113058-max/paperbox-erp.git',
      path: '/data/erp-data/paperbox-erp',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --workspaces --include=dev && npm run build && pm2 reload ecosystem.config.cjs',
      'pre-setup': '',
    },
  },
};
