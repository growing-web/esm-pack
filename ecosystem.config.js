module.exports = {
  apps: [
    {
      name: 'esm-pack',
      cwd: './',
      script: 'npm run start:prod',
      watch: false,
      autorestart: false,
      ignore_watch: ['node_modules', '.esmd'],
      instances: 1,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './esmd/logs/cashier-error.log',
      out_file: './esmd/logs/cashier-out.log',
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
