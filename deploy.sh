#!/bin/bash
# LA Project - Sunucu Kurulum Scripti
# Kullanim: SSH ile sunucuya baglandiktan sonra calistirin

set -e

echo "=== LA Project Kurulumu ==="

# 1. Sistem guncellemesi
echo "[1/7] Sistem guncelleniyor..."
sudo apt update && sudo apt upgrade -y

# 2. Node.js 20 LTS kurulumu
echo "[2/7] Node.js kuruluyor..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Nginx kurulumu
echo "[3/7] Nginx kuruluyor..."
sudo apt install -y nginx

# 4. PM2 kurulumu
echo "[4/7] PM2 kuruluyor..."
sudo npm install -g pm2

# 5. Proje dosyalarini kopyala
echo "[5/7] Proje kuruluyor..."
cd /home/ubuntu
if [ -d "la-project" ]; then
  cd la-project && git pull
else
  git clone https://github.com/blgkync/la-project.git
  cd la-project
fi
npm install --production

# 6. Dizinleri olustur
mkdir -p uploads/experiments uploads/notebook uploads/projects uploads/workpackages
mkdir -p /var/log/la-project

# 7. Env dosyasi
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
PORT=3000
NODE_ENV=production
DB_PATH=./db/la-project.db
ENVEOF
  echo ".env dosyasi olusturuldu"
fi

# 8. Nginx yapilandirmasi
echo "[6/7] Nginx yapilandiriliyor..."
sudo cp nginx/la-project.conf /etc/nginx/sites-available/la-project
sudo ln -sf /etc/nginx/sites-available/la-project /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# 9. PM2 ile baslat
echo "[7/7] Uygulama baslatiliyor..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash

echo ""
echo "=== Kurulum tamamlandi! ==="
echo "Simdi SSL sertifikasi kurun:"
echo "  sudo apt install certbot python3-certbot-nginx -y"
echo "  sudo certbot --nginx -d la-project.com -d www.la-project.com"
echo ""
