const _pathListWeakMap = new WeakMap();

// 扩展 _ d3 工具方法
Object.assign(window.util = window.util || {}, {
    // svg 相关扩展
    svg: {
        // 路径工具类
        Path: class Path {

            // 路径构造方法
            constructor(d) {
                // 设置路径结构
                _pathListWeakMap.set(this, []);
                // 获得路径 d 属性
                if (_.isString(d)) {
                    // 获取路径点
                    let ps = d.split(/[^-0-9]/);
                    let list = _pathListWeakMap.get(this);
                    // 变量路径点
                    for (let i = 1; i < ps.length; i = i + 2) {
                        // 存储路径点
                        list.push([parseInt(ps[i]), parseInt(ps[i + 1])]);
                    }
                }
            }

            // 向路径中加入一个点
            point(p) {
                // 如果点是数组类型，则加入路径数组
                if (_.isArray(p)) {
                    _pathListWeakMap.get(this).push(_.clone(p));
                }
                // 返回路径对象
                return this;
            }

            // 正序查询点对象
            index(i) {
                return _pathListWeakMap.get(this)[i || 0];
            }

            // 获取最后一个对象
            last(index) {
                let list = _pathListWeakMap.get(this);
                // 获取指定，倒数多少个点
                return list[list.length - (index || 1)];
            }

            // 对最后一个点进行复制
            copy() {
                // 克隆最后一个对象，并放入数组
                _pathListWeakMap.get(this).push(_.clone(this.last()));
                // 返回路径对象
                return this;
            }

            // 对最后一个点平移Y轴
            moveY(offset) {
                // 获得路径，最后点
                let last = this.last();
                // 移动最后点 Y 轴
                last[1] = last[1] + offset;
                // 返回路径对象
                return this;
            }

            // 对最后一个点平移X轴
            moveX(offset) {
                // 获得路径，最后点
                let last = this.last();
                // 移动最后点 Y 轴
                last[0] = last[0] + offset;
                // 返回路径对象
                return this;
            }

            // 与上个点 X 轴相同
            sameX() {
                // 获取最后 一个点
                let l = this.last(1);
                // 获得倒数第二个点
                let ls = this.last(2);
                // 使最后一个点的 x 与 倒数第二个点相同
                l[0] = ls[0];
                // 返回路径对象
                return this;
            }

            // 与上个点 Y 轴相同
            sameY() {
                // 获取最后 一个点
                let l = this.last(1);
                // 获得倒数第二个点
                let ls = this.last(2);
                // 使最后一个点的 Y 与 倒数第二个点相同
                l[1] = ls[1];
                // 返回路径对象
                return this;
            }

            // 根据点数组画线
            line() {
                // 绘制关系路径
                return d3.svg.line()(_pathListWeakMap.get(this));
            }
        },
        // 画布相关类
        SVG: class SVG {

            // svg 构造方法
            constructor(select, className) {
                // 放置svg的容器
                this.select = select;
                // svg class 名称
                this.className = className || 'relation-svg';
                // 设置画布属性
                this.svgAttr();
                // 生成svg对象
                this.buildSVG();
            }

            // 构建画布相关属性
            svgAttr() {
                // 获取图像宽度
                this.width = $(this.select).width();
                // 获取图像高度
                this.height = $(this.select).height();
                // 画布中心点
                this.ccp = [parseInt(this.width / 2), parseInt(this.height / 2)];
            }

            // 构建svg对象
            buildSVG() {
                // 获得容器，并生成svg对象
                this.svg = d3.select(this.select).append('svg');
                // 对象id 属性
                this.id = `svg-${util.core.uuid()}`;
                // 设置svg 相关属性
                this.svg.attr({
                    'style': "position:absolute;top:0;right:0;left:0;bottom:0;width:100%;height:100%",
                    'class': this.className,
                    'id': this.id
                });
                // 构建全局 g
                this.buildGlobalG();
            // 构建defs对象
            // this.buildDefs();
            }

            // 添加样式
            appendCss(css) {
                // 向svg 中添加样式
                this.defs.append('style').html(css);
            }

            // 追加defs 元素
            getDefs() {
                if (!this.defs) {
                    // 向svg对象，放置defs
                    this.defs = this.svg.append('svg:defs');
                }
                return this.defs;
            }

            // 构建defs
            buildDefs() {
                // 向svg对象，放置defs
                this.defs = this.svg.append('svg:defs');
                // 添加箭头元素
                this.marker({
                    'default': '#b8b8b8',
                    'natural-invest': '#51aea4',
                    'be-invested': '#51aea4',
                    'invest': '#fea13d',
                    'subsidiary': '#a880bd'
                });
                // 添加人头像
                this.userIcon();
                // 构建更多图标
                this.hasMoreIcon();
            }

            // 构建全局g
            buildGlobalG() {
                // 向画布添加全局g
                this.globalG = this.svg.append('g');
                // 为 g 添加
                this.globalG.attr('class', 'global-g');
                // 使画布具备，拖拽、放大缩小能力
                this.svg.call(this.zoomSVG());
            }

            // 忽略位置
            _ignoreZoom = false;

            // 忽略位移
            ignoreZoom() {
                this._ignoreZoom = true;
            }

            // 开始位移
            startZoom() {
                this._ignoreZoom = false;
            }

            // 缩放、平移画布
            zoomSVG() {
                // 兼容d3 3.x 与 4.x版本
                let z = d3.behavior ? d3.behavior.zoom() : d3.zoom();
                // 对svg图像进行放大缩小，及平移
                return z.scaleExtent([0.1, 3]).on("zoom", () => {
                    // 进行拖动处理
                    let trans = d3.event.translate;
                    // 进行缩放处理
                    let scale = d3.event.scale;
                    // 放入下一帧执行
                    window.requestAnimationFrame(() => {
                        // 对图像进行放大、缩小、平移操作
                        !this._ignoreZoom && this.globalG.attr("transform", `translate(${trans})scale(${scale})`);
                    });
                });
            }

            // 关系图，从开始点移动到结束点
            transition(start, end, selectEnd) {
                let _this = this;
                let sps = util.core.concat(start.point.ccp, start.height);
                let eps = util.core.concat(end.point.ccp, end.height);
                var i = d3.interpolateZoom(sps, eps);
                // 全局图设置位移效果
                this.globalG
                    .attr("transform", this.transform(sps))
                    .transition()
                    .delay(70)
                    .duration(i.duration / 3)
                    .attrTween("transform", function() {
                        return function(t) {
                            return _this.transform(i(t));
                        };
                    })
                    .each("end", function() {
                        // 设置节点，定位属性
                        _this.positionItem(end, selectEnd);
                    });
            }

            // 计算移动，及放大数据
            transform(p) {
                var k = this.height / p[2] / 12;
                return "translate(" + (this.ccp[0] - p[0] * k) + "," + (this.ccp[1] - p[1] * k) + ")scale(" + k + ")";
            }

            // 展示定位节点样式
            positionItem(node, selectEnd) {
                // 去除已有选中节点
                d3.selectAll('.global-g .position-item').each(function() {
                    let es = d3.select(this);
                    let cls = es.attr('class');
                    es.attr('class', cls.replace('position-item', ''));
                });
                if (_.isFunction(selectEnd)) {
                    selectEnd(node);
                } else {
                    // 设置新的定位节点
                    let es = d3.select(`#g${node.id}`);
                    let cls = es.attr('class');
                    es.attr('class', cls + ' position-item');
                }
            }

            // 构建箭头对象
            marker(map, refX, refY) {
                let _this = this;
                // 构建多个箭头对象
                if (_.isObject(map)) {
                    // 获得箭头key数组
                    let cls = _.keys(map);
                    // 向defs中放入多个箭头
                    this.defs.selectAll('marker')
                        .data(cls)
                        .enter().append("svg:marker") // This section adds in the arrows
                        .attr("id", function(d) {
                            return `${_this.id}-${d}`;
                        })
                        .attr("viewBox", "0 -5 10 10")
                        .attr("refX", refX || 8)
                        .attr("refY", refY || 0)
                        .attr("markerWidth", 9)
                        .attr("markerHeight", 9)
                        .attr("orient", "auto")
                        .append("svg:path")
                        .attr("d", "M0,-5L10,0L0,5")
                        .attr('fill', (d) => {
                            // 箭头填充，指定颜色
                            return map[d];
                        });
                }
                // 返回svg对象
                return this;
            }

            // 构建人头像
            userIcon(scale) {
                // 增加人头像数据
                this.defs.append('path')
                    .attr('id', 'user-icon')
                    .attr('d', "M941.071 952.955l-235.216-96.953-42.642-62.082-24.24-8.724-7.753-27.153c0 0 69.778-74.678 75.61-146.438 90.146-78.546 54.269-186.19 23.267-159.055 8.705-96.974 7.753-163.891-7.753-193.945-15.51-29.099-38.777-60.119-80.448-67.873 0.972-14.54 0.972-95.049-189.003-61.11-189.974 32.987-219.055 196.86-157.986 343.299-104.687-34.909-6.782 153.244 21.322 147.411 14.54 52.363 37.805 113.453 83.364 149.335-1.946 20.37 0.972 24.24 0.972 24.24l-36.832 11.644-14.54 54.306-261.004 94.514 852.896-1.406z")
                    .attr('transform', `scale(${scale || 0.018})`);
            }

            // 构建更多图标
            hasMoreIcon() {
                // 折叠上层节点数据
                this.defs.append('path')
                    .attr('id', 'close-more-icon')
                    .attr('d', "M512 1024c-282.752 0-512-229.248-512-512s229.248-512 512-512 512 229.248 512 512S794.752 1024 512 1024zM512 128C299.968 128 128 299.968 128 512s171.968 384 384 384 384-171.968 384-384S724.032 128 512 128zM704 576 576 576l0 128c0 35.392-28.608 64-64 64-35.328 0-64-28.608-64-64L448 576 320 576C284.672 576 256 547.392 256 512c0-35.328 28.672-64 64-64l128 0L448 320c0-35.328 28.672-64 64-64 35.392 0 64 28.672 64 64l0 128 128 0c35.392 0 64 28.672 64 64C768 547.392 739.392 576 704 576z")
                    .attr('transform', "scale(0.01)");

                // 展开上层节点数据
                let g = this.defs.append('g')
                    .attr('id', 'open-more-icon')
                    .attr('transform', 'scale(0.01)');

                g.append('path')
                    .attr('d', "M512 0C229.184 0 0 229.184 0 512c0 282.752 229.184 512 512 512s512-229.248 512-512C1024 229.184 794.816 0 512 0zM512 896c-212.096 0-384-171.904-384-384s171.904-384 384-384 384 171.904 384 384S724.096 896 512 896z");
                g.append('path')
                    .attr('d', "M512 576l192 0c35.392 0 64-28.672 64-64s-28.608-64-64-64L512 448 320 448C284.672 448 256 476.672 256 512s28.672 64 64 64L512 576z");
            }

            // 封装一个灯光滤镜
            filterLighting(x, y, z) {
                let id = `filter-${util.core.uuid()}`;
                this.defs.append('filter').attr({
                    id: id
                }).html(`
                    <feDiffuseLighting in="SourceGraphic" result="light" lighting-color="white">
                      <fePointLight x="${x - 20}" y="${y - 20}" z="${z || 20}" />
                    </feDiffuseLighting>

                    <feComposite in="SourceGraphic" in2="light"
                                 operator="arithmetic" k1="1" k2="0" k3="0" k4="0"/>`);
                return id;
            }

            clear() {
                this.globalG.html('');
            }
        },
        // svg操作类
        OperSVG: class OperSVG {

            updateAttr =['x', 'y', 'dx', 'dy', 'd'];

            // svg操作类，构造方法
            constructor(svg) {
                this.svg = svg;
            }

            // 相关点击操作
            click(select) {
                // 查询相关元素
                this.svg.globalG.selectAll(select).each(function(d, i) {
                    // 当前选择器
                    let _this = this;
                    // 放入下一帧执行
                    window.requestAnimationFrame(() => {
                        // 构建点击事件
                        var onClickFunc = d3.select(_this).on("click");
                        // 如果点击事件不存在
                        if (!onClickFunc) {
                            // 尝试获取父节点点击事件
                            var p = d3.select(_this.parentNode);
                            onClickFunc = p && p.on('click');
                        }
                        // 调用点击事件，并传递参数
                        onClickFunc && onClickFunc.apply(_this, [d, i]);
                    });
                });
                // 返回操作对象本身
                return this;
            }

            // 数据集相关处理
            dataSet(data, tag, cls) {
                // 如果数据不存在
                if (!data) {
                    return;
                }
                let dd = data;
                if (!_.isArray(data)) {
                    dd = [data];
                }
                // 获取数据集
                let update = this.svg.globalG.selectAll(cls || tag || 'g').data(dd);
                // 设置数据集
                update.each(function(d) {
                    let _this = d3.select(this);
                    for (let k in d) {
                        if (_.includes(this.updateAttr, k)) {
                            let v = d[k];
                            _this.attr(k, v);
                        }
                    }
                });

                // 创建图片节点
                update.enter().append(tag).each(function(d) {
                    let _this = d3.select(this);
                    if (cls) {
                        _this.attr('class', cls);
                    }

                    for (let k in d) {
                        let v = d[k];
                        if (k === 'text') {
                            // 设置文本属性
                            _this.text(v);
                        } else if (k === 'style') {
                            for (let kk in v) {
                                let vv = v[kk];
                                _this.style(kk, vv);
                            }
                        } else {
                            // 设置其余属性
                            _this.attr(k, v);
                        }
                    }
                });
                // 删除多余节点
                update.exit().remove();
            }

            // 构建图片svg
            image(data, cls) {
                // 构建数据集
                this.dataSet(data, 'image', cls);
            }

            text(data, cls) {
                // 构建数据集
                this.dataSet(data, 'text', cls);
            }
        },
        // svg操作类
        DrawGraph: class DrawGraph {
            // 画图的构造方法
            constructor(cls, svg, datas, location, graph, ligature) {
                this.cls = cls;
                this.svg = svg;
                this.datas = datas;
                this.location = location;
                this.ligature = ligature,
                this.graph = graph;
                // 向数据添加位置信息
                this.parse();
            }

            // 设置位置信息
            parse() {
                // 向当前数据，设置位置信息
                this.location(this.datas);
                // 获得数据后，画图
                this.drawGraph();
                // 存在连线信息
                if (this.ligature) {
                    // 计算连线信息
                    this.ligatureList = this.ligature(this.datas);
                    // 获得数据后，画线
                    this.drawLigature();
                }
            }

            // 解析数据
            drawGraph() {
                // 当前对象别名
                let _this = this;
                // 获取图画数据
                let dd = this.datas;
                // 如果不是
                if (!_.isArray(dd)) {
                    dd = [dd];
                }
                // 获取数据集
                let update = this.svg.globalG
                    .selectAll(`.graph-${this.cls}`)
                    .data(dd);
                // 设置数据集
                update.each(function(d) {
                    if (!d.change) {
                        return;
                    }
                    d.change = false;
                    // 获取元素选择器
                    let sel = d3.select(this);
                    // 存在图形更新方法
                    if (_this.graph.update) {
                        window.requestAnimationFrame(() => {
                            // 对图形进行更新
                            _this.graph.update(sel, d);
                        });
                    // 不存在更新方法
                    } else {
                        // 默认修改图形，位移
                        sel.attr('x', d.loc.x)
                            .attr('y', d.loc.y);
                    }
                });

                // 创建图片节点
                update
                    .enter()
                    .append('g').attr('class', `graph-${this.cls}`)
                    .each(function(d) {
                        window.requestAnimationFrame(() => {
                            // 绘制图形对象
                            _this.graph.draw(d3.select(this), d);
                        });
                    });

                // 删除多余节点
                update.exit().remove();
            }

            // 解析数据
            drawLigature() {
                // 当前对象别名
                let _this = this;
                // 获取数据集
                let update = this.svg.globalG
                    .selectAll(`ligature-${this.cls}`)
                    .data(this.ligatureList);
                // 设置数据集
                update.each(function(d) {
                    // 获取元素选择器
                    let sel = d3.select(this);
                    // 存在图形更新方法
                    if (_this.graph.update) {
                        // 对图形进行更新
                        _this.graph.update(sel, d);
                    // 不存在更新方法
                    } else {
                        // 默认修改图形，位移
                        sel.attr('x', d.loc.x)
                            .attr('y', d.loc.y);
                    }
                });

                // 创建图片节点
                update
                    .enter()
                    .append('g').attr('class', `ligature-${this.cls}`)
                    .each(function(d) {
                        // 绘制图形对象
                        _this.graph.draw(d3.select(this), d);
                    });

                // 删除多余节点
                update.exit().remove();
            }

            // 修改数据
            update(datas) {
                // 对数据重新赋值
                this.datas = datas;
                // 重新解析数据
                this.parse();
            }
        }
    }
});
