import { getPreUrl, nanoid } from '../utils/utils';
const levelObj = {
  upProgressbox: 100, // 上传进度（静）
  rightBox: 101, // 右键菜单（静）
  copyEdit: 102, // 复制编辑（静）
  imgPreview: 102, // 图片预览（动）
  msg: 103, // 通知框（静）
  _progressBar: 104, // 调节器（动）
  popConfirm: 104, // 确认框（动）
  hechang: 105, // 何畅（静）
  loading: 107, // 加载动画（静）
  clickLove: 107, // 点击（动）
};
const url = getPreUrl() + '/api';
const serverURL = url;
const mediaURL = url + '/getfile';
// 搜索引擎
const searchEngineData = [
  {
    name: 'Bing',
    icon: '/images/searchlogo/bing-xs.png',
    logo: '/images/searchlogo/bing.png', // 图片h / w = 40%
    searchlink: 'https://bing.com/search?q={{}}',
    color: '#1B8473',
  },
  {
    name: 'Google',
    icon: '/images/searchlogo/google-xs.png',
    logo: '/images/searchlogo/google.png',
    searchlink: 'https://www.google.com/search?q={{}}',
    color: '#4285F4',
  },
  {
    name: 'Searxng',
    icon: '/images/searchlogo/searxng-xs.png',
    logo: '/images/searchlogo/searxng.png',
    searchlink: 'https://search.hechang.me/search?q={{}}',
    color: '#487CFF',
  },
  {
    name: 'Baidu',
    icon: '/images/searchlogo/baidu-xs.png',
    logo: '/images/searchlogo/baidu.png',
    searchlink: 'https://www.baidu.com/s?wd={{}}',
    color: '#2932E1',
  },
  {
    name: 'DuckDuckGo',
    icon: '/images/searchlogo/duckduckgo-xs.png',
    logo: '/images/searchlogo/duckduckgo.png',
    searchlink: 'https://duckduckgo.com/?q={{}}',
    color: '#EC2027',
  },
  {
    name: 'Yandex',
    icon: '/images/searchlogo/yandex-xs.png',
    logo: '/images/searchlogo/yandex.png',
    searchlink: 'https://yandex.com/search/?text={{}}',
    color: '#FD3D11',
  },
  {
    name: 'Wikipedia',
    icon: '/images/searchlogo/wikipedia-xs.png',
    logo: '/images/searchlogo/wikipedia.png',
    searchlink: 'https://zh.wikipedia.org/wiki/{{}}',
    color: '#000000',
  },
  {
    name: 'Github',
    icon: '/images/searchlogo/github-xs.png',
    logo: '/images/searchlogo/github.png',
    searchlink: 'https://github.com/search?q={{}}',
    color: '#1F1F1F',
  },
  {
    name: 'Youtube',
    icon: '/images/searchlogo/youtube-xs.png',
    logo: '/images/searchlogo/youtube.png',
    searchlink: 'https://www.youtube.com/results?search_query={{}}',
    color: '#FF0000',
  },
  {
    name: 'Bilibili',
    icon: '/images/searchlogo/bilibili-xs.png',
    logo: '/images/searchlogo/bilibili.png',
    searchlink: 'https://search.bilibili.com/all?keyword={{}}',
    color: '#E47494',
  },
  {
    name: 'Yahoo',
    icon: '/images/searchlogo/yahoo-xs.png',
    logo: '/images/searchlogo/yahoo.png',
    searchlink: 'https://search.yahoo.com/search?p={{}}',
    color: '#5F01D1',
  },
  {
    name: 'Sogou',
    icon: '/images/searchlogo/sougou-xs.png',
    logo: '/images/searchlogo/sougou.png',
    searchlink: 'https://www.sogou.com/web?query={{}}',
    color: '#F94E19',
  },
  {
    name: 'Toutiao',
    icon: '/images/searchlogo/toutiao-xs.png',
    logo: '/images/searchlogo/toutiao.png',
    searchlink: 'https://m.toutiao.com/search?keyword={{}}',
    color: '#ED2F28',
  },
  {
    name: 'Weibo',
    icon: '/images/searchlogo/weibo-xs.png',
    logo: '/images/searchlogo/weibo.png',
    searchlink: 'https://s.weibo.com/weibo?q={{}}',
    color: '#E6162D',
  },
  {
    name: 'Zhihu',
    icon: '/images/searchlogo/zhihu-xs.png',
    logo: '/images/searchlogo/zhihu.png',
    searchlink: 'https://www.zhihu.com/search?q={{}}',
    color: '#1087EB',
  },
];
// 搜索提示服务
const searchWord = [
  {
    type: 'close',
  },
  {
    type: 'Bing',
    link: 'https://api.bing.com/qsonhs.aspx?type=cb&q={{}}&cb=window.bing.sug',
  },
  {
    type: 'Google',
    link: 'https://suggestqueries.google.com/complete/search?client=youtube&q={{}}&jsonp=window.google.ac.h',
  },
  {
    type: 'Baidu',
    link: 'https://suggestion.baidu.com/su?wd={{}}&cb=window.baidu.sug',
  },
];
const _d = {
  serverURL,
  mediaURL,
  levelObj,
  speed: 500,
  translator: 'https://bing.com/translator?text={{}}', // 翻译接口
  temid: nanoid(), // 临时id
  screen: 800, // 区分大屏小屏
  searchEngineData, // 搜索引擎
  searchWord, // 搜索提示服务
  checkColor: 'rgb(26 147 207 / 40%)', // 选中颜色
  title: 'Hello', // 标题
  emptyList: 'List is empty', // 空列表显示
  isHome: false, // 是否在主页
  isFilePage: false, // 是否是文件管理页
  maxSongList: 2000,
  // local数据默认值
  localStorageDefaultData: {
    gentlemanLockPd: '', // 君子锁密码
    clockData: {
      coord: {
        // 坐标
        left: 20,
        top: 20,
      },
      size: 0.14, // 大小
    }, // 时钟数据
    miniPlayerCoord: {},
    miniLrcCoord: {
      left: 50,
      top: 100,
    },
    searchOpenPop: false, // 搜索结果弹窗打开
    noteWiden: false, // 笔记显示区域加宽
    loginName: '', // 登录名
    username: '', // 用户名
    showpd: false, // 显示密码
    dark: 's', // 黑暗模式 s：随系统 y：开启 n：关闭
    clickLove: false, // 点击♥
    pmsound: true, // 提示音
    pageGrayscale: 0, // 页面灰度
    mediaVolume: 0.7, // 媒体音量
    fontType: 'default', // 字体类型
    notePageSize: 20, // 笔记每页显示
    editNoteFontSize: 0.22, // 编辑笔记输入框字体大小
    editNoteCodeNum: true, // 编辑笔记显示行号
    bmPageSize: 20, // 书签每页显示
    filesPageSize: 20, // 文件列表每页显示
    fileUrl: '/', // 文件路径
    fileSort: { type: 'time', isDes: true }, // 文件排序
    fileFontSize: 0.22, // 文件编辑文本大小
    fileShowGrid: false, // 文件列表块状显示
    fileEditCodeNum: true, // 编辑文件显示行号
    newNote: '', // 未保存的新笔记
    historyPageSize: 20, // 历史记录每页显示
    searchengine: 0, // 搜索引擎
    searchWordIdx: 1, // 搜索提示词服务
    filterbg: 0, // 壁纸模糊度
    songListSort: 'default', // 歌曲排序
    bgPageSize: 20, // 壁纸、图床每页显示
    trashPageSize: 20, // 回收站每页显示
    songPlaySpeed: ['x1', 1], // 歌曲播放速度
    showSongTranslation: false, // 显示歌词翻译
    lastweizi: {},
    lrcState: { size: 0.25, position: 'left' }, // 歌词状态
    songListPageSize: 50, // 歌曲每页显示
    asidePageSize: 6, // 侧边书签每页显示
    account: '', // 账号
    noteFontSize: 0.22, // 笔记文本大小
    tipsFlag: 0, // tips标识
    toolTip: true, // 提示工具
  },
};
export default _d;
