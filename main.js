const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs');
const path = require('path');
let filePath = '../Бой_20251020_1.txt';
let configPath = './config.json';
let lastSize = 0;
let buffer = ''; // буфер для неполных строк
let damageWithTime =[];
let config = {};

function scanDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  // const result = entries.map(entry => {
  //   const fullPath = path.join(dirPath, entry.name);
  //   return {
  //     name: entry.name,
  //     path: fullPath,
  //     type: entry.isDirectory() ? 'dir' : 'file'
  //   };
  // });
  let bigger="";
  let lastDate = new Date("2000-01-01");
  let lastId = 0;
  entries.forEach(entry => {
    const fullPath = path.join(dirPath, entry.name);
    if(entry.name.includes('_'))
    {
      const parts = entry.name.split('_');
      if(parts.length==3)
      {
        var dateString = parts[1];
        dateString=dateString.substring(0,4)+"-"+dateString.substring(4,6)+"-"+dateString.substring(6,8)+"T00:00:00.000Z"
        var date = new Date(dateString);
        if(date>lastDate&&Number.parseInt(parts[2])>=lastId)
        {
          bigger=path.join(dirPath, entry.name);
          lastDate=date;
          lastId=Number.parseInt(parts[2]);
          
        }
      }
    }
  })
  filePath = bigger;
}
console.log(config.logPath);

console.log(filePath);
// Эта функция вызывается для каждой новой строки
let firstDate = null;

let win;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Размер окна
  const winWidth = 100;
  const winHeight = 100;

  // Позиция в правом верхнем углу
  const posX = width/2 - (winWidth/2); // отступ 10px от правого края
  const posY = height/2 + 200;                    
  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x:posX,
    y:posY,
    alwaysOnTop: true,   // держать окно поверх всех
    resizable: false,
    frame: false,        // без рамки
    transparent: true,   // прозрачный фон
    focusable: true,   // не перехватывает фокус    // нельзя перетаскивать
    skipTaskbar: false,
    webPreferences: {
      nodeIntegration: true,  // разрешаем require() в рендерере
      contextIsolation: false // для простоты примера
    }
  });

  win.loadFile('index.html');
    win.once('ready-to-show', () => {
    // 👇 порядок важен!
    win.setAlwaysOnTop(true, 'screen-saver');
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.setFullScreenable(false);
    win.showInactive(); // показать без фокуса
  });
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('Файл пока не существует.');
      } else {
        console.error('Ошибка доступа к файлу:', err);
      }
      return;
    }
    lastSize = stats.size;
  });
  setInterval(() => {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.log('Файл пока не существует.');
      } else {
        console.error('Ошибка доступа к файлу:', err);
      }
      return;
    }

    // если файл вырос — читаем добавленную часть
    if (stats.size > lastSize) {
      const stream = fs.createReadStream(filePath, {
        start: lastSize,
        end: stats.size,
        encoding: 'utf8'
      });

      stream.on('data', chunk => {
        buffer += chunk;

        // делим по строкам
        let lines = buffer.split(/\r?\n/);
        buffer = lines.pop(); // последняя может быть неполной строкой
        //console.log(lines);
        for (const line of lines) {
          if (line.trim() !== '') {
            handleNewLine(line);
          }
        }
      });

      stream.on('end', () => {
        lastSize = stats.size;
      });

      stream.on('error', err => {
        console.error('Ошибка чтения:', err);
      });
    } else if (stats.size < lastSize) {
      // файл был обнулён
      console.log('[Файл был перезаписан]');
      lastSize = stats.size;
      buffer = '';
    }
  });
}, 100);
ipcMain.on('clear', (event, message) => {
    damageWithTime = [];
    firstDate = null;
    win.webContents.send('update-data', (0));
  });
}
function isNumeric(str) {
  if (typeof str !== 'string') return false; // защита от нестрок
  return str.trim() !== '' && !isNaN(str);
}
function handleNewLine(line) {
  

  const date = (new Date());
    const trimmed = new Date(Math.floor(date.getTime() / 1000) * 1000);
  if(line.includes('терпит урон')||line.includes('You hit')) {
    const damage = line.split(' ').find(x=>isNumeric(x));
    let dmg= Number.parseInt(damage);
    if(true)
    {
      damageWithTime.push({date:trimmed, damage:dmg});
    }
    
    if(!firstDate&&damageWithTime.length>0){
      firstDate = damageWithTime[0].date;
    }
  }
  // Пример парсинга строки как JSON
  try {
    const parsed = JSON.parse(line);
    //console.log('→ Распарсено:', parsed);
  } catch {
    // Если не JSON — просто как текст
  }
  var lastDamage = damageWithTime[damageWithTime.length-1];
  if(!lastDamage)
  {
  win.webContents.send('update-data', (0));

    return;
  }
  const lastDate = lastDamage.date;
  const d1 = lastDate;
const d2 = firstDate;

const diffSeconds = Math.abs(d2 - d1) / 1000;
  const cutoff = new Date(lastDate.getTime() - diffSeconds * 1000);
  
// Фильтрация
  const recentDates = damageWithTime.filter(d => d.date >= cutoff);
  let amount = damageWithTime.reduce((acc, curr) => acc + curr.damage, 0);
  // for(var i=0;i<diffSeconds;i++)
  // {
  //   const cutoff = new Date(lastDate.getTime() - i * 1000);
  //   const currDmg = damageWithTime.find(d => d.date == cutoff);
  //   if(currDmg)
  //   {
  //     lastDamage = currDmg;
  //   }
  //   amount += lastDamage.damage;
  // }
  console.clear();
  console.log(diffSeconds, amount);
  //console.log(amount,diffSeconds,(amount/diffSeconds), damageWithTime[0]);
  win.webContents.send('update-data', Math.floor(amount/diffSeconds));
}
fs.readFile(configPath, 'utf8', (err, data) => {
  if (err) {
    console.error('Ошибка при чтении файла:', err);
    return;
  }
  config = JSON.parse(data);
  scanDir(config.logPath)
  app.whenReady().then(createWindow);
});
