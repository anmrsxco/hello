import '../../css/common/common.css';
import './index.less';
import '../../js/common/common';
import { myOpen, pageErr, queryURLParams } from '../../js/utils/utils';
const vd = document.querySelector('video');
vd.src = queryURLParams(myOpen()).HASH;
vd.play();
vd.onerror = function () {
  pageErr();
};
