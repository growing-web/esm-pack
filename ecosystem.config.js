module.exports = {
  apps: [
    {
      name: 'esm-pack',
      cwd: './',
      script: 'npm run start:prod',
      watch: false,
      instances: 1,
      autorestart: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/usr/local/logs/esm-pack/cashier-error.log',
      out_file: '/usr/local/logs//esm-pack/cashier-out.log',
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
