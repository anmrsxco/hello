import $ from 'jquery';
import '../../font/iconfont.css';
import '../../css/common/common.css';
import '../edit/index.less';
import './index.less';
import '../note/md.css';
import {
  queryURLParams,
  myOpen,
  _setData,
  _getData,
  debounce,
  imgPreview,
  isImgFile,
  toLogin,
  isIframe,
  getFiles,
  getSuffix,
  _progressBar,
  percentToValue,
  LazyLoad,
  imgjz,
  _setTimeout,
  showQcode,
  isDarkMode,
  isLogin,
} from '../../js/utils/utils';
import '../../js/common/common';
import _msg from '../../js/plugins/message';
import { UpProgress } from '../../js/plugins/UpProgress';
import createEditer from '../../js/utils/editor';
import gqImg from '../../images/img/gqimg.png';
import { reqGetNotePad, reqNotePad } from '../../api/notepad';
import { reqPicRepeat, reqPicUp } from '../../api/pic';
import rMenu from '../../js/plugins/rightMenu';
import MdWorker from '../../js/utils/md.worker.js';
import fileSlice from '../../js/utils/fileSlice.js';
const mdWorker = new MdWorker();
const $contentWrap = $('.content_wrap'),
  $headBtns = $contentWrap.find('.head_btns'),
  $editWrap = $contentWrap.find('.edit_wrap'),
  $editBox = $editWrap.find('.edit_box'),
  $themeCss = $('.theme_css'),
  $previewBox = $editWrap.find('.preview_box'),
  $resize = $previewBox.find('.resize');

let dark = _getData('dark');
let editNoteCodeNum = _getData('editNoteCodeNum');
let editNoteFontSize = _getData('editNoteFontSize');
// 黑暗模式
function changeTheme(flag) {
  dark = flag;
  if (dark == 'y') {
    $themeCss.attr('href', '/css/notethem/notecode1.css');
    editor.setTheme('ace/theme/github_dark');
  } else if (dark == 'n') {
    $themeCss.attr('href', '/css/notethem/notecode.css');
    editor.setTheme('ace/theme/chrome');
  } else if (dark == 's') {
    if (isDarkMode()) {
      $themeCss.attr('href', '/css/notethem/notecode1.css');
      editor.setTheme('ace/theme/github_dark');
    } else {
      $themeCss.attr('href', '/css/notethem/notecode.css');
      editor.setTheme('ace/theme/chrome');
    }
  }
}
window.changeTheme = changeTheme;
// 编辑器
const editor = createEditer($editBox[0]);
editor.getSession().setMode('ace/mode/markdown');
changeTheme(dark);
// 快捷键
editor.getSession().on(
  'change',
  debounce(function () {
    rende();
  }, 1000)
);
editor.commands.addCommand({
  name: 'createLink',
  bindKey: { win: 'Ctrl-K', mac: 'Command-K' },
  exec: function () {
    createLink();
  },
});
editor.commands.addCommand({
  name: 'codeBlock',
  bindKey: { win: 'Ctrl-Shift-K', mac: 'Command-Shift-K' },
  exec: function () {
    createCodeBlock();
  },
});
editor.commands.addCommand({
  name: 'codeTable',
  bindKey: { win: 'Ctrl-B', mac: 'Command-B' },
  exec: function () {
    createTable();
  },
});
editor.commands.addCommand({
  name: 'upImg',
  bindKey: { win: 'Ctrl-I', mac: 'Command-I' },
  exec: async function () {
    if (!isLogin()) {
      toLogin();
      return;
    }
    const files = await getFiles({
      multiple: true,
      accept: '.jpg,.jpeg,.png,.ico,.svg,.webp,.gif',
    });
    if (files.length == 0) return;
    hdUpFile(files);
  },
});
const $aceScroll = $editBox.find('.ace_scrollbar-v');
// 对比记录
let orginData = {
  data: '',
};
function initValue(obj) {
  editor.setValue(obj.data);
  editor.gotoLine(1);
  editor.focus();
  orginData = obj;
}
let { k } = queryURLParams(myOpen());
if (!k || !/^[\w]+$/.test(k)) {
  rMenu.inpMenu(
    false,
    {
      items: {
        key: {
          placeholder: '请输入便条Key',
          beforeText: '便条Key：',
          verify(val) {
            val = val.trim();
            if (val == '') {
              return '请输入便条Key';
            } else if (val.length > 20) {
              return '便条key过长';
            } else if (!/^[\w]+$/.test(val)) {
              return '只能包含数字、字母和下划线';
            }
          },
        },
      },
    },
    ({ inp }) => {
      myOpen(`/notepad/?k=${inp.key}`);
    },
    0,
    1,
    1
  );
} else {
  reqGetNotePad({ k })
    .then((res) => {
      if (res.code == 0) {
        document.title = k;
        initValue({ data: res.data });
        $headBtns.addClass('open');
        $editWrap.addClass('open');
        upData();
      }
    })
    .catch(() => {});
}
// 保存便条
function upData() {
  const data = editor.getValue();
  if (data === orginData.data) {
    _setTimeout(upData, 1000);
  } else {
    orginData.data = data;
    reqNotePad({ k, data }).finally(upData);
  }
}
// 预览
function rende() {
  const text = editor.getValue();
  if ($previewBox.is(':hidden')) return;
  if (text.trim() == '') {
    $previewBox.find('.content').html('');
    return;
  }
  mdWorker.postMessage(text);
}
mdWorker.addEventListener('message', (event) => {
  $previewBox.find('.content').html(event.data);
  imgLazy.bind(
    $previewBox.find('.content')[0].querySelectorAll('img'),
    (item) => {
      const url = item.getAttribute('data-src');
      imgjz(
        url,
        () => {
          item.src = url;
        },
        () => {
          item.src = gqImg;
        }
      );
    }
  );
  hdScroll();
});
const imgLazy = new LazyLoad();
$previewBox.on('click', 'img', function () {
  const imgs = $previewBox.find('img');
  let idx = 0;
  const arr = [];
  imgs.each((i, item) => {
    if (item == this) {
      idx = i;
    }
    arr.push({
      u1: item.getAttribute('data-src'),
    });
  });
  imgPreview(arr, idx);
});
// 粘贴图片
$editBox[0].addEventListener('paste', function (e) {
  const files = [];
  const data = e.clipboardData || window.clipboardData;
  [...data.items].forEach((item) => {
    const blob = item.getAsFile();
    if (blob && isImgFile(blob.name)) {
      files.push(blob);
    }
  });
  if (files.length == 0) return;
  e.preventDefault();
  hdUpFile(files);
});
// 调整宽度
~(function () {
  let previeW, editW, x;
  function hdDown(e) {
    $editWrap.addClass('jzxz');
    previeW = $previewBox[0].offsetWidth;
    editW = $editBox[0].offsetWidth;
    if (e.type == 'touchstart') {
      x = e.touches[0].clientX;
    } else if (e.type === 'mousedown') {
      x = e.clientX;
    }
    this.addEventListener('touchmove', hdMove);
    document.addEventListener('mousemove', hdMove);
    this.addEventListener('touchend', hdUp);
    document.addEventListener('mouseup', hdUp);
  }
  function hdMove(e) {
    e.preventDefault();
    let xx;
    if (e.type == 'touchmove') {
      xx = e.touches[0].clientX;
    } else if (e.type === 'mousemove') {
      xx = e.clientX;
    }
    let diff = xx - x;
    x = xx;
    editW += diff;
    previeW -= diff;
    if (editW > 100 && previeW > 100) {
      $editBox.css({
        width: editW + 'px',
      });
      $previewBox.css({
        width: previeW + 'px',
      });
    }
  }
  function hdUp() {
    $editWrap.removeClass('jzxz');
    this.removeEventListener('touchmove', hdMove);
    document.removeEventListener('mousemove', hdMove);
    this.removeEventListener('touchend', hdUp);
    document.removeEventListener('mouseup', hdUp);
  }
  $resize[0].addEventListener('mousedown', hdDown);
  $resize[0].addEventListener('touchstart', hdDown);
})();
$aceScroll.on('scroll', hdScroll);
// 同步滚动
function hdScroll() {
  if ($previewBox.is(':hidden')) return;
  const CT = $aceScroll.scrollTop(),
    CBH = $editBox.outerHeight(),
    CH = $aceScroll[0].scrollHeight - CBH,
    SH = $previewBox.find('.content')[0].scrollHeight - CBH,
    ST = (CT / CH) * SH;
  $previewBox.find('.content').scrollTop(ST);
}
// 上传
async function hdUpFile(files) {
  if (!isLogin()) {
    toLogin();
    return;
  }
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
      const { HASH } = await fileSlice(file, (percent) => {
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
          url: `/api/picture/${url}`,
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
          url: `/api/picture/${url}`,
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
  let str = '';
  fData.forEach((item) => {
    let { filename, url } = item;
    str += `\n![${filename}](${url})\n`;
  });
  editor.insert(str);
  editor.focus();
}
// 拖入上传
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
function createLink() {
  editor.insert(`\n[](https://)\n`);
  let row = editor.selection.getCursor().row;
  editor.gotoLine(row, 1);
  editor.focus();
}
function createCodeBlock() {
  editor.insert(`\n\`\`\`javascript\n\n\`\`\`\n`);
  let row = editor.selection.getCursor().row;
  editor.gotoLine(row - 2, 13);
  editor.focus();
}
function createTable() {
  editor.insert(`\n|列1|列2|列3|\n|:--:|--|--|\n|行1|  |  |\n|行2|  |  |\n`);
  editor.focus();
}
$editWrap.css({
  'font-size': percentToValue(12, 40, editNoteFontSize),
});
function changeCodeNum() {
  editor.setOption('showGutter', editNoteCodeNum);
}
changeCodeNum();
// 设置
function settingEdit(e) {
  const data = [
    { id: 'size', text: '字体大小', beforeIcon: 'iconfont icon-font-size' },
    {
      id: 'num',
      text: '行号',
      beforeIcon: 'iconfont icon-bianhao',
      afterIcon: editNoteCodeNum
        ? 'iconfont icon-kaiguan-kai1'
        : 'iconfont icon-kaiguan-guan',
    },
  ];
  rMenu.selectMenu(
    e,
    data,
    ({ e, resetMenu, id }) => {
      if (id == 'size') {
        _progressBar(e, editNoteFontSize, (percent) => {
          $editWrap.css({
            'font-size': percentToValue(12, 30, percent),
          });
          editNoteFontSize = percent;
          _setData('editNoteFontSize', editNoteFontSize);
        });
      } else if (id == 'num') {
        editNoteCodeNum = !editNoteCodeNum;
        _setData('editNoteCodeNum', editNoteCodeNum);
        data[1].afterIcon = editNoteCodeNum
          ? 'iconfont icon-kaiguan-kai1'
          : 'iconfont icon-kaiguan-guan';
        resetMenu(data);
        changeCodeNum();
      }
    },
    '设置'
  );
}
$headBtns
  .on('click', '.setting_btn', settingEdit)
  .on('click', '.table_btn', createTable)
  .on('click', '.code_btn', createCodeBlock)
  .on('click', '.link_btn', createLink)
  .on('click', '.img_btn', async function () {
    if (!isLogin()) {
      toLogin();
      return;
    }
    const files = await getFiles({
      multiple: true,
      accept: '.jpg,.jpeg,.png,.ico,.svg,.webp,.gif',
    });
    if (files.length == 0) return;
    hdUpFile(files);
  })
  .on('click', '.preview_state', function () {
    if (!$headBtns._flag) {
      $headBtns._flag = 'y';
    }
    if ($headBtns._flag === 'y') {
      $headBtns._flag = 'n';
      $headBtns
        .find('.preview_state')
        .attr('class', 'preview_state iconfont icon-yanjing_yincang_o');
      $previewBox.css('display', 'none');
      $editBox.addClass('open');
      $headBtns.find('.to_max_btn').css('display', 'none');
    } else {
      $headBtns._flag = 'y';
      $headBtns
        .find('.preview_state')
        .attr('class', 'preview_state iconfont icon-yanjing_xianshi_o');
      $previewBox.css('display', 'block');
      $editBox.removeClass('open');
      $headBtns.find('.to_max_btn').css('display', 'block');
      rende();
    }
    $editBox.css('display', 'block');
  })
  .on('click', '.to_max_btn', function () {
    $editBox.toggle();
  })
  .on('click', '.h_go_home', function () {
    myOpen('/');
  })
  .on('click', '.share_btn', function (e) {
    showQcode(e, myOpen(), '扫码打开便条').catch(() => {});
  })
  .on('click', '.open_btn', openNotepad);
// 切换便条
function openNotepad(e) {
  rMenu.inpMenu(
    e,
    {
      items: {
        key: {
          placeholder: '请输入便条Key',
          beforeText: '便条Key：',
          verify(val) {
            val = val.trim();
            if (val == '') {
              return '请输入便条Key';
            } else if (val.length > 20) {
              return '便条key过长';
            } else if (!/^[\w]+$/.test(val)) {
              return '只能包含数字、字母和下划线';
            }
          },
        },
      },
    },
    debounce(
      function ({ close, inp }) {
        close();
        myOpen(`/notepad/?k=${inp.key}`);
      },
      1000,
      true
    ),
    '切换到指定便条'
  );
}
if (isIframe()) {
  $headBtns.find('.h_go_home').remove();
}
if (!isIframe()) {
  // 禁止后退
  function pushHistory() {
    window.history.pushState(null, '', myOpen());
  }
  pushHistory();
  window.addEventListener('popstate', function () {
    pushHistory();
    // to do something
  });
}
