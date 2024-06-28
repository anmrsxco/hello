const nodemailer = require('nodemailer');
const { _d } = require('../data/data');
const temData = {};
function sendMail(to, title, html) {
  return new Promise((resolve, reject) => {
    const { user, pass } = _d.email;
    if (!user) {
      reject('未配置发信邮箱');
      return;
    }
    const transporter = nodemailer.createTransport({
      host: 'smtp.qq.com',
      secureConnection: true,
      port: 465,
      auth: {
        user,
        pass,
      },
    });
    const options = {
      from: user,
      to,
      subject: title,
      html,
    };
    transporter.sendMail(options, function (err, msg) {
      if (err) {
        reject(err);
        return;
      }
      resolve(msg);
      transporter.close();
    });
  });
}
async function sendCode(to, code) {
  const html = `验证码 <span style="font-size:40px;color:#409eff;">${code}</span> 十分钟内有效，请勿泄露与转发。如非本人操作，请忽略此邮件。`;
  try {
    await sendMail(to, 'Hello账号验证邮件', html);
    temData['email' + to] = { t: Date.now(), code };
  } catch (error) {
    throw error;
  }
}
function clean() {
  const now = Date.now();
  Object.keys(temData).forEach((item) => {
    const { t } = item;
    if (now - t > 10 * 60 * 1000) {
      delete temData[item];
    }
  });
}
function get(email) {
  clean();
  const obj = temData['email' + email];
  return obj ? obj.code : '';
}
function del(email) {
  delete temData['email' + email];
}
const mailer = {
  get,
  del,
  sendMail,
  sendCode,
};
module.exports = mailer;
