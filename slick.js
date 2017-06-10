import React from 'react';
import Slider from 'react-slick';

// demo 地址： http://neostack.com/opensource/react-slick
export default class ReactSlick extends Component {

    name = "slickComponent";

    // 是否加载样式，标准key
    loadCssKey = 'ds-slider-css-loaded';

    css = `
		.slick-slider
		{
		    position: relative;

		    display: block;
		    box-sizing: border-box;

		    -webkit-user-select: none;
		       -moz-user-select: none;
		        -ms-user-select: none;
		            user-select: none;

		    -webkit-touch-callout: none;
		    -khtml-user-select: none;
		    -ms-touch-action: pan-y;
		        touch-action: pan-y;
		    -webkit-tap-highlight-color: transparent;
		}

		.slick-list
		{
		    position: relative;

		    display: block;
		    overflow: hidden;

		    margin: 0;
		    padding: 0;
		}
		.slick-list:focus
		{
		    outline: none;
		}
		.slick-list.dragging
		{
		    cursor: pointer;
		    cursor: hand;
		}

		.slick-slider .slick-track,
		.slick-slider .slick-list
		{
		    -webkit-transform: translate3d(0, 0, 0);
		       -moz-transform: translate3d(0, 0, 0);
		        -ms-transform: translate3d(0, 0, 0);
		         -o-transform: translate3d(0, 0, 0);
		            transform: translate3d(0, 0, 0);
		}

		.slick-track
		{
		    position: relative;
		    top: 0;
		    left: 0;

		    display: block;
		}
		.slick-track:before,
		.slick-track:after
		{
		    display: table;

		    content: '';
		}
		.slick-track:after
		{
		    clear: both;
		}
		.slick-loading .slick-track
		{
		    visibility: hidden;
		}

		.slick-slide
		{
		    display: none;
		    float: left;

		    height: 100%;
		    min-height: 1px;
		}
		[dir='rtl'] .slick-slide
		{
		    float: right;
		}
		.slick-slide img
		{
		    display: block;
		}
		.slick-slide.slick-loading img
		{
		    display: none;
		}
		.slick-slide.dragging img
		{
		    pointer-events: none;
		}
		.slick-initialized .slick-slide
		{
		    display: block;
		}
		.slick-loading .slick-slide
		{
		    visibility: hidden;
		}
		.slick-vertical .slick-slide
		{
		    display: block;

		    height: auto;

		    border: 1px solid transparent;
		}
		.slick-arrow.slick-hidden {
		    display: none;
		}
		.slick-next, .slick-prev {
		    height: 20px;
		    width: 20px;
		    line-height: 0;
		    font-size: 0;
		    cursor: pointer;
		    background: 0 0;
		    color: transparent;
		    top: 50%;
		    transform: translate(0,-50%);
		    border: none;
		    outline: 0;
		}
		.slick-dots, .slick-next, .slick-prev {
		    position: absolute;
		    display: block;
		    padding: 0;
		}
		.slick-prev {
		    left: -25px;
		}
		.slick-next {
		    right: -25px;
		}
		.slick-prev:before {
		    content: "\\E609";
		}
		.slick-next:before {
			content: "\\E608";
		}
		.slick-next:before, .slick-prev:before {
		    font-size: 20px;
		    line-height: 1;
		    color: #999;
		    opacity: .25;
		    display: block;
    		font-family: anticon!important;
		}
		.slick-next:hover:before, .slick-prev:hover:before {
			opacity: .75;
		}
    `;

    componentWillMount() {
        // 加载组件css，只加载一次
        util.core.appendComponentCss(this.loadCssKey, this.css);
    }

    render() {
        let {children, ...other} = this.props;
        return (<Slider {...other}>
                    { children }
                </Slider>);
    }
}
