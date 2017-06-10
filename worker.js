import hash from 'object-hash';
/*
xhr.setRequestHeader('Content-Type', 'application/json');
*/

// 扩展 _ 方法
Object.assign(window.util = window.util || {}, {
    // 对dom的操作
    worker: {

        // key-url 关联关系
        keyURLCache: {},

        // 工作器线程类
        CoreWorker: class CoreWorker {

            // Worker 构造方法
            constructor(funcStr, onMessage, onError, ignoreClose) {
                // 工作器标识 key
                this.key = hash(funcStr);
                // 设置字符串函数
                this.funcStr = funcStr;
                // 设置收到消息回调
                this.onMessage = onMessage;
                // 设置错误消息回调
                this.onError = onError;
                // 设置忽略删除
                this.ignoreClose = ignoreClose;
                // 构建工作器
                this.buildWorker();
            }

            // 构建一个Worker线程
            buildWorker() {
                // 获取缓存url
                let url = util.worker.keyURLCache[this.key];
                // 如果换成url 不存在
                if (!url) {
                    // 构建URL对象 URL.createObjectURL
                    window.URL = window.URL || window.webkitURL;
                    // 构建字符串函数，blob数据
                    let blob = util.core.blob(this.funcStr);
                    // 构建资源访问url
                    url = URL.createObjectURL(blob);
                    // 缓存资源url
                    util.worker.keyURLCache[this.key] = url;
                }
                // 生成一个工作器
                this.worker = new Worker(url);
                // 绑定消息回调函数
                this.worker.onmessage = (msg) => {
                    // 调用消息回调
                    _.isFunction(this.onMessage) && this.onMessage(msg);
                    // 关闭工作器
                    this.close();
                }
                // 绑定错误回调函数
                this.worker.onerror = (err) => {
                    // 调用错误回调
                    _.isFunction(this.onError) && this.onError(err);
                    // 关闭工作器
                    this.close();
                }
            }

            // 向工作器发送消息
            postMessage(param) {
                // 向工作线程发送消息
                this.worker.postMessage(param);
            }

            // 关闭工作线程
            close() {
                // 结束工作线程
                !this.ignoreClose && this.worker.terminate();
            }
        },
        // ajax worker 字符串函数
        ajaxFuncStr: `

            // 创建浏览器兼容的 ajax 请求对象
            function createXHR(key) {
                // IE7+,Firefox, Opera, Chrome ,Safari
                if(typeof XMLHttpRequest != "undefined") {
                    return new XMLHttpRequest();
                }
                // IE6-
                else if(typeof ActiveXObject != "undefined"){
                    if(typeof arguments.callee.activeXString != "string") {
                        var versions = ["MSXML2.XMLHttp.6.0", "MSXML2.XMLHttp.3.0", "MSXMLHttp"],
                        i, len;
                        for(i = 0, len = versions.length; i < len; i++) {
                            try{
                                new ActiveXObject(versions[i]);
                                arguments.callee.activeXString = versions[i];
                                break;
                            }catch(ex) {
                                self.postMessage({key: key, error: "请升级浏览器版本"});
                            }
                        }
                    }
                    return arguments.callee.activeXString;        
                }else {
                    self.postMessage({key: key, error: "XHR对象不可用"});
                }
            }

            // 格式化参数
            function dataFormat(key, obj){
                // 不支持FormData的浏览器的处理 
                var arr = new Array();
                var i = 0;
                for(var attr in obj) {
                    arr[i] = encodeURIComponent(attr) + "=" + encodeURIComponent(obj[attr]);
                    i++;
                }
                return arr.join("&");
            }

            // ajax状态变更，处理函数
            function stateChange(e) {
                var xhr = e.currentTarget;
                try {
                    switch(xhr.readyState) {
                        // 此时xhr对象被成功构造，open()方法还未被调用
                        case 0 :
                            break; 
                        // open()方法已被成功调用，send()方法还未被调用。注意：只有xhr处于OPENED状态，才能调用xhr.setRequestHeader()和xhr.send(),否则会报错
                        case 1 :
                            break;
                        // send()方法已经被调用, 响应头和响应状态已经返回
                        case 2 :
                            break;
                        // 响应体(response entity body)正在下载中，此状态下通过xhr.response可能已经有了响应数据
                        case 3 : 
                            break;
                        //  整个数据传输过程结束，不管本次请求是成功还是失败
                        case 4 :
                            if((xhr.status >= 200 && xhr.status < 300) || xhr.status == 304) {
                                // 解析结果
                                var result = JSON.parse(xhr.responseText);
                                // 发送结果消息
                                self.postMessage({key: xhr.key, data: result});
                            }else {
                                self.postMessage({key: xhr.key, error: xhr.responseText});
                            }
                            break;
                    }
                } catch(err) {
                    self.postMessage({key: xhr.key, error: err});
                }
                
            };

            // 获取ajax 请求对象
            function getXHR(key) {
                // 创建ajax对象
                var xhr = createXHR(key);
                // 读取cookie相关信息
                xhr.withCredentials = true; 
                // 定义xhr对象的请求响应事件
                xhr.onreadystatechange = stateChange;
                // 设置请求key
                xhr.key = key;
                // 设置超时时间
                xhr.timeout = 60000;
                // 请求超时回调
                xhr.ontimeout = function(e) { 
                    // 发送超时信息
                    self.postMessage({key: key, error: '请求超时'});
                };
                // 绑定ajax 错误回调
                xhr.onerror = function(e) { 
                    // 发送错误信息
                    self.postMessage({key: key, error: e});
                };
                // 返回xhr ajax 对象
                return xhr;
            }

            // 发起ajax get请求
            function get(key, url, param) {
                // 创建ajax对象
                var xhr = getXHR(key);
                // 发起get请求
                xhr.open("get", url + '?' + param ,true);
                // 发起get请求
                xhr.send(null);
            }

            // 发起ajax post请求
            function post(key, url, param, progress) {
                // 创建ajax对象
                var xhr = getXHR(key);
                // 发起post 请求
                xhr.open("post", url, true);
                // 如果存在上传进度
                if(typeof progress === 'function') {
                    // 绑定上传进度回调
                    xhr.onprogress = xhr.upload.onprogress = progress;
                }
                // 不支持FormData的浏览器的处理 
                if(typeof FormData == "undefined") {
                    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
                }
                // 发起post请求
                xhr.send(param);
            }           
    
            // 接收相关消息
            self.onmessage = function (e) {
                // 获得ajax请求消息
                var data = e.data;
                // 获取请求类型
                var type = (data.type || '').toLowerCase();
                // 构建请求参数
                var param = dataFormat(data.key, data.param);
                // 发起ajax get请求
                if(type === 'get') {
                    get(data.key, data.url, param);
                // 发起ajax post请求
                } else if(type === 'post') {
                    post(data.key, data.url, param);
                }
            };
        `,

        // 是否支持worker
        canWorker() {
            return 'function' === typeof window['Worker'];
        },

        // 初始化，工作器
        getAjaxWorker: () => {
            // 支持工作线程
            if (util.worker.canWorker()) {
                // 新建ajax 工作器
                return new util.worker._AjaxWorker();
            }
        },

        // 工作线程函数，转换为字符串
        workFuncToString: (map) => {
            // 构建函数数组
            let funcArr = [];
            // 遍历工作线程函数
            _.each(map, (funcStr, key) => {
                // 判断函数字符串，有效性
                if (_.isString(funcStr) && _.includes(funcStr, 'function')) {
                    // 构建函数字符串
                    let fstr = key ? `var ${key} = ${funcStr}` : funcStr;
                    // 构建单个函数，字符串
                    funcArr.push(fstr);
                }
            });
            // 输出函数字符串
            return funcArr.join('\n');
        },

        // 工作线程函数，转换为对象
        workFuncToObject: (map) => {
            // 初始化对象
            let ret = {};
            // 遍历函数字符串
            _.each(map, (funcStr, key) => {
                // 无效属性名称
                if (!key) {
                    return;
                }
                // 函数字符串，是否符合要求
                if (_.isString(funcStr) && _.includes(funcStr, 'function')) {
                    // 解析函数字符串
                    ret[key] = eval(`(true && ${funcStr})`);
                } else {
                    // 赋值简单属性
                    ret[key] = funcStr;
                }
            });
            // 返回对象本身
            return ret;
        },

        // AjaxWorker
        _AjaxWorker: class AjaxWorker {

            // ajax工作线程构造方法
            constructor() {
                // 构建工作器
                this.worker = new util.worker.CoreWorker(util.worker.ajaxFuncStr, this.onMessage.bind(this), this.onError.bind(this));
                // 构建weak 操作
                this.weak = new util.optimize.Weak(this);
                // 构建一个错误处理帧
                this.frame = new util.optimize.Frame(this, (widget, param) => {
                    throw new Error(param);
                });
            }

            // 接收到消息
            onMessage(msg) {
                // 接收到工作器的消息
                let data = msg.data;
                // 获得消息处理key
                let key = data.key;
                // 获取消息中的数据
                let d = data.data;
                // 获取承诺对象
                let dfd = this.weak.get(key);
                // 如果存在数据
                if (d) {
                    // 如果code 不为1，则输出错误信息
                    if (d.code != 1) {
                        // 放置错误信息
                        this.frame.push(JSON.stringify(d));
                    }
                    // ajax 请求成功，返回正确数据
                    dfd.resolve(d)
                // ajax请求失败，返回错误信息
                } else {
                    // 放置错误信息
                    this.frame.push(data.error);
                    // 驳回承诺对象
                    dfd.reject(data.error);
                }
            }

            // 工作器，error消息处理
            onError(msg) {
                // 放置错误信息
                this.frame.push(msg);
            }

            // 向ajax工作器，发起ajax 请求
            _ajax(type, dfd, url, param) {
                // 获取唯一标识
                let key = util.core.uuid();
                // 绑定 key - dfd 映射关系
                this.weak.set(key, dfd);
                // 向ajax工作器，发起请求
                this.worker.postMessage({
                    type,
                    key,
                    url,
                    param
                });
            }

            // 发起get请求
            get(dfd, url, param) {
                this._ajax('get', dfd, url, param);
            }

            // 发起post请求
            post(dfd, url, param) {
                this._ajax('post', dfd, url, param);
            }
        }
    }
});
