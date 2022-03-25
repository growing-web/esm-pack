module.exports = {
  apps: [
    {
      name: 'cdn-server',
      cwd: './',
      script: 'npm run start:prod',
      watch: false,
      instances: 1,
      autorestart: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
