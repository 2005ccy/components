
// 扩展 atlas 工具方法
Object.assign(window.atlas = window.atlas || {}, {
    // ds相关扩展
    relation: {
        // 单个对象
        Unit: class Unit extends util.core.Base {
            // 单个图形宽度
            width = 60;
            // 单个图形高度
            height = 40;

            // 单个图形构造方法
            constructor(id, data, relObj) {
                super();
                // 设置单图编号
                this.id = id;
                // 设置单图名称
                this.name = relObj && relObj.isPerson ? data.personName : data.companyName;
                // 删除个人名称
                delete data.personName;
                // 删除公司名称
                delete data.companyName;
                // 赋值data
                this.data = data;
                // 赋值关系对象
                this.relObj = relObj;
            }

            // 设置文本信息
            setText() {
                // 获得单图宽度
                let iw = this.width;
                // 获得单图高度
                let ih = this.height;
                // 获取企业名称
                let n = this.name || '';
                // 名称长度
                let length = n.length;
                // 第一行文本
                let fRow;
                // 第二行文本
                let sRow;
                // 如果大于 60 为根节点
                if (iw > 60) {
                    let m = parseInt(length / 2);
                    fRow = n.substring(0, m);
                    sRow = n.substring(m);
                // 为其他节点
                } else {
                    // 如果超长
                    if (length > 8) {
                        n = n.substring(0, 7) + '...';
                    }
                    fRow = n.substring(0, 4);
                    sRow = n.substring(4);
                }

                // 计算文本x点
                let x = this.point.ltp[0] + 8;
                // 计算文本y点
                let y = this.point.ltp[1] + 16;
                // 设置单图，文本信息
                this.text = {
                    text: n,
                    attrX: x,
                    attrY: y,
                    fRow: fRow,
                    sRow: sRow
                }
            }

            // 设置中心点
            setCCP(ccp) {
                // 构建点属性
                this.point = this.getObject();
                // 设置中心点
                this.point.ccp = ccp;
                // 计算实体半宽
                let hw = this.width / 2;
                // 计算实体半高
                let hh = this.height / 2;
                // 设置单个图形左上点
                this.point.ltp = [ccp[0] - hw, ccp[1] - hh];
                // 设置中上点
                this.point.ctp = [ccp[0], ccp[1] - hh];
                // 设置中下点
                this.point.cbp = [ccp[0], ccp[1] + hh];

                // 设置单图文本
                this.setText();
            }

            // 计算图谱，宽度高度
            getWidthHeight(param) {
                // 展开关系图，上、下、左、右
                let {left, right, up, down} = param;
                // 获取单图左上点
                let ltp = this.point.ltp;
                // 获取左边
                let ul = ltp[0];
                // 获取上边
                let ut = ltp[1];
                // 计算右边
                let ur = ul + this.width;
                // 计算下边
                let ud = ut + this.height;
                // 单图更靠左
                if (ul < left) {
                    param.left = ul;
                }
                // 单图更靠上
                if (ut < up) {
                    param.up = ut;
                }
                // 单图更靠右
                if (ur > right) {
                    param.right = ur;
                }
                // 单图更靠下
                if (ud > down) {
                    param.down = ud;
                }
            }

            // 设置根节点，样式
            rootNode() {
                let l = this.name.length;
                let nw = (l / 2 + 1) * 10 + 10;
                this.width = nw;
                // 该节点为根节点
                this.isRootNode = true;
            }

            // 自动补全
            autoComplete(dataSource, keyword) {
                // 是否匹配关键词
                let match = keyword ? _.includes(this.name, keyword) : true;
                // 匹配加入数据集
                if (match) {
                    dataSource.push({
                        value: this.id,
                        text: this.name
                    });
                }
            }
        },
        // 图形组
        Group: class Group extends util.core.Base {
            // 图形组在，图形层中的索引
            index = 0;
            // 渲染个数
            renderNum = 5;
            // 一次展示个数
            showNum = 4;
            // 左边边界
            left = 0;
            // 右边边界
            right = 0;
            // 中心点
            center = 0;
            // 一份中点距离
            part = 50;
            // 组件距离
            space = 50;

            // 组图构造方法
            constructor(key, unitList) {
                super();
                // 组图隐藏单图列表数据
                this.hideUnitList = this.getArray(unitList);
                // 设置可见单图数据
                this.showUnitList = this.getArray();
                // 设置匹配单图数据
                this.matchUnitList = this.getArray();
                // 组图的key 属性
                this.key = key;
                // 设置每个单图对象的，组图对象
                _.each(this.hideUnitList, (hu) => {
                    // 当前单图，的组图属性
                    if (hu) {
                        hu.group = this;
                    }
                });
            }

            // 查询最大宽度高度
            getWidthHeight(param) {
                let list = this.showUnitList;
                for (let i in list) {
                    let su = list[i];
                    su.getWidthHeight(param);
                }
            }

            // 展示更多
            showMore() {
                // 根据判断条件，取值条件；或隐藏数组
                let unitList = this.condition ? this.matchUnitList : this.hideUnitList;
                // 计算组图，隐藏单图数量
                let length = unitList.length;
                // 计算将要展示单图对象
                let shows = unitList.splice(0, length > this.showNum ? this.showNum : length);
                // 存在需展示的单图数据
                if (!_.isEmpty(shows)) {
                    // 连接到展示列表
                    this.showUnitList = this.getArray(util.core.concat(this.showUnitList, shows));
                    // 使用图形层，移动图形组
                    this.level.moveGroup();
                }

                // addMore打点
                this.level.relation.events.addMorePingback(this.key.split('-')[0]);
            }

            // 显示单个节点
            showNode(node) {
                // 根据判断条件，取值条件；或隐藏数组
                let unitList = this.condition ? this.matchUnitList : this.hideUnitList;
                // 移除隐藏数组中的数据
                let showNode = _.remove(unitList, (hu) => {
                    // 移除节点，相关条件
                    return _.isString(node) ? hu.id === node : hu.id === node.id;
                });
                // 存在被移除节点
                if (!_.isEmpty(showNode)) {
                    // 将节点放入，展示数组
                    this.showUnitList.push(showNode[0]);
                    // 移动图形
                    this.level.moveGroup();
                }
            }

            // 计算单图对象，中心点
            computeCenterPoint(index) {
                // 计算是否为研究对象上层
                let isUp = this.level.index < 0;
                // 当前单图显示索引
                let ui = index % 4;
                // 计算当前单图，索引 4 的倍数
                let n = parseInt(index / 4);
                // 计算当前单图，偏移量
                let offset = 2 * n * this.part;
                // 定义当前单图，中心点
                let p;
                // 单图索引，余4 等于 0
                if (ui === 0) {
                    // 如果索引不为0
                    if (offset === 0 && index > 0) {
                        // 偏移量为两倍距离
                        offset = 2 * this.part;
                    }
                    // 计算单图中心点
                    p = [this.center + offset, isUp ? this.level.downY : this.level.upY];
                // 单图索引， 余4 等于 1
                } else if (ui === 1) {
                    // 计算单图中心点
                    p = [this.center - this.part - offset, isUp ? this.level.upY : this.level.downY];
                // 单图索引， 余4 等于 2
                } else if (ui === 2) {
                    // 计算单图中心点
                    p = [this.center + this.part + offset, isUp ? this.level.upY : this.level.downY];
                // 单图索引， 余4 等于 3
                } else {
                    // 计算单图中心点
                    p = [this.center - (2 * this.part) - offset, isUp ? this.level.downY : this.level.upY];
                }
                // 返回中心点
                return p;
            }

            // 设置unit中心点
            setUnitCCP() {
                let list = this.showUnitList;
                // 遍历要展示的单元图形列表
                for (let i = 0; i < list.length; i++) {
                    // 获取单元图形对象
                    let unit = list[i];
                    // 计算单元图形中心点
                    let ccp = this.computeCenterPoint(i);
                    // 设置中心点
                    unit.setCCP(ccp);
                }
            }

            // 获取组 class 名称
            getGroupClass(type) {
                // 返回组图class 名称
                return `l${this.level.index}-g${this.key}-${type}`;
            }

            // 条件下，是否存在更多
            conditionHasMore(unit) {
                let level = this.level;
                let li = level.index;
                let k = 'up';
                if (li > 0) {
                    k = 'down';
                }
                let group = level.relation.treeObj.groupMap[`${unit.id}-${k}`];
                if (group && !_.isEmpty(group.matchUnitList)) {
                    return true;
                }
                return false;
            }

            // 根据单图数据，绘制单图
            graphItem(d, sel) {
                // 获得单图g，实体
                let item = _.isArray(sel) ? sel : d3.select(this);
                // 清空原有子节点
                item.html('');
                // 设置单图id
                item.attr('id', `g${d.id}`);

                d.isRootNode && item.attr('class', item.attr('class') + ' root-item');

                // 设置背景框
                item.append('rect')
                    .attr('x', d.point.ltp[0])
                    .attr('y', d.point.ltp[1])
                    .attr('width', d.width)
                    .attr('height', d.height)
                    .attr('rx', 5)
                    .attr('ry', 5);

                let hasMore = d.group.condition ? d.group.conditionHasMore(d) : d.hasMore;
                // 存在，下层管理组图
                if (hasMore) {
                    // 绘制用户头像
                    item.append('use')
                        .attr('xlink:href', '#close-more-icon')
                        .attr('class', 'has-more-icon more-node')
                        .attr('x', d.point.ccp[0] - 5)
                        .attr('y', d.hasType === 'up' ? d.point.ltp[1] - 10 : d.point.ltp[1] + d.height);
                }

                // 是否为个人节点
                let isPerson = d.relObj && d.relObj.isPerson;
                // 如果为公司节点
                if (!isPerson) {
                    // 公司名称文本
                    let text = item.append('text')
                        .attr('x', d.text.attrX)
                        .attr('y', d.text.attrY)
                        .text(d.text.fRow)

                    // 绘制公司名称，第二行
                    text.append('tspan')
                        .text(d.text.sRow)
                        .attr('x', d.text.attrX)
                        .attr('y', d.text.attrY + 16)
                    // 如果公司名称被截取，绘制title
                    if (d.text.text != d.name) {
                        // 如果单图，不存在 title 标签
                        if (!item.select('title')[0][0]) {
                            // 插入全称的 title 标签
                            item.insert("title", ":first-child").text(d.name);
                        }
                    }
                // 为自然人单图
                } else {
                    // 绘制用户名称
                    item.append('text')
                        .text(d.text.text)
                        .attr('class', 'user-name')
                        .attr('x', d.point.ccp[0])
                        .attr('y', d.text.attrY + 18);
                    // 绘制用户头像
                    item.append('use')
                        .attr('xlink:href', '#user-icon')
                        .attr('class', 'user-icon')
                        .attr('x', d.text.attrX + 14)
                        .attr('y', d.text.attrY - 12);
                }
            }

            // 绘制更新图像
            graphItemUpdate(d, sel, tid) {
                // 获得单图g, 实体
                let item = _.isArray(sel) ? sel : d3.select(this);

                // 移动单图背景
                item.select('rect')
                    .attr('x', d.point.ltp[0])
                    .attr('y', d.point.ltp[1]);

                // 移动 - 存在管理组图 图标
                item.select('.has-more-icon')
                    .attr('xlink:href', d.isOpen ? '#open-more-icon' : '#close-more-icon')
                    .attr('class', d.isOpen ? 'has-more-icon' : 'has-more-icon more-node')
                    .attr('x', d.point.ccp[0] - 5)
                    .attr('y', d.hasType === 'up' ? d.point.ltp[1] - 10 : d.point.ltp[1] + d.height)

                // 是否为个人节点
                let isPerson = d.relObj && d.relObj.isPerson;
                // 如果为公司节点
                if (!isPerson) {
                    // 移动公司名称
                    let text = item.select('text')
                        .attr('x', d.text.attrX)
                        .attr('y', d.text.attrY);
                    // 移动第二行，公司名称
                    text.select('tspan')
                        .attr('x', d.text.attrX)
                        .attr('y', d.text.attrY + 16)
                // 为自然投资人
                } else {
                    // 移动用户名称
                    item.select('text')
                        .attr('x', d.point.ccp[0])
                        .attr('y', d.text.attrY + 18);
                    // 移动用户头像
                    item.select('.user-icon')
                        .attr('x', d.text.attrX + 14)
                        .attr('y', d.text.attrY - 12);
                }

                // 添加壳资源
                if (d.shells) {
                    let selId = '#' + tid;
                    let shellG = `.shell-atlas-relation`
                    // 添加背景文字
                    new util.d3.Operate(selId).bgText(shellG, '壳', {
                        x: d.point.ltp[0] - 11,
                        y: d.point.ltp[1] + 15
                    // 鼠标进入壳资源
                    }).do();

                    // 添加壳资源详情，移入移出
                    d3.select(selId + ' ' + shellG).on('mouseenter', function(d) {
                        // 显示壳资源详情
                        d.group.level.relation.container.showShellDetail(d, d3.event);
                    // 鼠标离开壳资源
                    }).on('mouseleave', function(d) {
                        // 隐藏壳资源详情
                        d.group.level.relation.container.hideShellDetail(d, d3.event);
                    });
                }
            }

            // 绘制改组单图列表
            graphUnitList() {
                let _this = this;
                let list = this.showUnitList;
                // 展示列表中的数据，可见
                _.each(list, (unit) => {
                    unit.isShow = true;
                });

                // 获取单图class名称
                let gcls = this.getGroupClass('item');
                // 获得画布，全局g对象
                let globalG = (this.relation || this.level.relation).svg.globalG;

                // 获得已绑定单图集合
                let update = globalG.selectAll('.' + gcls)
                    .data(list);

                // 移动单图列表，中所有组件
                update.each(function(d, i) {
                    let sel = d3.select(this);
                    let tid = sel.attr('id');
                    if (_.includes(tid, d.id)) {
                        _this.frame(_this.graphItemUpdate, d, sel, tid);
                    } else {
                        _this.frame(_this.graphItem, d, sel);
                    }
                });

                // 绘制新的单图列表
                update.enter()
                    .append('g')
                    .attr('class', gcls + ' item')
                    .on('click', function(dd) {
                        // 调用加载函数
                        !dd.isRootNode && dd.group.level.toggleShowHide(dd.id);
                    })
                    .each(function(d) {
                        let sel = d3.select(this);
                        // 添加右键事件
                        sel[0][0].addEventListener('contextmenu', function(e) {
                            // 终止事件冒泡
                            e.preventDefault();
                            // 获得关系图谱
                            let r = d.group.level.relation;
                            // 获得相关事件
                            r && r.events && r.events.showContextMenu(d, e);
                        }, false);
                        // 绘制公司节点
                        _this.frame(_this.graphItem, d, sel);
                    });

                // 删除多余的单图列表
                update.exit().remove();
            }

            // 绘制 层级间，单图间的关联路径
            graphUnitListPath() {
                // this对象别名
                let _this = this;
                // 折线移动 y 轴的位置
                let v = (this.relation || this.level.relation).levelSpace / 7;
                // 获取下层对象
                let level = this.level.relation.nextLevel(this.level);
                // 下层上行 Y 轴
                let upY = level.upY;
                // 下层下行 Y 轴
                let downY = level.downY;
                // 获取展示单图对象
                let showUnitList = this.showUnitList;
                // 组图，显示单图数量
                let length = showUnitList.length;

                // 绘制路径函数
                function graphPathFunc(d, i, sel) {
                    // 创建path 一个path对象
                    let path = new util.svg.Path();
                    try {
                        // 绘制下层路径
                        if (_this.level.index > 0) {
                            // 第一个元素
                            if (i == 0) {
                                // 获得关系开始对象编号
                                let sid = _this.key.split('-')[0];
                                // 获得关系开始对象
                                let sobj = _this.level.relation.treeObj.unitMap[sid];
                                // 获得关系开始对象连线
                                path.point(sobj.point.cbp);
                                // 存在更多
                                sobj.hasMore && path.moveY(10);
                                // 绘制组图中心点，Y轴上移点
                                path.copy().point(_this.groupCCP).moveY(-1 * v);
                            }
                            // 绘制组图中心点，到各元素连线
                            path.point(_this.groupCCP);

                            // 绘制组图中点，水平线
                            path.point(d.point.ctp).sameY()
                                // 绘制上点
                                .point(d.point.ctp)
                            // 绘制单图，指定颜色箭头
                            sel.attr("marker-end", `url(#${_this.level.relation.svg.id}-${(d.relObj && d.relObj.type) || 'be-invested'})`)
                        // 绘制上层路径
                        } else if (_this.level.index < 0) {
                            // 绘制单图，底边中心点
                            path.point(d.point.cbp)
                                // 绘制组图中点，水平线
                                .point(_this.groupCCP).sameX()
                                // 绘制到组图中心点
                                .point(_this.groupCCP);
                            // 如果为第一个单图
                            if (i == 0) {
                                // 如果是两个元素
                                if (length == 2) {
                                    // 向中间移动
                                    path.moveX(-1 * (_this.part / 2));
                                }
                                // 绘制中心点到，目标对象连线
                                path.point(_this.groupCCP).moveY(v).sameX();
                                // 获取目标对象编号
                                let tid = _this.key.split('-')[0];
                                // 获取目标对象实体
                                let tobj = _this.level.relation.treeObj.unitMap[tid];
                                // 绘制到目标对象，上方Y轴平移点
                                path.point(tobj.point.ctp).moveY((tobj.point.ccp[1] == downY ? -3.1 : -1) * v)
                                    // 绘制目标对象，上方点
                                    .point(tobj.point.ctp);
                                // 如果存在更多数据
                                tobj.hasMore && tobj.hasType == 'up' && path.moveY(-10);

                                // 根据单图数据，绘制不同颜色箭头
                                sel.attr("marker-end", `url(#${_this.level.relation.svg.id}-${(d.relObj && d.relObj.type) || 'be-invested'})`)
                            }
                        }
                    } catch ( e ) {}

                    // 获得股份占比
                    let holdRatio = d.relObj && d.relObj.holdRatio;
                    // 获取文本内容
                    let hold = holdRatio ? holdRatio + '%' : '';
                    // 路径无效，返回文本
                    if (hold) {
                        // 设置百分比
                        d.holdRatio = hold;
                        let point;
                        if (_this.level.index > 0) {
                            // 获取路径结束点
                            let last = path.last();
                            point = [last[0], last[1] - 23];
                        // 绘制上层路径
                        } else if (_this.level.index < 0) {
                            // 获取路径开始
                            let first = path.index();
                            point = [first[0], first[1] + 7];
                        }
                        // 设置百分比，背景定位点
                        d.point.percent = point;
                    }

                    // 返回路径点
                    return path.line();
                }

                // 获取组class名称
                let gcls = this.getGroupClass('path');
                let globalG = this.level.relation.svg.globalG;

                // 获得已绑定dom集合
                let update = globalG.selectAll('.' + gcls)
                    .data(showUnitList);

                function setAttrD(widget, data) {
                    let dp = graphPathFunc(data.d, data.i, data.sel);
                    data.sel.attr('d', dp);
                }
                // 设置路径
                let setPathD = function(d, i) {
                    let sel = d3.select(this);
                    _this.frame(setAttrD, {
                        sel: sel,
                        d: d,
                        i: i
                    });
                    // 到达each 最后一个
                    if (i == showUnitList.length - 1) {
                        // 绘制图谱百分比
                        _this.frame(_this.graphUnitListPercent);
                    }
                }

                // 更新关系路径
                update.each(setPathD);

                // renderType 【 投资：1, 子公司：2, 被公司投资：3, 自然人投资：3, 自然人高管：4 】
                // 'invest', 'subsidiary', 'be-invested', 'natural-invest', 'natural-manager'

                // 新增关系路径
                update.enter()
                    .append('svg:path')
                    .attr('class', function(d) {
                        let cls = '';
                        if (d.relObj) {
                            let rt = d.relObj.renderType || 0;
                            cls = d.relObj.type = ['', 'invest', 'subsidiary', 'be-invested', 'natural-invest', 'natural-manager'][rt];
                        }
                        d.pathCls = cls;
                        return gcls + ' ' + cls;
                    })
                    .attr("fill", "none")
                    .each(setPathD);

                // 删除多余路径
                update.exit().remove();
            }

            // 绘制连线百分比
            graphUnitListPercent() {
                // 当前对象别名
                let _this = this;

                // 获取组class名称
                let gcls = this.getGroupClass('percent');
                let globalG = this.level.relation.svg.globalG;

                // 绘制百分比点
                function graphPercentBGFunc(d, i) {
                    return gcls + ' percent ' + d.pathCls;
                }

                let list = _.filter(this.showUnitList, (su) => {
                    return su.point.percent;
                });

                // 获得已绑定dom集合
                let update = globalG.selectAll('.' + gcls)
                    .data(list);

                // 添加
                update.attr('class', graphPercentBGFunc);
                // 移动百分比文本
                update.select('text')
                    .text((d) => d.holdRatio)
                    .attr('x', (d) => d.point.percent[0])
                    .attr('y', (d) => d.point.percent[1] + 10);
                // 移动百分比，背景
                update.select('rect')
                    .attr('x', (d) => d.point.percent[0] - 15)
                    .attr('y', (d) => d.point.percent[1]);

                // 百分比g，实体
                let item = update.enter()
                    .append('g')
                    .attr('class', graphPercentBGFunc);

                // 绘制百分比，背景
                item.append('rect')
                    .attr('class', 'percent-bg')
                    .attr('x', (d) => d.point.percent[0] - 15)
                    .attr('y', (d) => d.point.percent[1])
                    .attr('width', 30)
                    .attr('height', 12);

                // 绘制实体文本
                item.append('text')
                    .text((d) => d.holdRatio)
                    .attr('x', (d) => d.point.percent[0])
                    .attr('y', (d) => d.point.percent[1] + 10);

                // 多余dom处理
                update.exit().remove();
            }

            // 加载更多
            graphAddMore() {
                // 获取组class名称
                let gcls = this.getGroupClass('add-btn');
                let globalG = this.level.relation.svg.globalG;

                let unitList = this.condition ? this.matchUnitList : this.hideUnitList;
                // 获得已绑定dom集合
                let update = globalG.selectAll('.' + gcls)
                    .data(_.isEmpty(unitList) || _.isEmpty(this.showUnitList) ? [] : [this]);

                if (this.groupCCP) {
                    let rectX = this.groupCCP[0] + 20;
                    let rectY = this.groupCCP[1] + (this.level.index > 0 ? -29 : 8);
                    let textX = this.groupCCP[0] + 30;
                    let textY = this.groupCCP[1] + (this.level.index > 0 ? -14 : 23);

                    // 移动『加载更多』
                    update.select('rect')
                        .attr('x', rectX)
                        .attr('y', rectY);
                    update.select('text')
                        .text('+ 加载更多')
                        .attr('x', textX)
                        .attr('y', textY);

                    // 绘制【加载更多】
                    let addG = update.enter()
                        .append('g')
                        .attr('class', gcls + ' add-btn')
                        .on('click', function(d) {
                            // 调用加载函数
                            d.showMore();
                        });

                    addG.append('rect')
                        .attr('x', rectX)
                        .attr('y', rectY)
                        .attr('width', 75)
                        .attr('height', 22)
                        .attr('rx', 3)
                        .attr('ry', 3);

                    addG.append('text')
                        .text('+ 加载更多')
                        .attr('x', textX)
                        .attr('y', textY);
                }

                // 删除多余路径百分比
                update.exit().remove();
            }

            // 渲染图形单元列表
            renderUnitList() {
                // 设置单元中心点
                this.setUnitCCP();
                this.frame(this.graphUnitList);
                this.frame(this.graphUnitListPath);
                this.frame(this.graphAddMore);
            }

            // 渲染图形组
            render(relation, level, index) {
                // 设置关系图对象
                this.relation = relation;
                // 设置层级对象
                this.level = level;
                // 设置图形组下标
                this.index = index;
                // 如果是初次渲染
                if (_.isEmpty(this.showUnitList)) {
                    // 根据判断条件，取值条件；或隐藏数组
                    let unitList = this.condition ? this.matchUnitList : this.hideUnitList;
                    // 对数据进行排序
                    unitList.sort(function(a, b) {
                        let ahr = (a.relObj && a.relObj.holdRatio) || 0;
                        let bhr = (b.relObj && b.relObj.holdRatio) || 0;
                        let ret = bhr - ahr;
                        if (!ret) {
                            let bhm = b.hasMore ? 1 : 0;
                            let ahm = a.hasMore ? 1 : 0;
                            ret = bhm - ahm;
                        }
                        return ret;
                    });
                    // 未展示的单图个数
                    let length = unitList.length;
                    // 展示默认单元图形列表
                    this.showUnitList = this.getArray(unitList.splice(0, length > this.renderNum ? this.renderNum : length));
                }
                // 渲染图形单元列表
                this.renderUnitList();
            }

            // 隐藏相关组图
            hide() {
                let showUnitList = this.showUnitList;
                // 遍历显示
                _.each(showUnitList, (su) => {
                    // 标识节点隐藏
                    su.isShow = false;
                    // 设置展开下层标识位
                    su.isOpen = false;
                    // 调用加载函数
                    su.group.level.hide(su.id);
                });
                // 清空展示节点
                if (!this.condition) {
                    // 还原隐藏单图列表
                    this.hideUnitList = this.getArray(util.core.concat(this.hideUnitList, showUnitList));
                } else {
                    // 还原隐藏单图列表
                    this.matchUnitList = this.getArray(util.core.concat(this.matchUnitList, showUnitList));
                }
                // 显示单图列表为空
                this.showUnitList = this.getArray();
                // 去除相关svg DOM
                this.renderUnitList();
            }

            // 组图形，自动补全
            autoComplete(dataSource, keyword) {
                let list = this.hideUnitList;
                // 遍历隐藏，单图数组
                for (let i in list) {
                    let unit = list[i];
                    unit.autoComplete(dataSource, keyword);
                }
                let showUnitList = this.showUnitList;
                // 遍历展示，单图数组
                for (let i in showUnitList) {
                    let unit = showUnitList[i];
                    unit.autoComplete(dataSource, keyword);
                }
            }

            // 设置组图条件
            setCondition(condition) {
                // 清除条件
                this.clearCondition();
                // 设置筛选条件
                this.condition = condition;
                // 获取行业条件
                let industry = (this.condition.industry || []).join(';');
                // 获取持股百分比
                let percent = this.condition.percent && this.condition.percent[0];
                // 数据类型转换
                percent = percent ? parseFloat(percent) : null;
                // 获取市场类型
                let type = (this.condition.type || []).join(';');
                // 从隐藏数组中，获取符合条件的单图列表
                this.matchUnitList = this.getArray(_.remove(this.hideUnitList, (unit, i) => {
                    // 假定符合条件
                    let match = true;
                    // 获取单图数据
                    let data = unit.data;
                    // 获取单图，关系数据
                    let relObj = unit.relObj || {};
                    // 获取持股比例
                    let hr = relObj.holdRatio || 0;
                    // 比较所属行业
                    if (industry && !_.includes(industry, data.industry)) {
                        match = false;
                    }
                    // 比较持股比例
                    if (percent && hr < percent) {
                        match = false;
                    }
                    // 比较市场类型
                    if (type && !_.includes(type, data.companyMarketType || (relObj.isPerson && '自然人'))) {
                        match = false;
                    }
                    // 返回比较结果
                    return match;
                }));
            }

            // 清空组图条件
            clearCondition() {
                // 条件置空
                this.condition = null;
                let showUnitList = this.showUnitList;
                // 遍历显示
                _.each(showUnitList, (su) => {
                    // 标识节点隐藏
                    su.isShow = false;
                    // 设置展开下层标识位
                    su.isOpen = false;
                });
                // 数据全部归于隐藏数组
                this.hideUnitList = this.getArray(util.core.concat(this.hideUnitList, this.matchUnitList, showUnitList));
                // 展示数组为空
                this.showUnitList = this.getArray();
                // 匹配数组为空
                this.matchUnitList = this.getArray();
                // 去除相关svg DOM
                this.renderUnitList();
            }

            // 获取展示的公司编号
            getCompanyIds(cidList) {
                let showUnitList = this.showUnitList;
                // 遍历展示，单图数组
                for (let i in showUnitList) {
                    let unit = showUnitList[i];
                    let cid = unit && unit.data && unit.data.companyId;
                    cid && cidList.push(cid);
                }
            }

            // 清理壳资源
            clearShellResource() {
                let showUnitList = this.showUnitList;
                // 遍历展示，单图数组
                for (let i in showUnitList) {
                    let unit = showUnitList[i];
                    if (unit.shells) {
                        // 添加壳资源详情，移入移出
                        d3.select(`#g${unit.id} .shell-atlas-relation`).remove();
                        delete unit.shells;
                    }
                }
            }
        },
        // 层级对象
        Level: class Level extends util.core.Base {
            // 层中元素，间距
            space = 65;
            // 层中第一行 y 轴
            upY = 0;
            // 层中第二行 y 轴
            downY = 0;

            // 隐藏组对象
            hideGroupMap = this.getObject();

            // 构造函数
            constructor(index, relation) {
                super();
                // 展示组对象
                this.showGroupList = this.getArray();

                this.index = index;
                this.relation = relation;
            }

            // 获取层的宽高
            getWidthHeight(param) {
                let list = this.showGroupList;
                for (let i in list) {
                    let sg = list[i];
                    sg.getWidthHeight(param);
                }
            }

            // 向Group中放置新数据
            put(groupKey, group) {
                // 生成组图像索引
                let index = _.size(this.hideGroupMap);
                // 设置组图形索引
                group.index = index;
                // 设置组图的level 对象
                group.level = this;
                // 向隐藏Map，加入数据
                this.hideGroupMap[groupKey] = group;
            }

            // 计算当前层，上层与下层Y轴
            levelY() {
                // 如果为当前层
                if (this.index === 0) {
                    // 画布中心点Y轴
                    let svgCCPY = this.relation.svg.ccp[1];
                    // 上层Y中 与 屏幕中点Y轴 相同
                    this.upY = this.downY = svgCCPY;
                } else {
                    // 获得层间距
                    let levelSpace = this.relation.levelSpace;
                    // 处在研究对象，下方
                    if (this.index > 0) {
                        // 获取上层数据
                        let upLevel = this.relation.treeObj.levelMap[this.index - 1]
                        // 设置当层，上行 Y 轴
                        this.upY = upLevel.downY + (this.index < 2 ? levelSpace - 70 : levelSpace);
                        // 设置当层，下行 Y 轴
                        this.downY = this.upY + this.space;
                    // 上层
                    } else {
                        // 获取下层数据
                        let downLevel = this.relation.treeObj.levelMap[this.index + 1]
                        // 设置当层， 下行 Y 轴
                        this.downY = downLevel.upY - (this.index < -1 ? levelSpace : levelSpace - 70);
                        // 设置当层， 上行 Y 轴
                        this.upY = this.downY - this.space;
                    }
                }
            }

            // 获取图形组key
            groupKey(id) {
                // 构建上层 key
                let groupKey = `${id}-up`;
                // 如果是下层
                if (this.index > 0) {
                    // 构建下层 key
                    groupKey = `${id}-down`;
                }
                // 返回组图key
                return groupKey;
            }

            // 检查是否存在，图形组
            hashGroup(id) {
                // 获得组图key
                let groupKey = this.groupKey(id);
                // 返回当层，是否存在该 组图
                return !!this.hideGroupMap[groupKey];
            }

            // 显示指定图形组
            addShowGroup(groupKey, id) {
                // 获得粉猪
                let group = this.hideGroupMap[groupKey];
                // 如果存在单图 id
                if (id) {
                    // 赋值组图，关联单图对象
                    group.relUnit = this.relation.treeObj.unitMap[id];
                }
                // 将组图，加入到显示组
                this.showGroupList.push(group);
                // 去除隐藏组图，相关联系
                delete this.hideGroupMap[groupKey];
            }

            // 显示指定图形组
            addHideGroup(groupKey, id) {
                // 移除显示的组图
                let group = _.remove(this.showGroupList, (sg) => {
                    return sg.key == groupKey;
                });
                // 如果组图存在
                if (!_.isEmpty(group)) {
                    // 需隐藏得组图
                    let hideGroup = group[0];
                    // 组图需隐藏
                    hideGroup.hide();
                    // 将组图，放入隐藏列表
                    this.hideGroupMap[groupKey] = hideGroup;
                }
            }

            // 设置组图，中间点
            setShowGroupCenter() {
                // 获得当层，显示组图个数
                let showGroupList = this.showGroupList;
                let length = showGroupList.length;
                // 存在显示组图
                if (length > 0) {
                    // 获得一个组图对象
                    let first = showGroupList[0];
                    // 获得两个单图，中心点 X 轴距离
                    let part = first.part;
                    // 获得两个单图，空隙距离
                    let space = first.space;
                    // 组图初始渲染个数
                    let renderNum = first.renderNum;
                    // 计算当层，组图间隙个数
                    let sn = length - 1;
                    // 计算当层，显示单图个数
                    let unitCount = _.reduce(showGroupList, function(sum, g) {
                        // 当前组图，显示单图个数
                        let sul = g.showUnitList.length;
                        // 存在过滤条件
                        let unitList = g.condition ? g.matchUnitList : g.hideUnitList;
                        // 当前组图，隐藏单图个数
                        let hul = unitList.length;
                        // 返回当前组图，显示单图个数；如果为首次渲染，则计算渲染个数
                        return sum + (sul === 0 ? (hul > renderNum ? renderNum : hul) : sul);
                    }, 0);
                    // 计算总距离，的一半
                    let total = (unitCount * part + (sn * space)) / 2;
                    // 获得画布，中心点 X 轴
                    let ccpX = this.relation.svg.ccp[0];
                    // 计算当层，左边界的位置
                    let left = ccpX - total;
                    // 计算一个偏移量
                    let v = this.relation.levelSpace / 5 + 5;
                    // 计算当前层数
                    let levelIndex = Math.abs(this.index);

                    // 遍历展示图形组
                    for (let i = 0; i < showGroupList.length; i++) {
                        // 获得当前组图
                        let g = showGroupList[i];
                        // 获得当前组图，显示单图的数量
                        let sul = g.showUnitList.length;
                        // 存在过滤条件
                        let unitList = g.condition ? g.matchUnitList : g.hideUnitList;
                        // 获得当前组图，隐藏单图的数量
                        let hul = unitList.length;
                        // 获得当前组图，实际显示单图数量，考虑首次渲染
                        let rul = sul === 0 ? (hul > renderNum ? renderNum : hul) : sul;
                        // 获得当前分组，显示单图总宽度
                        let width = rul * part;
                        // 如果是 0、-1、1 层；只有一个组；且组图中心点，为画布中心点
                        g.center = levelIndex < 2 ? ccpX : left + parseInt(rul / 2) * part;
                        // 计算组图的中点
                        g.groupCCP = [g.center, this.index > 0 ? this.upY - v : this.downY + v];
                        // 返回下一个组图的左边界
                        left = left + width + space;
                    }
                }
            }

            // 移动图形组
            moveGroup() {
                let showGroupList = this.showGroupList;
                // 对组数据进行排序
                showGroupList.sort(function(a, b) {
                    // 存在关系单图
                    if (a.relUnit && a.relUnit.point && b.relUnit.point) {
                        // 根据关系单图，x轴位置；进行组图排序
                        return a.relUnit.point.ccp[0] - b.relUnit.point.ccp[0];
                    } else {
                        // 按照组图的索引排序
                        return a.index - b.index;
                    }
                });
                // 计算展示组，中间点
                this.setShowGroupCenter();
                // 遍历展示图形组
                for (let i = 0; i < showGroupList.length; i++) {
                    // 对图形组，进行渲染
                    showGroupList[i].render(this.relation, this, i);
                }
                // 如果不为第 0 组
                if (this.index != 0) {
                    // 获得下层对象
                    let showLevel = this.getShowLevel();
                    // 如果存在下层对象
                    if (showLevel) {
                        // 对下层对象，进行组图的连带移动
                        showLevel.moveGroup();
                    }
                }
            }

            // 渲染层数据
            render(relation) {
                // 设置relation 属性
                this.relation = relation;
                // 计算y轴
                this.levelY();
                // 渲染当前所有隐藏图形组
                for (let groupKey in this.hideGroupMap) {
                    // 加入展示图形组
                    this.addShowGroup(groupKey);
                }
                // 移动图形组
                this.moveGroup();
            }

            // 获取展示level
            getShowLevel() {
                // 根据层的索引，返回下层对象
                return this.relation && this.relation.treeObj.levelMap[this.index + (this.index > 0 ? 1 : -1)];
            }

            // 展示与隐藏，与id关联的组图数据
            toggleShowHide(id) {
                let unit = this.relation && this.relation.treeObj.unitMap[id];
                if (unit && unit.hasMore) {
                    if (unit.isOpen) {
                        unit.isOpen = false;
                        this.hide(id);
                    } else {
                        unit.isOpen = true;
                        this.show(id);
                    }
                }
            }

            // 隐藏下层，与id关联的组图数据
            hide(id) {
                // 获得当前层，下层对象
                let showLevel = this.getShowLevel();
                // 如果存在下层对象
                if (showLevel) {
                    // 更换展开--折叠图标
                    d3.select(`#g${id} .has-more-icon`)
                        .attr('xlink:href', '#close-more-icon')
                        .attr('class', 'has-more-icon more-node');
                    // 获得图形组key
                    let groupKey = showLevel.groupKey(id);
                    // 加入展示组
                    showLevel.addHideGroup(groupKey, id);
                    // 移动图形组
                    showLevel.moveGroup();
                }
            }

            // 展示下层，与id关联的组图数据
            show(id) {
                // 获得当前层，下层对象
                let showLevel = this.getShowLevel();
                // 如果存在下层对象
                if (showLevel) {
                    // 设置关系对象
                    showLevel.relation = this.relation;
                    // 如果下层，上行Y 轴为0，则需要对该层Y 轴，进行初始化
                    showLevel.upY === 0 && showLevel.levelY();
                    // 如果下层，存在关联组图
                    if (showLevel.hashGroup(id)) {
                        // 更换展开--折叠图标
                        d3.select(`#g${id} .has-more-icon`)
                            .attr('xlink:href', '#open-more-icon')
                            .attr('class', 'has-more-icon');
                        // 获得图形组key
                        let groupKey = showLevel.groupKey(id);
                        // 加入展示组
                        showLevel.addShowGroup(groupKey, id);
                        // 移动图形组
                        showLevel.moveGroup();
                    }
                }
            }

            // 层视图自动补全
            autoComplete(dataSource, keyword) {
                for (let k in this.hideGroupMap) {
                    let group = this.hideGroupMap[k];
                    group.autoComplete(dataSource, keyword);
                }
                let showGroupList = this.showGroupList;
                for (let i in showGroupList) {
                    let group = showGroupList[i];
                    group.autoComplete(dataSource, keyword);
                }
            }

            // 还原showGroup 到 hideGroupMap
            hideAllGroupMap() {
                let showGroupList = this.showGroupList;
                for (let i in showGroupList) {
                    let sg = showGroupList[i];
                    this.hideGroupMap[sg.key] = sg;
                }
                this.showGroupList = this.getArray();
            }

            // 向层设置条件
            setCondition(condition) {
                // 设置查询条件
                this.condition = condition;
                // 隐藏所有groupMap
                this.hideAllGroupMap();
                // 设置隐藏组图条件
                for (let k in this.hideGroupMap) {
                    let group = this.hideGroupMap[k];
                    group.setCondition(condition);
                }
            }

            // 向层清除条件
            clearCondition() {
                // 清空条件
                this.condition = null;
                // 隐藏所有groupMap
                this.hideAllGroupMap();
                // 清空隐藏组图条件
                for (let k in this.hideGroupMap) {
                    let group = this.hideGroupMap[k];
                    group.clearCondition();
                }
            }

            // 获取展示组图，公司编号
            getCompanyIds(cidList) {
                let showGroupList = this.showGroupList;
                for (let i in showGroupList) {
                    let sg = showGroupList[i];
                    sg.getCompanyIds(cidList);
                }
            }

            clearShellResource() {
                let showGroupList = this.showGroupList;
                for (let i in showGroupList) {
                    let sg = showGroupList[i];
                    sg.clearShellResource();
                }
            }
        },
        // 构建数据树
        Tree: class Tree extends util.core.Base {
            // 层数据
            levelMap = this.getObject();
            // 组数据
            groupMap = this.getObject();
            // 单个数据
            unitMap = this.getObject();
            // 其余关系
            otherPaths = this.getObject();
            // 树值类型
            type = null;

            // 树构造方法
            constructor(rootId, datas, relation, type) {
                super();
                // 设置根节点编号
                this.rootId = rootId,
                // 设置接口数据
                this.datas = datas;
                // 构建引用对象
                this.relation = relation;
                // 解析接口数据
                this.parse(0);
            }

            // 获取人员数据
            getPerson(id) {
                return _.find(this.datas.personMap, (d) => {
                    return d.personId === id;
                });
            }

            // 获取公司数据
            getCompany(id) {
                return _.find(this.datas.companyMap, (d) => {
                    return d.companyId === id;
                });
            }

            // 根据id 查找数据
            getData(id, isPerson) {
                return isPerson ? this.getPerson(id) : this.getCompany(id);
            }

            // 设置单个数据
            putUnitMap(id, relation = this.getObject()) {
                // 是否存在关联数据
                if (!this.unitMap[id]) {
                    // 查询单图数据
                    let data = this.getData(id, relation && relation.isPerson);
                    // 存在数据
                    if (data) {
                        // 对数据进行赋值
                        this.unitMap[id] = new atlas.relation.Unit(id, data, relation);
                    }
                }
            }

            // 设置组数据
            putGroupMap(key, unitList) {
                // 如果不存在分组数据
                if (!this.groupMap[key]) {
                    // 设置组数据
                    this.groupMap[key] = new atlas.relation.Group(key, unitList);
                }
            }

            // 设置层数据
            putLevelMap(index, groupKey) {
                // 获取已有的层对象
                let level = this.levelMap[index];
                // 如果层对象不存在
                if (!level) {
                    // new 一个层对象
                    level = new atlas.relation.Level(index, this.relation);
                }
                // 层对象加入一个组对象
                level.put(groupKey, this.groupMap[groupKey]);
                // 设置层对象
                this.levelMap[index] = level;
            }

            // 改变人员属性
            changePersonRelation(personRelation) {
                // 设置为人员关系
                personRelation.isPerson = true;
                // 设置sourceId 属性
                personRelation.sourceId = personRelation.personId;
                // 删除多余属性
                delete personRelation.personId;
                // 设置targetId 属性
                personRelation.targetId = personRelation.companyId;
                // 删除多余属性
                delete personRelation.companyId;
            }

            // 设置其余链接
            setOtherPath(crList, isSourceId) {
                // 移除关系列表中，存在的关系
                _.remove(crList, (cr) => {
                    // 获取新增节点 编号
                    let id = isSourceId ? cr.sourceId : cr.targetId;
                    // 获取单图对象
                    let m = this.unitMap[id];
                    // 存在单图对象
                    if (m) {
                        // 向其他关系中，放入关系数据
                        this.otherPaths[`${cr.sourceId}-${cr.targetId}`] = cr;
                    }
                    // 存在，则删除该关系
                    return m;
                })
            }

            // 判断是否能两个单图对象，都已绘制
            canGraphPath(path) {
                return path && this.unitMap[path.sourceId].isShow && this.unitMap[path.targetId].isShow;
            }

            // 获得绘制图形列表
            getGraphPathList() {
                // 需要绘制的关系
                let graphPath = this.getArray();
                // 遍历现有关系
                _.each(this.otherPaths, (path, k) => {
                    // 如果连接，两个单图；同时存在
                    if (this.canGraphPath(path)) {
                        // 可以绘制列表
                        graphPath.push(path);
                    }
                });
                // 返回绘制数组
                return graphPath;
            }

            // 绘制链接，函数
            graphOtherPathFunc(d) {
                // 获取开始单图
                let source = this.unitMap[d.sourceId];
                // 获取目标单图
                let target = this.unitMap[d.targetId];

                let path = new util.svg.Path();

                path.point(source.point.ccp);
                path.point(target.point.ccp);

                return path.line();
            }

            // 绘制其余连线
            graphOtherPath() {
                // 获得绘制列表
                let graphPath = this.getGraphPathList();
                // 进行相关绘制
                // 获取组class名称
                let cls = 'other-path';
                let globalG = this.relation.svg.globalG;

                let update = globalG.selectAll('.' + cls)
                    .data(graphPath);

                // 更新关系路径
                update.attr('d', this.graphOtherPathFunc);

                // 绘制关系路径
                update.enter().append('path')
                    .attr('class', cls)
                    .attr("marker-end", `url(#${this.relation.svg.id}-default)`)
                    .attr('d', this.graphOtherPathFunc);

                // 删除多余关系路径
                update.exit().remove();
            }

            // 获得上层所有实体
            getUp(id) {
                // 遍历公司上层对象
                let crList = _.remove(this.datas.companyRelationMap, (cr) => {
                    // 目标id 与 查询对象一致
                    return cr && cr.targetId === id;
                });
                // 遍历有关系的人员关系
                _.remove(this.datas.personRelationMap, (pr) => {
                    // 人员关系公司id 是否为目标id
                    let m = pr.companyId === id;
                    // 如果匹配成功
                    if (m) {
                        // 改变人员关系属性
                        this.changePersonRelation(pr);
                        // 将数据放入关系列表
                        crList.push(pr);
                    }
                    // 是否删除该关系
                    return m;
                });
                // 设置其余链接
                this.setOtherPath(crList, true);
                // 返回关系列表
                return crList;
            }

            // 存在更多
            hasMore(id, type) {
                // 根据id，查询单图对象
                if (this.unitMap[id]) {
                    // 获取单图对象
                    let unit = this.unitMap[id];
                    // 设置有关联属性
                    unit.hasMore = true;
                    // 设置有关联类型
                    unit.hasType = type;
                }
            }

            // 向上追溯
            up(id, index) {
                let _this = this;
                // 查询公司关系
                let crList = this.getUp(id);
                // 如果存在相应的关系
                if (!_.isEmpty(crList)) {
                    // 存在上级数据
                    this.hasMore(id, 'up');
                    // 构建单个数组
                    let unitList = _.map(crList, (cr) => {
                        // 获取上层单个id
                        let id = cr.sourceId;
                        // 设置单个对象
                        this.putUnitMap(id, cr);
                        // 返回单个对象
                        return this.unitMap[id];
                    });
                    // 分组key
                    let groupKey = `${id}-up`;
                    // 设置组数据
                    this.putGroupMap(groupKey, unitList);
                    // 构建层数据
                    this.putLevelMap(index, groupKey);

                    _.each(crList, (cr) => {
                        // 获取上层单个id
                        let id = cr.sourceId;
                        this.frame(this.up, id, index - 1);
                    });
                }
            }

            current(id, index) {
                // 添加单个数据
                this.putUnitMap(this.rootId);
                // 设置组数据
                this.putGroupMap(id, [this.unitMap[id]]);
                // 构建层数据
                this.putLevelMap(index, id);
            }

            // 解析数据并构建树
            parse(index) {
                // 添加当层数据
                this.current(this.rootId, index);
                // 向上追溯
                _.includes('core,shareholder', this.relation.type) && this.up(this.rootId, index - 1);
                // 向下追溯
                _.includes('core,investment', this.relation.type) && this.down(this.rootId, index + 1);
            }

            // 向下追溯
            down(id, index) {
                let _this = this;
                // 查询公司关系
                let crList = _.remove(this.datas.companyRelationMap, (cr) => {
                    // 目标id 与 查询对象一致
                    return cr.sourceId === id;
                });
                // 设置其余链接
                this.setOtherPath(crList);
                // 如果存在相应的关系
                if (!_.isEmpty(crList)) {

                    // 存在上级数据
                    this.hasMore(id, 'down');

                    // 构建单个数组
                    let unitList = _.map(crList, (cr) => {
                        // 获取上层单个id
                        let id = cr.targetId;
                        // 设置单个对象
                        this.putUnitMap(id, cr);
                        // 返回单个对象
                        return this.unitMap[id];
                    });
                    // 分组key
                    let groupKey = `${id}-down`;
                    // 设置组数据
                    this.putGroupMap(groupKey, unitList);
                    // 构建层数据
                    this.putLevelMap(index, groupKey);

                    // 继续遍历子节点
                    _.each(crList, (cr) => {
                        // 获取上层单个id
                        let id = cr.targetId;
                        this.frame(this.down, id, index + 1);
                    });
                }
            }

            // 进行树渲染
            render(relation) {
                // 设置画布对象
                this.relation = relation;
                // 渲染中间层
                this.levelMap[0].render(relation);
                // 渲染目标上层
                _.includes('core,shareholder', this.relation.type) && this.levelMap[-1].render(relation);
                // 渲染目标下层
                _.includes('core,investment', this.relation.type) && this.levelMap[1].render(relation);
            }
        },
        // 关系图对象
        Relation: class Relation extends util.core.Base {
            // 行间距
            levelSpace = 200;
            // 层级map
            levelMap = this.getObject();

            // 关系图谱相关css
            getCss() {
                let cls = `.${this.svg.className}`;
                return `
                ${cls} {
                    background: #fff;
                }
                ${cls} marker {
                    fill: #51aea4;
                }
                ${cls} #close-more-icon,
                ${cls} #open-more-icon {
                    fill: #89cff8;
                }
                ${cls} .global-g {
                    pointer-events: none;
                }
                ${cls} .global-g g {
                    pointer-events: visiblePainted;
                }
                ${cls} .global-g rect {
                    fill: #eaeaea
                }
                ${cls} .global-g text {
                    font-size: 11px;
                    fill: #333;
                }
                ${cls} .global-g path {
                    stroke: #b8b8b8;
                }
                ${cls} .global-g .add-btn {
                    cursor:pointer;
                    fill: #6ac3f7;
                }
                ${cls} .global-g .percent text {
                    fill: #51aea4;
                }
                ${cls} .global-g .percent-bg {
                    fill: #fff;
                }
                ${cls} .global-g .item rect {
                    fill: #f0f9fe;
                    stroke: #89cff8;
                }
                ${cls} .global-g .user-icon {
                    fill: #777;
                }
                ${cls} .global-g .user-name {
                    text-anchor: middle;
                }
                ${cls} .global-g .percent {
                    text-anchor: middle;
                }
                ${cls} .global-g path.be-invested,
                ${cls} .global-g path.natural-invest {
                    stroke: #51aea4;
                }
                ${cls} .global-g .be-invested text,
                ${cls} .global-g .natural-invest text {
                    fill: #51aea4;
                }
                ${cls} .global-g path.invest {
                    stroke: #fea13d;
                }
                ${cls} .global-g .invest text {
                    fill: #fea13d;
                }
                ${cls} .global-g path.subsidiary {
                    stroke: #a880bd;
                }
                ${cls} .global-g .subsidiary text {
                    fill: #a880bd;
                }
                ${cls} .global-g .position-item rect {
                    stroke: #ea4e5b;
                }
                ${cls} .global-g .position-item text {
                    fill: #ea4e5b;
                }
                ${cls} .global-g .root-item rect {
                    fill: #ea4e5b;
                    stroke: #ea4e5b;
                }
                ${cls} .global-g .root-item text {
                    fill: #fff;
                }
                ${cls} .global-g .shell-atlas-relation rect {
                    fill: #ea4e5b;
                    stroke: none;
                }
                ${cls} .global-g .shell-atlas-relation text {
                    fill: #fff;
                    font-size: 11px;
                    font-weight: bold;
                }
            `;
            }

            // renderType 【 投资：1, 子公司：2, 被公司投资：3, 自然人投资：3, 自然人高管：4 】
            // 'invest', 'subsidiary', 'be-invested', 'natural-invest', 'natural-manager'

            // 关系图的构造方法
            constructor(options) {
                super();
                // 扩展参数属性
                Object.assign(this, options);
                // 清理svg对象
                this.svg.clear();
                // 为svg 增加样式
                this.svg.appendCss(this.getCss());
                // 存在树形数据
                if (this.tree) {
                    // 构建树形对象
                    this.treeObj = new atlas.relation.Tree(this.rootId, this.tree && (this.tree.data || this.tree), this);
                    // 删除重复数据
                    delete this.tree;
                }
            }

            // 根据id 获取节点数据
            getNode(nodeId) {
                return this.treeObj && this.treeObj.unitMap[nodeId];
            }

            // 渲染关系图
            render() {
                let _this = this;
                // 设置根节点的宽度
                let node = this.getNode(this.rootId);
                if (node) {
                    // 图谱根节点
                    node.rootNode();
                    // 让树进行渲染
                    this.treeObj.render(this);
                } else {
                    // 图谱不存在
                    this.notExsistData();
                }
            }

            // 数据不存在
            notExsistData() {
                let operSvg = new util.svg.OperSVG(this.svg);
                operSvg.image({
                    'xlink:href': 'img/new-ui/blank8.png',
                    x: this.svg.ccp[0] - 68,
                    y: this.svg.ccp[1] - 80,
                    width: 137,
                    height: 127
                });
                operSvg.text({
                    text: '暂无关系图谱',
                    x: this.svg.ccp[0] - 48,
                    y: this.svg.ccp[1] + 60,
                    style: {
                        'font-size': '14px'
                    }
                })
            }

            // 获取当前关系图，宽高
            getWidthHeight() {
                // 定义关系图谱，上下左右
                let param = {
                    left: 0,
                    right: 0,
                    up: 0,
                    down: 0
                };
                // 获取关系图谱，层数据
                let levelMap = this.treeObj.levelMap;
                // 遍历关系图谱层数据
                for (let k in levelMap) {
                    // 获取单层数据
                    let level = levelMap[k];
                    // 设置当前层，上下左右，数据
                    level.getWidthHeight(param);
                }
                // 返回当前数据
                return param;
            }

            // 根据层级，返回层级列表
            getLevelList(level) {
                let ret = this.getArray();
                let map = this.treeObj.levelMap;
                // 遍历需要的层级
                for (let i = 1; i <= level; i++) {
                    _.includes('core,investment', this.type) && ret.push(map[i]);
                    _.includes('core,shareholder', this.type) && ret.push(map[-1 * i]);
                }
                return ret;
            }

            // 自动补全
            autoComplete(level, keyword) {
                // 定义展示结果
                let ret = this.getArray();
                ;
                // 获取层列表
                let levelList = this.getLevelList(level);
                // 遍历需要的层级
                for (let i in levelList) {
                    levelList[i] && levelList[i].autoComplete(ret, keyword);
                }
                // 返回补全数组
                return ret;
            }

            // 定位点
            positionNode = null;

            // 移动到对应位置
            transition(endNodeId) {
                // 获取开始节点
                let start = this.positionNode && this.positionNode.id != endNodeId ? this.positionNode : this.getNode(this.rootId);
                // 获取结束节点
                let end = this.getNode(endNodeId);
                // 展示隐藏得节点
                this.showNode(endNodeId);
                // 移动到结束节点
                this.svg.transition(start, end);
                // 赋值为开始节点
                this.positionNode = end;
            }

            // 移除定位效果
            removeTransition(nodeId) {
                // 移除定位，为当前节点
                if (this.positionNode && this.positionNode.id == nodeId) {
                    // 移动到中间节点
                    this.transition(this.rootId);
                }
            }

            // 构建展示堆栈
            showNodeStack(stack, nodeId) {
                // 获取节点对象
                let node = this.getNode(nodeId);
                // 如果节点存在
                if (node) {
                    // 如果节点已经，可见
                    if (!node.isShow) {
                        // 执行操作
                        stack.push({
                            oper: 'showNode',
                            node: node
                        });
                        // 获取节点组信息
                        let group = node.group;
                        // 查看组显示，节点数
                        let showSize = _.size(group.showUnitList);
                        // 不存在显示的节点，则组图数据为非显示
                        if (showSize < 1) {
                            // 获取引用节点
                            let key = group.key;
                            // 获取组图，引用节点编号
                            let gid = key.split('-')[0];
                            // 执行操作
                            stack.push({
                                oper: 'showGroup',
                                refId: gid,
                                group: this.getNode(gid).group
                            });
                            // 继续查找节点数据
                            this.showNodeStack(stack, gid);
                        }
                    }
                }
            }

            // 执行节点堆栈
            excuteNodeStack(stack) {
                // 获取堆栈每个操作
                for (let i = stack.length - 1; i >= 0; i--) {
                    // 获取单个堆栈，操作
                    let os = stack[i];
                    // 如果是展示组图，操作
                    if (os.oper === 'showGroup') {
                        // 展示隐藏节点
                        os.group.level.toggleShowHide(os.refId);
                    // 如果是展示节点操作
                    } else if (os.oper === 'showNode') {
                        // 展示节点
                        os.node.group.showNode(os.node);
                    }
                }
            }

            // 展示隐藏得节点
            showNode(nodeId) {
                // 定义堆栈容器
                let stack = this.getArray();
                // 构建显示堆栈容器
                this.showNodeStack(stack, nodeId);
                // 执行堆栈操作
                this.excuteNodeStack(stack);
            }

            // 展示指定层级节点
            showLevelNode() {
                // 获取当前图谱条件
                let c = this.condition;
                // 获取层级 
                let level = c && c.level ? c.level[0] : 1;
                // 渲染条件数据
                this.render();

                // 构造操作类
                let operSvg = new util.svg.OperSVG(this.svg);
                // 进行一次 "加载更多"
                operSvg.click('.add-btn');

                let time = 55;
                // 存在多层，全部展开
                for (let i = 1; i < level; i++) {
                    time = time * i;
                    setTimeout(function() {
                        // 执行多次，展开下层节点
                        operSvg.click('.more-node');
                    }, time * i);
                }
            }

            // 向图谱设置条件
            setCondition() {
                // 获取当前图谱条件
                let c = this.condition;
                // 获取层列表
                let levelList = _.values(this.treeObj.levelMap);
                // 删除0 节点
                levelList.shift();
                // 遍历需要的层级
                for (let i in levelList) {
                    levelList[i] && levelList[i].setCondition(c);
                }
            }

            // 过滤筛选条件
            showConditionNode(condition) {
                // 设置查询条件
                this.condition = condition;
                // 向图谱设置条件
                this.setCondition();
                // 展示指定层节点
                this.showLevelNode();
            }

            // 清除筛选条件
            showClearConditionNode() {
                // 设置关系图谱条件
                this.condition = null;
                // 获取层级数据
                let levelMap = this.treeObj.levelMap;
                // 遍历所有层级map
                for (let key in levelMap) {
                    if (key != 0) {
                        // 获得层级对象
                        let level = levelMap[key];
                        // 层级清空对象
                        level.clearCondition();
                    }
                }
                // 渲染画面
                this.render();
            }

            // 获取下一层
            nextLevel(level) {
                // 获取下层的索引
                let index = level.index + 1;
                // 如果当前索引为 0
                if (level.index === 0) {
                    // 如果图谱类型为股东
                    if (this.type == 'shareholder') {
                        // 下标为 上层
                        index = level.index - 1;
                    } else if (this.type == 'investment') {
                        index = level.index + 1;
                    }
                // 如果当前索引 小于 0
                } else if (level.index > 0) {
                    // 下标为 上层
                    index = level.index - 1;
                }
                // 根据下标，获取层对象
                return this.treeObj.levelMap[index];
            }

            // 获取展示节点 companyId
            getCompanyIds() {
                // 获取层列表
                let levelList = _.values(this.treeObj.levelMap);
                // 删除0 节点
                levelList.shift();
                // 存储companyId 列表
                let cidList = this.getArray();
                // 遍历需要的层级
                for (let i in levelList) {
                    levelList[i] && levelList[i].getCompanyIds(cidList);
                }
                // 返回公司id 字符串
                return cidList.join(',');
            }

            // 设置壳资源
            setCompnayShellResource(shells) {
                // 默认状态，没有加载壳资源
                let addShells = false;
                // 遍历壳资源列表
                _.each(shells, (s) => {
                    let cid = s.companyId;
                    let node = this.getNode(cid);
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

            // 清理壳资源
            clearShellResource() {
                // 获取层列表
                let levelList = _.values(this.treeObj.levelMap);
                // 删除0 节点
                levelList.shift();
                // 遍历需要的层级
                for (let i in levelList) {
                    levelList[i] && levelList[i].clearShellResource();
                }
            }
        }
    }
});
