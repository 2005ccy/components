import React from 'react';
import { Icon, Button, Input, AutoComplete, Select } from 'antd';
const Option = AutoComplete.Option;
const SelectOption = Select.Option;

export default class AutoCompleteWidget extends Component {

    // 组件名称
    name = "autoComplete";

    // 是否加载样式，标准key
    loadCssKey = 'ds-auto-complete-css-loaded';

    // 需要加载的css 内容
    css = `
        .ds-auto-complete .ant-select-combobox .ant-select-arrow {
          display: block;
        }
        .ds-auto-complete .ant-select-combobox .ant-select {
          width: 92px;
        }
        .ds-auto-complete .ant-select-selection-selected-value {
          padding-left: 10px;
        }
        .ds-auto-complete .global-search-wrapper {
          padding-right: 50px;
        }
        .ds-auto-complete .global-search {
          width: 100%;
        }
        .ds-auto-complete .global-search.ant-select-auto-complete .ant-select-selection--single {
          margin-right: 0;
        }
        .ds-auto-complete .global-search.ant-select-auto-complete .ant-input-affix-wrapper .ant-input:not(:last-child) {
          padding-right: 62px;
        }
        .ds-auto-complete .global-search.ant-select-auto-complete .ant-input-affix-wrapper .ant-input-suffix {
          right: 0;
        }
        .ds-auto-complete .global-search.ant-select-auto-complete .ant-input-affix-wrapper .ant-input-suffix button {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
        }
        .ds-auto-complete .global-search-item-count {
          position: absolute;
          right: 16px;
        }
        .ds-auto-complete .option-company-type {
          float: right;
          border: 1px solid #8baddd;
          color: #8baddd;
          width: 17px;
          height: 17px;

        }
        .ds-auto-complete .ant-btn-primary {
           padding: 0 7px;
           border-radius: 4px;
        }
        .global-search.ant-select-auto-complete .ant-input-affix-wrapper .ant-input-suffix button {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }
    `;

    // 搜索补全列表
    state = {
        dataSource: [],
    }

    // 请求每页条数
    pageSize = 10;
    pageNo = 1;
    allLoaded = false;

    checkAllLoaded() {
        // 如果数据个数，小于请求个数
        if (_.size(this.state.dataSource) < this.pageSize * this.pageNo) {
            // 数据全部加载完成
            this.allLoaded = true;
        }
    }

    ajaxLoadedMore() {
        // 加载请求页面 Number
        this.pageNo++;
        // 继续请求
        this.doAjax();
    }

    // 滚动加载更多
    scrollLoadMore() {
        // 自动补全对象
        let _this = this;
        // 选择自动补全，ul DOM
        !this.allLoaded && this.selectPoll('.ant-select-dropdown-menu', (sel) => {
            // 如果没有加载滚动事件
            if (!sel.hasClass('on-scroll')) {
                // 绑定选中菜单，滚动事件
                sel.scroll(function() {
                    // 获取菜单容器高度
                    let height = sel.height();
                    // 获得子DOM
                    let lis = sel.children();
                    // 获得单个子DOM高度
                    let liHeight = lis.first()[0].clientHeight;
                    // 获取总高度
                    let maxHeight = lis.length * liHeight;
                    // 如果划到底部
                    if (!_this.allLoaded && ($(this).scrollTop() + height >= maxHeight - 5)) {
                        // 加载更多
                        _this.ajaxLoadedMore();
                    }
                })
                sel.addClass('on-scroll');
            }
        });
    }

    // 处理用户输入搜索
    handleSearch = (value) => {
        // 去除无效空格
        value = _.trim(value);
        // 如果搜索内容不同
        if (this.searchValue != value) {
            // 当前页码，恢复初始值
            this.pageNo = 1;
            // 全部加载，恢复初始值
            this.allLoaded = false;
        }
        // 设置查询值
        this.searchValue = value;
        // 构建ajax 对象
        value && value.length > 1 && this.doAjax().always(this.scrollLoadMore);
    }

    // 选中一个公司
    selectCompany() {
        // 根据选中查询公司信息
        let company = _.find(this.state.dataSource, (d) => {
            return (d.personId ? d.personId : d.companyId) == this.optionId;
        });
        // 存在公司信息，回调选中函数
        if (company) {
            // 清空选项
            this.clear();
            // 组件回调
            _.isFunction(this.props.onSelect) && this.props.onSelect(company);
        }
    }

    // 清空组件状态
    clear() {
        this.selectValue = null;
        this.setState({
            dataSource: [],
            uuid: util.core.uuid()
        });
    }

    // 选择类型字段
    selectType(value) {
        // 更改查询类型
        this.selectValue = value;
        // 发起搜索请求
        this.handleSearch(this.searchValue);
    }

    // 获得下拉，列表放置容器
    getContainer() {
        return $(`#${this.id}`)[0];
    }

    // 公司类型简写
    abbrMarketType(companyType) {
        let mt = (companyType || '')[0].replace('上', '沪');
        if (_.includes('沪,深,三,创', mt)) {
            return <div className="option-company-type">
                       <span>{ mt }</span>
                   </div>
        }
    }

    // 渲染下拉选择器
    renderOption(item) {
        // 获取uuid 字符串
        let uuid = util.core.uuid();
        // 无数据渲染
        if (!item) {
            return <Option
                           key={ uuid }
                           value={ null }>
                       <div style={ { 'textAlign': 'center' } }>
                           <i className="anticon anticon-frown-o"></i> 没有匹配结果，请更改类型或修改关键词
                       </div>
                   </Option>
        }
        // 个人数据渲染
        if (this.selectValue == 'person') {
            let name = item.personName + ' ';
            let p = ' ' + (item.position || '').replace(/;/g, ' ');
            let label = name + item.companyFullName + p;

            return (<Option
                            key={ uuid }
                            value={ `${uuid}_${item.personId}` }
                            text={ label }>
                        <strong>{ name }</strong>
                        { item.companyFullName }
                        <strong>{ p }</strong>
                    </Option>)
        }
        // 公司数据渲染
        return (
            <Option
                    key={ uuid }
                    value={ `${uuid}_${item.companyId}` }
                    text={ item.companyFullName }>
                { item.companyFullName }
                { this.abbrMarketType(item.companyType) }
            </Option>
            );
    }

    // 用户选中补全项
    selectOptionId(value) {
        // 参数无效，退出方法
        if (!value) {
            return;
        }
        this.optionId = value.split('_').pop();
        util.core.call(this.props.selectOption, this.optionId);
    }

    // 组件将要挂载，加载组件css
    componentWillMount() {
        // 设置加载更多为，节流函数
        this.throttle(this.ajaxLoadedMore, 100);
        // 加载组件css，只加载一次
        util.core.appendComponentCss(this.loadCssKey, this.css);
    }

    componentDidMount() {

        this.selectPoll('.select-type .ant-select-selection__placeholder', (sel) => {
            let ml = this.select('.ant-input-group-addon').width() + 20;
            let mr = this.select('.ant-input-suffix').width() - 5;
            sel.css({
                'margin-right': `${mr}px`,
                'margin-left': `${ml}px`
            });
        });
    }

    // 组件完成更新
    componentDidUpdate(prevProps, prevState) {
        // 如果包含，dataSource状态值
        if (this.searchValue && prevState.dataSource) {
            // 检查是否加载完成
            this.checkAllLoaded();
        }
    }

    // 渲染组件
    render() {

        let {select} = this.props;
        // 选择器前置对象
        let before = null;
        // 存在下拉组件
        if (select) {
            // 获取下拉值
            this.selectValue = this.selectValue ? this.selectValue : _.get(_.first(select), 'value');
            // 搜索框前置组件
            before = <Select
                             getPopupContainer={ this.getContainer }
                             defaultValue={ this.selectValue }
                             onSelect={ this.selectType }>
                         { _.map(select, (en) => {
                               return <SelectOption
                                                    key={ en.value }
                                                    value={ en.value }>
                                          { en.text }
                                      </SelectOption>
                           }) }
                     </Select>;
        }

        return (
            <div
                 id={ this.id }
                 className="ds-auto-complete">
                <AutoComplete
                              key={ this.state.uuid || this.id }
                              className={ `global-search ${before ? 'select-type' : ''}` }
                              size={ this.props.size || 'large' }
                              style={ { width: '100%' } }
                              defaultValue={ null }
                              dataSource={ (this.state.dataSource || [null]).map(this.props.renderOption || this.renderOption) }
                              onSearch={ this.handleSearch }
                              onSelect={ this.selectOptionId }
                              placeholder={ this.props.placeholder }
                              optionLabelProp="text"
                              getPopupContainer={ this.getContainer }>
                    <Input
                           addonBefore={ before }
                           suffix={ this.props.button || <Button
                                                                 onClick={ this.selectCompany }
                                                                 className="search-btn"
                                                                 size={ this.props.size || 'large' }
                                                                 type="primary">
                                                             { this.props.btnText || '添加' }
                                                         </Button> } />
                </AutoComplete>
            </div>
            );
    }

}
