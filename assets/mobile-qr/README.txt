GUZO Mobile — Expo Go QR codes
LAN IP: 192.168.100.4

Customer  exp://192.168.100.4:8081
Driver    exp://192.168.100.4:8082
Merchant  exp://192.168.100.4:8083
Branch    exp://192.168.100.4:8084

Scan with Expo Go on the same Wi-Fi as your dev machine.
Android not updating? In Expo Go: shake phone -> Reload. Turn off mobile data.
Regenerate QRs after Wi-Fi/IP change: npm run mobile:qr
Demo users: run npm run db:seed (set SEED_DEMO_PASSWORD locally).