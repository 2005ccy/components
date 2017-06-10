import _ from 'lodash';
import pingback from 'core/services/pingback';
import hash from 'object-hash';

const _ajaxCacheWeakMap = new WeakMap();

// 扩展 _ 方法
Object.assign(window.util = window.util || {}, {
    // 临时存储
    storage: {
        // 缓存对象
        cache: {},
        // 设置localStorage
        setItem: (k, v) => {
            try {
                if (_.isObject(v)) {
                    v = JSON.stringify(v);
                }
            } catch ( e ) {};
            // 浏览器支持 localStorage
            if (typeof localStorage !== 'undefined') {
                try {
                    // 设置信息
                    localStorage.setItem(k, v);
                } catch ( e ) {};
            } else {
                // 临时存储
                util.storage.cache[k] = v;
            }
        },
        // 是否存在 缓存项
        hasItem: (k) => {
            return !_.isUndefined(util.storage.getItem(k));
        },
        // 获取localStorage
        getItem: (k) => {
            // 取出缓存中的值
            try {
                let v = typeof localStorage !== 'undefined' ? localStorage.getItem(k) : util.storage.cache[k];
                if (_.includes(v, '[') || _.includes(v, '{')) {
                    v = JSON.parse(v);
                }
                return v;
            } catch ( e ) {}
            return null;
        },
        // 删除localStorage 中的值
        removeItem: (k) => {
            if (typeof localStorage !== 'undefined') {
                // 删除存储值
                try {
                    localStorage.removeItem(k);
                } catch ( e ) {}
            } else {
                // 删除存储值
                delete util.storage.cache[k];
            }
        },
    },
    // 声明一个请求对象
    request: {
        // 初始化方法
        init: () => {
            // 扩展jquery ajax支持put delete方法.
            jQuery.each(["put", "delete"], function(i, method) {
                // 构建ajax 请求方法
                jQuery[method] = function(url, data, callback, type) {
                    // shift arguments if data argument was omitted
                    if (jQuery.isFunction(data)) {
                        type = type || callback || 'json';
                        callback = data;
                        data = undefined;
                    }
                    // 返回一个ajax请求对象
                    return jQuery.ajax({
                        url: url,
                        type: method,
                        dataType: type || 'json',
                        data: data,
                        success: callback || jQuery.noop
                    });
                };
            });
        },
        // 后端接口请求
        Ajax: class Ajax {
            // ajax构造方法
            constructor(config, widget) {
                // Ajax对象，没有绑定组件对象；输出错误信息
                if (!widget) {
                    throw Error('Ajax 必须绑定，组件对象');
                }
                // 设置ajax 配置文件
                this.config = config;
                // 设置ajax 组件对象
                this.widget = widget;
                // 设置节流方法
                if (this.config.throttle) {
                    let _this = this;
                    // 构建do别名方法
                    this._do = this.do;
                    // 生成do 节流方法
                    this._do = _.throttle(this._do.bind(this), this.config.throttle, {
                        // 关闭节流开始前调用
                        'leading': false,
                        // 节流结束后开始调用
                        'trailing': true
                    });
                    // 重写有节流特性的，ajax请求方法
                    this.do = () => {
                        // 返回do操作，及容错承诺对象
                        return _this._do() || util.core.reject();
                    }
                }
            }

            // 请求前，设置状态信息
            before(state) {
                this.beforeState = state;
                return this;
            }

            // 设置请求前状态修改
            _setBeforeState() {
                // 设置组件状态值
                this.widget.setState(this.beforeState);
            }

            // 设置参数
            param(param) {
                this._param = param;
                return this;
            }

            // 覆盖组件属性
            setWidget(widget) {
                this.widget = widget;
                return this;
            }

            // 设置组件状态
            setState(state) {
                // 定义对象别名
                let _this = this;
                // 设置对象状态
                this.state = state;
                // 获取承诺对象
                let dfd = $.Deferred();
                // 将请求放入下一帧
                window.requestAnimationFrame(() => {
                    // 执行ajax 请求
                    _this.do().done((data) => {
                        // ajax 执行成功，返回结果
                        dfd.resolve(data);
                    }).fail((err) => {
                        // 执行失败，返回错误
                        dfd.reject(err);
                    });
                });
                // 返回承诺对象
                return dfd.promise();
            }

            // 向组件设置状态值
            _setState(data) {
                // 初始化状态值
                let r = {};
                // 遍历状态值
                for (let k in this.state) {
                    // 获取设置值
                    let val = this.state[k];
                    // 如果是字符串，则设置ajax结果值
                    if (_.isString(val)) {
                        r[k] = _.get(data, val, _.startsWith(val, 'data') ? [] : val);
                    // 如果是函数类型，则调用函数
                    } else if (_.isFunction(val)) {
                        r[k] = val(data);
                    // 如果是其他，则直接赋值
                    } else {
                        r[k] = val;
                    }
                }
                // 设置组件状态值
                this.widget.setState(r);
            }

            // 获取请求url
            getUrl() {
                return window.getapi('rrp', this.config.url(this._param));
            // return `https://gw.wmcloud.com/rrp/web${this.config.url(this._param)}`;
            }

            // 使用工作线程，获取ajax请求
            getWorker() {
                let dfd = $.Deferred();
                let ajaxWorker = util.worker.getAjaxWorker();
                ajaxWorker.get(dfd, this.getUrl(), this._param);
                return dfd.promise();
            }

            // 发起ajax get请求
            get() {
                return util.worker.canWorker() ? this.getWorker() : $.get(this.getUrl(), this._param);
            }

            // 支持缓存请求
            getCache() {
                // 计算请求key
                let key = `${this.getUrl()}.${hash(this._param)}`;
                // 获取缓存数据
                let cache = _ajaxCacheWeakMap.get(this);
                // 获取缓存数据
                let c = cache && cache[key];
                // 如果存在缓存数据
                if (c) {
                    // 返回克隆数据
                    return util.core.resolve(JSON.parse(c));
                }
                // 发起ajax 请求
                return this.get().done((data) => {
                    // 存在缓存，不存在key
                    if (cache) {
                        cache[key] = JSON.stringify(data);
                    // 不存在缓存，新增缓存
                    } else {
                        _ajaxCacheWeakMap.set(this, {
                            [key]: JSON.stringify(data)
                        });
                    }
                });
            }

            // 使用工作线程，获取ajax请求
            postWorker() {

                let dfd = $.Deferred();
                let ajaxWorker = util.worker.getAjaxWorker();
                try {
                    ajaxWorker.post(dfd, this.getUrl(), this._param);
                } catch ( e ) {
                    dfd.reject();
                }

                return dfd.promise();
            }

            // 发起ajax post请求
            post() {
                return util.worker.canWorker() ? this.postWorker() : $.post(this.getUrl(), this._param);
            }

            // 发起ajax put请求
            put() {
                return $.put(this.getUrl(), this._param);
            }

            // 发起ajax delete请求
            delete() {
                return $.delete(this.getUrl(), this._param);
            }

            // json类型请求
            json(type) {
                return $.ajax({
                    type: type,
                    url: this.getUrl(),
                    data: JSON.stringify(this._param),
                    dataType: "json",
                    contentType: "application/json"
                });
            }

            // 发起post JSON 请求
            postJSON() {
                return this.json('POST');
            }

            // 发起put JSON 请求
            putJSON() {
                return this.json('PUT');
            }

            // 改变单个对象，属性值
            _changeUnitObj(obj, changeFuncs) {
                // 遍历改变函数列表
                for (let k in changeFuncs) {
                    // 获得单个改变函数
                    let fuc = changeFuncs[k];
                    // 如果数据中不存在，该数据
                    if (_.isUndefined(obj[k])) {
                        // 则生成新属性
                        obj[k] = fuc(obj);
                    // 存在属性值
                    } else {
                        // 使用函数修改属性值
                        obj[k] = fuc(obj[k]);
                    }
                }
            }

            // 改变一个数据属性
            _changeDataAttr(attr, changeFuncs) {
                // 如果属性为数组类型
                if (_.isArray(attr)) {
                    // 遍历该数组
                    _.each(attr, (obj) => {
                        // 改变每个元素的属性
                        this._changeUnitObj(obj, changeFuncs);
                    })
                // 如果属性为对象类型
                } else if (_.isObject(attr)) {
                    // 改变元素属性
                    this._changeUnitObj(attr, changeFuncs);
                }
            }

            // 改变接口数据
            _changeData(data) {
                // 获取属性变更配置
                let change = this.config.change;
                // 遍历配置列表
                for (let k in change) {
                    // 获取属性修改，函数列表
                    let cfs = change[k];
                    // 查询属性值
                    let d = _.get(data, k);
                    // 如果属性存在
                    if (d) {
                        // 使用函数列表，修改属性值
                        this._changeDataAttr(d, cfs);
                    }
                }
            }

            // 执行ajax请求
            do() {
                // 如果存在过期设置, 且没有页码参数
                if (this.config.expire) {
                    // 获取页码
                    let pageNow = this._param['pageNow'];
                    // 检查当前组件，指定状态；过期时间；未过期，则终止ajax 请求
                    let noExpire = !this.widget.checkStateStampExpire(this.state, this.config.expire);
                    // 页码存在，第一页判断过期；不存在页码，判断过期
                    if (pageNow ? pageNow === 1 && noExpire : noExpire) {
                        // 终止ajax
                        return util.core.reject();
                    }
                }
                // 存在请求前，状态修改
                !_.isEmpty(this.beforeState) && this._setBeforeState();
                // 存在配置参数配置, 使用配置参数
                if (_.isFunction(this.config.param)) {
                    // 通过配置文件参数，获得参数值
                    this._param = this.config.param(this.widget);
                }
                // 存在配置状态，优先使用配置选项
                this.state = this.config.setState ? this.config.setState : this.state;
                // 执行后端接口请求
                return this[this.config.method]().done((data) => {
                    // 判断是否存在mock数据
                    if (util.core.isDev && (!data || !data.data) && _.isFunction(this.config.mock)) {
                        // 设置mock数据
                        data = this.config.mock();
                    }
                    // 改变接口数据
                    !_.isEmpty(this.config.change) && this._changeData(data);
                    // 如果存在组件对象
                    this.widget && this.state && this._setState(data);
                });
            }
        }
    },
    // 打点对象
    pingback: {
        send: (eventId, param) => {
            pingback.send(_.extend({
                eventId: eventId
            }, param));
        // console.info('pingback: ', eventId, ', param:', param);
        }
    }
});
// 执行初始化方法
util.request.init();
