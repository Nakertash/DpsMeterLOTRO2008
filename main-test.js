const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
const filePath = '../Бой_20251020_1.txt';
let lastSize = 0;
let buffer = ''; // буфер для неполных строк
let damageWithTime =[];

// Эта функция вызывается для каждой новой строки


let win;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Размер окна
  const winWidth = 100;
  const winHeight = 50;

  // Позиция в правом верхнем углу
  const posX = width - winWidth - 10; // отступ 10px от правого края
  const posY = 10;                    
  win = new BrowserWindow({
    width: 100,
    height: 50,
    x:posX,
    y:posY,
    alwaysOnTop: true,   // держать окно поверх всех
    resizable: false,
    frame: false,        // без рамки
    transparent: true,   // прозрачный фон
    focusable: false,   // не перехватывает фокус
movable: false,     // нельзя перетаскивать
skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,  // разрешаем require() в рендерере
      contextIsolation: false // для простоты примера
    }
  });

  win.loadFile('index.html');

win.setIgnoreMouseEvents(true);
  // Каждую секунду читаем файл и отправляем данные в окно

}

app.whenReady().then(createWindow);