import _ from 'lodash';

// 扩展 util 方法
Object.assign(window.util = window.util || {}, {
    // 核心功能
    d3: {
        // 查找可见元素
        showNodes: (nodeList, selFunc) => {
            return _.filter(nodeList, (node, i) => {
                return d3.selectAll(selFunc(node, i))[0][0];
            });
        },
        // d3 元素操作类
        Operate: class Operate {

            // d3 元素操作类构造方法
            constructor(select) {
                // 赋值选择器
                this.select = select;
            }

            // 添加class 属性
            addClass(className) {
                // 设置需添加的类名
                this.addClassName = className;
                // 返回自身
                return this;
            }

            // 添加class 方法
            _addClass(selObj) {
                // 获取元素当前 class
                let cls = selObj.attr('class');
                // 如果不包含，需要设置的class， 则添加当前class
                !_.includes(cls, this.addClassName) && selObj.attr({
                    // 连接新的class
                    'class': cls + ' ' + this.addClassName
                });
            }

            // 需要移除某个class
            removeClass(className) {
                // 记录要移除的class, 没有参数则为选择器本身
                this.removeClassName = className || this.select.replace(/[.]/, '');
                // 返回对象本身
                return this;
            }

            // 存在回调函数
            callback(callback) {
                // 设置回调函数
                this._callback = callback;
                // 返回对象本身
                return this;
            }

            // 移除样式操作
            _removeClass(selObj) {
                // 获取当前元素class
                let cls = selObj.attr('class');
                // 替换要移除的class
                let ncls = _.trim(cls.replace(this.removeClassName, ''));
                // 设置新的class
                selObj.attr({
                    'class': ncls
                })
            }

            // 替换某属性
            replace(attrName, value) {
                // 记录要替换的属性名称
                this.replaceAttrName = attrName;
                // 记录要替换的值
                this.replaceValue = value;
                // 返回对象本身
                return this;
            }

            // 进行替换操作
            _replace(selObj) {
                // 查询还原属性值
                let storeAttr = selObj.attr(`data-${this.replaceAttrName}`);
                // 设置还原对象
                let storeObj = {};
                // 如果当前元素，还原属性无效
                if (!storeAttr) {
                    // 获取当前替换属性值
                    let replaceAttr = selObj.attr(this.replaceAttrName);
                    // 设置还原对象值
                    storeObj[`data-${this.replaceAttrName}`] = replaceAttr;
                }
                // 设置替换属性，及还原属性值
                selObj.attr(_.extend({
                    [this.replaceAttrName]: this.replaceValue
                }, storeObj));
            }

            // 还原某属性
            restore(attrName) {
                // 记录要还原的属性
                this.restoreAttrName = attrName;
                // 返回自身
                return this;
            }

            // 还原某属性
            _restore(selObj) {
                // 获取还原属性值
                let storeAttr = selObj.attr(`data-${this.restoreAttrName}`);
                // 设置还原属性，及失效保存还原属性
                selObj.attr({
                    [this.restoreAttrName]: storeAttr,
                    [`data-${this.restoreAttrName}`]: ''
                });
            }

            // 添加背景文本
            bgText(className, text, padding) {
                this.bgTextClassName = className;
                this.bgTextContent = text;
                this.bgTextPadding = padding;
                return this;
            }

            _bgText(selObj) {
                selObj.selectAll(this.bgTextClassName).remove();
                let bgtg = selObj.append('g').attr({
                    'class': this.bgTextClassName.replace(/\./g, '')
                });
                let p = this.bgTextPadding;
                let width = this.bgTextContent.length * 15;
                let height = 15;
                bgtg.append('rect').attr({
                    rx: 3,
                    ry: 3,
                    width: width,
                    height: height,
                    x: p.x - width / 2,
                    y: p.y - height
                });
                bgtg.append('text').text(this.bgTextContent).attr({
                    'text-anchor': 'middle',
                    x: p.x,
                    y: p.y - 4
                });
            }

            // 执行操作
            do() {
                // d3 操作对象别名
                let _this = this;
                // 选择要操作的对象
                return d3.selectAll(this.select).each(function(d) {
                    // 获取元素对象
                    let selObj = d3.select(this);

                    // 替换某属性
                    if (_this.replaceAttrName) {
                        _this._replace(selObj);
                    }

                    // 还原某属性
                    if (_this.restoreAttrName) {
                        _this._restore(selObj);
                    }

                    // 存在移除class操作
                    if (_this.removeClassName) {
                        _this._removeClass(selObj);
                    }

                    // 存在添加class 操作
                    if (_this.addClassName) {
                        _this._addClass(selObj);
                    }

                    // 存在回调函数
                    if (_.isFunction(_this._callback)) {
                        _this._callback(selObj);
                    }

                    // 添加背景文本
                    if (_this.bgTextContent) {
                        _this._bgText(selObj);
                    }
                });
            }
        }
    }
});
