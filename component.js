// 生成对象hash 字符串
import hash from 'object-hash';
import React from 'react';
import PubSub from 'pubsub-js';

// 刷新帧列表
const frameList = [];
const stateList = [];

// 便于GC 回收的数据结构
const _stateWeakMap = new WeakMap();
const _tempWeakMap = new WeakMap();
const _stateStampWeakMap = new WeakMap();
const _subscribeArrWeakMap = new WeakMap();
const _operStateListWeakMap = new WeakMap();
const _changeWeakMap = new WeakMap();

// 高级定制组件类 【作者：陈朝阳】
class Component extends React.Component {

    // 每个组件都有唯一标识，一般用于组件id <div id={this.id}>...</div>
    id = util.core.uuid();

    // 组件构造方法
    constructor(props) {
        // 调用 'React.Component' 构造方法
        super(props);
        // 扩展组件状态属性
        this.extendState();
        // 覆盖组件生命周期方法，添加全局控制逻辑
        this.overrideLifecycle();
        // 将所有方法，绑定this
        this.autoBind();

        // 构建weak 操作
        this.weak = new util.optimize.Weak(this);
    }

    // 扩展主键状态属性
    extendState() {
        // 设置初始化 state 值
        this.state = Object.assign({
            hash: 'init', // 定义初始hash 值
            visible: true, // 定义组件在可视区域，只处理可视区组件；提升性能
        }, this.state);

        // 设置状态临时信息
        _stateWeakMap.set(this, []);
        // 设置临时对象数据
        _tempWeakMap.set(this, {});
        // 设置状态时间戳数据
        _stateStampWeakMap.set(this, {});
        // 设置订阅数组数据
        _subscribeArrWeakMap.set(this, []);
        // 设置状态操作类别数据
        _operStateListWeakMap.set(this, []);
        // 设置改变状态数据
        _changeWeakMap.set(this, {});
    }

    // 覆盖组件生命周期方法
    overrideLifecycle() {

        // 定义一个空函数
        let empty = () => {
        };

        // 页面挂载，触发的生命周期方法
        // Mounting: Class constructor -> componentWillMount -> render -> componentDidMount

        // 组件将要被加载到页面
        this._componentWillMount = this.componentWillMount || empty;
        this.componentWillMount = this.overrideComponentWillMount;
        // 组件已经加载到页面
        this._componentDidMount = this.componentDidMount || empty;
        this.componentDidMount = this.overrideComponentDidMount;

        // 页面卸载，触发的生命周期方法
        // Unmounting: componentWillUnmount

        // 组件将要从页面移除
        this._componentWillUnmount = this.componentWillUnmount || empty;
        this.componentWillUnmount = this.overrideComponentWillUnmount;

        // 组件属性更新，触发生命周期方法
        // Props Changes: componentWillReceiveProps -> shouldComponentUpdate -> componentWillUpdate -> render -> componentDidUpdate
        // 组件状态更新，触发生命周期方法
        // State Changes: shouldComponentUpdate -> componentWillUpdate -> render -> componentDidUpdate

        // 组件改变状态方法
        this._setState = this.setState;
        this.setState = this.overrideSetState;
        // 组件将要接收新属性
        this._componentWillReceiveProps = this.componentWillReceiveProps || empty;
        this.componentWillReceiveProps = this.overrideComponentWillReceiveProps;
        // 组件将要更新，通过该方法，返回true：允许组件更新；返回false：拒绝组件更新
        this._shouldComponentUpdate = this.shouldComponentUpdate;
        this.shouldComponentUpdate = this.overrideShouldComponentUpdate;
        // 组件将要更新，通过该方法，返回true：允许组件更新；返回false：拒绝组件更新
        this._render = this.render;
        this.render = this.overrideRender;
        // 组件更新前回调函数
        this._componentWillUpdate = this.componentWillUpdate || empty;
        this.componentWillUpdate = this.overrideComponentWillUpdate;
        // 组件更新完成
        this._componentDidUpdate = this.componentDidUpdate || empty;
        this.componentDidUpdate = this.overrideComponentDidUpdate;
    }

    // 根据索引--获取事件编号，发起打点事件
    _pingback(...indexs) {
        _.isObject(this.pingback) && this._pingbackSend(this._pingbackEventId(...indexs));
    }

    // 根据索引--获取事件编号，并传递参数，发起打点事件 
    _pingbackParam(param, ...indexs) {
        _.isObject(this.pingback) && this._pingbackSend(this._pingbackEventId(...indexs), param);
    }

    // 获取打点，事件编号
    _pingbackEventId(...indexs) {
        // 初始化eId
        let eventId = this.pingback;
        // 遍历参数
        for (let i = 0; i < indexs.length; i++) {
            // 获取参数指定值
            eventId = eventId[indexs[i]];
            // 结果无效，退出循环
            if (!eventId) {
                break;
            }
        }
        // 返回事件编号
        return eventId;
    }

    // 组件打点函数
    _pingbackSend(eventId, param) {
        // 存在事件id
        eventId && util.pingback.send(eventId, param);
    }

    // 组件将要被加载到页面
    overrideComponentWillMount() {
        // 如果属性名称
        if (this.props.name) {
            // 设置新的组件名称
            this.name = this.props.name;
        }
        // 如果名称不存在
        if (!this.name) {
            throw new Error('组件必须含有：name属性');
        }
        // 以id缓存组件
        util.core.setComponent(this.id, this);
        // 以name缓存组件
        util.core.setComponent(this.name, this);
        // 发布组件将要加载
        this._publish('componentWillMount');
        // 组件将要加载打点
        this._pingback('componentWillMount');
        // 执行子类回调
        this._componentWillMount();
    }

    // 对一些特殊样式，进行处理
    operateDOM() {
        // 获得组件选择器
        let s = $(`#${this.id}`);
        // 如果当前对象，没有填充class
        if (!s.hasClass('height-full-body')) {
            // 继续查询子组件
            s = s.find('.height-full-body');
        }
        // 填充选择器最小高度
        util.dom.heightFullBody(s);
    }

    didMount = false;

    // 组件已经加载到页面
    overrideComponentDidMount() {

        if (!this.didMount && !_.includes(frameList, this.id)) {
            // 设置dom完成标志位
            this.didMount = true;
            // 发布组件加载到页面
            this._publish('componentDidMount');
            // 对一些特殊样式，进行处理
            this.operateDOM();
            // 可以添加的逻辑： 1. 判断组件是否在可视区域, 如果不在，只渲染<div></div>, 停止ajax请求来 提升性能
            // 执行子类回调
            this._componentDidMount();
        }
    }

    // 组件将要从页面移除
    overrideComponentWillUnmount() {
        let _this = this;
        // 当前组件已被卸载
        this.isUnMount = true;
        // 发布组件卸载事件
        this._publish('componentWillUnmount');
        // 组件卸载事件
        this._pingback('componentWillUnmount');
        // 移除全局组件缓存
        util.core.removeComponent(this.id);
        // 移除全局组件缓存
        util.core.removeComponent(this.name);
        // 清除相关订阅
        this.clearPubSub();
        // 执行子类回调
        this._componentWillUnmount();
        // 设置组件为null
        window.requestAnimationFrame(() => {
            _this = null;
        });
    }

    // 构建一个易于清理的数组
    getArray() {
        // 获得临时数据
        let map = _tempWeakMap.get(this);
        // 返回一个新数据
        return map[util.core.uuid()] = [];
    }

    // 构建易于清理的对象
    getObject() {
        // 获得临时数据
        let map = _tempWeakMap.get(this);
        // 返回一个新数据
        return map[util.core.uuid()] = {};
    }

    // 将对象转为，简单对象
    toPlainObject(obj) {
        // 设置返回对象
        let ret = this.getObject();
        // 存在React.Element 属性
        if (obj.$$typeof) {
            return ret;
        }
        // 遍历对象属性
        for (let k in obj) {
            // 获得对象值
            let v = obj[k];
            // 无效值
            if (!v) {
                // 记录值
                ret[k] = v;
                // 继续下个属性
                continue;
            }
            // 如果对象为，简单对象
            if (_.isArray(v)) {
                // 遍历获得，原始对象，数组
                ret[k] = _.map(v, (item) => {
                    // 每个数组元素，继续获得值
                    return this.toPlainObject(item);
                });
            // 如果值为，复杂对象
            } else if (!v.$$typeof && !util.core.isSimpleObject(v)) {
                // 定义对象值
                let ro = this.getObject();
                // 放置对象中
                ret[k] = ro;
                // 遍历复杂对象
                _.each(v, (vv, k) => {
                    // 赋值每个属性
                    ro[k] = _.isObject(vv) ? this.toPlainObject(vv) : vv;
                });
            // 如果是简单对象
            } else if (!v.$$typeof && _.isPlainObject(v)) {
                // 放入返回结果
                ret[k] = v;
            }
        }
        // 返回去除，复杂值对象
        return ret;
    }

    // 改变状态时间戳
    _changeStateStamp() {
        // 获取修改状态
        let nextState = _.last(_stateWeakMap.get(this));
        let map = _stateStampWeakMap.get(this);
        // 遍历新状态
        for (let k in nextState) {
            // 记录新状态时间戳
            map[k] = _.now();
        }
    }

    // 检查检查状态时间戳，是否过期
    checkStateStampExpire(checkState, timeout) {
        // 如果没有需检查的，状态属性
        if (_.isEmpty(checkState)) {
            // 默认情况，返回已过期
            return true;
        }
        // 获取当前时间
        let now = _.now();
        // 获取当前状态时间戳map
        let map = _stateStampWeakMap.get(this);
        // 遍历需要检查的状态
        for (let k in checkState) {
            // 获取某状态值的时间戳
            let ss = map[k] || 0;
            // 如果当前时间 - 状态时间戳 大于 过期时间，则状态过期
            if (now - ss > timeout) {
                return true;
            }
        }
        // 返回，所有状态未过期
        return false;
    }

    // 组件改变状态方法, 如果param数组编号, hash将被改变
    overrideSetState(nextState) {
        // 如果新状态为 空
        if (_.isEmpty(nextState)) {
            // 退出方法
            return;
        }
        // 默认状态没有变更
        let same = true;
        // 用于存储原有属性
        let refMap = this.getObject();
        // 遍历新状态
        for (let k in nextState) {
            // 获取新的状态值
            let v = nextState[k];
            // 获得旧的状态值
            let ov = this.state[k];
            // 如果值不相同
            if (v !== ov && !this.state[`${k}__Hash__`]) {
                // 设置状态被改变
                same = false;
            }
            // 如果值相同，同时为对象引用比较
            if (_.isObject(v)) {
                // 记录引用属性
                refMap[k] = v;
            }
        }
        // 引用相同，无法比较结果
        if (same && !_.isEmpty(refMap)) {
            // 遍历引用对象
            for (let k in refMap) {
                // 获取引用属性
                let v = refMap[k];
                // 生成引用属性
                let hk = `${k}__Hash__`;
                // 计算引用属性hash 值
                let nsh = hash(this.toPlainObject(v));
                // hash值不相同
                if (this.state[hk] != nsh) {
                    // 设置hash 值
                    nextState[hk] = nsh;
                    // 不相同
                    same = false;
                }
            }
        }
        // 状态相同, 或是组件被卸载，退出设置状态
        if (same || util.core.isUnMount(this)) {
            return;
        }
        // 设置状态信息
        let list = _stateWeakMap.get(this);
        list.push(nextState);

        // 设置状态过期时间
        this._changeStateStamp();

        // 已经是帧处理，直接设置状态
        if (nextState['__frameNow__']) {
            this._setState(_stateWeakMap.get(this).shift());
        } else {
            // 记录状态修改
            stateList.push(this);
            // 每帧执行移除，状态设置
            window.requestAnimationFrame(() => {
                // 获取数组第一个数据
                let widget = stateList.shift();
                let ns = _stateWeakMap.get(widget).shift();
                // 设置组件状态
                widget._setState(ns);
            });
        }
    }

    // 组件将要接收新属性
    overrideComponentWillReceiveProps(nextProps) {
        // 添加全局，控制逻辑
        // 执行子类回调
        this._componentWillReceiveProps(nextProps);
    }

    // 组件将要更新，通过该方法，返回true：允许组件更新；返回false：拒绝组件更新
    overrideShouldComponentUpdate(nextProps, nextState) {
        // 存在子类覆盖方法，则执行子类逻辑
        if (this._shouldComponentUpdate) {
            return this._shouldComponentUpdate(nextProps, nextState);
        }
        // 默认属性比对，状态比对
        return true;
    }

    // 当前对象，是否经过帧管道
    animationFrame = false;

    // 组件更新
    overrideRender() {
        // 对象别名
        let _this = this;
        // 帧管道，标志位判断
        if (!this.animationFrame) {
            // 执行过，帧管道
            this.animationFrame = true;
            // 放入帧执行列表
            frameList.push(this.id);
            // 将下面操作，放入下帧执行
            window.requestAnimationFrame(() => {
                // 获取管道中，最后一个组件，并改变组件状态
                _this.get(frameList.pop()).setState({
                    __frameNow__: _.now()
                });
            });
            return <div></div>
        }
        // 下帧执行组件状态，加载完成
        window.requestAnimationFrame(this.overrideComponentDidMount.bind(this));
        // 执行组件渲染
        let content = this._render();
        // 添加 id={this.id} 容器
        return content.props.id ? content : (<div id={ this.id }>
                                                 { content }
                                             </div>);
    }

    // 组件更新前回调函数
    overrideComponentWillUpdate(nextProps, nextState) {
        // 添加全局，控制逻辑
        // 执行子类回调
        this._componentWillUpdate(nextProps, nextState);
    }

    // 组件更新完成
    overrideComponentDidUpdate(prevProps, prevState) {
        // 发出属性改变事件
        if (this.props != prevProps) {
            // 发布属性变化事件
            this._publish('props', this.props);
        } else {
            // 发布状态变化事件
            this._publish('state', this.state);
        }
        // 执行子类回调
        this._componentDidUpdate(prevProps, prevState);
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
        let map = _changeWeakMap.get(this);
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

    // 获取某个组件
    get(name) {
        return util.core.getComponent(name);
    }

    // 清除相关订阅
    clearPubSub() {
        // 清除组件自身订阅
        PubSub.unsubscribe(this.name);
        let array = _subscribeArrWeakMap.get(this);
        // 销毁对其他组件的订阅
        for (let i in array) {
            PubSub.unsubscribe(array[i]);
        }
    }

    // 发布不同类型事件
    _publish(key, datas, poll) {
        // 别名对象
        let _this = this;
        // 移动下一帧执行
        window.requestAnimationFrame(() => {
            // 发布指定事件
            let ret = PubSub.publish(`${_this.name}.${key}`, datas);
            // 没有被接收，且需要轮询发布
            if (!ret && poll) {
                // 轮询发布
                setTimeout(() => {
                    // 轮询发布订阅事件
                    _this._publish(key, datas, poll);
                }, 100);
            }
        });
    }

    // 被订阅的

    // 组件事件订阅，公共方法
    _subscribe(key, callback) {
        // 如果回调函数存在
        if (_.isFunction(callback)) {

            // 发起组件订阅
            let sub = PubSub.subscribe(key, (key, data) => {
                // 回调，并传递数据
                callback(data, key);
            });
            // 记录订阅对象，用于销毁处理
            _subscribeArrWeakMap.get(this).push(sub);
        }
    }

    // 订阅某组件，属性、状态变更
    subscribe(name, callback) {
        this._subscribe(name, callback);
    }

    // 订阅某组件【将要挂载】，componentWillMount
    subscribeComponentWillMount(name, callback) {
        this._subscribe(`${name}.componentWillMount`, callback);
    }

    // 订阅某组件【已挂载到页面】，componentDidMount
    subscribeComponentDidMount(name, callback) {
        this._subscribe(`${name}.componentDidMount`, callback);
    }

    // 订阅某组件【将要卸载】，componentWillUnmount
    subscribeComponentWillUnmount(name, callback) {
        this._subscribe(`${name}.componentWillUnmount`, callback);
    }

    // 订阅某组件，属性变更
    subscribeProps(name, callback) {
        this._subscribe(`${name}.props`, callback);
    }

    // 订阅某组件，状态变更
    subscribeState(name, callback) {
        this._subscribe(`${name}.state`, callback);
    }

    // 获取组件状态
    getWidgetState(widget, name, callback) {
        // 如果组件存在
        if (widget) {
            // 如果组件已经存在
            if (widget.state[name]) {
                callback(widget.state[name]);
            } else {
                // 订阅组件变更事件
                this.subscribeState(widget.name, (state, key) => {
                    // 存在指定状态值
                    if (state[name]) {
                        callback(state[name]);
                    }
                });
            }
        }
    }

    // 当前组件，默认ajax 请求器
    _ajax = null;

    // 重新构建，默认ajax 请求器
    setAjax(api) {
        return (this._ajax = new util.request.Ajax(api || this.props.api, this));
    }

    // 获取当前ajax 选择器
    getAjax(api) {
        return this._ajax || this.setAjax(api);
    }

    // 组件ajax请求 reject 为了兼容 t
    doAjax(api) {
        return this.getAjax(api).do();
    }

    // 场景一： 已知dom存在
    // this.select('.ant-tabs-tab:eq(0) .anticon-close').hide();

    // 组件内部选择器，对dom进行查询；前提条件dom已经存在
    select(sel) {
        // 构建组件选择器
        return $(`#${this.id} ${sel}`);
    }

    // 对选择器，进行轮询查询
    _selectPoll(sel, callback, timeout, timestamp) {
        let _this = this;
        // 获取选择器
        let select = $(sel);
        // 如果选择器 dom 存在
        if (select.length > 0) {
            // 回调方法，并返回dom对象
            callback(select);
        // 查询的dom 不存在
        } else {
            // 如果未超出，过期时间
            if (_.now() < timeout) {
                // 100毫秒后，继续查询
                setTimeout(() => {
                    // 执行轮询器，查询
                    _this._selectPoll(sel, callback, timeout);
                }, timestamp || 300);
            }
        }
    }

    // 场景二：dom不一定存在，组件正在构建中，所以使用轮询查找
    // this.selectPoll('.ant-tabs-tab:eq(0) .anticon-close', sel => sel.hide());

    // 组件轮询，选择器！当dom不存在，进行轮询；直到过期停止
    selectPoll(sel, callback, timeout, timestamp) {
        // 判断是否存在 id DOM
        if (!_.includes(sel, '#') && $(`#${this.id}`).length > 0) {
            sel = `#${this.id} ${sel}`;
        }
        // 进行轮询查询 选择器, 回调， 及过期时间
        this._selectPoll(sel, callback, _.now() + (timeout || 2000), timestamp)
    }

    // 改变状态值
    operState(stateName) {
        // 返回一个状态操作对象
        let so = new StateOper(stateName, this);
        // 加入操作列表
        _operStateListWeakMap.get(this).push(so);
        // 返回操作对象
        return so;
    }

    // 构建状态属性查询器
    queryState(stateName) {
        // 返回一个状态属性查询器
        return new StateQuery(stateName, this.state[stateName]);
    }

    // 改变状态值
    changeState() {
        // 状态需要改变的数据
        let change = this.getObject();
        let list = _operStateListWeakMap.get(this);
        // 遍历操作列表
        for (let i in list) {
            // 获取每个状态操作对象
            let os = list[i];
            // 计算属性新值
            let nv = this.unitOperState(os);
            // 如果存在，状态属性新值
            if (!_.isUndefined(nv)) {
                // 放置改变对象
                change[os.stateName] = nv;
            }
        }
        // 置空操作列表
        this.clearStateList();
        // 存在需要改变的状态值 设置状态值
        !_.isEmpty(change) && this.setState(change);
    }

    // 清空状态列表
    clearStateList() {
        _operStateListWeakMap.set(this, []);
    }

    // 操作状态数组属性
    operStateArray(os) {
        // 默认没有改变状态
        let change = false;
        // 获取状态属性名称
        let sn = os.stateName;
        // 获取当前状态属性值
        let sv = this.state[sn];

        // 存在移除属性
        if (!_.isUndefined(os.removeAttr)) {
            // 根据属性，移除元素
            let ros = _.remove(sv, _.isObject(os.removeAttr) ? _.matches(os.removeAttr) : v => os.removeAttr === v);
            // 存在被移除的对象
            if (!_.isEmpty(ros)) {
                // 需要改变状态
                change = true;
            }
        }

        // 存在向状态属性，添加元素需求
        if (os.pushItem) {
            // 设定默认，存在重复值
            let uniq = false;
            // 存在去重key
            if (!_.isUndefined(os.uniqKey)) {
                // 匹配到存在的值
                if (!_.find(sv, _.isObject(os.uniqKey) ? _.matches(os.uniqKey) : (item) => {
                        return _.isString(item) || _.isEmpty(item) ? item === os.uniqKey : item[os.uniqKey] === os.pushItem[os.uniqKey];
                    })) {
                    // 需要改变状态
                    change = uniq = true;
                }
            }
            // 将新元素，放入状态属性数组
            uniq && sv.push(os.pushItem);
        }
        // 如果状态已，改变
        if (change) {
            return sv;
        }
        // 状态未改变
        return;
    }

    // 执行单个操作状态
    unitOperState(os) {
        // 获取状态属性名称
        let sn = os.stateName;
        // 获取当前状态属性值
        let sv = this.state[sn];

        // 如果存在比较值
        if (!_.isUndefined(os.equalVal)) {
            // 如果比较不成功
            if (sv != os.equalVal) {
                // 退出，状态修改操作
                return;
            }
        }

        // 状态值被改变
        if (!_.isUndefined(os.value)) {
            // 设置状态属性为，新值
            return os.value;
        // 不是直接修改值的情况
        } else {
            // 如果属性值为数组类型
            if (_.isArray(sv)) {
                // 返回数组属性，相关操作
                return this.operStateArray(os);
            // 如果状态属性值为对象类型
            } else if (_.isObject(sv)) {

                // 如果状态属性，为简单类型
            } else {


            }
        }
    }

    // 设置节流函数
    throttle(funcName, timestamp) {
        // 参数为函数类型
        if (_.isFunction(funcName)) {
            // 获得函数名称
            funcName = funcName.name.split(' ').pop();
        }
        // 如果为有效函数
        if (_.isFunction(this[funcName])) {
            // 将该函数改造为节流函数
            this[funcName] = _.throttle(this[funcName], timestamp || 500, {
                // 关闭节流开始前调用
                'leading': false,
                // 节流结束后开始调用
                'trailing': true
            });
        }
    }

    // 获取对象查询参数
    query() {
        // 获取查询条件
        let search = location.search || '';
        // 获取key-value数组
        let sarr = search.replace('?', '').split(/[?&=]/);
        // 构建返回对象
        let ret = {};
        // 遍历赋值，返回对象
        for (let i = 0; i < sarr.length; i = i + 2) {
            // 赋值key = 赋值value
            ret[sarr[i]] = sarr[i + 1];
        }
        // 返回对象
        return ret;
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

    // 是否存在某函数帧操作
    hasFrame(func) {
        // 获取函数名称
        let key = `${func.name}.frame`;
        // 如果不存在对应的key
        return this.weak.has(key);
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
    async(func, param) {
        // 获取函数名称
        let key = `${this.name}.async`;
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

    // 是否存在，某函数异步操作
    hasAsync(func) {
        // 获取函数名称
        let key = `${this.name}.async`;
        // 获取异步操作对象
        let asyncObj = this.weak.get(key);
        // 查看是否存在指定函数
        return asyncObj && asyncObj.hasAsync(func);
    }

    // 异步并封装，普通函数
    asyncResolve(func, param) {
        // 获取函数参数
        let p = param || {};
        // 设置函数名称
        p.funcName = func.name;
        // 执行异步操作
        this.async((param) => {
            // 构建承诺对象
            let dfd = $.Deferred();

            console.info('async-resolve func: ', func.name);
            // 成功返回，函数结果
            dfd.resolve(func(param));
            // 返回承诺对象
            return dfd.promise();
        }, p);
    }

    // 刷新次数
    refreshCount = 0;

    // 刷新状态
    refresh(obj) {
        // 刷新计数 + 其他状态
        this.setState(_.extend({
            refresh: ++this.refreshCount
        }, obj));
    }

    // 获取刷新key
    refreshKey(key) {
        return `r${this.refreshCount}.${key}`;
    }

    // 设置延时函数
    setTimeout(func, timestamp) {
        // 获取函数名称
        let key = `${func.name}.setTimeout`;
        // 如果不存在对应的key
        if (this.weak.has(key)) {
            // 清除延时事件
            clearTimeout(this.weak.get(key));
        }
        let tok = setTimeout(func, timestamp);
        // 并缓存帧对象
        this.weak.set(key, tok);
    }

    // 清理延时函数
    clearTimeout(func) {
        // 获取函数名称
        let key = `${func.name}.setTimeout`;
        // 如果不存在对应的key
        if (this.weak.has(key)) {
            // 清除延时事件
            clearTimeout(this.weak.get(key));
        }
    }
}

/*
    1. 实现改变状态属性
    2. 实现向数组型，状态属性；添加元素，并去重
    3. 数组移除元素
    4. 比较属性值，不相等则，停止属性修改
 */
// 对状态属性，操作类
class StateOper {

    // 状态属性操作器构造方法
    constructor(stateName, widget) {
        // 设置状态属性名称
        this.stateName = stateName;
        // 设置组件
        this.widget = widget;
    }

    // 向状态属性中，新增新元素
    push(item) {
        // 保存新元素
        this.pushItem = item;
        // 返回自身
        return this;
    }

    // 需要根据 key 指定属性；去重
    uniq(key) {
        // 保存去重key
        this.uniqKey = key;
        // 返回自身
        return this;
    }

    // 对状态属性，设置新值
    val(value) {
        // 保存新值
        this.value = value;
        // 返回自身
        return this;
    }

    // 根据属性，删除元素
    remove(attrs) {
        // 保存移除属性
        this.removeAttr = attrs;
        // 返回自身
        return this;
    }

    // 设置比较值
    equal(val) {
        // 保存比较值
        this.equalVal = val;
        // 返回自身
        return this;
    }

    do() {
        if (this.widget) {
            let nv = this.widget.unitOperState(this);
            nv && this.widget.setState({
                [this.stateName]: nv
            });
            this.widget.clearStateList();
        }
    }
}

// 状态属性，查询器
class StateQuery {

    // 每步操作的值
    val = null;

    // 状态属性查询器构造方法
    constructor(stateName, stateVal) {
        // 设置状态属性名称
        this.stateName = stateName;
        // 设置状态属性值
        this.stateVal = stateVal;
    }

    // 查询符合属性的，索引
    findIndex(attrObj) {
        // 如果状态属性值，为数组类型
        if (_.isArray(this.stateVal)) {
            // 返回根据，属性对象，查找到的索引
            this.val = _.findIndex(this.stateVal, _.matches(attrObj));
        }
        // 返回对象自身
        return this;
    }

    // 获取前一个对象
    prev() {
        // 存在对象下标
        if (this.val > -1) {
            // 获取前一个的下标
            let i = this.val - 1 == -1 ? this.stateVal.length - 1 : this.val - 1;
            // 获取前一个对象
            this.val = this.stateVal[i];
        } else {
            // 设置值为 null
            this.val = null;
        }
        // 返回对象自身
        return this;
    }

    // 获取对象属性
    attr(key) {
        // 如果查询值，为对象类型
        if (_.isObject(this.val)) {
            // 获取属性值
            this.val = this.val[key];
        } else {
            // 设置值为null
            this.val = null;
        }
        // 返回自身
        return this;
    }
}

// 定义为全局组件
window.Component = Component;
