import { reqUserGetRealTime, reqUserRealTime } from '../../../api/user';
import { _setTimeout } from '../../utils/utils';

let fg = 0;
function read(cb) {
  reqUserGetRealTime({ flag: fg })
    .then((res) => {
      fg = res.data.flag; //更新标识
      read(cb);
      if (res.code == 0) {
        cb && cb(res.data.data);
      }
    })
    .catch(() => {
      _setTimeout(() => {
        read(cb);
      }, 5000);
    });
}
function send(data) {
  //发送指令
  reqUserRealTime(data)
    .then(() => {})
    .catch(() => {});
}
const realtime = {
  read,
  send,
};
export default realtime;
