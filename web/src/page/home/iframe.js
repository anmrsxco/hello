import $ from 'jquery';
import {
  ContentScroll,
  _getTarget,
  encodeHtml,
  getScreenSize,
  imgjz,
  isFullScreen,
  isMobile,
  longPress,
  myDrag,
  myOpen,
  myResize,
  nanoid,
  toCenter,
  toHide,
  toSetSize,
} from '../../js/utils/utils';
import { backWindow, setZidx } from './backWindow';
import imgMrLogo from '../../images/img/mrlogo.png';
import { closeAllwindow, hideAllwindow } from './index';
import rMenu from '../../js/plugins/rightMenu';
const $minimizeBox = $('.minimize_box');
// 标签logo
function getTagFont(type) {
  let font = 'iconfont ';
  if (type == 'notes') {
    font += `icon-mingcheng-jiluben`;
  } else if (type == 'note') {
    font += `icon-jilu`;
  } else if (type == 'history') {
    font += `icon-history`;
  } else if (type == 'bmk') {
    font += `icon-shuqian`;
  } else if (type == 'edit') {
    font += `icon-bianji`;
  } else if (type == 'log') {
    font += `icon-rizhi`;
  } else if (type == 'pic') {
    font += `icon-tupian`;
  } else if (type == 'trash') {
    font += `icon-huishouzhan`;
  } else if (type == 'root') {
    font += `icon-zhanghao`;
  } else if (type == 'sharebm') {
    font += `icon-fenxiang_2`;
  } else if (type == 'sharelist') {
    font += `icon-fenxiang_2`;
  } else if (type == 'sharemusic') {
    font += `icon-yinle1`;
  } else if (type == 'videoplay') {
    font += `icon-shipin1`;
  } else if (type == 'file' || type == 'sharefile') {
    font += `icon-24gl-folder`;
  } else if (type == 'notepad') {
    font += `icon-jilu`;
  }
  return font;
}
// 更新iframe标题
openInIframe.hdTitle = {
  data: {},
  add(id, i) {
    this.data[id] = i;
  },
  remove(id) {
    if (this.data.hasOwnProperty(id)) {
      delete this.data[id];
    }
  },
  updateTitle(id, val) {
    if (this.data.hasOwnProperty(id)) {
      const ifram = this.data[id];
      ifram.name = val;
      ifram.updateTitle();
    }
  },
};
window.openInIframe = openInIframe;
class CreateIframe {
  constructor(url, name) {
    this.url = url;
    this.name = name || url;
    this.id = nanoid();
    this.init();
  }
  init() {
    this.box = document.createElement('div');
    this.box.className = 'iframe_warp jzxz';
    let str = `
    <div class="i_head_btns">
        <div cursor class="i_close_btn iconfont icon-guanbi"></div>
        <div cursor class="i_to_max_btn iconfont icon-xuanzeweixuanze"></div>
        <div cursor class="i_hide_btn iconfont icon-jianhao"></div>
        <div class="i_title_text"><p class="scroll_text"></p></div>
        <div cursor title="刷新" class="i_refresh_btn iconfont icon-suijibofang"></div>
        <div cursor title="新标签打开" class="i_new_page_open_btn iconfont icon-link1"></div>
      </div>
      <div class="con">
      <div class="iframe_mask"></div>
      <div class="iframe_load"></div>
      <iframe src="${encodeHtml(
        this.url
      )}" scrolling="yes" frameborder="0"></iframe>
      </div>
      `;
    this.box.innerHTML = str;
    this.scrollText = this.box.querySelector('.scroll_text');
    this.iframe = this.box.querySelector('iframe');
    this.iframeMask = this.box.querySelector('.iframe_mask');
    this.iframeLoad = this.box.querySelector('.iframe_load');
    this.scrollT = new ContentScroll(this.scrollText);
    this.iframe.onerror = this.iframe.onload = () => {
      try {
        this.iframeLoad.style.opacity = 0;
        this.iframeWindow = this.iframe.contentWindow;
        this.iframeWindow.onmousedown = () => {
          this.hdDown();
        };
        this.iframeWindow.ontouchstart = () => {
          this.hdStart();
        };
        this.iframeWindow.iframeId = this.id;
        // eslint-disable-next-line no-unused-vars
      } catch (error) {}
    };
    document.querySelector('#main').append(this.box);
    this.box.style.display = 'flex';
    this.hdZindex();
    toSetSize(this.box);
    toCenter(this.box);
    const _this = this;
    // 窗口缩放
    this.resizeClose = myResize({
      target: _this.box,
      down(target) {
        target.style.transition = '0s';
        showIframeMask();
      },
      up(target) {
        hideIframeMask();
        target._os = {
          w: target.offsetWidth,
          h: target.offsetHeight,
        };
      },
    });
    // 拖动窗口
    this.dragClose = myDrag({
      trigger: _this.box.querySelector('.i_title_text'),
      target: _this.box,
      down({ target }) {
        target.style.transition = '0s';
        showIframeMask();
      },
      up({ target, x, y, pointerX }) {
        hideIframeMask();
        const h = window.innerHeight;
        if (y <= 0 || y >= h) {
          _this.toMax();
        } else {
          target._op = {
            x,
            y,
          };
          _this.toRest(pointerX);
        }
      },
    });
    this.bandEvent();
    this.tagBox = addHideBox(this);
    this.updateTitle();
  }
  // 更新标题
  updateTitle() {
    this.scrollT.init(this.name);
    this.tagBox.querySelector('.title').innerText = this.name;
  }
  // 处理层级
  hdZindex() {
    setZidx(this.box, this.id, this.hdHide.bind(this));
  }
  // 全屏
  toMax() {
    const { w, h } = getScreenSize();
    this.box.style.transition =
      'top 0.5s ease-in-out, left 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out';
    this.box.style.top = 0 + 'px';
    this.box.style.left = 0 + 'px';
    this.box.style.width = w + 'px';
    this.box.style.height = h + 'px';
  }
  // 退出全屏
  toRest(pointerX) {
    let { x = 0, y = 0 } = this.box._op;
    const { w = 0, h = 0 } = this.box._os;
    this.box.style.transition =
      'top 0.5s ease-in-out, left 0.5s ease-in-out, width 0.5s ease-in-out, height 0.5s ease-in-out';
    if (pointerX) {
      // 如果是全屏
      if (isFullScreen(this.box)) {
        let percent = (pointerX - x) / this.box.offsetWidth;
        x = pointerX - w * percent;
        this.box._op.x = x;
      }
    }
    this.box.style.top = y + 'px';
    this.box.style.left = x + 'px';
    this.box.style.width = w + 'px';
    this.box.style.height = h + 'px';
  }
  bandEvent() {
    this.box.onclick = this.hdClick.bind(this);
    this.box.onmousedown = this.hdDown.bind(this);
    this.box.ontouchstart = this.hdStart.bind(this);
  }
  hdDown() {
    if (isMobile()) return;
    this.hdZindex();
  }
  hdStart() {
    if (!isMobile()) return;
    this.hdZindex();
  }
  close() {
    openInIframe.hdTitle.remove(this.id);
    this.box.onclick = null;
    this.box.onmousedown = null;
    this.box.ontouchstart = null;
    this.tagBox.remove();
    this.scrollT.close();
    this.iframe.src = 'about:blank';
    this.iframe.onerror = this.iframe.onload = null;
    try {
      this.iframeWindow.onmousedown = null;
      this.iframeWindow.ontouchstart = null;
      this.iframeWindow.document.write('');
      this.iframeWindow.document.clear();
      // eslint-disable-next-line no-unused-vars
    } catch (error) {}
    this.dragClose();
    this.resizeClose();
    toHide(this.box, { to: 'bottom', scale: 'small' }, () => {
      backWindow.remove(this.id);
      this.iframe.remove();
      this.box.remove();
    });
  }
  hdClick(e) {
    if (_getTarget(this.box, e, '.i_close_btn')) {
      this.close();
    } else if (_getTarget(this.box, e, '.i_to_max_btn')) {
      if (isFullScreen(this.box)) {
        this.toRest();
      } else {
        this.toMax();
      }
    } else if (_getTarget(this.box, e, '.i_refresh_btn')) {
      this.iframeLoad.style.opacity = 1;
      try {
        this.iframeWindow.location.reload();
        return;
        // eslint-disable-next-line no-unused-vars
      } catch (error) {}
      this.iframe.src = this.url;
    } else if (_getTarget(this.box, e, '.i_new_page_open_btn')) {
      try {
        let url = this.iframeWindow.location.href;
        this.url = url;
        // eslint-disable-next-line no-unused-vars
      } catch (error) {}
      myOpen(this.url, '_blank');
    } else if (_getTarget(this.box, e, '.i_hide_btn')) {
      this.hdHide();
    }
  }
  hdHide() {
    toHide(this.box, { to: 'top', scale: 'small', useVisibility: true }, () => {
      backWindow.remove(this.id);
      this.tagBox.classList.add('hide');
      this.scrollT.close();
    });
  }
}
function openInIframe(url, name) {
  const ifra = new CreateIframe(url, name);
  openInIframe.hdTitle.add(ifra.id, ifra);
  return ifra;
}
// 生成标签
function addHideBox(iframeBox) {
  const box = document.createElement('div');
  box.className = 'iframe_tag';
  box._iframeBox = iframeBox;
  box.setAttribute('title', iframeBox.url);
  box.setAttribute('cursor', '');

  const close = document.createElement('span');
  close.className = 'close_btn iconfont icon-guanbi';
  const title = document.createElement('span');
  title.className = 'title';
  title.innerText = iframeBox.name;
  const logo = document.createElement('span');
  const isOuterLink = iframeBox.url.startsWith('http');

  logo.className = `logo ${
    isOuterLink ? '' : getTagFont(iframeBox.url.split('/')[1])
  }`;
  if (isOuterLink) {
    const u = `/api/getfavicon?u=${encodeURIComponent(iframeBox.url)}`;
    imgjz(
      u,
      () => {
        logo.style.backgroundImage = `url(${u})`;
      },
      () => {
        logo.style.backgroundImage = `url(${imgMrLogo})`;
      }
    );
  }
  box.appendChild(logo);
  box.appendChild(title);
  box.appendChild(close);
  $minimizeBox[0].appendChild(box);
  return box;
}
// 切换显示/隐藏
function switchIframeBox() {
  const _this = this.parentNode;
  const htarget = _this._iframeBox.box;
  const obj = backWindow.getValue().slice(-1)[0];
  if (
    htarget.style.visibility == 'hidden' ||
    (obj && obj.id != _this._iframeBox.id)
  ) {
    _this._iframeBox.hdZindex();
    htarget.style.visibility = 'visible';
    _this._iframeBox.scrollT.init(_this._iframeBox.name);
    _this._iframeBox.toRest();
    _this.classList.remove('hide');
    return;
  }
  _this._iframeBox.hdHide();
}
$minimizeBox
  .on('click', '.title', switchIframeBox)
  .on('click', '.logo', function (e) {
    const _this = this.parentNode;
    handleHideBox(e, _this);
  })
  .on('click', '.close_btn', function () {
    const _this = this.parentNode;
    _this._iframeBox.close();
  })
  .on('contextmenu', '.iframe_tag', function (e) {
    e.preventDefault();
    if (isMobile()) return;
    const _this = this;
    handleHideBox(e, _this);
  });
longPress($minimizeBox[0], '.iframe_tag', function (e) {
  const _this = this,
    ev = e.changedTouches[0];
  handleHideBox(ev, _this);
});
// 标签菜单
function handleHideBox(e, _this) {
  const htarget = _this._iframeBox,
    url = htarget.url;
  const data = [
    {
      id: '1',
      text: '新标签打开',
      beforeIcon: 'iconfont icon-link1',
    },
    {
      id: '2',
      text: '隐藏所有窗口',
      beforeIcon: 'iconfont icon-jianhao',
    },
    {
      id: '3',
      text: '关闭所有窗口',
      beforeIcon: 'iconfont icon-guanbi1',
    },
  ];
  rMenu.selectMenu(
    e,
    data,
    ({ close, id }) => {
      close();
      if (id == '1') {
        myOpen(url, '_blank');
      } else if (id == '2') {
        hideAllwindow();
      } else if (id == '3') {
        closeAllwindow();
      }
    },
    _this.innerText
  );
}
export function closeAllIframe() {
  $minimizeBox[0].querySelectorAll('.iframe_tag').forEach((item) => {
    item._iframeBox.close();
  });
}
export function hideAllIframe() {
  $minimizeBox[0].querySelectorAll('.iframe_tag').forEach((item) => {
    item._iframeBox.hdHide();
  });
}
export function showIframeMask() {
  Object.keys(openInIframe.hdTitle.data).forEach((item) => {
    const ifra = openInIframe.hdTitle.data[item];
    ifra.iframeMask.style.display = 'block';
  });
}
export function hideIframeMask() {
  Object.keys(openInIframe.hdTitle.data).forEach((item) => {
    const ifra = openInIframe.hdTitle.data[item];
    ifra.iframeMask.style.display = 'none';
  });
}
