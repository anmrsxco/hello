import $ from 'jquery';
import '../../css/common/reset.css';
import '../../css/common/common.css';
import '../../font/iconfont.css';
import './index.less';
import {
  queryURLParams,
  myOpen,
  imgjz,
  encodeHtml,
  pageErr,
  setPageScrollTop,
  getTextImg,
  formatDate,
  enterPassCode,
  _getDataTem,
  _setDataTem,
  hdPath,
  debounce,
  userLogoMenu,
  LazyLoad,
  getScreenSize,
  hdOnce,
} from '../../js/utils/utils';
import imgMrLogo from '../../images/img/mrlogo.png';
import '../../js/common/common';
import _msg from '../../js/plugins/message';
import { reqBmkGetShare, reqBmkSaveShare } from '../../api/bmk';
import pagination from '../../js/plugins/pagination';
import _d from '../../js/common/config';
import toolTip from '../../js/plugins/tooltip/index';
import rMenu from '../../js/plugins/rightMenu';
import { showBmkInfo } from '../../js/utils/showinfo';
const urlparmes = queryURLParams(myOpen()),
  HASH = urlparmes.HASH;
if (!HASH) {
  pageErr();
}
let pageNo = 1;
let bmList = [];
let bmPageSize = 12;
let passCode = _getDataTem('passCode', HASH) || '';
const bmLoadImg = new LazyLoad();
const $box = $('.box');
const $head = $('.head');
const $paginationBox = $('.pagination_box');
// 生成列表
function renderList() {
  const pageTotal = Math.ceil(bmList.length / bmPageSize);
  pageNo < 1 ? (pageNo = pageTotal) : pageNo > pageTotal ? (pageNo = 1) : null;
  let str = '';
  bmList
    .slice((pageNo - 1) * bmPageSize, pageNo * bmPageSize)
    .forEach((item) => {
      let { name, des, id } = item;
      des = des ? encodeHtml(des) : '';
      name = encodeHtml(name);
      str += `<li data-id="${id}" cursor class="bm_item jzxz">
        <div class="logo"></div>
        <div class="bm_title">${name}</div>
        <p>${des || '描述'}</p>
        </li>`;
    });
  pgnt.render({
    pageSize: bmPageSize,
    total: bmList.length,
    pageNo,
    small: getScreenSize().w <= _d.screen,
  });
  $box.html(str).addClass('open');
  $head.addClass('open');
  $paginationBox.addClass('open');
  bmLoadImg.bind($box[0].querySelectorAll('.bm_item'), (item) => {
    const $item = $(item),
      { link } = getBmInfo($item.attr('data-id')),
      url = `/api/getfavicon?u=${encodeURIComponent(link)}`;
    const $img = $item.find('.logo');
    imgjz(
      url,
      () => {
        $img
          .css({
            'background-image': `url(${url})`,
          })
          .addClass('load');
      },
      () => {
        $img
          .css({
            'background-image': `url(${imgMrLogo})`,
          })
          .addClass('load');
      }
    );
  });
  setPageScrollTop(0);
}
// 分页
const pgnt = pagination($paginationBox[0], {
  select: [12, 24, 36, 48],
  change(val) {
    pageNo = val;
    renderList();
  },
  changeSize(val) {
    bmPageSize = val;
    pageNo = 1;
    renderList();
  },
  toTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  },
});
let defaultTitle = '';
function getBmInfo(id) {
  return bmList.find((item) => item.id == id);
}
const verifyCode = hdOnce(() => {
  enterPassCode(({ close, val }) => {
    passCode = val;
    getShareData(close);
  });
});
// 获取书签数据
function getShareData(close) {
  reqBmkGetShare({ id: HASH, pass: passCode })
    .then((res) => {
      if (res.code == 0) {
        _setDataTem('passCode', passCode, HASH);
        close && close();
        let { username, logo, account, data, title, valid, email } = res.data;
        $head._uObj = { username, account, email };
        defaultTitle = title;
        logo = logo
          ? hdPath(`/api/logo/${account}/${logo}`)
          : getTextImg(username);
        imgjz(
          logo,
          () => {
            $head.find('.logo').css('background-image', `url(${logo})`);
          },
          () => {
            $head
              .find('.logo')
              .css('background-image', `url(${getTextImg(username)})`);
          }
        );
        $head.find('.from').text(username);
        $head.find('.title').text(title);
        $head.find('.valid').text(
          valid == 0
            ? '永久'
            : formatDate({
                template: '{0}-{1}-{2} {3}:{4}',
                timestamp: valid,
              })
        );
        bmList = data;
        renderList();
      } else if (res.code == 3) {
        if (passCode) {
          _msg.error('提取码错误');
        }
        verifyCode();
      }
    })
    .catch(() => {});
}
getShareData();
// 保存书签
function saveBm(e) {
  rMenu.inpMenu(
    e,
    {
      subText: '提交',
      items: {
        name: {
          value: defaultTitle,
          placeholder: '书签分组名称',
          verify(val) {
            if (val.trim() == '') {
              return '请输入名称';
            } else if (val.trim().length > 100) {
              return '名称过长';
            }
          },
        },
      },
    },
    debounce(
      function ({ close, inp }) {
        reqBmkSaveShare({ id: HASH, name: inp.name, pass: passCode })
          .then((res) => {
            if (res.code == 0) {
              _msg.success(res.codeText);
              close();
            }
          })
          .catch(() => {});
      },
      1000,
      true
    ),
    '保存书签到分组'
  );
}
$head
  .on('click', '.logo', function (e) {
    const { account, username, email } = $head._uObj;
    userLogoMenu(e, account, username, email);
  })
  .on('click', '.save_to_list', saveBm);
$box
  .on('click', '.bm_item', function () {
    const $this = $(this),
      { link } = getBmInfo($this.attr('data-id'));
    myOpen(link, '_blank');
  })
  .on('click', '.logo', function (e) {
    e.stopPropagation();
    const $this = $(this).parent(),
      obj = getBmInfo($this.attr('data-id'));
    showBmkInfo(e, obj);
  })
  .on('mouseenter', '.bm_item', function () {
    const $this = $(this);
    const id = $this.attr('data-id');
    const { name, link, des } = getBmInfo(id);
    const str = `名称：${name || '--'}\n链接：${link || '--'}\n描述：${
      des || '--'
    }`;
    toolTip.setTip(str).show();
  })
  .on('mouseleave', '.bm_item', function () {
    toolTip.hide();
  });
