const { app, BrowserWindow } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function iniciarServidorLocal(carpetaDist) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlLimpia = (req.url || '/').split('?')[0];
      let rutaArchivo = path.join(carpetaDist, urlLimpia === '/' ? 'index.html' : urlLimpia);

      // Si la ruta no es un archivo físico (rutas de expo-router), devolver index.html
      if (!fs.existsSync(rutaArchivo) || fs.statSync(rutaArchivo).isDirectory()) {
        rutaArchivo = path.join(carpetaDist, 'index.html');
      }

      const ext = path.extname(rutaArchivo).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(rutaArchivo).pipe(res);
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function crearVentanaNativa() {
  const carpetaDist = path.join(__dirname, 'dist');
  const urlLocal = await iniciarServidorLocal(carpetaDist);

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 680,
    title: 'BarberZones · Sistema de Gestión',
    icon: path.join(__dirname, 'assets', 'images', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(urlLocal);
}

app.whenReady().then(() => {
  crearVentanaNativa();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentanaNativa();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});