const RUNTIME_TOTAL_CPU = process.env.RUNTIME_TOTAL_CPU || 1
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
      exec_mode: 'cluster',
      node_args: '--max-old-space-size=4096',
      instances: RUNTIME_TOTAL_CPU,
      env: {
        NODE_ENV: 'production',
      },
      time: true,
    },
  ],
}
