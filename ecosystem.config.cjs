module.exports = {
  apps: [
    {
      name: 'paperbox-server',
      script: 'apps/server/dist/main.js',
      cwd: '/root/workspace/paperbox-erp',
      interpreter: 'node',
      env: {
        PORT: 3003,
        NODE_ENV: 'development',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '30s',
    },
    {
      name: 'paperbox-web',
      script: 'npx',
      args: 'vite --port 5174',
      cwd: '/root/workspace/paperbox-erp/apps/web',
      interpreter: 'bash',
      env: {
        NODE_ENV: 'development',
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '15s',
    },
  ],
};
