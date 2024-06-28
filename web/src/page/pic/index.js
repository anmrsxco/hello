import $ from 'jquery';
import '../../css/common/reset.css';
import '../../css/common/common.css';
import '../../font/iconfont.css';
import './index.less';
import {
  _setData,
  _getData,
  imgjz,
  copyText,
  isImgFile,
  imgPreview,
  encodeHtml,
  toLogin,
  getScreenSize,
  longPress,
  isMobile,
  getFiles,
  isIframe,
  myOpen,
  getSuffix,
  getFilePath,
  getPreUrl,
  hdPath,
  LazyLoad,
  isRoot,
  isLogin,
} from '../../js/utils/utils';
import _d from '../../js/common/config';
import '../../js/common/common';
import pagination from '../../js/plugins/pagination';
import { UpProgress } from '../../js/plugins/UpProgress';
import _msg from '../../js/plugins/message';
import _pop from '../../js/plugins/popConfirm';
import loadfailImg from '../../images/img/loadfail.png';
import {
  reqPicDelete,
  reqPicList,
  reqPicRepeat,
  reqPicUp,
} from '../../api/pic';
import rMenu from '../../js/plugins/rightMenu';
import fileSlice from '../../js/utils/fileSlice';
if (!isLogin()) {
  toLogin();
}
const $contentWrap = $('.content_wrap'),
  $imgList = $contentWrap.find('.img_list'),
  $footer = $('.footer');
// 上传
async function hdUpFile(files) {
  const fData = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const { name, size } = file;
    const pro = new UpProgress(name);
    if (!isImgFile(name)) {
      pro.fail();
      _msg.error(`图片格式错误`);
      continue;
    }
    if (size <= 0 || size >= 5 * 1024 * 1024) {
      pro.fail();
      _msg.error(`图片大小必须0~5M范围`);
      continue;
    }
    try {
      //文件切片
      let { HASH } = await fileSlice(file, (percent) => {
        pro.loading(percent);
      });
      const isrepeat = await reqPicRepeat({
        HASH,
      }); //是否已经存在文件

      if (parseInt(isrepeat.code) === 0) {
        pro.close('文件已存在');
        const { url } = isrepeat.data;
        fData.push({
          filename: getSuffix(name)[0],
          url: getPreUrl() + hdPath(`/api/picture/${url}`),
        });
        //文件已经存在操作
        continue;
      }
      const result = await reqPicUp(
        {
          name,
          HASH,
        },
        file,
        (percent) => {
          pro.update(percent);
        }
      );
      if (parseInt(result.code) === 0) {
        const { url } = result.data;
        fData.push({
          filename: getSuffix(name)[0],
          url: getPreUrl() + hdPath(`/api/picture/${url}`),
        });
        pro.close();
      } else {
        pro.fail();
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      pro.fail();
    }
  }
  picPageNo = 1;
  renderImgList(true);
  showLink(fData);
}
// 粘贴上传
document.body.addEventListener('paste', function (e) {
  let files = [];
  let data = e.clipboardData || window.clipboardData;
  [...data.items].forEach((item) => {
    let blob = item.getAsFile();
    if (blob && isImgFile(blob.name)) {
      files.push(blob);
    }
  });
  if (files.length === 0) return;
  e.preventDefault();
  hdUpFile(files);
});
if (isIframe()) {
  $contentWrap.find('.go_home').remove();
}
$contentWrap
  .on('click', '.uoload_img_btn', async function (e) {
    e.stopPropagation();
    const files = await getFiles({
      multiple: true,
      accept: '.jpg,.jpeg,.png,.ico,.svg,.webp,.gif',
    });
    if (files.length == 0) return;
    hdUpFile(files);
  })
  .on('click', '.go_home', function () {
    myOpen('/');
  });
// 拖拽上传
~(function () {
  document.addEventListener('dragenter', function (e) {
    e.preventDefault();
  });
  document.addEventListener('dragover', function (e) {
    e.preventDefault();
  });
  document.addEventListener('drop', function (e) {
    e.preventDefault();
    const files = [...e.dataTransfer.files];
    if (files.length == 0) return;
    hdUpFile(files);
  });
})();
// 获取壁纸
let picPageNo = 1;
let curPageSize = _getData('bgPageSize');
renderImgList(true);
// 图片列表加载
function imgListLoading() {
  let str = '';
  new Array(50).fill(null).forEach(() => {
    str += `<div style="pointer-events: none;" class="img_item">
        <div class="img"></div>
            </div>`;
  });
  $imgList.html(str).scrollTop(0);
}
if (!isRoot()) {
  $imgList.remove();
}
// 获取图片信息
function getPicItem(id) {
  return $imgList.list.find((item) => item.id == id);
}
$imgList.list = [];
const defaultRes = `<p style='text-align: center;'>${_d.emptyList}</p>`;
// 生成列表
function renderImgList(y) {
  if (!isRoot()) return;
  if (y) {
    imgListLoading();
  }
  let str = '',
    showpage = curPageSize;
  reqPicList({ pageNo: picPageNo, pageSize: showpage })
    .then((result) => {
      if (parseInt(result.code) === 0) {
        const { total, data, pageNo } = result.data;
        picPageNo = pageNo;
        $imgList.list = data;
        if (data.length == 0) {
          str += defaultRes;
        } else {
          data.forEach((v) => {
            const { id } = v;
            str += `<div class="img_item" data-id="${id}">
            <div check="n" class="check_level"></div>
            <i cursor class="menu_btn iconfont icon-shoucang"></i>
              <div class="img"></div>
                  </div>`;
          });
          str += `<div class="pagingbox">`;
          str += pgnt.getHTML({
            pageNo,
            pageSize: showpage,
            total,
            small: getScreenSize().w <= _d.screen,
          });
          str += `</div > `;
        }
        $imgList.html(str).addClass('open');
        $footer.stop().slideUp(_d.speed);
        if (y) {
          $imgList.scrollTop(0);
        }
        bglazyImg.bind($imgList[0].querySelectorAll('.img'), (item) => {
          let $img = $(item);
          const obj = getPicItem($img.parent().attr('data-id'));
          if (!obj) return;
          const url = getFilePath(`/pic/${obj.url}`, 1);
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
              $img.css({
                'background-image': `url(${loadfailImg})`,
              });
            }
          );
        });
      }
    })
    .catch(() => {});
}
const bglazyImg = new LazyLoad();
// 分页
const pgnt = pagination($imgList[0], {
  select: [20, 40, 60, 80, 100],
  change(val) {
    picPageNo = val;
    renderImgList(true);
    _msg.botMsg(`第 ${picPageNo} 页`);
  },
  changeSize(val) {
    curPageSize = val;
    _setData('bgPageSize', curPageSize);
    picPageNo = 1;
    renderImgList(true);
    _msg.botMsg(`第 ${picPageNo} 页`);
  },
  toTop() {
    $imgList.stop().animate(
      {
        scrollTop: 0,
      },
      _d.speed
    );
  },
});
// 复制
function copyLink(e, pobj) {
  const data = [];
  const obj = {
    url: getPreUrl() + hdPath(`/api/picture/${pobj.url}`),
    filename: pobj.title,
  };
  typeTemplateArr.forEach((item, idx) => {
    const { type, template } = item;
    const text = template.replace(/\{\{(.*?)\}\}/g, function () {
      const key = arguments[1];
      return obj[key];
    });
    data.push({
      id: idx + 1,
      text: type,
      param: { text },
    });
  });
  rMenu.selectMenu(
    e,
    data,
    ({ param, close, id }) => {
      if (id) {
        close();
        copyText(param.text);
      }
    },
    '选择复制链接类型'
  );
}
// 删除
function deletePic(e, ids, cb, isCheck) {
  _pop(
    {
      e,
      text: `确认删除：${isCheck ? '选中的' : ''}图片？`,
      confirm: { type: 'danger', text: '删除' },
    },
    (type) => {
      if (type == 'confirm') {
        reqPicDelete(ids)
          .then((result) => {
            if (parseInt(result.code) === 0) {
              cb && cb();
              _msg.success(result.codeText);
              renderImgList();
              return;
            }
          })
          .catch(() => {});
      }
    }
  );
}
// 菜单
function picMenu(e, pobj, el) {
  const data = [
    { id: '1', text: '复制链接', beforeIcon: 'iconfont icon-fuzhi' },
    { id: '2', text: '选中', beforeIcon: 'iconfont icon-duoxuan' },
    {
      id: '3',
      text: '删除',
      beforeIcon: 'iconfont icon-shanchu',
    },
  ];
  rMenu.selectMenu(
    e,
    data,
    ({ e, close, id }) => {
      if (id == '1') {
        copyLink(e, pobj);
      } else if (id == '3') {
        deletePic(e, [pobj.id], close);
      } else if (id == '2') {
        close();
        $imgList.find('.check_level').css('display', 'block');
        $footer.stop().slideDown(_d.speed).find('span').attr({
          class: 'iconfont icon-xuanzeweixuanze',
          check: 'n',
        });
        checkedImg(el);
      }
    },
    '操作图片'
  );
}
$imgList
  .on('click', '.img', function () {
    const $this = $(this);
    const idx = $this.index('.img');
    const arr = [];
    $imgList.find('.img').each((idx, item) => {
      const $item = $(item);
      const obj = getPicItem($item.parent().attr('data-id'));
      const u1 = `/api/picture/${obj.url}`;
      const u2 = getFilePath(`/pic/${obj.url}`, 1);
      arr.push({
        u2,
        u1,
      });
    });
    imgPreview(arr, idx);
  })
  .on('contextmenu', '.img', function (e) {
    e.preventDefault();
    if (isMobile()) return;
    picMenu(
      e,
      getPicItem($(this).parent().data('id')),
      this.parentNode.querySelector('.check_level')
    );
  })
  .on('click', '.menu_btn', function (e) {
    e.preventDefault();
    picMenu(
      e,
      getPicItem($(this).parent().data('id')),
      this.parentNode.querySelector('.check_level')
    );
  })
  .on('click', '.check_level', function () {
    checkedImg(this);
  });
// 选中
function checkedImg(el) {
  const $this = $(el);
  const check = $this.attr('check');
  if (check === 'n') {
    $this.attr('check', 'y').css('background-color', _d.checkColor);
  } else {
    $this.attr('check', 'n').css('background-color', 'transparent');
  }
  const $imgItem = $imgList.find('.img_item'),
    $checkArr = $imgItem.filter(
      (_, item) => $(item).find('.check_level').attr('check') === 'y'
    );
  _msg.botMsg(`选中：${$checkArr.length}项`);
  if ($checkArr.length === $imgItem.length) {
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
longPress($imgList[0], '.img', function (e) {
  const ev = e.changedTouches[0];
  picMenu(
    ev,
    getPicItem($(this).parent().data('id')),
    this.parentNode.querySelector('.check_level')
  );
});
// url模板
const typeTemplateArr = [
  {
    type: 'url',
    template: '{{url}}',
  },
  {
    type: 'markdown',
    template: '![{{filename}}]({{url}})',
  },
  {
    type: 'html',
    template: '<img src="{{url}}" alt="{{filename}}" title="{{filename}}" />',
  },
  {
    type: 'bbcode',
    template: '[img]{{url}}[/img]',
  },
  {
    type: 'markdown with link',
    template: '[![{{filename}}]({{url}})]({{url}})',
  },
];
// 显示图片连接
const showLink = (function () {
  const $tabMask = $('.tab_mask'),
    $head = $tabMask.find('.head'),
    $content = $tabMask.find('.content');
  function render(data) {
    if (data.length === 0) return;
    let hstr = '';
    let cstr = '';
    typeTemplateArr.forEach((item, idx) => {
      const { type, template } = item;
      hstr += `<span data-idx="${idx}" cursor class="${
        idx == 0 ? 'active' : ''
      }">${type}</span>`;
      cstr += `<ul class="${idx == 0 ? 'active' : ''}">`;
      data.forEach((obj) => {
        let text = template.replace(/\{\{(.*?)\}\}/g, function () {
          const key = arguments[1];
          return obj[key];
        });
        text = encodeHtml(text);
        cstr += `<li data-text="${text}">${text}<i cursor class="iconfont icon-fuzhi"></i></li>`;
      });
      cstr += '</ul>';
    });
    $head.html(hstr);
    $content.html(cstr);
    $tabMask.stop().fadeIn(_d.speed);
  }
  $tabMask.on('click', function (e) {
    if (e.target == this) {
      $tabMask.stop().fadeOut(_d.speed);
    }
  });
  $content.on('click', 'i', function () {
    const text = $(this).parent().attr('data-text');
    copyText(text);
  });
  $head.on('click', 'span', function () {
    const $this = $(this),
      idx = $this.attr('data-idx'),
      $span = $head.find('span'),
      $ul = $content.find('ul');
    $span.removeClass('active');
    $this.addClass('active');
    $ul.removeClass('active');
    $ul.eq(idx).addClass('active');
  });
  return render;
})();
$footer
  .on('click', '.f_delete', function (e) {
    const $imgItem = $imgList.find('.img_item'),
      $checkArr = $imgItem.filter(
        (_, item) => $(item).find('.check_level').attr('check') === 'y'
      );
    if ($checkArr.length === 0) return;
    const arr = [];
    $checkArr.each((i, v) => {
      arr.push(v.getAttribute('data-id'));
    });
    deletePic(e, arr, false, 1);
  })
  .on('click', '.f_close', function () {
    let $imgItem = $imgList.find('.img_item');
    $imgItem
      .find('.check_level')
      .css('display', 'none')
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
    let $imgItem = $imgList.find('.img_item');
    $imgItem
      .find('.check_level')
      .attr('check', che)
      .css('background-color', che === 'y' ? _d.checkColor : 'transparent');
    _msg.botMsg(`选中：${che === 'y' ? $imgItem.length : 0}项`);
  });
