import './index.less';
const { encodeHtml, _getTarget, unique } = require('../../../js/utils/utils');

export class CreateTabs {
  constructor(opt = {}) {
    const defaultOpt = {
      el: null,
      data: [],
      add: null,
      change: null,
    };
    this.opt = Object.assign(defaultOpt, opt);
    if (typeof this.opt.el === 'string') {
      this.opt.el = document.querySelector(this.opt.el);
    }
    this.init();
  }
  init() {
    this.box = document.createElement('div');
    this.box.className = 'tabs_box';
    this.opt.el.appendChild(this.box);
    this.render();
    this.bindEvent();
  }
  hdChange() {
    this.opt.data = unique(this.opt.data, ['id']);
    this.opt.change && this.opt.change(this.opt.data);
  }
  render() {
    let str = '';
    this.opt.data.forEach((item) => {
      const { id, title } = item;
      str += `<div class="tab" data-id="${id}"><span class="text">${encodeHtml(
        title
      )}</span><i cursor class="iconfont close icon-guanbi"></i></div>`;
    });
    str += '<div cursor class="add_tab iconfont icon-jiajian1"></div>';
    this.box.innerHTML = str;
  }
  bindEvent() {
    this._hdClick = this.hdClick.bind(this);
    this.box.addEventListener('click', this._hdClick);
  }
  unBindEvent() {
    this.box.removeEventListener('click', this._hdClick);
  }
  add(tab) {
    this.opt.data.push(tab);
    this.hdChange();
    this.render();
  }
  remove(id) {
    this.opt.data = this.opt.data.filter((item) => item.id !== id);
    this.hdChange();
    this.render();
  }
  hdClick(e) {
    const close = _getTarget(this.box, e, '.tab .close', 1);
    const addTab = _getTarget(this.box, e, '.add_tab', 1);
    if (close) {
      const id = close.parentNode.dataset.id;
      this.remove(id);
    } else if (addTab) {
      this.opt.add && this.opt.add({ e, add: this.add.bind(this) });
    }
  }
  get list() {
    return this.opt.data;
  }
  set list(val) {
    this.opt.data = val;
    this.hdChange();
    this.render();
  }
}
