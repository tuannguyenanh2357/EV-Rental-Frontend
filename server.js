const express = require('express');
const path = require('path');
const app = express();

const distDir = path.join(__dirname, 'dist', 'my-app', 'browser');

app.use(express.static(distDir));

app.get('/*', function(req, res) {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
