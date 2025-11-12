#!/bin/bash
set -e
ROOT_DIR=${PWD}
echo "Deploying Ikuruka from $ROOT_DIR"
# Install Node & npm as needed (assume Ubuntu/Debian)
# npm ci for server, build frontend, run migrations, and restart service
cd $ROOT_DIR
npm ci
node server/migrate.js || true
# Build frontend (if using Vite)
cd frontend
npm ci
npm run build || true
cd $ROOT_DIR
# Create systemd service
sudo tee /etc/systemd/system/ikuruka.service > /dev/null <<EOF
[Unit]
Description=Ikuruka Node App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$ROOT_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node $ROOT_DIR/server/index.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable ikuruka.service
sudo systemctl restart ikuruka.service || sudo journalctl -u ikuruka.service --no-pager -n 200
