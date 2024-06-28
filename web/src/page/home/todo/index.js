import $ from 'jquery';
import {
  debounce,
  formatDate,
  copyText,
  toHide,
  hdTextMsg,
  toSetSize,
  toCenter,
  _getTarget,
  isMobile,
  myDrag,
  myToMax,
  myToRest,
  getSelectText,
  myResize,
  _mySlide,
  getScreenSize,
} from '../../../js/utils/utils.js';
import _d from '../../../js/common/config';
import _msg from '../../../js/plugins/message';
import _pop from '../../../js/plugins/popConfirm';
import {
  reqTodoAdd,
  reqTodoDelete,
  reqTodoEdit,
  reqTodoList,
  reqTodoState,
} from '../../../api/todo.js';
import { backWindow, setZidx } from '../backWindow.js';
import pagination from '../../../js/plugins/pagination/index.js';
import rMenu from '../../../js/plugins/rightMenu/index.js';
import { hideRightMenu } from '../rightSetting/index.js';
import { hideIframeMask, showIframeMask } from '../iframe.js';
const $todoBox = $('.todo_box'),
  $theadBtns = $todoBox.find('.t_head_btns'),
  $todoList = $todoBox.find('.todo_list');
let todoList = [],
  todoPageNo = 1,
  todoPageSize = 40,
  undoneCount = 0;
// 设置待办列表
export function setTodoUndone(val) {
  if (val === undefined) {
    return undoneCount;
  }
  undoneCount = val;
}
// 提醒消息
export function todoMsg() {
  if (undoneCount == 0) return;
  _msg.msg(
    {
      message: `您有 ${undoneCount} 条未完成事项`,
      type: 'warning',
      icon: 'iconfont icon-xuanzeyixuanze',
      duration: 8000,
    },
    (type) => {
      if (type == 'click') {
        showTodoBox();
      }
    },
    1
  );
}
// 加载
function todoLoading() {
  let str = '';
  new Array(30).fill(null).forEach(() => {
    let w = Math.round(Math.random() * (90 - 20) + 20);
    str += `<p style="pointer-events: none;background-color:var(--color9);height:30px;width:100%;margin:10px 0;"></p>
              ${
                w % 2 === 0
                  ? '<p style="pointer-events: none;background-color:var(--color9);height:30px;width:100%;margin:10px 0;"></p>'
                  : ''
              }
              <p style="pointer-events: none;background-color:var(--color9);height:30px;width:${w}%;margin:10px 0;"></p>
        `;
  });
  $todoList.html(str).scrollTop(0);
}
// 获取待办列表
export function getTodoList(toTop) {
  if (toTop) {
    todoLoading();
  }
  reqTodoList({ pageNo: todoPageNo, pageSize: todoPageSize }).then((res) => {
    if (res.code == 0) {
      const { total, pageNo, data } = res.data;
      undoneCount = res.data.undoneCount;
      todoList = data;
      todoPageNo = pageNo;
      renderTodoList(total, toTop);
    }
  });
}
// 生成列表
function renderTodoList(total, toTop) {
  if ($todoBox.is(':hidden')) return;
  let str = `<div style="padding-bottom: 10px;">
      <button cursor class="add_btn btn btn_primary">添加</button>${
        todoList.some((item) => item.state == '1')
          ? '<button cursor class="clear_btn btn btn_danger">清除已完成</button>'
          : ''
      }
      ${
        todoList.length > 0
          ? '<button cursor class="clear_all_btn btn btn_danger">清空</button>'
          : ''
      }
          </div>`;
  if (todoList.length == 0) {
    str += `<p style="padding: 20px 0;pointer-events: none;text-align: center;">暂无待办事项</p>`;
    $todoList.html(str);
    return;
  }
  todoList.forEach((item) => {
    let { id, data, state, time } = item;
    str += `<ul data-id="${id}">
            <li cursor class="todo_state iconfont ${
              state == '0' ? 'icon-xuanzeweixuanze' : 'icon-xuanzeyixuanze'
            }"></li>
            <li class="todo_text">
              <div class="text ${state == '0' ? '' : 'del'}">${hdTextMsg(
      data
    )}</div>
              <div class="time">更新：${formatDate({
                template: '{0}-{1}-{2} {3}:{4}',
                timestamp: time,
              })}</div>
            </li>
            <li cursor class="set_btn iconfont icon-icon"></li>
          </ul>`;
  });
  str += `<div class="todo_paging_box">`;
  str += todoPgnt.getHTML({
    pageNo: todoPageNo,
    pageSize: todoPageSize,
    total,
    small: getScreenSize().w <= _d.screen,
  });
  str += `</div > `;
  $todoList.html(str);
  if (toTop) {
    $todoList.scrollTop(0);
  }
}
// 分页
const todoPgnt = pagination($todoList[0], {
  select: [40, 60, 80, 100, 200],
  change(val) {
    todoPageNo = val;
    getTodoList(true);
    _msg.botMsg(`第 ${todoPageNo} 页`);
  },
  changeSize(val) {
    todoPageSize = val;
    todoPageNo = 1;
    getTodoList(true);
    _msg.botMsg(`第 ${todoPageNo} 页`);
  },
  toTop() {
    $todoList.stop().animate(
      {
        scrollTop: 0,
      },
      _d.speed
    );
  },
});
// 获取todo数据
function getTodo(id) {
  return todoList.find((item) => item.id == id);
}
// 显示todo
export function showTodoBox() {
  hideRightMenu();
  setZidx($todoBox[0], 'todo', closeTodoBox);
  $todoBox.stop().fadeIn(_d.speed, () => {
    getTodoList(true);
  });
  $todoBox.css('display', 'flex');
  if (!$todoBox._once) {
    $todoBox._once = true;
    toSetSize($todoBox[0], 800, 800);
    toCenter($todoBox[0]);
  }
}
// 关闭todo
export function closeTodoBox() {
  toHide(
    $todoBox[0],
    {
      to: 'bottom',
      scale: 'small',
    },
    () => {
      backWindow.remove('todo');
      $todoList.html('');
    }
  );
}
$theadBtns.on('click', '.t_close_btn', closeTodoBox);
// 新增事项
function addTodo(e) {
  rMenu.inpMenu(
    e,
    {
      subText: '提交',
      items: {
        text: {
          type: 'textarea',
          placeholder: '待办内容',
          verify(val) {
            if (val.trim() == '') {
              return '请输入待办内容';
            } else if (val.trim().length > 500) {
              return '待办内容过长';
            }
          },
        },
      },
    },
    debounce(
      function ({ close, inp }) {
        reqTodoAdd({ data: inp.text })
          .then((result) => {
            if (parseInt(result.code) === 0) {
              close();
              _msg.success(result.codeText);
              getTodoList();
              return;
            }
          })
          .catch(() => {});
      },
      1000,
      true
    ),
    '新增待办事项'
  );
}
// 删除事项
function delTodo(e, id, cb) {
  let opt = {
      e,
      text: '确认清除：当页已完成事项？',
      confirm: { type: 'danger', text: '清除' },
    },
    param = {
      ids: todoList.filter((item) => item.state === '1').map((item) => item.id),
    };
  if (id) {
    param = { ids: [id] };
    if (id == 'all') {
      param = { ids: todoList.map((item) => item.id) };
      opt = {
        e,
        text: '确认清空：当页事项？',
        confirm: { type: 'danger', text: '清空' },
      };
    } else {
      opt = {
        e,
        text: '确认删除：事项？',
        confirm: { type: 'danger', text: '删除' },
      };
    }
  }
  _pop(opt, (type) => {
    if (type == 'confirm') {
      reqTodoDelete(param)
        .then((result) => {
          if (parseInt(result.code) === 0) {
            _msg.success(result.codeText);
            getTodoList();
            cb && cb();
            return;
          }
        })
        .catch(() => {});
    }
  });
}
// 编辑事项
function editTodo(e, todo) {
  rMenu.inpMenu(
    e,
    {
      subText: '提交',
      items: {
        text: {
          type: 'textarea',
          placeholder: '待办内容',
          value: todo.data,
          verify(val) {
            if (val.trim() == '') {
              return '请输入待办内容';
            } else if (val.trim().length > 500) {
              return '待办内容过长';
            }
          },
        },
      },
    },
    debounce(
      function ({ close, inp }) {
        let data = inp.text;
        if (data == todo.data) return;
        reqTodoEdit({ id: todo.id, data })
          .then((result) => {
            if (parseInt(result.code) === 0) {
              close(true);
              _msg.success(result.codeText);
              getTodoList();
              return;
            }
          })
          .catch(() => {});
      },
      1000,
      true
    ),
    '编辑待办事项'
  );
}
// 菜单
function todoMenu(e) {
  const todo = getTodo($(this).parent().attr('data-id'));
  const data = [
    {
      id: 'copy',
      text: '复制',
      beforeIcon: 'iconfont icon-fuzhi',
    },
  ];
  if (todo.state == 0) {
    data.push({
      id: 'edit',
      text: '编辑',
      beforeIcon: 'iconfont icon-bianji',
    });
  }
  data.push({
    id: 'del',
    text: '删除',
    beforeIcon: 'iconfont icon-shanchu',
  });
  rMenu.selectMenu(
    e,
    data,
    function ({ e, close, id }) {
      if (id == 'edit') {
        editTodo(e, todo);
      } else if (id == 'del') {
        delTodo(e, todo.id, () => {
          close();
        });
      } else if (id == 'copy') {
        copyText(todo.data);
        close();
      }
    },
    todo.data
  );
}
$todoList
  .on('click', '.add_btn', addTodo)
  .on('click', '.clear_btn', delTodo)
  .on('click', '.clear_all_btn', function (e) {
    delTodo(e, 'all');
  })
  .on('click', '.set_btn', todoMenu)
  .on('click', '.todo_state', function () {
    changeTodoState($(this).parent().attr('data-id'));
  });
function changeTodoState(id) {
  const todo = getTodo(id);
  let obj = { id: todo.id };
  if (todo.state == '1') {
    obj.flag = 'y';
  }
  reqTodoState(obj)
    .then((res) => {
      if (res.code == 0) {
        _msg.success(res.codeText);
        getTodoList();
      }
    })
    .catch(() => {});
}
// 层级
function todoIndex(e) {
  if (_getTarget(this, e, '.todo_box')) {
    setZidx($todoBox[0], 'todo', closeTodoBox);
  }
}
document.addEventListener('mousedown', (e) => {
  if (isMobile()) return;
  todoIndex(e);
});
document.addEventListener('touchstart', (e) => {
  if (!isMobile()) return;
  todoIndex(e.changedTouches[0]);
});
// 拖动
myDrag({
  trigger: $theadBtns.find('.t_space')[0],
  target: $todoBox[0],
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
// 调整大小
myResize({
  target: $todoBox[0],
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
// 手势关闭
_mySlide({
  el: $todoList[0],
  right(e) {
    if (
      getSelectText() !== '' ||
      _getTarget(this, e, '.todo_list .todo_paging_box')
    )
      return;
    closeTodoBox();
  },
});
