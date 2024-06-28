import $ from 'jquery';
import '../../css/common/reset.css';
import '../../css/common/common.css';
import '../../font/iconfont.css';
import '../notes/index.less';
import './index.less';
import {
  _setData,
  _getData,
  debounce,
  setPageScrollTop,
  toLogin,
  scrollState,
  throttle,
  queryURLParams,
  myOpen,
  isIframe,
  wrapInput,
  getScreenSize,
  isurl,
  _myOpen,
  longPress,
  isMobile,
  hdTitleHighlight,
  copyText,
  isLogin,
} from '../../js/utils/utils';
import _d from '../../js/common/config';
import '../../js/common/common';
import pagination from '../../js/plugins/pagination';
import _msg from '../../js/plugins/message';
import _pop from '../../js/plugins/popConfirm';
import realtime from '../../js/plugins/realtime';
import {
  reqUserDeleteTrash,
  reqUserRecoverTrash,
  reqUserTrashList,
} from '../../api/user';
import toolTip from '../../js/plugins/tooltip';
import rMenu from '../../js/plugins/rightMenu';
import { showBmkInfo } from '../../js/utils/showinfo';
if (!isLogin()) {
  toLogin();
}
// 数据同步
realtime.read((res) => {
  const {
    type,
    data: { flag },
  } = res;
  if (type === 'updatedata' && flag === 'trash') {
    renderList();
  }
});
const $headWrap = $('.head_wrap'),
  $contentWrap = $('.content_wrap'),
  $footer = $('.footer');
let { HASH } = queryURLParams(myOpen());
if (!HASH) {
  HASH = 'note';
}
// 搜索
const wInput = wrapInput($headWrap.find('.inp_box input')[0], {
  change(val) {
    val = val.trim();
    if (val == '') {
      $headWrap.find('.inp_box i').css('display', 'none');
    } else {
      $headWrap.find('.inp_box i').css('display', 'block');
    }
    $contentWrap.pagenum = 1;
    _renderList(true);
  },
  focus(target) {
    $(target).parent().addClass('focus');
  },
  blur(target) {
    $(target).parent().removeClass('focus');
  },
});
function listLoading() {
  let str = '';
  new Array(50).fill(null).forEach(() => {
    str += `<ul style="pointer-events: none;height:40px;margin-bottom:6px;background-color: var(--color9);" class="item_box"></ul>`;
  });
  $contentWrap.html(str);
  setPageScrollTop(0);
}
let curPageSize = _getData('trashPageSize');
$contentWrap.pagenum = 1;
$contentWrap.list = [];
function getListItem(id) {
  return $contentWrap.list.find((item) => item.id === id);
}
const defaultRes = `<p style='text-align: center;'>${_d.emptyList}</p>`;
const _renderList = debounce(renderList, 1000);
function renderList(y) {
  let pagenum = $contentWrap.pagenum,
    a = wInput.getValue().trim(),
    slogo = 'icon-shoucang';
  if (a.length > 100) {
    _msg.error('搜索内容过长');
    return;
  }
  if (y) {
    listLoading();
  }
  myOpen(`/trash/#${encodeURIComponent(HASH)}`);
  pagenum ? null : (pagenum = 1);
  let btnText = '书签列表';
  if (HASH === 'note') {
    slogo = 'icon-jilu';
    btnText = '笔记';
  } else if (HASH === 'history') {
    slogo = 'icon-history';
    btnText = '历史记录';
  } else if (HASH === 'bookmk') {
    slogo = 'icon-shuqian';
    btnText = '书签';
  }
  $headWrap.find('.select_btn').text(btnText);
  let showpage = curPageSize;
  reqUserTrashList({
    word: a,
    pageNo: pagenum,
    pageSize: showpage,
    type: HASH,
  })
    .then((result) => {
      if (parseInt(result.code) === 0) {
        let str = '';
        let { total, data, pageNo, splitWord } = result.data;
        $contentWrap.list = data;
        $contentWrap.pagenum = pageNo;
        if (data.length === 0) {
          str += defaultRes;
        } else {
          data.forEach((v) => {
            let { name, id, link, data } = v;
            name ? null : (name = data);
            link ? (name = `${name} (${link})`) : null;
            str += `<ul class="item_box" data-id="${id}" data-type="${HASH}">
                  <div cursor check="n" class="check_state"></div>
                  <li class="item_type iconfont ${slogo}"></li>
                  <li ${
                    HASH !== 'booklist' ? 'cursor' : ''
                  } class="item_title">${hdTitleHighlight(splitWord, name)}</li>
                  <li cursor class="set_btn iconfont icon-icon"></li>
                </ul>`;
          });
        }
        str += `<div class="pagingbox">`;
        str += pgnt.getHTML({
          pageNo,
          pageSize: showpage,
          total,
          small: getScreenSize().w <= _d.screen,
        });
        str += `</div > `;
        $contentWrap.html(str).addClass('open');
        $headWrap.addClass('open');
        $headWrap._checkState = false;
        $footer.stop().slideUp(_d.speed);
        if (y) {
          setPageScrollTop(0);
        }
      }
    })
    .catch(() => {});
}
const pgnt = pagination($contentWrap[0], {
  change(val) {
    $contentWrap.pagenum = val;
    renderList(true);
    _msg.botMsg(`第 ${$contentWrap.pagenum} 页`);
  },
  changeSize(val) {
    curPageSize = val;
    _setData('trashPageSize', curPageSize);
    $contentWrap.pagenum = 1;
    renderList(true);
    _msg.botMsg(`第 ${$contentWrap.pagenum} 页`);
  },
  toTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  },
});
renderList(true);
if (isIframe()) {
  $headWrap.find('.h_go_home').remove();
}
function getTypeText(type) {
  switch (type) {
    case 'note':
      return '笔记';
    case 'booklist':
      return '书签列表';
    case 'bookmk':
      return '书签';
    case 'history':
      return '历史记录';
    default:
      return '';
  }
}
$headWrap
  .on('click', '.h_go_home', function () {
    myOpen('/');
  })
  .on('click', '.h_check_item_btn', hdCheckItemBtn)
  .on('click', '.select_btn', function (e) {
    const data = [
      { text: '笔记', param: { value: 'note' } },
      { text: '书签列表', param: { value: 'booklist' } },
      { text: '书签', param: { value: 'bookmk' } },
      { text: '历史记录', param: { value: 'history' } },
    ];
    data.forEach((item, idx) => {
      item.id = idx + 1;
      if (item.param.value == HASH) {
        item.active = true;
      } else {
        item.active = false;
      }
    });
    rMenu.selectMenu(
      e,
      data,
      ({ close, id, param }) => {
        if (id) {
          close();
          HASH = param.value;
          $contentWrap.pagenum = 1;
          renderList(true);
        }
      },
      '选择列表类型'
    );
  })
  .on('click', '.inp_box i', function () {
    wInput.setValue('');
    wInput.target.focus();
  });
function hdRecover(e, ids, t, cb, isCheck) {
  const text = getTypeText(t);
  _pop({ e, text: `确认恢复：${isCheck ? '选中的' : ''}${text}？` }, (type) => {
    if (type == 'confirm') {
      reqUserRecoverTrash({
        ids,
        type: t,
      })
        .then((result) => {
          if (parseInt(result.code) === 0) {
            _msg.success(result.codeText);
            renderList();
            cb && cb();
            return;
          }
        })
        .catch(() => {});
    }
  });
}
function hdDel(e, ids, t, cb, isCheck) {
  const text = getTypeText(t);
  _pop(
    {
      e,
      text: `确认删除：${isCheck ? '选中的' : ''}${text}？`,
      confirm: { type: 'danger', text: '删除' },
    },
    (type) => {
      if (type == 'confirm') {
        reqUserDeleteTrash({
          ids,
          type: t,
        })
          .then((result) => {
            if (parseInt(result.code) === 0) {
              _msg.success(result.codeText);
              renderList();
              cb && cb();
              return;
            }
          })
          .catch(() => {});
      }
    }
  );
}
function getSearchEngine() {
  return (
    _d.searchEngineData[_getData('searchengine')] || _d.searchEngineData[0]
  );
}
$contentWrap
  .on('click', '.set_btn', function (e) {
    const $this = $(this);
    const id = $this.parent().attr('data-id');
    const obj = getListItem(id);
    const t = $this.parent().attr('data-type');
    let data = [];
    if (t == 'note') {
      data.push({
        id: '1',
        text: '编辑笔记',
        beforeIcon: 'iconfont icon-bianji',
      });
    }
    data = [
      ...data,
      { id: '2', text: '恢复', beforeIcon: 'iconfont icon-chexiao' },
      {
        id: '3',
        text: '删除',
        beforeIcon: 'iconfont icon-shanchu',
      },
    ];
    rMenu.selectMenu(
      e,
      data,
      ({ e, close, id: flag }) => {
        if (flag == '2') {
          hdRecover(e, [id], t, () => {
            close();
          });
        } else if (flag == '3') {
          hdDel(e, [id], t, () => {
            close();
          });
        } else if (flag == '1') {
          close();
          e.stopPropagation();
          _myOpen(`/edit/#${encodeURIComponent(id)}`, obj.name);
        }
      },
      obj.name || obj.data
    );
  })
  .on('contextmenu', '.item_box', function (e) {
    e.preventDefault();
    if (isMobile()) return;
    if (!$footer.is(':hidden')) return;
    hdCheckItemBtn();
    checkedItem(this.querySelector('.check_state'));
  })
  .on('mouseenter', '.item_box', function () {
    const $this = $(this);
    const type = $this.attr('data-type');
    if (type === 'bookmk') {
      const obj = getListItem($this.attr('data-id'));
      const { name, link, des, group } = obj;
      const str = `分组：${group.id === 'home' ? '主页' : group.name}\n名称：${
        name || '--'
      }\n链接：${link || '--'}\n描述：${des || '--'}`;
      toolTip.setTip(str).show();
    }
  })
  .on('mouseleave', '.item_box', function () {
    toolTip.hide();
  })
  .on('click', '.item_type', function (e) {
    const $this = $(this).parent();
    const type = $this.attr('data-type');
    const obj = getListItem($this.attr('data-id'));
    if (type === 'bookmk') {
      showBmkInfo(e, obj);
    } else if (type === 'history') {
      copyText(obj.data);
    } else if (type === 'note') {
      copyText(obj.name);
    } else if (type === 'booklist') {
      copyText(obj.name);
    }
  })
  .on('click', '.item_title', function (e) {
    const $this = $(this);
    const type = $this.parent().attr('data-type');
    const obj = getListItem($this.parent().attr('data-id'));
    if (type === 'bookmk') {
      myOpen(obj.link, '_blank');
    } else if (type === 'history') {
      if (isurl(obj.data)) {
        myOpen(obj.data, '_blank');
      } else {
        const url = getSearchEngine().searchlink.replace(/\{\{\}\}/, obj.data);
        myOpen(url, '_blank');
      }
    } else if (type === 'note') {
      e.stopPropagation();
      _myOpen(`/note/?v=${encodeURIComponent(obj.id)}`, obj.name);
    }
  })
  .on('click', '.check_state', function () {
    checkedItem(this);
  });
longPress($contentWrap[0], '.item_box', function () {
  if (!$footer.is(':hidden')) return;
  hdCheckItemBtn();
  checkedItem(this.querySelector('.check_state'));
});
function checkedItem(el) {
  const $this = $(el),
    check = $this.attr('check');
  if (check === 'n') {
    $this.attr('check', 'y').css('background-color', _d.checkColor);
  } else {
    $this.attr('check', 'n').css('background-color', 'transparent');
  }
  const $itemBox = $contentWrap.find('.item_box'),
    $checkArr = $itemBox.filter(
      (_, item) => $(item).find('.check_state').attr('check') === 'y'
    );
  _msg.botMsg(`选中：${$checkArr.length}项`);
  if ($checkArr.length > 0) {
    $footer.stop().slideDown(_d.speed);
  } else {
    $footer.stop().slideUp(_d.speed);
  }
  if ($checkArr.length === $itemBox.length) {
    $footer.find('span').attr({
      class: 'iconfont icon-xuanzeyixuanze',
      check: 'y',
    });
  } else {
    $footer.find('span').attr({
      class: 'iconfont icon-xuanzeweixuanze',
      check: 'n',
    });
  }
}
function hdCheckItemBtn() {
  const $itemBox = $contentWrap.find('.item_box');
  if ($headWrap._checkState) {
    $itemBox.find('.check_state').css('display', 'none');
    $headWrap._checkState = false;
    $footer.stop().slideUp(_d.speed);
  } else {
    $itemBox
      .find('.check_state')
      .css('display', 'block')
      .attr('check', 'n')
      .css('background-color', 'transparent');
    $headWrap._checkState = true;
    $footer.stop().slideDown(_d.speed);
  }
  $footer.find('span').attr({
    class: 'iconfont icon-xuanzeweixuanze',
    check: 'n',
  });
}
// 获取选中项
function getCheckItems() {
  const $itemBox = $contentWrap.find('.item_box'),
    $checkArr = $itemBox.filter(
      (_, item) => $(item).find('.check_state').attr('check') === 'y'
    );
  const arr = [];
  $checkArr.each((i, v) => {
    arr.push(v.getAttribute('data-id'));
  });
  return arr;
}
$footer
  .on('click', '.f_delete', function (e) {
    const ids = getCheckItems();
    if (ids.length === 0) return;
    hdDel(e, ids, HASH, false, 1);
  })
  .on('click', '.f_recover', function (e) {
    const ids = getCheckItems();
    if (ids.length === 0) return;
    hdRecover(e, ids, HASH, false, 1);
  })
  .on('click', '.f_close', function () {
    let $itemBox = $contentWrap.find('.item_box');
    $itemBox
      .find('.check_state')
      .attr('check', 'n')
      .css('background-color', 'transparent');
    $footer.stop().slideUp(_d.speed);
  })
  .on('click', 'span', function () {
    let che = $(this).attr('check');
    che === 'y' ? (che = 'n') : (che = 'y');
    $footer.find('span').attr({
      class:
        che === 'y'
          ? 'iconfont icon-xuanzeyixuanze'
          : 'iconfont icon-xuanzeweixuanze',
      check: che,
    });
    let $itemBox = $contentWrap.find('.item_box');
    $itemBox
      .find('.check_state')
      .attr('check', che)
      .css('background-color', che === 'y' ? _d.checkColor : 'transparent');
    _msg.botMsg(`选中：${che === 'y' ? $itemBox.length : 0}项`);
  });
scrollState(
  window,
  throttle(function ({ type }) {
    if (type == 'up') {
      $headWrap.removeClass('open');
    } else {
      $headWrap.addClass('open');
    }
  }, 1000)
);
