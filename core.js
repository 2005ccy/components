// 工具方法
import _ from 'lodash';
// 时间工具类
import moment from 'moment';
// 生成对象hash 字符串
import hash from 'object-hash';

// 扩展 _ 方法
Object.assign(window.util = window.util || {}, {
    // 核心功能
    core: {
        isDev: _.includes('localhost,127.0.0.1', location.hostname),
        // 截取字符串
        substring: (str, start, end) => {
            if (_.isString(str)) {
                let si = str.indexOf(start);
                if (si > -1) {
                    si = si + start.length;
                    let ei = str.indexOf(end, si);
                    ei = ei < 0 ? str.length : ei;
                    return str.substring(si, ei);
                }
            }
            return str;
        },
        // 获取当前日期
        nowDate: () => {
            return moment().format('YYYY-MM-DD');
        },
        // 将时间转换为字符串
        timeStr: (date, format) => {
            // 时间无效
            if (!date) {
                return null;
            }
            // 设置时间对象
            let m = date;
            // 如果不是moment对象
            if (!moment.isMoment(date)) {
                // 转换为moment对象
                m = moment(date);
                // 如果moment对象无效, 返回null
                if (!m._isValid) {
                    return null;
                }
            }
            // 格式化字符串
            return m.format(format);
        },
        // 获取日期
        getDate: (date) => {
            return util.core.timeStr(date, 'YYYY-MM-DD');
        },
        // 获取时间
        getTime: (date) => {
            return util.core.timeStr(date, 'YYYY-MM-DD HH:mm');
        },
        // 获取时间
        getTimes: (date) => {
            return util.core.timeStr(date, 'YYYY-MM-DD HH:mm:ss');
        },
        // 返回错误承诺对象
        reject: (err) => {
            let dfd = $.Deferred();
            dfd.reject(err);
            return dfd.promise();
        },
        // 返回正确承诺对象
        resolve: (data) => {
            let dfd = $.Deferred();
            dfd.resolve(data);
            return dfd.promise();
        },
        // 返回超时正确对象
        resolveTimeout: (data, mills) => {
            let dfd = $.Deferred();
            setTimeout(() => {
                dfd.resolve(data);
            }, mills || 100);
            return dfd.promise();
        },
        // 组件是否已经被卸载
        isUnMount: (component) => {
            return !component || component.isUnMount || component._calledComponentWillUnmount;
        },
        // 发现元素，或取第一个元素
        findOrFirst: (list, cond) => {
            // 返回空对象
            if (!_.isArray(list) || _.isEmpty(list)) {
                return {};
            }
            // 返回符合条件，或第一个数据
            let obj = _.find(list, cond);
            // 如果数据无，返回第一个
            if (!obj) {
                return list[0];
            }
            // 返回查询到的对象
            return obj;
        },
        // 调用指定函数
        call: (func, ...params) => {
            return _.isFunction(func) && func(...params);
        },
        // 生成uuid字符串 ==OK==
        uuid: () => {
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
            return uuid;
        },
        // 添加样式到头部
        appendCss: (css) => {
            // 存在css内容
            if (_.isString(css)) {
                // 构建style DOM元素
                let style1 = document.createElement('style');
                // 添加样式内容
                style1.innerHTML = css;
                // 将样式加载到头部
                document.head.appendChild(style1);
            }
        },
        // 添加组件样式
        appendComponentCss: (key, css) => {
            // 是否已经加载过，相应的样式文件
            if (!util.storage.cache[key]) {
                // 加载样式文件到页面
                util.core.appendCss(css);
                // 更改条件状态
                util.storage.cache[key] = true;
            }
        },
        componentKey: {},
        // 对form进行缓存
        componentCache: new WeakMap(),
        // 设置form到缓存
        setComponent: (id, form) => {
            let key = {
                name: id
            };
            util.core.componentKey[id] = key;
            util.core.componentCache.set(key, form);
        },
        // 获取缓存的form
        getComponent: (id) => {
            let key = util.core.componentKey[id];
            return util.core.componentCache.get(key);
        },
        // 删除缓存的form
        removeComponent: (id) => {
            let key = util.core.componentKey[id];
            delete util.core.componentCache.delete(key);
            delete util.core.componentKey[id];
        },
        // 是一个简单对象
        isSimpleObject: (obj) => {
            // 是一个对象类型
            if (_.isObject(obj)) {
                // 遍历对象属性值
                let vs = _.values(obj);
                // 遍历对象属性值
                for (let i in vs) {
                    // 如果属性值为 对象类型，则为复杂类型
                    if (_.isObject(vs[i])) {
                        return false;
                    }
                }
                // 对象为简单对象
                return true;
            }
            // 对象不是简单对象
            return false;
        },
        // 获取配置url
        url: (url) => {
            return window.getapi('rrp', url);
        },
        // 跳转页面
        navigate: (url) => {
            Backbone.history.navigate(url, {
                trigger: true
            });
        },
        // 连接数组
        concat: (source, ...target) => {
            let ret = source.slice() || [];
            for (let i in target) {
                let t = target[i];
                if (_.isArray(t)) {
                    ret.splice(ret.length, 0, ...t);
                } else {
                    ret.push(t);
                }
            }
            return ret;
        },
        // 过滤对象值
        filterObj: (obj) => {
            let ret = {};
            for (let k in obj) {
                let val = obj[k];
                if (val) {
                    ret[k] = val;
                }
            }
            return ret;
        },
        // 构建blob 数据
        blob: (string, type) => {
            try {
                // 构建blob数据
                return new Blob([string], type || {
                        type: 'application/javascript'
                    });
            } catch ( e ) { // Backwards-compatibility
                // 构建兼容的blob数据
                window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
                let blob = new BlobBuilder();
                blob.append(string);
                return blob.getBlob();
            }
        },
        // 后续对象的基础类
        Base: class Base {
            // 每个类的唯一标识
            id = util.core.uuid();

            // Base 类构造方法
            constructor() {
                // 将所有方法，绑定this
                this.autoBind();

                // 构建weak 操作
                this.weak = new util.optimize.Weak(this);
                // 改变map
                this.isChangeMap = this.getObject();
            }

            // 绑定方法数组
            bind(methods) {
                methods.forEach(method => {
                    this[method] = this[method].bind(this);
                });
            }

            // 执行类的所有方法绑定
            autoBind() {
                this.bind(
                    Object.getOwnPropertyNames(this.constructor.prototype)
                        .filter(prop => typeof this[prop] === 'function')
                );
            }

            // 构建一个易于清理的数组
            getArray(arr) {
                // 获取uuid
                let uuid = util.core.uuid();
                // 设置一个新数组
                this.weak.set(uuid, arr || []);
                // 返回新数组值
                return this.weak.get(uuid);
            }

            // 构建易于清理的对象
            getObject(obj) {
                // 获取uuid
                let uuid = util.core.uuid();
                // 设置一个新对象
                this.weak.set(uuid, obj || {});
                // 返回新数组值
                return this.weak.get(uuid);
            }

            // 组件具备hash能力
            hash(obj) {
                // 计算对象hash字符串
                return hash(obj);
            }

            // 判断对象是否改变
            isChange(key, obj) {
                // 如果是一个空对象，则未修改
                if (_.isEmpty(obj)) {
                    return false;
                }
                // 计算对象hash值
                let c = hash(obj);
                // 获取保存key 与 hash 对象
                let map = this.isChangeMap;
                // 比较现有hash值
                if (c !== map[key]) {
                    // 赋予新hash值
                    map[key] = c;
                    // 返回值已改变
                    return true;
                }
                // 返回值未改变
                return false;
            }

            // 执行帧操作
            frame(func, ...param) {
                // 获取函数名称
                let key = `${func.name}.frame`;
                // 如果不存在对应的key
                if (!this.weak.has(key)) {
                    // 构建一个帧对象
                    let frame = new util.optimize.Frame(this, func);
                    // 并缓存帧对象
                    this.weak.set(key, frame);
                }
                // 执行对应函数
                this.weak.get(key).push(param);
            }

            // 多次执行相同逻辑
            timesFrame(func, param, times) {
                // 遍历执行帧次数
                for (var i = 0; i < times; i++) {
                    // 生成帧方法
                    this.frame(func, param);
                }
            }

            // 执行异步操作
            async(func, ...param) {
                // 获取函数名称
                let key = `${this.id}.async`;
                // 如果不存在对应的key
                if (!this.weak.has(key)) {
                    // 构建一个帧对象
                    let async = new util.optimize.Async(this);
                    // 并缓存帧对象
                    this.weak.set(key, async);
                }
                // 执行对应函数
                this.weak.get(key).push(func, param);
            }

            // 异步并封装，普通函数
            asyncResolve(func, ...param) {
                // 执行异步操作
                this.async((param) => {
                    // 构建承诺对象
                    let dfd = $.Deferred();
                    // 成功返回，函数结果
                    dfd.resolve(func(param));
                    // 返回承诺对象
                    return dfd.promise();
                }, param);
            }

            // 查询个数
            selectCount(select, length, callback) {
                // 判断个数是否相同
                if ($(select).length === length) {
                    // 回调相应方法
                    callback();
                } else {
                    // 下次继续执行
                    setTimeout(this.selectCount.bind(this, select, length, callback), 100);
                }
            }

            // 异步查询DOM 个数
            asyncSelectCount(func, param) {
                // 执行异步操作
                this.async((param) => {
                    // 构建承诺对象
                    let dfd = $.Deferred();
                    // 获取选择器
                    let selObj = func(param);
                    // 查询选择器个数
                    this.selectCount(selObj.select, selObj.length, () => {
                        // 成功返回，函数结果
                        dfd.resolve(selObj);
                    });
                    // 返回承诺对象
                    return dfd.promise();
                }, param);
            }
        }
    }
});
