module.exports = {
  apps: [
    {
      name: 'esm-pack',
      cwd: './',
      script: 'dist/main.js',
      watch: false,
      autorestart: false,
      ignore_watch: ['node_modules', '.esmd', '.logs'],
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '.logs/pm2/cashier-error.log',
      out_file: '.logs/pm2/cashier-out.log',
      merge_logs: true,
      node_args: '--harmony',
      instances: 4,
      ignore_watch: ['node_modules', 'logs', 'static'],
      //   exec_mode: 'cluster',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
}
