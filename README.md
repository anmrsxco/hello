```bash
git clone https://github.com/zxecsm/hello.git /opt/hello/hello
```

```bash
vim /opt/hello/hello/server/data/config.js
```

```javascript
const filepath = '/opt/hello/data'; // 网站数据存放目录
const rootP = '/'; // 文件管理根目录
const configObj = {
  port: 55555,
  filepath,
  rootP,
  userFileP: `${filepath}/userFile`,
};
module.exports = configObj;
```

```bash
cd /opt/hello/hello/server
pnpm i
cd ../web
pnpm i
pnpm run build
cd ../server
node app
```
