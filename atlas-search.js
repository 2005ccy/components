
// 扩展 atlas 工具方法
Object.assign(window.atlas = window.atlas || {}, {
    // ds相关扩展
    search: {

        // 搜索工作器
        SearchWorker: class SearchWorker {

            // 搜索工作器，构造方法
            constructor() {
                // 能使用工作器
                if (util.worker.canWorker()) {
                    // 构建工作器
                    this.worker = new util.worker.CoreWorker(util.worker.workFuncToString(this.operWorker), this.onMessage.bind(this), this.onError.bind(this), true);
                } else {
                    // 不支持工作线程，使用函数形式
                    this.workerFuncs = util.worker.workFuncToObject(this.operWorker);
                }
                // 构建weak 操作
                this.weak = new util.optimize.Weak(this);
                // 构建一个错误处理帧
                this.frame = new util.optimize.Frame(this, (widget, param) => {
                    throw new Error(param);
                });
            }

            // 工作器相关操作
            operWorker = {
                // 获取单点数据
                nodeInfo: `function (nodes, matchStr, id, personMap, companyMap) {
                        // 没有在匹配字符串中
                        if(matchStr.indexOf(',' + id + ',') < 0) {
                            // 查询个人信息
                            var p = personMap[id.replace('p', '')];
                            // 存在个人信息
                            if(p) {
                                // 设置个人属性
                                p.isPerson = true;
                                // 设置节点数据
                                nodes[id] = p;
                            } else {
                                // 查询公司数据
                                var c = companyMap[id];
                                // 设置公司数据
                                if(c) {
                                    nodes[id] = c;
                                }
                            }
                        }
                    }`,
                // 获取节点数据
                getNodes: `function (links, datas, nodesList) {
                        // 需返回节点数据
                        var nodes = {};
                        // 防重复字符串
                        var matchStr = '';
                        // 公司数据map
                        var companyMap = datas.companyMap;
                        // 个人数据map
                        var personMap = datas.personMap;
                        // 移除索引数组
                        var removeArr = [];
                        // 遍历列表数据
                        for(var i in links) {
                            // 获得单个关系数据
                            var link = links[i];
                            // 开始节点编号
                            var source = link.source;
                            // 结束节点编号
                            var target = link.target;
                            // 添加开始节点
                            this.nodeInfo(nodes, matchStr, source, personMap, companyMap);
                            // 节点防重复比对字符串,连接source
                            matchStr += ',' + source + ',';
                            // 修改连接source 为节点对象
                            link.source = nodes[source];
                            // 添加结束节点
                            this.nodeInfo(nodes, matchStr, target, personMap, companyMap);
                            // 节点防重复比对字符串,连接target
                            matchStr += ',' + target + ',';
                            // 修改连接target 为节点对象
                            link.target = nodes[target];
                            // 如果对象数据，缺省
                            if(!link.source || !link.target) {
                                // 移除节点缺省
                                removeArr.push(i);
                            } else {
                                // 获取开始节点
                                var sn = nodes[source];
                                // 获取目标节点
                                var tn = nodes[target];
                                // 设置开始节点 to 属性
                                (sn.to = sn.to || []).push(tn);
                                // 设置目标节点 from 属性
                                (tn.from = tn.from || []).push(sn);
                            }
                        }
                        // 删除无效链接
                        for(var i = removeArr.length - 1; i > -1; i--) {
                            // 获取需删除的下标
                            var ri = removeArr[i];
                            // 删除无效链接
                            links.splice(ri, 1);
                        }
                        // 检查是否包含关键节点
                        for(var i in nodesList) {
                            // 获得关键节点编号
                            var nid = nodesList[i].replace('p', '');
                            // 获取关键节点
                            var keyNode = nodes[nid] || (personMap[nid] || companyMap[nid]);
                            // 存在关键节点
                            if(keyNode) {
                                // 设置 isKeyNode 属性
                                keyNode.isKeyNode = true;
                                // 并设置到节点map
                                nodes[nid] = keyNode;
                            }
                        }
                        // 返回节点数据
                        return nodes;
                    }`,
                // 计算现有所有路径
                getLinks: `function (pathList, links) {
                    // 遍历关系数据
                    for(var key in pathList) {
                        // 获取一个关系
                        var r = pathList[key];
                        // 如果是数组类型，则继续遍历
                        if(Array.isArray(r)) {
                            // 继续解析数组，提取连接对象
                            this.getLinks(r, links);
                        } else {
                            // 开始节点
                            r.source = r.sid;
                            // 目标节点
                            r.target = r.tid;
                            // 构建查询key
                            var key = r.source + '-' + r.target
                            // 判断关系是否存在
                            if(this.linkMatchStr.indexOf(key) < 0) {
                                // 将关系对象，放入links 数组
                                links.push(r);
                            }
                            // 连接比对字符串
                            this.linkMatchStr += ',' + key;
                        }
                    }
                }`,
                // 分析路径数据并构建map
                parseLinks: `function (relation, pathListMap, nodes) {

                    // 遍历相关关系
                    for(var i in relation) {
                        // 分析每层数据
                        var rel = relation[i];
                        // 保存匹配节点
                        var matchNodes = [];
                        // 遍历关系数组
                        for(var j in rel) {
                            // 获取一个节点连接
                            var link = rel[j];
                            // 如果搜索对象中，存在该连接sid
                            if(nodes.indexOf(link.sid) > -1) {
                                // 并且匹配节点，没有重复数据
                                if(matchNodes.indexOf(link.sid) < 0) {
                                    // 将连接sid 放入匹配数组
                                    matchNodes.push(link.sid);
                                }
                            }
                            // 如果搜索对象中，存在该连接tid
                            if(nodes.indexOf(link.tid) > -1) {
                                // 并且匹配节点，没有重复数据
                                if(matchNodes.indexOf(link.tid) < 0) {
                                    // 将连接tid 放入匹配数组
                                    matchNodes.push(link.tid);
                                }
                            }
                        }
                        // 对匹配数组，进行排序
                        matchNodes.sort(this.sortNodes);
                        // 并构建节点key 字符串
                        var key = matchNodes.join(',');
                        // 存在节点key
                        if(key) {
                            // 以该key保存相关数据
                            (pathListMap[key] = pathListMap[key] || []).push(rel);
                        } else {
                            (pathListMap['other'] = pathListMap['other'] || []).push(rel);
                        }
                    }
                }`,
                // 对nodes进行排序
                sortNodes: `function(a, b) {
                    // 获取左侧编号长度
                    var al = a.length;
                    // 获取右侧编号长度
                    var bl = b.length;
                    // 如果长度相等
                    if(al == bl) {
                        // 比较字符串内容
                        return a > b;
                    }
                    // 比较字符串长度
                    return al - bl;
                }`,
                // 匹配连接数据
                matchLinkStr: `function (matchStr, link) {
                    // 初始化左侧，连接字符串
                    var before = '';
                    // 初始化右侧，连接字符串
                    var end = '';
                    // 遍历一个节点关系
                    for(var i in link) {
                        // 取得一个链接
                        var r = link[i];
                        // 构建连接字符串
                        var str = ',' + r.sid + '->' + r.tid;
                        // 如果前部字符串
                        if(i < 2) {
                            // 连接前部字符串
                            before += str;
                        } else {
                            // 连接后部字符串
                            end += str;
                        }
                    }
                    // 截取前部开始，逗号
                    before = before.substring(1);
                    // 如果前部，或后部已经在比较字符串中存在
                    if(matchStr.indexOf(before) > -1 || matchStr.indexOf(end) > -1) {
                        // 则返回null
                        return null;
                    }
                    // 新连接，返回连接字符串
                    return before + end + ';';
                }`,
                // 清洗连接数组
                clearLinkArr: `function (links, count, nodes, hideList) {
                    // 定义比较字符串
                    var matchStr = '';
                    // 需清除关系，索引数组
                    var clear = [];
                    // 遍历关系数组
                    for(var i in links) {
                        // 获得单个关系
                        var link = links[i];
                        // 比较单个关系，前后部字符串，是否出现
                        var tstr = this.matchLinkStr(matchStr, link);
                        // 已经出现
                        if(!tstr) {
                            // 当前索引，放入清除数组
                            clear.push(i);
                        } else {
                            // 该连接为新连接，保留
                            matchStr += tstr;
                        }
                    }
                    // 从后向前，遍历清理数组
                    for(var i = clear.length - 1; i > -1; i--) {
                        // 删除指定下标，关系
                        hideList.push(links.splice(i, 1)[0]);
                    }
                    // 尝试清理15次，并且当前连接数组长度大于 25
                    if(count < 15 && links.length > this.clearConfigs[nodes.length]) {
                        // 进行下次连接数组清理，计数累加
                        this.clearLinkArr(links, count + 1, nodes, hideList);
                    }
                }`,
                // 清洗数据
                clearLinks: `function (pathListMap, nodes, hideListMap) {
                    // 遍历节点Key数组对象
                    for(var key in pathListMap) {
                        // 获得关系数组
                        var links = pathListMap[key];
                        // 如果关系数组长度大于25
                        if(links.length > this.clearConfigs[nodes.length]) {
                            var hideList = [];
                            // 进行关系数组，清理
                            this.clearLinkArr(links, 0, nodes, hideList);
                            // 如果存在隐藏数据
                            if(hideList.length > 0) {
                                hideListMap[key] = hideList;
                            }
                        }
                    }
                }`,
                // 根据条件，过滤相关links
                filterLinks: `function (filterRelation, relation, filter) {
                    // 获取百分比条件
                    var percent = filter && filter.percent;
                    // 获取百分比值
                    percent = (percent && percent[0]) || 0;
                    
                    // 获取关系条件
                    var relFilter = filter && filter.relation;
                    // 关系条件比较字符串
                    var relStr = relFilter ? (',' + relFilter.join(',') + ',') : '';
                    
                    // 遍历现有关系
                    for(var i in relation) {
                        var rel = relation[i];
                        filterRelation.push(rel.filter(function(link) {
                            
                            // 如果百分比大于0
                            if(percent > 0) {
                                // 如果关系百分比，小于条件值
                                if(link.r.shareholdingRatio < percent) {
                                    // 不符合条件
                                    return false;
                                }
                            }

                            // 如果连接关系，不符合；查询条件
                            if(relStr && relStr.indexOf(',' + link.r.relationType + ',') < 0) {
                                // 不符合条件
                                return false;
                            }

                            // 符合条件
                            return true;
                        }));
                    }
                }`,
                // 计算相关数值
                _operate: `function (datas, nodes, layer, filter) {
                    // 每次操作，清空比较字符串
                    this.linkMatchStr = '';
                    // 获取关系对象
                    var relation;
                    // 提取关系数据
                    var rels = datas && datas.relations;
                    // 提取层级数据
                    for(var i in rels) {
                        // 获取层级数据
                        var d = rels[i];
                        // 如果层级编号 等于参数层级
                        if(d.order == layer) {
                            // 获取层级，关系数据
                            relation = d.paths;
                            // 退出循环
                            break;
                        }
                    }
                    // 对节点进行排序
                    nodes.sort(this.sortNodes);
                    var filterRelation = [];
                    // 根据条件，过滤相关links
                    this.filterLinks(filterRelation, relation, filter);
                    // 构建关系map
                    var pathListMap = {};
                    // 分析路径数据并构建map
                    this.parseLinks(filterRelation, pathListMap, nodes);
                    // 构建隐藏关系map
                    var hideListMap = {};
                    // 赋值other数据
                    hideListMap['other'] = pathListMap['other'] || [];
                    // 删除other 数据
                    delete pathListMap['other'];
                    // 清洗数据
                    this.clearLinks(pathListMap, nodes, hideListMap);
                    // 定义最终关系数组
                    var links = [];
                    // 遍历关系数组Map
                    for(var k in pathListMap) {
                        // 获得关系数组
                        var pathList = pathListMap[k];
                        // 合并路径
                        this.getLinks(pathList, links);
                    }
                    // 获取所有节点数据
                    var showNodes = this.getNodes(links, datas, nodes);

                    // 构建返回隐藏数据结构
                    var hideNodesMap = {};
                    for(var k in hideListMap) {
                        // 隐藏关系数据
                        var hideLinks = [];
                        // 获得关系数组
                        var pathList = hideListMap[k];
                        // 路径列表为null
                        if(pathList.length < 1) {
                            // 进入下次迭代
                            continue;
                        }
                        // 合并路径
                        this.getLinks(pathList, hideLinks);
                        // 计算隐藏的节点
                        var hideNodes = this.getNodes(hideLinks, datas, nodes);
                        // 保留返回隐藏节点
                        hideNodesMap[k] = {links: hideLinks, nodes: hideNodes};
                    }
                    
                    // 返回计算结果
                    return {links: links, nodes: showNodes, hideNodesMap: hideNodesMap};
                }`,
                // 计算相关数值
                operate: `function (key, datas, nodes, layer, filter) {
                        // 发送计算结果
                        send(key, _operate(datas, nodes, layer, filter));
                    }`,
                // 关系数据，去重比较字符串
                linkMatchStr: '',
                // 清理相关配置
                clearConfigs: [150, 150, 100, 50, 30, 25],
                // 发送数据
                send: `function (key, datas) {
                        // 发送处理消息
                        self.postMessage({key: key, datas: datas});
                    }`,
                '': `
                    // 关系数据，去重比较字符串
                    var linkMatchStr = '';
                    // 清理相关配置
                    var clearConfigs = [150, 150, 100, 50, 30, 25];
                    // 接收到主线程，发送的消息
                    self.onmessage = function (e) {
                            // 获得ajax请求消息
                            var data = e.data;
                            // 当前操作key
                            var key = data.key;
                            // 获取请求类型
                            var oper = (data.oper || '').toLowerCase();
                            
                            // 构建请求参数
                            if(oper === 'operate') {
                                // 获取传递数据
                                var datas = data.datas;
                                // 查询相关节点
                                var nodes = data.nodes;
                                // 查询相关类型
                                var layer = data.layer;
                                // 查询条件
                                var filter = data.filter;
                                // 计算相关数值
                                operate(key, datas, nodes, layer, filter);
                            }
                        };`
            };

            // 操作函数
            operFunc = {
                // 解析数据
                parse: (dfd, datas, nodes, layer, filter) => {
                    // 发送计算结果
                    dfd.resolve(this.workerFuncs._operate(datas, nodes, layer, filter));
                }
            }

            // 相关操作
            operation(datas, nodes, layer, filter) {
                // 设置当前操作key
                let key = util.core.uuid();
                // 获取一个承诺对象
                let dfd = $.Deferred();
                // 绑定 key - dfd 映射关系
                this.weak.set(key, dfd);
                // 相关操作
                let oper = 'operate'
                // 如果支持工作器
                if (this.worker) {
                    // 发起工作器执行请求
                    this.worker.postMessage({
                        key,
                        oper,
                        datas,
                        nodes,
                        layer,
                        filter
                    })
                } else {
                    // 发起操作请求
                    this.operFunc.parse(dfd, datas, nodes, layer, filter);
                }
                // 返回承诺对象
                return dfd.promise();
            }

            // 接收到消息
            onMessage(msg) {
                // 接收到工作器的消息
                let data = msg.data;
                // 获取消息处理key
                let key = data.key;
                // 获取消息数据
                let datas = data.datas;
                // 获取承诺对象
                let dfd = this.weak.get(key);
                // 返回数据结果
                dfd.resolve(datas);
            }

            // 工作器，error消息处理
            onError(msg) {
                // 放置错误信息
                this.frame.push(msg);
            }
        },
        // 关系搜索图谱
        Search: class Search {

            // 设置搜索图谱id
            id = 'atlas-search';

            // 相关参数 nodes=19723,134822,287167,1458439,p442625&type=company,company,company,company,person
            // 搜索器构造方法
            constructor(svg, datas, nodes, layer, container) {
                // 容器对象
                this.container = container;
                // 设置svg 画布
                this.svg = svg;
                // 设置画布箭头
                this.setDefs();
                // 构建weak 操作
                this.weak = new util.optimize.Weak(this);
                // 设置相关数据
                this.weak.set('datas', datas);
                // 设置关系搜索节点
                this.nodes = nodes;
                // 对节点进行排序
                this.nodes.sort(function(a, b) {
                    // 获取左侧编号长度
                    var al = a.length;
                    // 获取右侧编号长度
                    var bl = b.length;
                    // 如果长度相等
                    if (al == bl) {
                        // 比较字符串内容
                        return a > b;
                    }
                    // 比较字符串长度
                    return al - bl;
                });
                // 获取节点字符串
                this.nodesStr = this.nodes.join(',').replace(/[p]/g, '');
                // 搜索节点移动位置单次距离
                this.enlargeDistance = 200;
                // 设置搜索节点，初始化位置
                this.enlargeBoundary();
                // 扩展次数
                this.enlargeCount = 1;
                // 默认电荷距离
                this.charge = -150000;
                // 设置圆的半径
                this.circleR = 25;
                // 设置关系搜索相关类型
                this.layer = layer;
                // 构建一个处理帧
                this.searchFrame = new util.optimize.Frame(this, this.searchFrameOper);
                // 搜索工作器
                this.searchWorker = new atlas.search.SearchWorker();

                // bug 工作线程使用，区别为全局加载
                // this.searchWorker = searchWorker;
                // 解析数据，并渲染结果
                this.parseDataAndRender();
                // 重写有节流特性的，ajax请求方法
                this.tick = _.throttle(this.tick.bind(this), 150, {
                    // 关闭节流开始前调用
                    'leading': false,
                    // 节流结束后开始调用
                    'trailing': true
                });
            }

            // 对对象svg 对象，defs的处理
            setDefs() {
                // 添加defs节点
                let defs = this.svg.getDefs();
                // 新增多类型箭头
                this.svg.marker({
                    'default': '#b8b8b8',
                    'natural-invest': '#51aea4',
                    'be-invested': '#51aea4',
                    'invest': '#fea13d',
                    'subsidiary': '#a880bd',
                    'natural-manager': '#51aea4',
                    'key-path': '#ea4e5b'
                }, 36, -1);
                // 修改箭头样式
                d3.select(`#${this.svg.id}-key-path`).attr({
                    'refX': 27,
                    'refY': 0
                });
                // 添加人头像
                this.svg.userIcon(0.02);
                // 设置图谱样式
                this.svg.appendCss(this.getCss());
            }

            // 当前画布样式
            getCss() {
                let cls = `.${this.svg.className}`;
                return `
                ${cls} .relation-svg #end {
                    fill: #51aea4;
                }
                ${cls} .global-g .n-${this.id} {
                    cursor: pointer;
                }
                ${cls} .global-g .n-${this.id} circle {
                    fill: #f0f9fe;
                    stroke: #89cff8;
                }
                ${cls} .global-g .tp-${this.id} {
                    fill: #51aea4;
                }
                ${cls} .global-g .t-${this.id} {
                    text-anchor: middle;
                }
                ${cls} .global-g .n-${this.id} text {
                    font-size: 11px;
                    fill: #333;
                    text-anchor: middle;
                }
                ${cls} .global-g .root-node circle {
                    fill: #ea4e5b;
                    stroke: #ea4e5b;
                }
                ${cls} .global-g .root-node text {
                    fill: #fff;
                }
                ${cls} .global-g .p-${this.id} {
                    stroke: #51aea4;
                }
                ${cls} .global-g .user-icon {
                    fill: #333;
                }
                ${cls} .global-g .root-node .user-icon {
                    fill: #efe4e4;
                }
                ${cls} .global-g path.be-invested,
                ${cls} .global-g path.natural-invest {
                    stroke: #51aea4;
                }
                ${cls} .global-g textPath.be-invested,
                ${cls} .global-g textPath.natural-invest {
                    fill: #51aea4;
                }
                ${cls} .global-g path.invest {
                    stroke: #fea13d;
                }
                ${cls} .global-g textPath.invest {
                    fill: #fea13d;
                }
                ${cls} .global-g path.subsidiary {
                    stroke: #a880bd;
                }
                ${cls} .global-g textPath.subsidiary {
                    fill: #a880bd;
                }
                ${cls} .global-g path.key-path {
                    stroke: #ea4e5b;
                    stroke-width: 1.5px;
                }
                ${cls} .global-g textPath.key-path-percent {
                    fill: #ea4e5b;
                    font-size:15px;
                }
                ${cls} .global-g .position-item circle {
                    fill: #ea4e5b;
                    stroke: #ea4e5b;
                }
                ${cls} .global-g .position-item text {
                    fill: #fff;
                }
                ${cls} .global-g .add-more-box text {
                    fill: #333;
                }
                ${cls} .global-g .shell-atlas-search rect {
                    fill: #ea4e5b;
                }
                ${cls} .global-g .shell-atlas-search text {
                    fill: #fff;
                    font-size: 11px;
                    font-weight: bold;
                }
            `;
            }

            // 操作与函数映射关系
            operate = {
                'force': 'getForce',
                'path': 'renderPath',
                'percent': 'renderPercent',
                'node': 'renderNode',
                'nodeTransform': 'nodeTransform',
                'pathDAttr': 'pathDAttr',
                'nodeTitle': 'renderNodeTitle',
                'nodeCircle': 'renderNodeCircle',
                'companyName': 'renderCompanyName'
            }

            // 搜索帧处理
            searchFrameOper(_this, ...oper) {
                // 执行相应操作
                _this[oper.join('')]();
            }

            // 构建力图模型
            getForce() {
                let _this = this;
                // 生成聚力对象
                this.force = d3.layout.force()
                    // 节点对象
                    .nodes(d3.values(this.weak.get('showNodes')))
                    // 关系连接
                    .links(this.weak.get('links'))
                    // 画布尺寸
                    .size([this.svg.width, this.svg.height])
                    // 关系连线距离
                    .linkDistance(230)
                    // 电荷节点间距离
                    .charge(this.charge)
                    // 中心引力
                    .gravity(0.17)
                    // 摩擦系数
                    .friction(0.012)
                    // 绑定tick事件
                    .on('tick', this.tick.bind(this))
                    // 力图构图完成
                    .on('end', function() {
                        // 检查图形边界
                        _this.checkBoundary();
                    })
                    // 执行开始方法
                    .start();

                // 检查边界，定时任务
                this.checkInterval = setInterval(this.checkBoundary.bind(this), 1300);
                // 渲染路径
                this.searchFrame.push(this.operate.path);
                // 渲染percent 百分比
                this.searchFrame.push(this.operate.percent);
                // 渲染节点 Node
                this.searchFrame.push(this.operate.node);
            }

            // tick 相关计算
            tick() {
                // 处理节点位置移动
                this.searchFrame.push(this.operate.nodeTransform);
                // 处理路径重算
                this.searchFrame.push(this.operate.pathDAttr);
            }

            // 计算搜索节点，构建图形边界
            enlargeBoundary() {
                // 边界扩大距离
                let ed = this.enlargeDistance / 4;
                // 画布中心点 X 轴
                let ccpX = this.svg.ccp[0];
                // 画布中心点 Y 轴
                let ccpY = this.svg.ccp[1];
                // 如果对象不存在边界
                if (!this.boundary) {
                    // 首次向内距离
                    ed = this.enlargeDistance;
                    // 初始化边界值
                    this.boundary = {
                        left: ccpX - (ccpX - ed),
                        top: ccpY - (ccpY - ed),
                        right: (ccpX * 2) - ed,
                        bottom: (ccpY * 2) - ed
                    }
                // 已存在边界值
                } else {
                    // 获取相应边界值
                    let {left, top, right, bottom} = this.boundary;
                    // 设置边界新值
                    this.boundary = {
                        left: left - ed,
                        top: top - ed,
                        right: right + ed,
                        bottom: bottom + ed
                    }
                }
                // 设置搜索关键点值
                this.setKeyNodesPoiont();
            }

            // 获取图形宽高
            getWidthHeight() {
                // 获取边界值
                let {left, top, right, bottom} = this.boundary;
                let r = 3 * this.circleR;
                // 返回结果值
                return {
                    left: (left < 0 ? left : 0) - r,
                    right: right + r,
                    up: (top < 0 ? top : 0) - r,
                    down: bottom + r
                };
            }

            // 设置搜索关键点值
            setKeyNodesPoiont() {
                // 搜索节点个数
                let l = this.nodes.length;
                // 克隆节点信息
                let cn = this.nodesStr.split(',');
                // 返回的实体结果
                let ret = {};
                // 中心节点
                let ccp = this.svg.ccp;
                // 获取边界值
                let {left, top, right, bottom} = this.boundary;
                // 两个关键节点
                if (l == 2) {
                    // 左侧节点值
                    ret[cn[0]] = [left, ccp[1]];
                    // 右侧节点值
                    ret[cn[1]] = [right, ccp[1]];
                } else if (l === 3) {
                    // 左侧节点值
                    ret[cn[0]] = [left, bottom];
                    // 右侧节点值
                    ret[cn[1]] = [right, bottom];
                    // 上方节点值
                    ret[cn[2]] = [ccp[0], top];
                } else if (l === 4) {
                    // 左上节点值
                    ret[cn[0]] = [left, top];
                    // 左下节点值
                    ret[cn[1]] = [left, bottom];
                    // 右下节点值
                    ret[cn[2]] = [right, bottom];
                    // 右上节点值
                    ret[cn[3]] = [right, top];
                } else if (l === 5) {
                    // 计算5边形，y轴偏移
                    let y = top + ((bottom - top) / 3);
                    // 计算底部偏移
                    let x = (right - left) / 5;
                    // 左节点值
                    ret[cn[0]] = [left, y];
                    // 右上节点值
                    ret[cn[1]] = [left + x, bottom];
                    // 右下节点值
                    ret[cn[2]] = [right - x, bottom];
                    // 左下节点值
                    ret[cn[3]] = [right, y];
                    // 左下节点值
                    ret[cn[4]] = [ccp[0], top];
                }
                // 关键点数据
                this.keyNodesPoint = ret;
            }

            // 获取图谱的 top、right、bottom、left
            checkBoundary() {
                // 别名对象方法
                let _this = this;
                // 假定搜索节点，没有越界
                let beyond = false;
                // 获得图谱边界
                let {left, top, right, bottom} = this.boundary;
                // 排除关键节点，边界检查
                let rejectStr = `,${this.nodesStr},`;
                // 容错值为1倍，圆半径
                let errVal = this.circleR * 3;
                // 计算左侧边界
                left -= errVal;
                // 计算上侧边界
                top -= errVal;
                // 计算右侧边界
                right += errVal;
                // 计算下侧边界
                bottom += errVal;
                // 查找当前索引节点
                d3.selectAll(`.n-${this.id}`).each(function(d) {
                    // 如果是关键节点，则退出方法
                    if (d.isKeyNode) {
                        return;
                    }
                    // 获得x轴值
                    let dxr = d.x;
                    // 获得y轴值
                    let dyr = d.y;
                    // 如果x轴值，超出左右边界
                    if (dxr < left || dxr > right) {
                        // 则节点越界
                        beyond = true;
                    }
                    // 如果y轴值，超出上下边界
                    if (dyr < top || dyr > bottom) {
                        // 则节点越界
                        beyond = true;
                    }
                });
                // 如果节点越界
                if (beyond) {
                    // 扩展次数递增
                    this.enlargeCount++;
                    // 计算新的边界
                    this.enlargeBoundary();
                    // 增加力图的电荷强度
                    this.force.charge(this.charge * this.enlargeCount);
                    // 刷新力图
                    this.force.resume();
                // 没有节点越界
                } else {
                    // 清除越界检查定时器
                    clearInterval(this.checkInterval);
                }
            }

            // 移动节点对象
            nodeTransform(select, duration) {
                // 当前搜索对象别名
                let _this = this;
                // 获取所有节点，并移动位置
                d3.selectAll(select || `.n-${this.id}`)
                    .attr("transform", function(d) {
                        // 该节点为关键节点
                        if (d.isKeyNode) {
                            // 获取节点数据，编号
                            let id = _this.getNodeId(d);
                            // 获取关键节点
                            let p = _this.keyNodesPoint[id];
                            // 存在节点，为关键节点
                            if (p) {
                                // 设置节点新 X
                                d.x = p[0];
                                // 设置节点新 Y
                                d.y = p[1];
                            }
                        }
                        // 将节点移动到新的 x，y
                        return "translate(" + d.x + "," + d.y + ")";
                    });
            }

            // 构建路径的 d元素
            pathDAttr(select) {
                // 获取所有的路径对象
                d3.selectAll(select || `.p-${this.id}`)
                    // 设置路径d 属性
                    .attr('d', function(d) {
                        // 计算路径转弯幅度
                        var dx = d.target.x - d.source.x,
                            dy = d.target.y - d.source.y,
                            dr = Math.sqrt(dx * dx + dy * dy);
                        // 返回路径绘制属性
                        return "M" +
                            d.source.x + "," +
                            d.source.y +
                            // "A" + dr + "," + dr + " 0 0,1 " +
                            "L" +
                            d.target.x + "," +
                            d.target.y;
                    });
            }

            // renderType 【 投资："H", 子公司："S", 被公司投资："RH", 自然人投资："Holder", 自然人高管："Senior" 】
            // 'invest', 'subsidiary', 'be-invested', 'natural-invest', 'natural-manager'
            // 渲染路径
            renderPath() {
                // 搜索图谱对象别名
                let _this = this;
                // 获取全局G
                let globalG = this.svg.globalG;
                // 构建路径class
                let pcls = `p-${this.id}`;
                // 执行更新数据
                let update = globalG.selectAll(`.p-${this.id}`).data(this.force.links());

                // 创建路径元素
                update.enter()
                    // 追加路径元素
                    .append('path')
                    // 设置路径，相关属性
                    .attr({
                        // 绑定箭头函数
                        'marker-end': function(d) {
                            // 定义类型map
                            let typeMap = {
                                'H': 'invest',
                                'SH': 'subsidiary',
                                "RH": 'be-invested',
                                "Holder": 'natural-invest',
                                "Senior": 'natural-manager'
                            };
                            // 确定连接箭头类型
                            let type = typeMap[d.r.relationType] || 'default';
                            // 获取随机字符串
                            let id = `p-${_this.getNodeId(d.source)}-${_this.getNodeId(d.target)}-${_this.svg.id}`;
                            // 设置数据pid 属性
                            d.pid = id;
                            // 设置关系class
                            d3.select(this).attr({
                                // 没有相关填充
                                'fill': 'none',
                                // 笔锋为1像素
                                'stroke-width': '1px',
                                // 路径id
                                id: id,
                                // 路径class
                                'class': `${pcls} ${type}`
                            });
                            // 返回箭头类型
                            return `url(#${_this.svg.id}-${type})`;
                        }
                    });

                // 删除多余节点
                update.exit().remove();
            }

            // 渲染percent 百分比
            renderPercent() {
                // 搜索图谱别名
                let _this = this;
                // 获得全局 g
                let globalG = this.svg.globalG;
                // 构建类名
                let tcls = `t-${this.id}`;
                // 查找百分比
                let update = globalG.selectAll('.' + tcls)
                    // 绑定数据
                    .data(this.force.links());

                // 新增数据处理
                update.enter()
                    // 追加文本
                    .append('text')
                    // 设置文本class 与位移属性
                    .attr({
                        'class': tcls,
                        'dy': -3
                    })
                    // 追加文本路径
                    .append("textPath") //append a textPath to the text element
                    // 设置文本路径，相关属性
                    .attr({
                        // 捆绑指定路径path
                        "xlink:href": function(d) {
                            // 定义类型map
                            let typeMap = {
                                'H': 'invest',
                                'SH': 'subsidiary',
                                "RH": 'be-invested',
                                "Holder": 'natural-invest',
                                "Senior": 'natural-manager'
                            };
                            // 确定连接箭头类型
                            let type = typeMap[d.r.relationType] || 'default';
                            // 设置文本路径class
                            d3.select(this).attr({
                                'class': `tp-${_this.id} ${type}`,
                                id: `t${d.pid}`
                            })
                            // 捆绑数据中的pid
                            return '#' + d.pid;
                        },
                        // 从开始偏移65%
                        "startOffset": "62%",
                    })
                    // 设置文本内容
                    .text(function(d) {
                        // 获得百分比数据
                        var n = d.r.shareholdingRatio;
                        // 返回百分比 或 空串
                        return `${ n ? (n + '%') : '' }`;
                    });

                // 删除多余节点
                update.exit().remove();
            }

            // 渲染节点title
            renderNodeTitle() {
                // 向节点，追加title 标签
                this.dNodes.append('title')
                    // 设置title 文本内容
                    .text(function(d) {
                        // 获得对象name 属性值
                        d.name = d.personName || d.name
                        // 返回name值
                        return d.name;
                    });
            }

            // 渲染公司圆
            renderNodeCircle() {
                // 追加公司背景圆
                this.dNodes.append("circle")
                    // 设置半径属性
                    .attr("r", this.circleR);
            }

            // 渲染公司名称
            renderCompanyName() {
                // 别名当前对象
                let _this = this;
                // 追加公司名称
                let name = this.dNodes.append('text')
                    // 设置文本属性
                    .attr({
                        x: 0,
                        dy: -2
                    });
                // 追加第一行文本
                name.append('tspan').text(function(d) {
                    // 不是公司节点，添加用户头像
                    if (!d.companyId) {
                        // 构造当前节点，选择器
                        d3.select(this.parentNode.parentNode)
                            // 追加头像图标
                            .append('use')
                            // 设置头像相关属性
                            .attr({
                                'xlink:href': '#user-icon',
                                'class': 'user-icon',
                                'x': -10,
                                'y': -20
                            });
                    }
                    // 返回第一行文本，自然人返回空串
                    return d.companyId ? d.name.substring(0, 3) : '';
                });
                // 追加第二行文本
                name.append('tspan').attr({
                    x: 0,
                    'dy': 12
                // 设置文本内容
                }).text(function(d) {
                    // 是否需要添加省略号
                    let appendEff = d.name.length > (d.companyId ? 6 : 3);
                    // 需要添加省略号
                    if (appendEff) {
                        // 获得父节点，并添加 ... 文本
                        d3.select(this.parentNode).append('tspan').text('...').attr({
                            x: 0,
                            'dy': 7
                        })
                    }
                    // 截取第二行文本
                    return d.companyId ? d.name.substring(3, 6) : d.name.substring(0, 3);
                })
            }

            // 获取节点id
            getNodeId(d) {
                return d.personId || d.companyId;
            }

            // 获取node id 字符串
            selNodeId(d) {
                // 获得数据id
                let id = _.isObject(d) ? this.getNodeId(d) : d;
                // 返回id 字符串
                return `n-${this.svg.id}-${id}`
            }

            // 向关键路径，添加样式
            _addClassKeyPath(sid, tid) {
                // 添加路径class，并 替换属性
                new util.d3.Operate(`#p-${sid}-${tid}-${this.svg.id}`).addClass('key-path').replace('marker-end', `url(#${this.svg.id}-key-path)`).do();
                // 添加百分比class
                new util.d3.Operate(`#tp-${sid}-${tid}-${this.svg.id}`).addClass('key-path-percent').do();
            }

            // 绘制进入关键路径
            addClassKeyPath(fromPaths) {
                let fps = fromPaths.split(',');
                for (let i = 0, j = 1; j < fps.length; i++, j++) {
                    let f = fps[i];
                    let s = fps[j];
                    this._addClassKeyPath(f, s);
                    this._addClassKeyPath(s, f);
                }
            }

            // 解析入口关键路径
            parseFromKeyPath(fromNodes, fromPaths) {
                // 遍历所有进入节点
                for (let i in fromNodes) {
                    // 获取单个进入节点
                    let fromNode = fromNodes[i];
                    // 构建新路径
                    let path = fromPaths + ',' + this.getNodeId(fromNode);
                    // 命中关键节点
                    if (fromNode.isKeyNode) {
                        // 绘制关键路径
                        this.addClassKeyPath(path);
                        continue;
                    }
                    let toKey = false;
                    // 遍历该节点，出口节点
                    for (let j in fromNode.to) {
                        // 获取单个出口节点
                        let toNode = fromNode.to[j];
                        // 如果单个出口节点为关键节点
                        if (toNode.isKeyNode) {
                            // 绘制关键路径
                            this.addClassKeyPath(path + ',' + this.getNodeId(toNode));
                            toKey = true;
                        }
                    }
                    if (toKey) {
                        continue;
                    }
                    // 继续分析下层节点
                    this.parseFromKeyPath(fromNode.from, path);
                }
            }

            // 解析出口关键路径
            parseToKeyPath(toNodes, toPaths) {
                // 遍历所有进入节点
                for (let i in toNodes) {
                    // 获取单个进入节点
                    let toNode = toNodes[i];
                    // 构建新路径
                    let path = toPaths + ',' + this.getNodeId(toNode);
                    // 命中关键节点
                    if (toNode.isKeyNode) {
                        // 绘制关键路径
                        this.addClassKeyPath(path);
                        continue;
                    }
                    let fromKey = false;
                    // 遍历该节点，出口节点
                    for (let j in toNode.from) {
                        // 获取单个出口节点
                        let fromNode = toNode.from[j];
                        // 如果单个出口节点为关键节点
                        if (fromNode.isKeyNode) {
                            // 绘制关键路径
                            this.addClassKeyPath(path + ',' + this.getNodeId(fromNode));
                            fromKey = true;
                        }
                    }
                    if (fromKey) {
                        continue;
                    }
                    // 继续分析下层节点
                    this.parseToKeyPath(toNode.to, path);
                }
            }

            // 绘制关键路径
            graphKeyPath(d) {

                // 查询该节点，class属性
                let cls = d3.select('#' + this.selNodeId(d)).attr('class');

                // 移除class 并 调整箭头样式
                new util.d3.Operate('.key-path').removeClass().restore('marker-end').do();
                // 移除指定class
                new util.d3.Operate('.key-path-percent').removeClass().do();

                // 如果该节点，存在key-node 样式
                if (_.includes(cls, 'key-node')) {
                    // 移除当前节点key-node class
                    new util.d3.Operate('#' + this.selNodeId(d)).removeClass('key-node').do();
                // 如果不存在，则继续操作
                } else {
                    // 移除指定class
                    new util.d3.Operate('.key-node').removeClass().do();

                    // 过滤不显示的节点函数
                    let selNodeFunc = (node, i) => {
                        return '#' + this.selNodeId(node);
                    };
                    // 获得节点出口数组
                    let to = util.d3.showNodes(d.to, selNodeFunc);
                    // 获得节点入口数组
                    let fr = util.d3.showNodes(d.from, selNodeFunc);
                    // 绘制出口关键路径
                    this.parseToKeyPath(to, '' + this.getNodeId(d));
                    // 绘制入口关键路径
                    this.parseFromKeyPath(fr, '' + this.getNodeId(d));
                    // 向当前节点，添加key-node class
                    new util.d3.Operate('#' + this.selNodeId(d)).addClass('key-node').do();
                }
            }

            // 加载更多到图谱
            _addMoreToGraph(hideNodes, addNum) {
                let showNodes = this.weak.get('showNodes');
                let links = this.weak.get('links');
                let hns = hideNodes.nodes;
                let hls = hideNodes.links;

                let matchArr = _.map(links, (link) => {
                    return `${this.getNodeId(link.source)}-${this.getNodeId(link.target)}`;
                });
                let matchStr = `,${matchArr.join(',')},`;
                // 隐藏连线，加入可见视图
                _.remove(hls, (hl, i) => {
                    let sid = this.getNodeId(hl.source);
                    let tid = this.getNodeId(hl.target);
                    if (_.includes(matchStr, `,${sid}-${tid},`)) {
                        return true;
                    }
                    if (showNodes[sid] && showNodes[tid]) {
                        links.push(hl);
                        return true;
                    } else if (addNum > 0) {
                        if (!showNodes[sid] && !showNodes[tid]) {
                            if (hns[sid] && hns[tid]) {
                                showNodes[sid] = hns[sid];
                                showNodes[tid] = hns[tid];
                                delete hns[sid];
                                delete hns[tid];
                                addNum--;
                                addNum--;
                                links.push(hl);
                                return true;
                            }
                            return false;
                        }
                        if (!showNodes[sid]) {
                            if (hns[sid]) {
                                showNodes[sid] = hns[sid];
                                delete hns[sid];
                                addNum--;
                                links.push(hl);
                                return true;
                            }
                        } else if (!showNodes[tid]) {
                            if (hns[tid]) {
                                showNodes[tid] = hns[tid];
                                delete hns[tid];
                                addNum--;
                                links.push(hl);
                                return true;
                            }
                        }
                    }
                    return false;
                });

                return addNum;
            }

            // 加载节点到搜索图谱
            addMoreToGraph(id) {
                let hideNodesMap = this.weak.get('hideNodesMap');
                let addNum = 10;
                for (let k in hideNodesMap) {
                    let hideNodes = hideNodesMap[k];
                    if (_.includes(k, id) || 'other' == k) {
                        if (!_.isEmpty(hideNodes)) {
                            addNum = this._addMoreToGraph(hideNodes, addNum);
                            if (addNum < 1) {
                                break;
                            }
                        }
                    }
                }
                // 加载数大于0，说明没有数据能用于加载
                if (addNum > 0) {
                    // 删除加载更多按钮
                    d3.select(`#add-more-${id}`).remove();
                }
                // 添加了数据，重新渲染画布
                if (addNum < 10) {
                    // 渲染图谱
                    this.render();
                }
            }

            // 加载更多按钮
            _renderAddMore(selObj, id) {
                let _this = this;
                // 获取关键节点数组
                let ns = this.nodesStr.split(',');
                // 获取关键节点个数
                let length = ns.length;
                let idx = _.indexOf(ns, '' + id);
                let left = {
                    rectX: -110,
                    rectY: -10,
                    textX: -70,
                    textY: 5
                };
                let right = {
                    rectX: 35,
                    rectY: -10,
                    textX: 73,
                    textY: 5
                };
                let position = left;
                if (length > 3) {
                    if (idx > 1) {
                        position = right;
                    }
                } else {
                    if (idx > 0) {
                        position = right;
                    }
                }
                let more = selObj.selectAll('.add-more-box').data([1]).enter().append('g').attr({
                    'class': 'add-more-box',
                    id: `add-more-${id}`
                }).on('click', function() {
                    // 加载数据到图谱
                    _this.addMoreToGraph(id);
                    // 停止事件冒泡
                    d3.event.stopPropagation();
                });
                more.append('rect').attr({
                    fill: '#eaeaea',
                    rx: 3,
                    ry: 3,
                    width: 75,
                    height: 22,
                    x: position.rectX,
                    y: position.rectY
                });
                more.append('text').text(' + 加载更多 ').attr({
                    fill: '#333',
                    x: position.textX,
                    y: position.textY
                });
            }

            // 渲染加载更多
            renderAddMore(selObj, d) {
                let hideNodesMap = this.weak.get('hideNodesMap');
                let id = this.getNodeId(d);
                for (let k in hideNodesMap) {
                    let hideNodes = hideNodesMap[k];
                    if ((_.includes(k, id) || 'other' == k) && !_.isEmpty(hideNodes && hideNodes.links)) {
                        this._renderAddMore(selObj, id);
                        break;
                    }
                }
            }

            // 渲染壳资源
            renderNodeShell(selObj, d) {
                let _this = this;
                let selId = '#' + this.selNodeId(d);
                let shellG = `.shell-${this.id}`
                // 添加背景文字
                new util.d3.Operate(selId).bgText(shellG, '壳', {
                    x: 30,
                    y: -17
                // 鼠标进入壳资源
                }).do();

                // 添加壳资源详情，移入移出
                d3.select(selId + ' ' + shellG).on('mouseenter', function(d) {
                    // 显示壳资源详情
                    _this.container.showShellDetail(d, d3.event);
                // 鼠标离开壳资源
                }).on('mouseleave', function(d) {
                    // 隐藏壳资源详情
                    _this.container.hideShellDetail(d, d3.event);
                });
            }

            // 渲染节点 Node
            renderNode() {
                let _this = this;
                // 获得全局 g
                let globalG = this.svg.globalG;
                // 构建类名
                let ncls = `n-${this.id}`;

                // 查找关系图谱节点
                let update = globalG.selectAll(`.${ncls}`)
                    // 绑定节点数据
                    .data(this.force.nodes());


                // 需新增节点的数据
                this.dNodes = update.enter()
                    // 追加节点g
                    .append('g')
                    // 增加class 属性
                    .attr('class', function(d) {
                        // 获取节点id
                        let id = _this.getNodeId(d);
                        // 获取当前节点
                        let selObj = d3.select(this);
                        // 获得当前节点，并设置id 属性
                        selObj.attr('id', _this.selNodeId(id));

                        // 如果当前节点，是关键节点
                        if (d.isKeyNode) {
                            // 渲染加载更多
                            _this.renderAddMore(selObj, d);
                        }

                        // 渲染壳资源
                        if (d.shells) {
                            // 渲染节点壳资源
                            _this.renderNodeShell(selObj, d);
                        }

                        // 返回root-node 和 节点class
                        return `${ncls} ${d.isKeyNode ? 'root-node' : ''}`;
                    })
                    // 对节点按下鼠标
                    .on('mousedown', function() {
                        // 使拖拽svg画布失效
                        _this.svg.ignoreZoom();
                    })
                    // 对节点松开鼠标
                    .on('mouseup', function() {
                        // 使拖拽svg画布 生效
                        _this.svg.startZoom();
                    })
                    .on('click', function(d) {
                        // 绘制关键路径
                        _this.graphKeyPath(d);
                    })
                    // 调用聚力拖拽事件
                    .call(this.force.drag);

                // 删除多余节点
                update.exit().remove();

                // 渲染节点title
                this.searchFrame.push(this.operate.nodeTitle);
                // 渲染公司节点
                this.searchFrame.push(this.operate.nodeCircle);
                // 渲染公司名称
                this.searchFrame.push(this.operate.companyName);
            }

            // 解析数据并渲染结果
            parseDataAndRender() {
                // 计算数据
                this.searchWorker.operation(this.weak.get('datas'), this.nodes, this.layer, this.filter).done((operDatas) => {
                    // 将对象边界置空
                    this.boundary = null;
                    // 设置搜索节点，初始化位置
                    this.enlargeBoundary();
                    // 设置隐藏节点Map
                    this.weak.set('hideNodesMap', operDatas.hideNodesMap);
                    // 设置所有链接
                    this.weak.set('links', operDatas.links);
                    // 设置可见节点
                    this.weak.set('showNodes', operDatas.nodes);
                    // 渲染图谱
                    this.render();
                });
            }

            // 渲染关系图谱
            render() {
                if (this.force) {
                    // 清空聚力图谱关系
                    this.force.links([]);
                    this.force.on('tick', null);
                    this.force.on('end', null);
                }
                // 清空画布元素
                this.svg.globalG.html('');
                // 构建力图对象
                this.searchFrame.push(this.operate.force);
            }

            // 节点自动补全
            nodesAutoComplete(completeList, nodes) {
                for (let k in nodes) {
                    let n = nodes[k];
                    completeList.push({
                        value: n.personId || n.companyId,
                        text: n.personName || n.name || n.companyName
                    });
                }
            }

            // 自动补全结果
            autoComplete() {
                let ret = [];

                // 设置可见节点
                let showNodes = this.weak.get('showNodes');
                this.nodesAutoComplete(ret, showNodes);
                let hideNodesMap = this.weak.get('hideNodesMap');
                for (let k in hideNodesMap) {
                    let hideNodes = hideNodesMap[k];
                    this.nodesAutoComplete(ret, hideNodes.nodes);
                }
                return ret;
            }

            getNode(nodeId) {
                // 设置可见节点
                let showNodes = this.weak.get('showNodes');
                let node = showNodes[nodeId];
                node.point = {
                    ccp: [node.x, node.y]
                }
                node.height = 2 * this.circleR;
                return node;
            }

            // 定位点
            positionNode = null;

            // 移动到对应位置
            transition(endNodeId) {
                // 获取开始节点
                let start = this.positionNode && this.positionNode.id != endNodeId ? this.positionNode : this.getNode(this.nodes[0]);
                // 获取结束节点
                let end = this.getNode(endNodeId);
                // 展示隐藏得节点
                // this.showNode(endNodeId);
                // 移动到结束节点
                this.svg.transition(start, end, (end) => {
                    new util.d3.Operate('#' + this.selNodeId(end)).addClass('position-item').do();
                });
                // 赋值为开始节点
                this.positionNode = end;
            }

            // 移除定位效果
            removeTransition(nodeId) {
                let pid = this.positionNode && (this.positionNode.personId || this.positionNode.companyId);
                // 移除定位，为当前节点
                if (pid == nodeId) {
                    // 移动到中间节点
                    this.transition(this.nodes[0]);
                }
            }

            // 展示符合条件节点
            showConditionNode(filter) {
                // 参数无效
                if (!_.isObject(filter)) {
                    // 退出方法
                    return;
                }
                // 获得层级对象
                let layerFilter = (filter.level && filter.level[0]) || this.layer;
                // 删除层级属性
                delete filter.level;
                // 赋值过滤条件
                this.filter = filter;
                // 设置当前查看层级
                this.layer = layerFilter;
                // 解析数据并渲染结果
                this.parseDataAndRender();
            }

            // 获取公司编号
            getCompanyIds() {
                let showNodes = this.weak.get('showNodes');
                let ret = [];
                _.each(showNodes, (sn, i) => {
                    if (!sn.personId) {
                        sn.companyId && ret.push(sn.companyId);
                    }
                });
                return ret.join(',');
            }

            // 向公司节点设置壳资源
            setCompnayShellResource(shells) {
                // 壳资源结果列表
                if (shells) {
                    let showNodes = this.weak.get('showNodes');
                    let addShells = false;
                    _.each(shells, (s) => {
                        let cid = s.companyId;
                        let node = showNodes[cid];
                        if (node) {
                            node.shells = s;
                            addShells = true;
                        }
                    });
                    // 添加壳资源
                    if (addShells) {
                        // 重新渲染关系图谱
                        this.render();
                    }
                }
            }

            // 清除节点中的壳资源
            clearShellResource() {
                // 显示展示节点
                let showNodes = this.weak.get('showNodes');
                // 默认没有发生，清空操作
                let clear = false;
                // 遍历可展示节点
                _.each(showNodes, (sn, id) => {
                    // 如果存在壳资源
                    if (sn.shells) {
                        // 说明发生清理
                        clear = true;
                        // 删除壳资源
                        delete sn.shells;
                    }
                });
                // 如果发生清洗
                if (clear) {
                    // 重新渲染关系图谱
                    this.render();
                }
            }
        }
    }
});

// window.searchWorker = new atlas.search.SearchWorker();
