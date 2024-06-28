const os = require('os');
//Cookie
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
// 获取访问设备信息
const UAParser = require('ua-parser-js');
// 操作SQLite数据库
const { queryData } = require('./utils/sqlite');
const {
  writelog,
  getClientIp,
  jwtde,
  getIn,
  _err,
  setCookie,
} = require('./utils/utils');
const { resolve } = require('path');
const configObj = require('./data/config.js');
require('./data/createData');
//Cookie
app.use(cookieParser());
app.use(express.json({ limit: '20000kb' }));
app.use(express.urlencoded({ extended: true, limit: '20000kb' }));
app.use(express.static(resolve(__dirname, 'static')));
app.use(async (req, res, next) => {
  try {
    const _clientConfig = new UAParser(req.headers['user-agent']).getResult(); //获取访问设备信息
    const osName = getIn(_clientConfig, ['os', 'name']) || 'other';
    const osVendor = getIn(_clientConfig, ['device', 'vendor']) || '';
    const osModel = getIn(_clientConfig, ['device', 'model']) || '';
    req._hello = {
      path: req.path,
      temid: req.headers['temid'],
      jwt: jwtde(req.cookies.token),
      ip: getClientIp(req),
      os: osName + (osVendor ? `(${osVendor} ${osModel})` : ''),
      method: req.method.toLocaleLowerCase(),
    };
    await writelog(req, `${req._hello.method}(${req._hello.path})`);
    next();
  } catch (error) {
    await writelog(req, `[ app.use ] - ${error}`, 'error');
    _err(res);
  }
});
app.use(
  '/api/font',
  express.static(`${configObj.filepath}/font`, { maxAge: 2592000000 })
);
app.use(
  '/api/logo',
  express.static(`${configObj.filepath}/logo`, { maxAge: 2592000000 })
);
app.use(
  '/api/picture',
  express.static(`${configObj.filepath}/pic`, { maxAge: 2592000000 })
);
app.use('/api/getfavicon', require('./routes/getfavicon'));
app.use(async (req, res, next) => {
  try {
    req._hello.userinfo = {};
    const {
      userinfo: { account },
      iat,
      exp,
    } = req._hello.jwt;
    if (account) {
      const user = (
        await queryData('user', '*', `WHERE state = ? AND account = ?`, [
          '0',
          account,
        ])
      )[0];
      if (user) {
        //对比token生成的时间
        if ((user.flag || 0) < iat) {
          req._hello.userinfo = user;
          if (Date.now() / 1000 - iat >= (exp - iat) / 2) {
            const { account, username } = req._hello.userinfo;
            setCookie(res, { account, username });
          }
        }
      }
    }
    next();
  } catch (error) {
    await writelog(req, `[ app.use ] - ${error}`, 'error');
    _err(res);
  }
});
app.use('/api/user', require('./routes/user'));
app.use('/api/bg', require('./routes/bg'));
app.use('/api/pic', require('./routes/pic'));
app.use('/api/root', require('./routes/root'));
app.use('/api/player', require('./routes/player'));
app.use('/api/bmk', require('./routes/bmk'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/search', require('./routes/search'));
app.use('/api/note', require('./routes/note'));
app.use('/api/getfile', require('./routes/getfile'));
app.use('/api/todo', require('./routes/todo'));
app.use('/api/count', require('./routes/count'));
app.use('/api/file', require('./routes/file'));
app.use('/api/notepad', require('./routes/notepad'));
app.use((req, res) => {
  res.sendFile(resolve(__dirname, 'data/404.html'));
});
app.listen(configObj.port, () => {
  const arr = getLocahost().map(
    (item) =>
      `http://${item}${configObj.port == 80 ? '' : `:${configObj.port}`}`
  );
  // eslint-disable-next-line no-console
  console.log(`服务开启成功，访问地址为：\n${arr.join('\n')}`);
});
function getLocahost() {
  const obj = os.networkInterfaces();
  let arr = [];
  Object.keys(obj).forEach((item) => {
    let value = obj[item];
    if (Object.prototype.toString.call(value).slice(8, -1) === 'Array') {
      arr = [
        ...arr,
        ...value
          .filter((item) => item.family == 'IPv4')
          .map((item) => item.address),
      ];
    }
  });
  return arr;
}
