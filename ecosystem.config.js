module.exports = {
  apps: [{
    name: 'la-project',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '300M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/var/log/la-project/error.log',
    out_file: '/var/log/la-project/out.log',
    merge_logs: true
  }]
};
