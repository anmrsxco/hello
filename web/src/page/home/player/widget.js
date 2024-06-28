import $ from 'jquery';
import _d from '../../../js/common/config';
import { backWindow, setZidx } from '../backWindow';
import {
  ContentScroll,
  _getData,
  _getTarget,
  _setData,
  debounce,
  deepClone,
  encodeHtml,
  getScreenSize,
  isMobile,
  isRoot,
  myDrag,
  myResize,
  myToMax,
  myToRest,
  toCenter,
  toHide,
  toSetSize,
} from '../../../js/utils/utils';
import _msg from '../../../js/plugins/message';
import {
  changePlayState,
  hdSongInfo,
  initMusicLrc,
  pauseSong,
  playNextSong,
  playPrevSong,
  setCurPlaySpeed,
  setPlayingSongInfo,
  toggleLrcMenuWrapBtnsState,
} from './lrc';
import {
  highlightPlayingSong,
  showMusicPlayerBox,
  updateSongInfo,
} from './index';
import { reqPlayerEditLrc, reqPlayerReadLrc } from '../../../api/player';
import { playingListHighlight } from './playlist';
import { updateLastPlay } from '../timer';
import { hideIframeMask, showIframeMask } from '../iframe';

const $miniPlayer = $('.mini_player'),
  $miniLrcWrap = $('.mini_lrc_wrap'),
  $editLrcWrap = $('.edit_lrc_wrap'),
  $musicMvWrap = $('.music_mv_wrap'),
  $myVideo = $musicMvWrap.find('.my_video');
let miniPlayerCoord = _getData('miniPlayerCoord'),
  miniLrcCoord = _getData('miniLrcCoord');
// 显示/隐藏迷你播放器
export function showMiniPlayer() {
  $miniPlayer.stop().show(_d.speed);
  setZidx($miniPlayer[0]);
}
export function hideMiniPlayer() {
  $miniPlayer.stop().hide(_d.speed);
}
// MV是隐藏
export function musicMvIsHide() {
  return $musicMvWrap.is(':hidden');
}
// mv是暂停
export function mvIspaused() {
  return $myVideo[0].paused;
}
// 显示/隐藏迷你歌词
export function showMiniLrcBox(once) {
  if (once && $miniLrcWrap._isone) return;
  $miniLrcWrap.stop().fadeIn(_d.speed);
  setZidx($miniLrcWrap[0]);
}
export function hideMiniLrcBox() {
  $miniLrcWrap.stop().fadeOut(_d.speed);
}
// 更换背景
export function changeMiniPlayerBg(url) {
  $miniPlayer.css('background-image', `url("${url}")`);
}
// 设置MV音量
export function setMvplayVolume(value) {
  $myVideo[0].volume = value;
}
$miniLrcWrap.find('.close').on('click', function () {
  hideMiniLrcBox();
  $miniLrcWrap._isone = true;
});
$miniPlayer
  .on('click', '.play_btn', changePlayState)
  .on('click', '.next_btn', playNextSong)
  .on('click', '.prev_btn', playPrevSong)
  .on('mouseenter', function () {
    if (!setPlayingSongInfo().hash) return;
    $(this).attr(
      'title',
      `${setPlayingSongInfo().artist} - ${setPlayingSongInfo().title}`
    );
  })
  .on('click', '.to_max', function () {
    showMusicPlayerBox();
  })
  .on('click', '.show_lrc', toggleMiniLrc);
// 切换迷你歌词
export function toggleMiniLrc() {
  $miniLrcWrap.fadeToggle(_d.speed)._isone = true;
  setZidx($miniLrcWrap[0]);
}
// 暂停
export function miniPlayerPause() {
  $miniPlayer
    .find('.play_btn')
    .attr('class', 'play_btn iconfont icon-65zanting')
    .css('animation', 'none');
}
// 加载
export function miniPlayerLoading() {
  $miniPlayer
    .find('.play_btn')
    .attr('class', 'play_btn iconfont icon-65zanting')
    .css('animation', 'fontcolor .5s infinite linear alternate');
}
// 播放
export function miniplayerPlaying() {
  $miniPlayer
    .find('.play_btn')
    .attr('class', 'play_btn iconfont icon-zanting')
    .css('animation', 'none');
}
// 更新歌词
export function miniLrcUpdateLrc(list, activeLrcIndex) {
  const showfy = _getData('showSongTranslation');
  const curObj = list[activeLrcIndex] || {},
    nextObj = list[activeLrcIndex + 1] || {};
  let activep = '',
    activep1 = '';
  const p = encodeHtml(curObj.p || ''),
    fy = encodeHtml(curObj.fy || ''),
    p1 = encodeHtml(nextObj.p || ''),
    fy1 = encodeHtml(nextObj.fy || '');
  activep = showfy
    ? `<p>${p}</p><p class='fy' style="font-size: 0.6em">${fy}</p>`
    : `<p>${p}</p>`;
  if (activeLrcIndex + 1 === list.length) {
    activep1 = '';
  } else {
    activep1 = showfy
      ? `<p>${p1}</p><p class='fy' style="font-size: 0.6em">${fy1}</p>`
      : `<p>${p1}</p>`;
  }
  const $lb = $miniLrcWrap.find('.lrcbot');
  if ($lb.attr('x') === '0') {
    $lb.find('.one').html(activep).addClass('open');
    $lb.find('.tow').html(activep1).removeClass('open');
    $lb.attr('x', '1');
  } else {
    $lb.find('.one').html(activep1).removeClass('open');
    $lb.find('.tow').html(activep).addClass('open');
    $lb.attr('x', '0');
  }
}
export function initMiniLrc() {
  $miniLrcWrap.find('.lrcbot').find('.one').text('');
  $miniLrcWrap.find('.lrcbot').find('.tow').text('');
}
$editLrcWrap.find('textarea').on('keydown', function (e) {
  let key = e.key,
    ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && key === 's') {
    saveLrc();
    e.preventDefault();
  }
});
// 关闭编辑歌词
export function closeEditLrcBox() {
  backWindow.remove('editlrc');
  toHide(
    $editLrcWrap[0],
    {
      to: 'bottom',
      scale: 'small',
    },
    () => {
      $editLrcWrap.find('textarea').val('');
    }
  );
  editLrcHeadContentScroll.close();
}
// 保存歌词
function saveLrc() {
  const val = $editLrcWrap.find('textarea').val();
  if ($editLrcWrap._val === val || !isRoot()) return;
  $editLrcWrap._val = val;
  reqPlayerEditLrc({
    id: $editLrcWrap._mobj.id,
    text: val,
  })
    .then((result) => {
      if (parseInt(result.code) === 0) {
        $editLrcWrap._val = val;
        _msg.success(result.codeText);
        return;
      }
    })
    .catch(() => {});
}
$editLrcWrap
  .on('click', '.close', function () {
    closeEditLrcBox();
  })
  .on('click', '.save', saveLrc);
const editLrcHeadContentScroll = new ContentScroll(
  $editLrcWrap.find('.song_info_text p')[0]
);
// 显示编辑歌词
export function showEditLrc(sobj) {
  if (!isRoot()) {
    $editLrcWrap.find('.save').remove();
  }
  setZidx($editLrcWrap[0], 'editlrc', closeEditLrcBox);
  $editLrcWrap.stop().fadeIn(_d.speed, () => {
    editLrcHeadContentScroll.init(`${sobj.artist} - ${sobj.title}`);
    $editLrcWrap.css('display', 'flex').find('textarea').val('');
    $editLrcWrap._mobj = deepClone(sobj);
    reqPlayerReadLrc({
      id: sobj.id,
    })
      .then((result) => {
        if (parseInt(result.code) === 0) {
          $editLrcWrap._val = result.data;
          $editLrcWrap.find('textarea').val(result.data);
          return;
        }
      })
      .catch(() => {});
  });
  if (!$editLrcWrap._once) {
    $editLrcWrap._once = true;
    toSetSize($editLrcWrap[0], 800, 800);
    toCenter($editLrcWrap[0]);
  }
}
// 暂停视频
export function pauseVideo() {
  $myVideo[0].pause();
}
// 播放视频
export function playVideo() {
  pauseSong();
  $myVideo[0].play();
}
// 关闭mv
export function closeMvBox() {
  pauseVideo();
  toHide($musicMvWrap[0], { to: 'bottom', scale: 'small' }, () => {
    backWindow.remove('mv');
  });
  musicMvContentScroll.close();
}
$musicMvWrap.on('click', '.m_close', closeMvBox);

// mv标题滚动
const musicMvContentScroll = new ContentScroll(
  $musicMvWrap.find('.m_top_space p')[0]
);
// MV播放函数
export function playMv(obj) {
  setPlayingSongInfo(hdSongInfo(obj));
  updateSongInfo();
  pauseSong();
  $myVideo.attr('src', setPlayingSongInfo().mmv);
  playVideo();
  $musicMvWrap.stop().fadeIn(_d.speed).css('display', 'flex');
  if (!$musicMvWrap.once) {
    $musicMvWrap.once = true;
    toSetSize($musicMvWrap[0], 600, 600);
    toCenter($musicMvWrap[0]);
  }
  musicMvContentScroll.init(
    `${setPlayingSongInfo().artist} - ${setPlayingSongInfo().title}`
  );
  setZidx($musicMvWrap[0], 'mv', closeMvBox);
  highlightPlayingSong(false);
  playingListHighlight(false);
  toggleLrcMenuWrapBtnsState();
  updateLastPlay('y', 1);
  initMusicLrc();
  $myVideo[0].playbackRate = setCurPlaySpeed()[1];
}
$myVideo[0].onerror = function () {
  _msg.error(`MV 加载失败`);
};
myDrag({
  trigger: $miniPlayer[0],
  border: true,
  create({ target }) {
    if (miniPlayerCoord.left) {
      target.style.left = miniPlayerCoord.left + 'px';
      target.style.top = miniPlayerCoord.top + 'px';
    }
  },
  down() {
    showIframeMask();
  },
  up({ x, y }) {
    hideIframeMask();
    miniPlayerCoord = {
      left: x,
      top: y,
    };
    _setData('miniPlayerCoord', miniPlayerCoord);
  },
});
myDrag({
  trigger: $miniLrcWrap[0],
  border: true,
  create({ target }) {
    target.style.left = miniLrcCoord.left + 'px';
    target.style.top = miniLrcCoord.top + 'px';
  },
  down() {
    showIframeMask();
  },
  up({ x, y }) {
    hideIframeMask();
    miniLrcCoord = {
      left: x,
      top: y,
    };
    _setData('miniLrcCoord', miniLrcCoord);
  },
});
myDrag({
  trigger: $musicMvWrap.find('.m_top_space')[0],
  target: $musicMvWrap[0],
  down({ target }) {
    target.style.transition = '0s';
    showIframeMask();
  },
  up({ target, x, y, pointerX }) {
    hideIframeMask();
    const h = window.innerHeight;
    if (y <= 0 || y >= h) {
      myToMax(target);
    } else {
      target._op = { x, y };
      myToRest(target, pointerX);
    }
  },
});
myResize({
  target: $musicMvWrap[0],
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
myDrag({
  trigger: $editLrcWrap.find('.song_info_text')[0],
  target: $editLrcWrap[0],
  down({ target }) {
    target.style.transition = '0s';
    showIframeMask();
  },
  up({ target, x, y, pointerX }) {
    hideIframeMask();
    const h = window.innerHeight;
    if (y <= 0 || y >= h) {
      myToMax(target);
    } else {
      target._op = { x, y };
      myToRest(target, pointerX);
    }
  },
});
myResize({
  target: $editLrcWrap[0],
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
// 层级
function hdIndex(e) {
  if (_getTarget(this, e, '.mini_player')) {
    setZidx($miniPlayer[0]);
  } else if (_getTarget(this, e, '.mini_lrc_wrap')) {
    setZidx($miniLrcWrap[0]);
  } else if (_getTarget(this, e, '.music_mv_wrap')) {
    setZidx($musicMvWrap[0], 'mv', closeMvBox);
  } else if (_getTarget(this, e, '.edit_lrc_wrap')) {
    setZidx($editLrcWrap[0], 'editlrc', closeEditLrcBox);
  }
}
document.addEventListener('mousedown', (e) => {
  if (isMobile()) return;
  hdIndex(e);
});
document.addEventListener('touchstart', (e) => {
  if (!isMobile()) return;
  hdIndex(e.changedTouches[0]);
});

//桌面大小改变自适应
window.addEventListener(
  'resize',
  debounce(function () {
    if (getScreenSize().w > _d.screen) {
      if ($miniLrcWrap.isshow) {
        $miniLrcWrap.css('display', 'block');
      }
      if ($miniPlayer.isshow) {
        $miniPlayer.css('display', 'block');
      }
    } else {
      if (!$miniLrcWrap.is(':hidden')) {
        $miniLrcWrap.css('display', 'none');
        $miniLrcWrap.isshow = true;
      } else {
        $miniLrcWrap.isshow = false;
      }
      if (!$miniPlayer.is(':hidden')) {
        $miniPlayer.css('display', 'none');
        $miniPlayer.isshow = true;
      } else {
        $miniPlayer.isshow = false;
      }
    }
  }, 1000)
);
