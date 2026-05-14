const http = require('http');
const fs = require('fs');
const path = require('path');

const filePath = 'C:\Users\Administrator\Desktop\万能任务APP\releases\wanneng-task-v4.4.apk';
const fileName = 'wanneng-task-v4.4.apk';

const server = http.createServer((req, res) => {
  console.log('Request:', req.url);
  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="' + fileName + '"',
      'Content-Length': stat.size,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } catch(e) {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(8080, '0.0.0.0', () => {
  console.log('APK Server running at http://0.0.0.0:8080/');
  console.log('Download from: http://YOUR_IP:8080/');
});
