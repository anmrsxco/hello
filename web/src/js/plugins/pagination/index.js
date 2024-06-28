import './index.less';
import {
  _getTarget,
  _mySlide,
  _setTimeout,
  creatSelect,
  inputPageNo,
} from '../../utils/utils';
/*
 *pageNo:当前页
 *pageSize:每页展示多少条
 *total:一共多少条
 *continuous:连续页码条数
 */
class Pagination {
  constructor(el, opt = {}) {
    this.el = el;
    const defaultOpt = {
      pageNo: 1,
      total: 0,
      totalPage: 1,
      continuous: 5,
      pageSize: 20,
      showTotal: true,
      small: false,
      select: [20, 40, 60, 80, 100, 200],
      toTop: false,
      change: false,
      changeSize: false,
    };
    this.opt = Object.assign(defaultOpt, opt);
    this.init();
  }
  init() {
    this.bindEvent();
    this.mySlide = _mySlide({
      el: this.el,
      left: (e) => {
        if (!_getTarget(this.el, e, '.paginationBox')) return;
        e.stopPropagation();
        // 避免影响绑定到当前元素的其他手势操作
        _setTimeout(() => {
          this.opt.pageNo++;
          this.hdChange();
        });
      },
      right: (e) => {
        if (!_getTarget(this.el, e, '.paginationBox')) return;
        e.stopPropagation();
        _setTimeout(() => {
          this.opt.pageNo--;
          this.hdChange();
        });
      },
    });
  }
  bindEvent() {
    this._hdClick = this.hdClick.bind(this);
    this.el.addEventListener('click', this._hdClick);
  }
  unBind() {
    this.el.removeEventListener('click', this._hdClick);
    this.mySlide();
  }
  hdChange() {
    this.opt.pageNo < 1
      ? (this.opt.pageNo = this.opt.totalPage)
      : this.opt.pageNo > this.opt.totalPage
      ? (this.opt.pageNo = 1)
      : null;
    this.opt.change && this.opt.change(this.opt.pageNo);
  }
  hdClick(e) {
    const target = e.target,
      flag = target.getAttribute('data-flag'),
      type = target.getAttribute('data-type');
    if (target.tagName.toLowerCase() === 'button' && type === 'paging') {
      if (flag === 'prev') {
        this.opt.pageNo--;
        this.hdChange();
      } else if (flag === 'next') {
        this.opt.pageNo++;
        this.hdChange();
      } else if (flag === 'go') {
        let val = this.el.querySelector('.paginationBox input').value.trim();
        val = parseInt(val);
        if (isNaN(val)) return;
        this.opt.pageNo = Math.abs(val);
        this.hdChange();
      } else if (flag === 'top') {
        this.opt.toTop && this.opt.toTop();
      } else if (flag === 'getvalue') {
        inputPageNo(e, { value: this.opt.pageNo }, (val) => {
          this.opt.pageNo = val;
          this.hdChange();
        });
      } else if (flag === 'select') {
        creatSelect(
          e,
          { active: this.opt.pageSize, data: this.opt.select },
          ({ value, close }) => {
            this.opt.changeSize && this.opt.changeSize(value);
            close();
          }
        );
      } else {
        this.opt.pageNo = +flag;
        this.hdChange();
      }
    }
  }
  render(opt) {
    this.el.innerHTML = this.getHTML(opt);
  }
  getHTML(opt = {}) {
    this.opt = Object.assign(this.opt, opt);
    this.opt.totalPage = Math.ceil(this.opt.total / this.opt.pageSize);
    this.opt.pageNo <= 0
      ? (this.opt.pageNo = this.opt.totalPage)
      : this.opt.pageNo >= this.opt.totalPage
      ? (this.opt.pageNo = this.opt.totalPage)
      : null;
    if (this.opt.total == 0) {
      return '';
    }
    if (this.opt.small) {
      const str = `<div class="paginationBox">
        <button data-type="paging" cursor data-flag="prev" class="iconfont icon-prev"></button>
        <button data-type="paging" cursor data-flag="getvalue">${
          this.opt.pageNo
        } / ${this.opt.totalPage}</button>
        <button data-type="paging" cursor data-flag="next" class="iconfont icon-page-next"></button>
        ${
          this.opt.select.length > 0
            ? `<button data-type="paging" cursor data-flag="select">${this.opt.pageSize}/页</button>`
            : ''
        }
        ${this.opt.showTotal ? `<span>共 ${this.opt.total} 条</span>` : ''}
        ${
          this.opt.toTop
            ? '<button data-type="paging" cursor data-flag="top" class="iconfont icon-up"></button>'
            : ''
        }
        </div>`;
      return str;
    }
    let startPage = this.opt.pageNo - parseInt(this.opt.continuous / 2),
      endPage = this.opt.pageNo + parseInt(this.opt.continuous / 2);
    if (this.opt.totalPage > this.opt.continuous) {
      startPage < 1 ? ((startPage = 1), (endPage = this.opt.continuous)) : null;
      endPage > this.opt.totalPage
        ? ((endPage = this.opt.totalPage),
          (startPage = this.opt.totalPage - this.opt.continuous + 1))
        : null;
    } else {
      startPage = 1;
      endPage = this.opt.totalPage;
    }
    let str = `<div class="paginationBox">`;
    str += `${
      this.opt.pageNo > 1
        ? '<button data-type="paging" cursor data-flag="prev" class="iconfont icon-prev"></button>'
        : ''
    }`;
    if (this.opt.totalPage > this.opt.continuous) {
      str += `${
        startPage > 1
          ? '<button data-type="paging" cursor data-flag="1">1</button>'
          : ''
      }
        ${
          startPage == 3
            ? '<button data-type="paging" cursor data-flag="2">2</button>'
            : ''
        }
        ${
          startPage > 3
            ? `<button data-type="paging" cursor data-flag="${
                startPage - 1
              }">...</button>`
            : ''
        }`;
    }
    for (let i = startPage; i <= endPage; i++) {
      str += `<button data-type="paging" cursor data-flag="${i}" class="${
        i == this.opt.pageNo ? 'active' : ''
      }">${i}</button>`;
    }
    if (this.opt.totalPage > this.opt.continuous) {
      str += `${
        endPage < this.opt.totalPage - 2
          ? `<button data-type="paging" cursor data-flag="${
              endPage + 1
            }">...</button>`
          : ''
      }
        ${
          endPage == this.opt.totalPage - 2
            ? `<button data-type="paging" cursor data-flag="${
                this.opt.totalPage - 1
              }">${this.opt.totalPage - 1}</button>`
            : ''
        }
        ${
          endPage < this.opt.totalPage
            ? `<button data-type="paging" cursor data-flag="${this.opt.totalPage}">${this.opt.totalPage}</button>`
            : ''
        }`;
    }
    str += `${
      this.opt.pageNo < this.opt.totalPage
        ? '<button data-type="paging" cursor data-flag="next" class="iconfont icon-page-next"></button>'
        : ''
    }`;
    if (this.opt.select.length > 0) {
      // str += `<select>`;
      // this.opt.select.forEach((item) => {
      //   str += `<option value="${item}" ${
      //     item == this.opt.pageSize ? 'selected' : ''
      //   }>${item}/页</option>`;
      // });
      // str += `</select>`;
      str += `<button data-type="paging" cursor data-flag="select">${this.opt.pageSize}/页</button>`;
    }
    if (this.opt.showTotal) {
      str += `<span>共 ${this.opt.total} 条,</span>`;
    }
    str += `<input autocomplete="off" value="${this.opt.pageNo}" type="number">
      <button data-type="paging" cursor data-flag="go" class="iconfont icon-huaban"></button>
      ${
        this.opt.toTop
          ? '<button data-type="paging" cursor data-flag="top" class="iconfont icon-up"></button>'
          : ''
      }`;
    str += `</div>`;
    return str;
  }
}
function pagination(el, opt) {
  return new Pagination(el, opt);
}
export default pagination;
