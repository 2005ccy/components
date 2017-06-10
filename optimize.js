// 帧的weak 数据
const _frameWeakMap = new WeakMap();
// weak 相关数据
const _weakWeakMap = new WeakMap();
// 异步weak 数据
const _asyncWeakMap = new WeakMap();

// 扩展优化方法
Object.assign(window.util = window.util || {}, {
    // 临时存储
    optimize: {
        // 帧的相关操作类
        Frame: class Frame {

            // 帧处理构造方法
            constructor(widget, callback) {
                // 定义组件
                this.widget = widget;
                // 定义帧处理回调函数
                this.callback = callback;
                // 不存在对象容器
                if (!_frameWeakMap.has(this.widget)) {
                    // 构建帧数据容器
                    _frameWeakMap.set(this.widget, []);
                }
            }

            // 帧操作入栈处理
            push(param) {
                // 帧操作数组
                let array = _frameWeakMap.get(this.widget);
                // 放置参数
                array.push(param);
                // 移入下帧
                this.animation();
            }

            // 移入下帧
            animation() {
                let _this = this;
                // 设置组件为null
                window.requestAnimationFrame(() => {
                    // 获取帧处理数组
                    let array = _frameWeakMap.get(_this.widget);
                    // 获取第一个帧执行参数
                    let param = array.shift();

                    // 函数为绑定函数
                    if (_.startsWith(_this.callback.name, 'bound')) {
                        // 执行帧处理回调
                        _this.callback(...param);
                    } else {
                        // 执行帧处理回调
                        _this.callback(_this.widget, ...param);
                    }
                });
            }
        },
        // 帧的相关操作类
        Async: class Async {

            // 帧处理构造方法
            constructor(widget) {
                // 定义组件
                this.widget = widget;
                // 不存在对象容器
                if (!_asyncWeakMap.has(this.widget)) {
                    // 构建帧数据容器
                    _asyncWeakMap.set(this.widget, []);
                }
            }

            // 帧操作入栈处理
            push(promise, param) {
                // 帧操作数组
                let array = _asyncWeakMap.get(this.widget);
                // 放置参数
                array.push({
                    promise,
                    param
                });
                // 移入下帧
                this.awaitAsync();
            }

            // 判断是否存在指定异步函数
            hasAsync(func) {
                // 参数函数名称
                let pfn = func.name;
                // 如果当前承诺对象，名称与参数名称相同
                if (_.get(this, 'promiseObj.promise.name') == pfn) {
                    return true;
                }
                // 获取缓存weak
                let array = _asyncWeakMap.get(this.widget);
                // 遍历现有异步函数
                for (let i in array) {
                    // 获取单个异步操作
                    let p = array[i];
                    // 获取操作函数名称
                    let fn = p.param.funcName || p.promise.name;
                    // 如果函数名称相同
                    if (fn == pfn) {
                        // 存在相关函数
                        return true;
                    }
                }
                // 不存在相关函数
                return false;
            }

            // 移入下帧
            awaitAsync() {
                // 如果当前对象不存在 或是 状态不是pending状态
                if (!this.promise || this.promise.state() !== 'pending') {
                    // 获取帧处理数组
                    let array = _asyncWeakMap.get(this.widget);
                    // 获取第一个帧执行参数
                    this.promiseObj = array.shift();
                    // 存在承诺对象
                    if (this.promiseObj) {
                        this.promiseObj.promise.name && console.info('async func: ', this.promiseObj.promise.name);
                        // 执行承诺对象
                        this.promise = this.promiseObj.promise(this.promiseObj.param);
                        // 承诺对象执行完成
                        this.promise.always(() => {
                            // 继续下一个承诺请求
                            this.awaitAsync();
                        });
                    }
                }
            }
        },
        // weak数据相关操作
        Weak: class Weak {

            // weak 构造方法
            constructor(widget) {
                // 赋值给对象组件
                this.widget = widget;
                // 构建帧数据容器
                _weakWeakMap.set(this.widget, {});
            }

            // 获取数组
            getArray() {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 返回一个新数据
                return map[util.core.uuid()] = [];
            }

            // 获取对象
            getObject() {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 返回一个新数据
                return map[util.core.uuid()] = {};
            }

            // 判断是否存在指定值
            has(key) {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 判断对象中，是否存在指定key
                return !!map[key];
            }

            // 设置属性key, value
            set(key, value) {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 判断对象中，是否存在指定key
                map[key] = value;
            }

            // 根据key，获取指定值
            get(key) {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 获取指定key值
                return map[key];
            }

            // 删除key 指定数据
            delete(key) {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 删除指定key
                delete map[key];
            }

            // 获取数据个数
            size() {
                // 获取对象缓存数据
                let map = _weakWeakMap.get(this.widget);
                // 删除指定key
                return _.size(map);
            }

            // 清空所有成员
            clear() {
                _weakWeakMap.set(this.widget, {});
            }
        }
    }
});
