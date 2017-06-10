import React from 'react';

export default class SvgIcon extends Component {

    // 组件名称
    name = 'svgIcon';

    // 是否加载样式，标准key
    loadCssKey = 'svg-icon-css-loaded';

    // 需要加载的css 内容
    css = `
        .svg-icon {
            cursor: pointer;
            float: left;
        }
        .svg-icon svg {
            width: 32px;
            height: 32px;
            padding: 5px;
        }
        .svg-icon path {
            fill: #939393;
        }
        .svg-icon-active path,
        .svg-icon path:hover {
            fill: #3d77c7;
        }
    `;

    // 选中svg，并去除其他的svg选中
    selectedSvgIcon() {
        // 获取svg对象
        let svg = this.select('svg');
        // 获取svg class 属性
        let cls = svg.attr('class');
        // 根据样式，遍历其余；相同class svg元素
        $(`.${cls.split(' ')[0]}`).each(function() {
            // 使其父容器，删除svg-icon-active 样式
            $(this).parent().removeClass('svg-icon-active');
        });
        // 使当前dom添加被点击样式
        svg.parent().addClass('svg-icon-active');
        // 回调属性方法, 并返回当前key
        _.isFunction(this.props.onChange) && this.props.onChange(this.props.iconKey);
    }

    componentWillMount() {
        // 加载组件css，只加载一次
        util.core.appendComponentCss(this.loadCssKey, this.css);
    }

    // dom 已经加载到页面
    componentDidMount() {
        // 查询path dom 元素
        let sel = this.select('svg path');
        // 遍历所有的 path 元素
        sel.each(function() {
            // 获取path s属性
            let s = $(this).attr('s');
            // 将path 缩放比例，设置指定参数
            $(this).attr('transform', `scale(${s || 0.02})`);
        });
    }

    // 渲染svg icon
    render() {
        // 将元素渲染到页面
        return (<div
                     id={ this.id }
                     className="svg-icon"
                     title={ this.props.title }
                     dangerouslySetInnerHTML={ { __html: this.props.children } }
                     onClick={ this.selectedSvgIcon }></div>);
    }
}
