import '../../css/common/reset.css';
import '../../font/iconfont.css';
import '../../css/common/common.css';
import './index.less';
import $ from 'jquery';
import '../../js/common/common';
import {
  computeSize,
  debounce,
  deepClone,
  encodeHtml,
  getPageScrollTop,
  getScreenSize,
  getWordCount,
  hdTitleHighlight,
  isIframe,
  isLogin,
  isRoot,
  loadingImg,
  myOpen,
  pageErr,
  setPageScrollTop,
  splitWord,
  toLogin,
  wrapInput,
} from '../../js/utils/utils';
import _msg from '../../js/plugins/message';
import _pop from '../../js/plugins/popConfirm';
import pagination from '../../js/plugins/pagination/index';
import _d from '../../js/common/config';
import { reqRootDeleteLog, reqRootLog, reqRootLogList } from '../../api/root';
import rMenu from '../../js/plugins/rightMenu';
let curName = null;
const $head = $('.header'),
  $main = $('.main'),
  $stat = $('.stat'),
  $foot = $('.footer');
$main.pageNo = 1;
$main.list = [];
let lPageSize = 20;
window.addEventListener('load', () => {
  $head.addClass('open');
});
// 搜索
const wInput = wrapInput($head.find('.inp_box input')[0], {
  change(val) {
    val = val.trim();
    if (val == '') {
      $head.find('.inp_box i').css('display', 'none');
    } else {
      $head.find('.inp_box i').css('display', 'block');
    }
    $main.pageNo = 1;
    _hdRender();
  },
  focus(target) {
    $(target).parent().addClass('focus');
  },
  blur(target) {
    $(target).parent().removeClass('focus');
  },
});
(() => {
  if (isLogin()) {
    if (!isRoot()) {
      pageErr();
    }
  } else {
    toLogin();
  }
})();
if (isIframe()) {
  $head.find('.h_go_home').remove();
}
// 日志列表
function getLogList(e) {
  reqRootLogList()
    .then((res) => {
      if (res.code == 0) {
        const data = [];
        res.data.forEach((item, idx) => {
          const { name, size } = item;
          data.push({
            id: idx + 1,
            text: `${name} - ${computeSize(size)}`,
            param: { name },
            beforeIcon: 'iconfont icon-rizhi',
          });
        });
        rMenu.selectMenu(
          e,
          data,
          ({ close, id, param }) => {
            if (id) {
              const name = param.name;
              close();
              getLogData(name);
            }
          },
          '日志列表'
        );
      }
    })
    .catch(() => {});
}
function getLogData(name) {
  loadingImg($main[0]);
  reqRootLog({ name })
    .then((res) => {
      if (res.code == 0) {
        $main.list = res.data.map((item) => ({ data: item }));
        $main.pageNo = 1;
        curName = name;
        hdRender();
        $stat.pageNo = 1;
        $stat.list = getStatData(res.data);
        $stat.html('');
        renderStat();
        $head.find('.del_btn').css('display', 'block');
        $head.find('.refresh_btn').css('display', 'block');
        $head.find('.log_info').css('display', 'block').text(name);
      }
    })
    .catch(() => {});
}
$head
  .on('click', '.del_btn', function (e) {
    if (curName) {
      dellog(e, curName);
    }
  })
  .on('click', '.refresh_btn', function () {
    if (curName) {
      getLogData(curName);
    }
  })
  .on('click', '.clean_btn', function (e) {
    dellog(e, 'all');
  })
  .on('click', '.h_go_home', function () {
    myOpen('/');
  })
  .on('click', '.select_btn', getLogList)
  .on('click', '.inp_box i', function () {
    wInput.setValue('');
    wInput.target.focus();
  });
$stat.list = [];
$stat.pageNo = 1;
// 访问统计
function getStatData(list) {
  const reg = /\[([^\[\]]+)\]\(([0-9A-Fa-f.:]+)\)/,
    ipObj = {};
  list.forEach((item) => {
    const ip = item.match(reg);
    if (ip) {
      const key = ip[2],
        addr = ip[1];
      if (ipObj.hasOwnProperty(key)) {
        ipObj[key]['total']++;
      } else {
        ipObj[key] = {
          total: 1,
          addr: addr,
        };
      }
    }
  });
  const ipArr = [];
  Object.keys(ipObj).forEach((item) => {
    ipArr.push({
      ip: item,
      total: ipObj[item]['total'],
      addr: ipObj[item]['addr'],
    });
  });
  ipArr.sort((a, b) => b.total - a.total);
  return ipArr;
}
function renderStat() {
  let str = '';
  $stat.list
    .slice(($stat.pageNo - 1) * 50, $stat.pageNo * 50)
    .forEach((item) => {
      const { ip, total, addr } = item;
      str += `<p><span cursor class='ip'>${encodeHtml(ip)}</span>(${encodeHtml(
        addr
      )})<span>：${total}</span></p>`;
    });
  $stat.append(str);
}
$stat.on('click', '.ip', function () {
  wInput.setValue(this.innerText);
});
window.addEventListener(
  'scroll',
  debounce(function () {
    if (
      getPageScrollTop() + this.document.documentElement.clientHeight >
      this.document.documentElement.scrollHeight - 50
    ) {
      $stat.pageNo++;
      renderStat();
    }
  }, 500)
);
// 分页
const pgnt = pagination($foot[0], {
  change(val) {
    $main.pageNo = val;
    hdRender();
    _msg.botMsg(`第 ${$main.pageNo} 页`);
  },
  changeSize(val) {
    lPageSize = val;
    $main.pageNo = 1;
    hdRender();
    _msg.botMsg(`第 ${$main.pageNo} 页`);
  },
  toTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  },
});
const _hdRender = debounce(hdRender, 1000);
const defaultRes = `<p style='text-align: center;'>${_d.emptyList}</p>`;
// 生成日志列表
async function hdRender() {
  const word = await splitWord(wInput.getValue());
  let str = '';
  let arr = deepClone($main.list);
  if (word) {
    arr = arr.map((item) => {
      item.num = getWordCount(word, item.data);
      return item;
    });
    arr.sort((a, b) => b.num - a.num);
    arr = arr.filter((item) => item.num > 0);
  }
  const pageTotal = Math.ceil(arr.length / lPageSize);
  $main.pageNo < 1
    ? ($main.pageNo = pageTotal)
    : $main.pageNo > pageTotal
    ? ($main.pageNo = 1)
    : null;
  if (arr.length == 0) {
    str += defaultRes;
  } else {
    arr
      .slice(($main.pageNo - 1) * lPageSize, $main.pageNo * lPageSize)
      .forEach((item) => {
        const data = item.data;
        str += `<p>${hdTitleHighlight(word, data)}</p>`;
      });
  }
  pgnt.render({
    pageNo: $main.pageNo,
    pageSize: lPageSize,
    total: arr.length,
    small: getScreenSize().w <= _d.screen,
  });
  $main.html(str);
  setPageScrollTop(0);
}
// 生成日志
function dellog(e, name) {
  _pop(
    {
      e,
      text: `确认${name == 'all' ? '清空：所有日志文件' : `删除：${name}`}？`,
      confirm: { type: 'danger', text: name == 'all' ? '清空' : '删除' },
    },
    (type) => {
      if (type == 'confirm') {
        reqRootDeleteLog({ name })
          .then((res) => {
            if (res.code == 0) {
              _msg.success('删除成功');
              $main.list = [];
              curName = null;
              $main.html('');
              $foot.html('');
              $stat.list = [];
              $stat.html('');
              $head.find('.del_btn').css('display', 'none');
              $head.find('.refresh_btn').css('display', 'none');
              $head.find('.log_info').css('display', 'none').text('');
            }
          })
          .catch(() => {});
      }
    }
  );
}
