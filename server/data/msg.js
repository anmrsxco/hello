const connect = {};

function getFlag() {
  return Math.random().toFixed(10).slice(-10);
}
function get(key, cb) {
  if (!connect.hasOwnProperty(key)) {
    connect[key] = {
      id: '',
      flag: getFlag(),
      data: {},
      cbs: [cb],
    };
  } else {
    connect[key]['cbs'].push(cb);
  }
  const time = Date.now();
  connect[key]['t'] = time;
  clean(time);
  return connect[key];
}
function set(key, id, data) {
  if (!connect.hasOwnProperty(key)) return;
  connect[key].id = id;
  connect[key].flag = getFlag();
  connect[key].data = data;
  connect[key]['cbs'].forEach((item) => {
    item && item();
  });
}
function clean(time) {
  Object.keys(connect).forEach((key) => {
    const { t } = connect[key];
    if (time - t > 1000 * 60) {
      delete connect[key];
    }
  });
}
function getConnect() {
  return connect;
}
const msg = {
  get,
  set,
  getConnect,
};
module.exports = msg;
