import $ from 'jquery';
import '../../css/common/reset.css';
import '../../css/common/common.css';
import '../../font/iconfont.css';
import './index.less';
import {
  getPreUrl,
  toLogin,
  showQcode,
  isIframe,
  myOpen,
  getScreenSize,
  encodeHtml,
  formatDate,
  createShare,
  getValidState,
  copyText,
  isLogin,
} from '../../js/utils/utils';
import '../../js/common/common';
import _msg from '../../js/plugins/message';
import _pop from '../../js/plugins/popConfirm';
import pagination from '../../js/plugins/pagination';
import _d from '../../js/common/config';
import realtime from '../../js/plugins/realtime';
import {
  reqUserDeleteShare,
  reqUserEditShare,
  reqUserShareList,
} from '../../api/user';
if (!isLogin()) {
  toLogin();
}
// 同步数据
realtime.read((res) => {
  const {
    type,
    data: { flag },
  } = res;
  if (type === 'updatedata' && flag === 'sharelist') {
    getShareList();
  }
});
const $contentWrap = $('.content_wrap'),
  $headBtns = $contentWrap.find('.head_btns'),
  $shareList = $contentWrap.find('.share_list');
let pageNo = 1;
let sList = [];
let sPageSize = 10;
// 生成列表
function renderShareList(total, pageNo, top) {
  let str = '';
  if (sList.length === 0) {
    str += `<p>${_d.emptyList}</p>`;
  } else {
    sList.forEach((item) => {
      let { id, type, title, pass, valid } = item,
        logo = 'icon-shoucang',
        url = getPreUrl();
      if (type == 'music') {
        logo = `icon-yinle1`;
        url += `/sharemusic/#${id}`;
      } else if (type == 'bookmk') {
        logo = `icon-shuqian`;
        url += `/sharebm/#${id}`;
      } else if (type == 'file') {
        logo = `icon-24gl-fileText`;
        url += `/sharefile/#${id}`;
      } else if (type == 'dir') {
        logo = `icon-24gl-folder`;
        url += `/sharefile/#${id}`;
      }
      let v = '永久';
      const state = getValidState(valid);
      if (state > 0) {
        v = formatDate({ template: '{0}-{1}-{2} {3}:{4}', timestamp: valid });
      } else if (state < 0) {
        v = '已过期';
      }
      str += `<li data-id="${id}" data-url="${encodeHtml(url)}">
              <div cursor class="item_type_logo iconfont ${logo}"></div>
              <div title="点击复制分享链接" class="title">名称：<span>${encodeHtml(
                title
              )}</span> ； 提取码：<span>${
        encodeHtml(pass) || '无'
      }</span> ； 有效期：<span style="${
        state < 0 ? `color:red;` : ''
      }">${v}</span> ； </div>
              <div cursor class="copy_link iconfont icon-erweima"></div>
              <div cursor class="edit iconfont icon-bianji"></div>
              <div cursor class="delete iconfont icon-guanbi"></div>
            </li>
            `;
    });
    str += '<div class="pagination" style="padding: 20px 0">';
    str += pgnt.getHTML({
      pageNo,
      pageSize: sPageSize,
      total,
      small: getScreenSize().w <= _d.screen,
    });
    str += '</div>';
  }
  $shareList.html(str).addClass('open');
  $headBtns.addClass('open');
  if (top) {
    $shareList.scrollTop(0);
  }
}
// 分页
const pgnt = pagination($shareList[0], {
  change(val) {
    pageNo = val;
    getShareList(1);
    _msg.botMsg(`第 ${pageNo} 页`);
  },
  changeSize(val) {
    sPageSize = val;
    pageNo = 1;
    getShareList(1);
    _msg.botMsg(`第 ${pageNo} 页`);
  },
  toTop() {
    $shareList.stop().animate({
      scrollTop: 0,
    });
  },
});
// 获取分享数据
function getShareList(top) {
  reqUserShareList({ pageNo, pageSize: sPageSize })
    .then((res) => {
      if (res.code == 0) {
        const { data, total } = res.data;
        pageNo = res.data.pageNo;
        sList = data;
        renderShareList(total, pageNo, top);
      }
    })
    .catch(() => {});
}
// 获取分享信息
function getShareItem(id) {
  return sList.find((item) => item.id == id);
}
getShareList(1);
// 删除
function deleteShare(e, obj) {
  _pop(
    {
      e,
      text: `确认删除：${obj.title}？`,
      confirm: { type: 'danger', text: '删除' },
    },
    (type) => {
      if (type == 'confirm') {
        reqUserDeleteShare({ ids: [obj.id] })
          .then((res) => {
            if (res.code == 0) {
              _msg.success(res.codeText);
              getShareList();
            }
          })
          .catch(() => {});
      }
    }
  );
}
// 编辑
function editShare(e, obj) {
  createShare(
    e,
    {
      title: '编辑分享项',
      name: obj.title,
      valid: getValidState(obj.valid),
      pass: obj.pass,
    },
    ({ close, inp }) => {
      const { title, pass, valid } = inp;
      reqUserEditShare({ id: obj.id, title, pass, valid })
        .then((result) => {
          if (parseInt(result.code) === 0) {
            close(1);
            getShareList();
          }
        })
        .catch(() => {});
    }
  );
}
$shareList
  .on('click', '.delete', function (e) {
    const obj = getShareItem($(this).parent().attr('data-id'));
    deleteShare(e, obj);
  })
  .on('click', '.edit', function (e) {
    const obj = getShareItem($(this).parent().attr('data-id'));
    editShare(e, obj);
  })
  .on('click', '.copy_link', function (e) {
    const $this = $(this);
    const url = $this.parent().attr('data-url');
    const id = $this.parent().attr('data-id');
    const obj = getShareItem(id);
    showQcode(e, url, obj.title).catch(() => {});
  })
  .on('click', '.item_type_logo', function () {
    const $this = $(this);
    const url = $this.parent().attr('data-url');
    const id = $this.parent().attr('data-id');
    const obj = getShareItem(id);
    const str = `分享名称：${obj.title}\n分享链接：${url}\n访问密码：${
      obj.pass || '无'
    }`;
    copyText(str);
  });
if (isIframe()) {
  $headBtns.find('.h_go_home').remove();
}
$headBtns
  .on('click', '.clear_share_list_btn', function (e) {
    _pop(
      {
        e,
        text: `确认清空：当页分享？`,
        confirm: { type: 'danger', text: '清空' },
      },
      (type) => {
        if (type == 'confirm') {
          reqUserDeleteShare({ ids: sList.map((item) => item.id) })
            .then((res) => {
              if (res.code == 0) {
                _msg.success(res.codeText);
                getShareList();
              }
            })
            .catch(() => {});
        }
      }
    );
  })
  .on('click', '.h_go_home', function () {
    myOpen('/');
  });
