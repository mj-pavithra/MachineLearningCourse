module.exports = {
  apps: [
    {
      name: 'gymapp-fe',
      script: 'serve',
      args: '-s dist -l 3000 --spa',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};


