module.exports = {
  apps: [
    {
      name: 'esmpack-api-server',
      cwd: './',
      script: 'dist/main.js',
      watch: false,
      autorestart: false,
      ignore_watch: ['node_modules', '.esmd', '.logs', 'static'],
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '.logs/pm2/cashier-error.log',
      out_file: '.logs/pm2/cashier-out.log',
      merge_logs: true,
      node_args: '--harmony',
      instances: 2,
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
}
