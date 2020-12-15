import React, { Component } from 'react';
import { Button, message } from 'antd';
import { PageTemplate, SelectMax } from '@wxfe/venom';
import request from '@wxfe/venom-request';
import { urls } from './config'; // 同目录得有一个config文件

// 对应页面中表格中的列（无操作的列）
const normalCol = [
  {
    title: '城市',
    dataIndex: 'cityName',
  },
  {
    title: '姓名',
    dataIndex: 'name',
  },
];
// 对应页面中筛选条件的模块
const filter = [
  {
    label: '城市',
    key: 'cityCode',
    component: (
      <SelectMax // 下拉框写法，此处为异步接口请求下拉数据，其他用法可以参考venom
        url={urls.queryAllCitys}
      />
    ),
  },
  {
    label: '姓名',
    key: 'name',
    component: 'Input', // 输入框，字符串形式的表单项目前只支持 Input/RangePicker
  },
  {
    label: '日期',
    key: 'date',
    component: 'RangePicker', // 日期区间选择器，字符串形式的表单项目前只支持 Input/RangePicker
  },
];

class Index extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    document.title = 'XXXX'; // 此处需要自行修改，对应网页标签页的title
  }

  componentDidMount() {
    // 这里可以写dom操作、地图、图表等逻辑
  }

  /**
   * 自定义操作列
   * @param val  对应dataIndex的值
   * @param record  对应这一行的数据
   * @param index   索引值
   * @returns {*}  必须是 jsx、null、空字符串
   */
  renderOperator = (val, record) => (
    <div>
      <Button type="link" onClick={this.disabledItem(record)}>
        禁用
      </Button>
    </div>
  );

  disabledItem = record => () => {
    request({
      ...urls.edit,
      data: { id: record.id }, // request data
    }).then(() => {
      // res是接口返回的数据中data的值，只有code等于200才会进入此处逻辑，更多文档可以查看venom文档
      message.success('禁用成功'); // toast提示用户信息
      this.onSearch(); // 数据同步，重新请求列表数据
    });
  };

  /**
   * 用于处理查询请求前的钩子（用于查询条件输入值的特殊处理）
   * @param options 筛选项的输入值
   * @returns {*}
   */
  beforeRequest = options => {
    const { date, ...others } = options; // 解构出日期区间的值单独处理

    if (date && date.length) {
      // 当日期组件有值输入时
      others.startDate = date[0].format('YYYY-MM-DD 00:00:00');
      others.endDate = date[1].format('YYYY-MM-DD 23:59:59');
    }

    return others;
  };

  /**
   * 用于处理查询请求拿到数据之后的钩子
   * @param data 接口返回的数据中data的值
   * @returns {*}  比如符合下方结构
   */
  afterRequest = data => ({
    list: data.list, // 必须 列数据
    total: data.total, // 必须 总条数
    pageNum: data.pageNum, // 非必须
    pageSize: data.pageSize, // 非必须
  });

  render() {
    const templateConfig = {
      searchOnLoad: true, // 是否进入即加载数据(默认是true，在数据过多需要有必填筛选项的情况可以设为false)
      url: urls.list, // 请求表格数据的url对象，在config中配置
      beforeRequest: this.beforeRequest,
      afterRequest: this.afterRequest, // 一般情况下用不到这个钩子，可以删除这一列
    };
    const columns = normalCol.concat({
      title: '操作',
      dataIndex: 'operations',
      render: this.renderOperator, // 自定义渲染这一列内容的方法，必须有返回值
    });

    return (
      <div className="example-class">
        {' '}
        {/* 这里的class需要自己替换，然后在index.less文件中写对应的样式 */}
        <PageTemplate
          rowKey="id" // 待修改，一行数据唯一的key值，如果没有，需要设为 (record, index) => index
          {...templateConfig}
          filter={filter}
          columns={columns}
          connect={({ onSearch }) => {
            // PageTemplate对外暴露重新查询数据的方法，你可以在某些用户行为之后调用onSearch
            this.onSearch = onSearch;
          }}
        />
      </div>
    );
  }
}
export default Index;
