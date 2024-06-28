import $ from 'jquery';
import '../../css/common/reset.css';
import '../../css/common/common.css';
import '../../font/iconfont.css';
import './index.less';
import './notes.less';
import {
  _setData,
  _getData,
  throttle,
  debounce,
  encodeHtml,
  _myOpen,
  setPageScrollTop,
  myOpen,
  toLogin,
  scrollState,
  showQcode,
  getPreUrl,
  queryURLParams,
  isIframe,
  wrapInput,
  getScreenSize,
  longPress,
  isMobile,
  hdTitleHighlight,
  isInteger,
  formatDate,
  isLogin,
} from '../../js/utils/utils';
import _d from '../../js/common/config';
import '../../js/common/common';
import pagination from '../../js/plugins/pagination';
import _msg from '../../js/plugins/message';
import _pop from '../../js/plugins/popConfirm';
import realtime from '../../js/plugins/realtime';
import {
  reqNoteCategory,
  reqNoteDelete,
  reqNoteSearch,
  reqNoteSetCategory,
  reqNoteState,
  reqNoteWeight,
} from '../../api/note';
import { CreateTabs } from './tabs';
import {
  isHideCategoryBox,
  renderCategoryList,
  showCategoryBox,
} from './category';
import toolTip from '../../js/plugins/tooltip';
import rMenu from '../../js/plugins/rightMenu';
import { showNoteInfo } from '../../js/utils/showinfo';
const $headWrap = $('.head_wrap'),
  $contentWrap = $('.content_wrap'),
  $noteCategory = $('.note_category'),
  $footer = $('.footer');
let runState = 'own';
let noteCategoryList = [];
const urlParams = queryURLParams(myOpen());
let { HASH } = urlParams;
if (urlParams.acc && urlParams.acc !== _getData('account')) {
  runState = 'other';
  $headWrap.find('.h_add_item_btn').remove();
  $headWrap.find('.h_check_item_btn').remove();
  $noteCategory.find('.setting_category').remove();
} else {
  if (isLogin()) {
    realtime.read((res) => {
      const {
        type,
        data: { flag },
      } = res;
      if (type === 'updatedata') {
        if (flag === 'note') {
          renderList();
        } else if (flag === 'category') {
          if (isHideCategoryBox()) {
            updataCategory();
          } else {
            renderCategoryList();
          }
        }
      }
    });
  } else {
    toLogin();
  }
}

export function setNoteCategoryList(val) {
  if (val === undefined) {
    return noteCategoryList;
  }
  noteCategoryList = val;
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
function updataCategory() {
  reqNoteCategory({ acc: urlParams.acc || '' })
    .then((res) => {
      if (res.code == 0) {
        noteCategoryList = res.data;
        tabsObj.list = categoryToArr(HASH || '');
        $noteCategory.addClass('open');
      }
    })
    .catch(() => {});
}
updataCategory();
// 添加分类条件
function hdCategoryAdd(e, cb) {
  const data = [];
  if (noteCategoryList.length === 0) {
    _msg.error('没有可选分类');
    return;
  }
  noteCategoryList.forEach((item) => {
    const { id, title } = item;
    data.push({ id, text: title, param: item });
  });
  rMenu.selectMenu(
    e,
    data,
    ({ id, param, close }) => {
      if (id) {
        cb && cb({ param, close });
      }
    },
    '选择分类'
  );
}
$noteCategory
  .on('click', '.setting_category', showCategoryBox)
  .on('click', '.clean_category', function () {
    tabsObj.list = [];
  });
function listLoading() {
  let str = '';
  new Array(50).fill(null).forEach(() => {
    str += `<ul style="pointer-events: none;height:40px;margin-bottom:6px;background-color: var(--color9);" class="item_box"></ul>`;
  });
  $contentWrap.html(str);
  setPageScrollTop(0);
}
// 渲染列表
$contentWrap.pagenum = 1;
let notePageSize = _getData('notePageSize');
let noteList = [];
// 生成列表
const _renderList = debounce(renderList, 1000);
function renderList(y) {
  let pagenum = $contentWrap.pagenum,
    word = wInput.getValue().trim();
  if (word.length > 100) {
    _msg.error('搜索内容过长');
    return;
  }
  if (y) {
    listLoading();
  }
  let showpage = notePageSize;
  const defaultRes = `<p style='text-align: center;'>${_d.emptyList}</p>`;
  const category = tabsObj.list.map((item) => item.id);
  reqNoteSearch({
    acc: urlParams.acc || '',
    word,
    pageNo: pagenum,
    pageSize: showpage,
    category,
  })
    .then((result) => {
      if (parseInt(result.code) === 0) {
        let str = '';
        const { total, data, pageNo, splitWord } = result.data;
        noteList = data;
        $contentWrap.pagenum = pageNo;
        if (data.length === 0) {
          str += defaultRes;
        } else {
          data.forEach((v) => {
            const { name, share, id, con, weight } = v;
            str += `<ul class="item_box" data-id="${id}">
                  <div cursor check="n" class="check_state"></div>
                  <li class="item_type iconfont icon-jilu"></li>
                  <li cursor class="item_title">${hdTitleHighlight(
                    splitWord,
                    name
                  )}</li>
                  ${
                    weight != 0 && !word && category.length === 0
                      ? `<li class="top_btn iconfont icon-zhiding" style="color: var(--color5);"></li>`
                      : ''
                  }
                  ${
                    runState == 'own'
                      ? `<li cursor class="lock_state iconfont ${
                          share === 'n'
                            ? 'icon-24gl-unlock2 open'
                            : 'icon-24gl-unlock4'
                        }"></li>
                        <li cursor class="set_btn iconfont icon-icon"></li>`
                      : ''
                  }
                  </ul>`;
            if (con && con.length > 0) {
              str += `<p>${hdHighlight(con)}</p>`;
            }
          });
        }
        $headWrap._checkState = false;
        $footer.stop().slideUp(_d.speed);
        hdPagination(str, pageNo, showpage, total, y);
      }
    })
    .catch(() => {});
}
function switchCleanBtnState() {
  const $clean = $noteCategory.find('.clean_category');
  if (tabsObj.list.length > 0) {
    $clean.css('display', 'block');
  } else {
    $clean.css('display', 'none');
  }
}
// 分类标签
const tabsObj = new CreateTabs({
  el: $noteCategory.find('.list')[0],
  change(data) {
    switchCleanBtnState();
    HASH = data.map((item) => item.id).join('-');
    myOpen(`#${HASH}`);
    $contentWrap.pagenum = 1;
    renderList(1);
  },
  add({ e, add }) {
    hdCategoryAdd(e, ({ param, close }) => {
      close();
      add(param);
    });
  },
});
// 获取笔记信息
function getNoteInfo(id) {
  return noteList.find((item) => item.id === id);
}
// 搜索高亮显示
function hdHighlight(con) {
  let s = '';
  con.forEach((item) => {
    const { type, value } = item;
    if (type == 'text') {
      s += encodeHtml(value);
    } else if (type == 'icon') {
      s += `<br/><span style="color:var(--btn-danger-color);">···</span><br/>`;
    } else if (type == 'word') {
      s += `<span style="color:var(--btn-danger-color);">${encodeHtml(
        value
      )}</span>`;
    }
  });
  return s;
}
// 分页
const pgnt = pagination($contentWrap[0], {
  change(val) {
    $contentWrap.pagenum = val;
    renderList(true);
    _msg.botMsg(`第 ${$contentWrap.pagenum} 页`);
  },
  changeSize(val) {
    notePageSize = val;
    _setData('notePageSize', notePageSize);
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
function hdPagination(str, pageNo, showpage, total, y) {
  str += `<div class="pagingbox">`;
  str += pgnt.getHTML({
    pageSize: showpage,
    pageNo,
    total,
    small: getScreenSize().w <= _d.screen,
  });
  str += `</div > `;
  $contentWrap.html(str).addClass('open');
  $headWrap.addClass('open');
  if (y) {
    setPageScrollTop(0);
  }
}
// 删除笔记
function deleteNote(e, ids, cb, name) {
  _pop(
    {
      e,
      text: `确认删除：${name || '选中的笔记'}？`,
      confirm: { type: 'danger', text: '删除' },
    },
    (type) => {
      if (type == 'confirm') {
        reqNoteDelete({ ids })
          .then((result) => {
            if (parseInt(result.code) === 0) {
              cb && cb();
              _msg.success(result.codeText);
              renderList();
            }
          })
          .catch(() => {});
      }
    }
  );
}
// 置顶笔记
function toTop(e, obj) {
  rMenu.inpMenu(
    e,
    {
      items: {
        num: {
          beforeText: '权重数：',
          value: obj.weight,
          inputType: 'number',
          placeholder: '0：取消；数值越大越靠前',
          verify(val) {
            val = val.trim();
            if (val == '') {
              return '请输入权重数';
            } else if (!isInteger(+val) || val < 0 || val > 9999) {
              return '请输入4位正整数';
            }
          },
        },
      },
    },
    debounce(
      function ({ inp, close }) {
        const w = inp.num;
        if (obj.weight == w) return;
        reqNoteWeight({ id: obj.id, weight: w })
          .then((res) => {
            if (res.code == 0) {
              close(1);
              renderList();
              _msg.success(res.codeText);
            }
          })
          .catch(() => {});
      },
      1000,
      true
    ),
    '置顶笔记'
  );
}
function categoryToArr(category) {
  const c = category.split('-').filter((item) => item);
  const res = [];
  c.forEach((id) => {
    const cInfo = noteCategoryList.find((item) => item.id === id);
    if (cInfo) {
      res.push(cInfo);
    }
  });
  return res;
}
// 笔记添加分类
function noteEditCategory(e, obj) {
  rMenu.selectTabs(
    e,
    categoryToArr(obj.category),
    {
      verify(data) {
        if (data.length > 10) {
          return '最多添加10个分类';
        }
      },
      add({ e, add }) {
        hdCategoryAdd(e, ({ param, close }) => {
          close();
          add(param);
        });
      },
      submit({ close, data }) {
        reqNoteSetCategory({
          id: obj.id,
          category: data.map((item) => item.id),
        })
          .then((res) => {
            if (res.code == 0) {
              close(1);
              renderList();
              _msg.success(res.codeText);
            }
          })
          .catch(() => {});
      },
    },
    '编辑分类'
  );
}
$contentWrap
  .on('click', '.set_btn', function (e) {
    if (runState !== 'own') return;
    const $this = $(this).parent();
    const obj = getNoteInfo($this.attr('data-id'));
    const { id: noteid, name, weight } = obj;
    const data = [
      { id: '1', text: '置顶', beforeIcon: 'iconfont icon-zhiding' },
      { id: '2', text: '分类', beforeIcon: 'iconfont icon-31liebiao' },
      { id: '3', text: '二维码', beforeIcon: 'iconfont icon-erweima' },
      { id: '4', text: '编辑笔记', beforeIcon: 'iconfont icon-bianji' },
      {
        id: '5',
        text: '删除',
        beforeIcon: 'iconfont icon-shanchu',
      },
    ];
    rMenu.selectMenu(
      e,
      data,
      ({ close, e, id }) => {
        if (id == '1') {
          toTop(e, { id: noteid, weight });
        } else if (id == '2') {
          noteEditCategory(e, obj);
        } else if (id == '3') {
          showQcode(
            e,
            `${getPreUrl()}/note/?v=${encodeURIComponent(noteid)}`,
            name
          );
        } else if (id == '4') {
          close();
          e.stopPropagation();
          _myOpen(`/edit/#${encodeURIComponent(noteid)}`, name);
        } else if (id == '5') {
          deleteNote(e, [noteid], close, name);
        }
      },
      name
    );
  })
  .on('click', '.item_title', function (e) {
    e.stopPropagation();
    const val = wInput.getValue().trim();
    const { name, id } = getNoteInfo($(this).parent().attr('data-id'));
    _myOpen(
      `/note/?v=${encodeURIComponent(id)}${
        val ? '#' + encodeURIComponent(val) : ''
      }`,
      name
    );
  })
  .on('contextmenu', '.item_box', function (e) {
    if (runState !== 'own') return;
    e.preventDefault();
    if (isMobile()) return;
    if (!$footer.is(':hidden')) return;
    hdCheckItemBtn();
    checkedItem(this.querySelector('.check_state'));
  })
  .on('mouseenter', '.item_box', function () {
    const { time, utime, category, visit_count, weight } = getNoteInfo(
      $(this).attr('data-id')
    );
    const arr = categoryToArr(category).map((item) => item.title);
    const str = `创建：${formatDate({
      template: '{0}-{1}-{2}',
      timestamp: time,
    })}\n更新：${formatDate({
      template: '{0}-{1}-{2}',
      timestamp: utime,
    })}\n分类：${arr.join('-') || '--'}\n阅读：${visit_count}\n权重：${weight}`;
    toolTip.setTip(str).show();
  })
  .on('mouseleave', '.item_box', function () {
    toolTip.hide();
  })
  .on('click', '.item_type', function (e) {
    const obj = getNoteInfo($(this).parent().attr('data-id'));
    const arr = categoryToArr(obj.category).map((item) => item.title);
    showNoteInfo(e, obj, arr);
  })
  .on(
    'click',
    '.lock_state',
    throttle(function () {
      if (runState !== 'own') return;
      const $this = $(this).parent();
      const obj = getNoteInfo($this.attr('data-id'));
      changeNoteState([obj.id], obj.share === 'n' ? 'y' : 'n');
    }, 2000)
  )
  .on('click', '.check_state', function () {
    checkedItem(this);
  });
// 切换笔记状态
function changeNoteState(ids, flag) {
  reqNoteState({ ids, flag })
    .then((result) => {
      if (parseInt(result.code) === 0) {
        _msg.success(result.codeText);
        renderList();
      }
    })
    .catch(() => {});
}
if (isIframe()) {
  $headWrap.find('.h_go_home').remove();
}
longPress($contentWrap[0], '.item_box', function () {
  if (!$footer.is(':hidden')) return;
  hdCheckItemBtn();
  checkedItem(this.querySelector('.check_state'));
});
// 选中笔记
function checkedItem(el) {
  if (runState !== 'own') return;
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
// 开启选中
function hdCheckItemBtn() {
  if (runState !== 'own') return;
  const $itemBox = $contentWrap.find('.item_box');
  if ($headWrap._checkState) {
    $itemBox
      .find('.check_state')
      .css('display', 'none')
      .attr('check', 'n')
      .css('background-color', 'transparent');
    $headWrap._checkState = false;
    $footer.stop().slideUp(_d.speed);
  } else {
    $itemBox.find('.check_state').css('display', 'block');
    $headWrap._checkState = true;
    $footer.stop().slideDown(_d.speed);
  }
  $footer.find('span').attr({
    class: 'iconfont icon-xuanzeweixuanze',
    check: 'n',
  });
}
$headWrap
  .on('click', '.h_go_home', function () {
    myOpen('/');
  })
  .on('click', '.h_add_item_btn', function (e) {
    if (runState !== 'own') return;
    e.stopPropagation();
    _myOpen('/edit/#new', '新笔记');
  })
  .on('click', '.h_check_item_btn', hdCheckItemBtn)
  .on('click', '.inp_box i', function () {
    wInput.setValue('');
    wInput.target.focus();
  });
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
    if (runState !== 'own') return;
    const ids = getCheckItems();
    if (ids.length === 0) return;
    deleteNote(e, ids);
  })
  .on('click', '.f_clock', function () {
    if (runState !== 'own') return;
    const ids = getCheckItems();
    if (ids.length === 0) return;
    changeNoteState(ids, 'n');
  })
  .on('click', '.f_open', function () {
    if (runState !== 'own') return;
    const ids = getCheckItems();
    if (ids.length === 0) return;
    changeNoteState(ids, 'y');
  })
  .on('click', '.f_close', function () {
    if (runState !== 'own') return;
    const $itemBox = $contentWrap.find('.item_box');
    $itemBox
      .find('.check_state')
      .css('display', 'none')
      .attr('check', 'n')
      .css('background-color', 'transparent');
    $headWrap._checkState = false;
    $footer.stop().slideUp(_d.speed);
  })
  .on('click', 'span', function () {
    if (runState !== 'own') return;
    let che = $(this).attr('check');
    che === 'y' ? (che = 'n') : (che = 'y');
    $footer.find('span').attr({
      class:
        che === 'y'
          ? 'iconfont icon-xuanzeyixuanze'
          : 'iconfont icon-xuanzeweixuanze',
      check: che,
    });
    const $itemBox = $contentWrap.find('.item_box');
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
