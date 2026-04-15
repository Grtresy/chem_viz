const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 开启 gzip 压缩可以进一步提升大 JSON 的传输速度
const compression = require('compression'); // 如果想优化，可以 npm install compression
app.use(compression()); 

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});