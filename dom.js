import _ from 'lodash';
import ReactDOM from 'react-dom';

// 扩展 _ 方法
Object.assign(window.util = window.util || {}, {
    // 对dom的操作
    dom: {
        // 初始化执行方法
        bodyHeight: 0,
        init: () => {
            util.dom.bodyHeight = $('body').height();
        },
        heightFullMinus: (select) => {
            let minus = 0;
            let s = $(select);
            let cls = s.attr('class') || '';
            let clsArr = cls.split(' ');
            for (let i in clsArr) {
                let c = clsArr[i];
                if (_.startsWith(c, 'height-full-') && c !== 'height-full-body') {
                    minus = _.last(c.split('-'));
                }
            }
            minus = parseInt(minus);
            return isNaN(minus) ? 0 : minus;
        },
        // 高度撑满body
        heightFullBody: (select) => {
            // 获得选择器
            let s = $(select);
            // 获得查询DOM
            if (s.length > 0) {
                // 遍历所有选择元素
                s.each(function() {
                    // 计算减少的值
                    let minus = util.dom.heightFullMinus($(this));
                    // 计算dom，偏移量
                    let offset = $(this).offset();
                    // 设置dom 里body底部，最小高度
                    $(this).css({
                        'min-height': (util.dom.bodyHeight - offset.top - minus),
                        'position': 'relative'
                    });
                });
            }
        },
        // 检查dom对象
        checkDOM: (dom) => {
            return dom instanceof Element;
        },
        // 从Backbone View页面，渲染React组件到Dom；并自动处理资源回收
        Render: class Render {

            // 渲染构造方法
            constructor(view, react, container) {
                // 页面组件
                this.view = view;
                // 覆盖视图销毁方法
                this.overrideViewDestory();
                // 赋值页面组件
                this.react = react;
                // 构建容器
                this.buildContainer(container);
                // 将组件渲染到页面
                this.render();
            }

            // 覆盖视图的销毁方法
            overrideViewDestory() {
                // 当前对象别名
                let _this = this;
                // 设置销毁前回调
                this.view.onBeforeDestroy = function() {
                    // 销毁组件方法
                    ReactDOM.unmountComponentAtNode(_this.container);
                }
            }

            // 构建Dom容器
            buildContainer(container) {
                // 如果是字符串，选择器
                if (_.isString(container)) {
                    this.container = $(container)[0];
                // 是一个jquery类型
                } else if (container instanceof jQuery) {
                    this.container = container[0];
                // 是一个dom 类型
                } else {
                    this.container = container;
                }
            }

            // 渲染组件到页面
            render() {
                let _this = this;
                window.requestAnimationFrame(() => {
                    ReactDOM.render(_this.react, _this.container);
                });
            }
        }
    }
});
// 执行初始化方法
util.dom.init();
