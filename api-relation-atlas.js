// 扩展 window.api
Object.assign(window.api = window.api || {}, {
    // 关系图谱相关接口
    relationAtlas: {
        // 查询关系树
        tree: {
            // 获取接口url
            url: (param) => {
                return '/relationMap/nodeTree'
            },
            // 请求方式
            method: 'getCache',
            // 请求完整 url 例子{nodeId: '公司或自然人编号', layer: 关系维度 [1-4], nodeType: 节点类型}
            demo: '/relationMap/nodeTree?nodeId=287167&layer=4&nodeType=company',
            // 例子结果
            demoResult: {
                code: 1,
                data: {
                    relationMapId: 45,
                    relationMapName: "符合条件2233",
                    rootId: "866453",
                    rootType: "company"
                },
                companyMap: [{
                    relationMapId: 45,
                    companyId: "866453",
                    companyName: "首都产业建设集团有限公司",
                    companyType: "其他有限责任公司"
                }],
                companyRelationMap: [{
                    relationMapId: 45,
                    companyRelationId: "1",
                    sourceId: "866453",
                    sourceGroupId: null
                }],
                personMap: [],
                personRelationMap: [{
                    relationMapId: 45,
                    personRelationId: "string",
                    companyId: "970744",
                    personName: "安笑南"
                }],
                rootId: "866453",
                rootType: "company",
                message: "success"
            }
        },
        // 根据公司名称，查询公司编号
        exist: {
            // 获取接口url
            url: (param) => {
                return '/relationMap/exist'
            },
            // 请求方式
            method: 'get',
            // 请求完整 url 
            demo: '/relationMap/exist?input=首都产业建设集团有限公司',
            // 返回结果
            demoResult: {
                "code": 1,
                "message": "success",
                "data": {
                    "首都产业建设集团有限公司": {
                        "id": 4006395,
                        "type": "company"
                    }
                }
            }
        },
        // 公司详情中，股票信息
        stockInfo: {
            // 获取接口url
            url: (param) => {
                return `/search/stockInfo`
            },
            // 请求方式
            method: 'getCache',
            // 修改接口数据
            change: {
                'data': {
                    'priceDelta': (val) => {
                        return _.ceil(val * 100, 2);
                    },
                    'marketValue': (val) => {
                        return _.ceil(val / 100000000, 2);
                    },
                    'pe': (val) => {
                        return _.ceil(val, 2);
                    }
                }
            },
            // 请求demo
            demo: '/search/stockInfo?ticker=601318',
            // 请求demo 结果
            demoResult: {
                "code": 1,
                "message": "success",
                "data": {
                    "ticker": "601318",
                    "shortNM": "中国平安",
                    "partyID": 2264,
                    "listDate": 1172678400000,
                    "hasMarketData": true,
                    "addedToPool": false,
                    "listStatus": "L",
                    "lastPrice": 41.1, // 现价
                    "openPrice": 40.59,
                    "highestPrice": 41.33,
                    "lowestPrice": 40.59,
                    "preClosePrice": 40.62,
                    "valueDelta": 0.48,
                    "priceDelta": 0.01181, // 涨跌幅 * 100
                    "yearData": null,
                    "marketValue": 7.5131792154E11, // 总市值 单位：元
                    "negMarketValue": 4.4522251095E11,
                    "totalEquity": 1.82802414E10,
                    "negEquity": 1.08326645E10,
                    "pe": 12.04151, // pettm
                    "eps": 1.29,
                    "latestYearMax": 41.09,
                    "latestYearMin": 31.031,
                    "bps": 22.51,
                    "pb": 1.8046
                }
            }
        },
        // 单个公司详情
        nodeDetail: {
            // 获取接口url
            url: (param) => {
                return `/relationMap/nodeDetail`
            },
            // 请求方式
            method: 'get',
            // 接口请求过期时间
            expire: 1000 * 60 * 60 * 24,
            // 修改接口数据
            change: {
                'data.datalist': {
                    'position': (val) => {
                        return _.isString(val) && val.replace(/;/g, ' ');
                    },
                    'ratio': (val) => {
                        return val && (val + '%');
                    }
                }
            },
            /*
                基本信息内容：api.relationAtlas.tree.companyMap
                非上市： companyMarketType，
                法定代表：representitive，
                注册资本：registrationCapital，
                市值：marketValue
                成立日期：establishDate
                主营业务：scope
                所属行业：industry
            */
            // 查询某公司--股东 {nodeId: '公司或自然人编号', layer: 关系维度 [1-4], nodeType: 节点类型}
            demo: '/relationMap/nodeDetail?nodeId=540207&nodeType=company&field=incompany&pageNow=1&pageSize=',
            // 查询某公司--对外投资
            demo2: '/relationMap/nodeDetail?nodeId=540207&nodeType=company&field=outcompany&pageNow=1&pageSize=',
            // 查询某公司--主要成员
            demo3: '/relationMap/nodeDetail?nodeId=540207&nodeType=company&field=member&pageNow=1&pageSize='
        },
        // 股权变动
        relationChanges: {
            // 获取股权变动接口
            url: (param) => {
                return `/relationMap/relationChanges`
            },
            // 请求方式
            method: 'get',
            // 接口请求过期时间
            expire: 1000 * 60 * 60 * 24,
            // 查询该公司股权变动情况 {nodeId: 股票编号， monthsBtwn：时间范围[1, 3, 6], relTypes：范围类型（Holder Senior）}
            demo: '/relationMap/relationChanges?nodeId=287167&monthsBtwn=6&relTypes=Holder%2CSenior&pageNow=1&pageSize=10',
            // 例子结果
            demoResult: {
                "code": 1,
                "message": "success",
                "data": {
                    "title": null,
                    "list": [{
                        "relId": 1108298,
                        "relType": "Senior",
                        "changeType": "离职",
                        "recordChgType": "del",
                        "nodeId": 1045160,
                        "nodeName": "赵继臣",
                        "nodeType": "people",
                        "actPubTime": "2017-01-13",
                        "sourceType": "auto_senior_chg",
                        "reportId": "15641690",
                        "reportName": "2017_2017-01-14_关于董事辞任的公告_4698.pdf",
                        "changeBefore": "董事;;副总经理"
                    }],
                    "pageNow": 1,
                    "pageCount": 1,
                    "pageSize": 10,
                    "total": 1,
                    "isFirstPage": true,
                    "isLastPage": true,
                    "actualTotal": 1,
                    "companyId": 287167
                }
            }
        },
        // 搜索公司名称
        searchHints: {
            // 获取股权变动接口
            url: (param) => {
                return `/relationMap/searchHints`
            },
            // 请求方式
            method: 'get',
            // 请求参数
            param: (widget) => {
                // 数据查询条数
                let param = {
                    size: (widget.pageSize * widget.pageNo) || 10
                };
                param.type = 'company';
                // 存在类型选择器
                if (widget.selectValue) {
                    // 设置类型参数
                    param.type = widget.selectValue;
                }
                // 设置查询文本
                param.input = _.trim(widget.searchValue);
                // 返回请求参数
                return param;
            },
            // 设置状态值
            setState: {
                'dataSource': 'data'
            },
            // 节流请求
            throttle: 1000,
            // demo 请求
            demo: '/relationMap/searchHints?input=首都&type=company&size=5',
            // demo数据
            demoResult: {
                "code": 1,
                "message": "success",
                "data": [{
                    "companyId": 43790,
                    "ticker": null,
                    "companyShortName": null,
                    "companyFullName": "首都信息发展股份有限公司",
                    "companyType": "香港交易所",
                    "registrationCapital": 289808609
                }, {
                    "companyId": 111681,
                    "ticker": null,
                    "companyShortName": null,
                    "companyFullName": "首都机场集团公司",
                    "companyType": "非上市公司",
                    "registrationCapital": 7000000000
                }, {
                    "companyId": 100046,
                    "ticker": null,
                    "companyShortName": null,
                    "companyFullName": "首都医疗健康产业有限公司",
                    "companyType": "非上市公司",
                    "registrationCapital": 1367500000
                }, {
                    "companyId": 100046,
                    "ticker": null,
                    "companyShortName": null,
                    "companyFullName": "首都医疗健康产业集团有限公司",
                    "companyType": "非上市公司",
                    "registrationCapital": 1367500000
                }, {
                    "companyId": 668177,
                    "ticker": null,
                    "companyShortName": null,
                    "companyFullName": "首都机场地产集团有限公司",
                    "companyType": "非上市公司",
                    "registrationCapital": 1000000000
                }]
            }
        },
        // 搜索某公司，壳资源
        shellInfo: {
            // 获取股权变动接口
            url: (param) => {
                return `/relationMap/shellInfo`
            },
            // 请求方式
            method: 'get',
            // 请求demo 
            demo: '/relationMap/shellInfo?companyIds=2190,2191,2192,2193,2194,2195',
            // 请求结果
            demoResult: {
                "code": 1,
                "message": "success",
                "data": [
                    {
                        "companyId": 2190,
                        "companyFullName": "铜陵中发三佳科技股份有限公司",
                        "companyShortName": "中发科技",
                        "ticker": "600520",
                        "shellReasonList": [
                            "实际控制人为自然人",
                            "第一大股东持股较低",
                            "市值较低",
                            "负债率适中"
                        ]
                    },
                    {
                        "companyId": 2194,
                        "companyFullName": "江苏江南高纤股份有限公司",
                        "companyShortName": "江南高纤",
                        "ticker": "600527",
                        "shellReasonList": [
                            "实际控制人为自然人",
                            "第一大股东持股较低",
                            "市值较低"
                        ]
                    }
                ]
            }
        }
    }
});
