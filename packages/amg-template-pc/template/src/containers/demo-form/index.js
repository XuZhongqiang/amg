import React from 'react';
import { Switch, message, Form, Button, Input, InputNumber } from 'antd';
import request from '@wxfe/venom-request';
import { SelectMax, Choice } from '@wxfe/venom';

import { urls } from './config';

// 表单的label和value的宽度占比，用于样式排版
const formItemLayout = {
  labelCol: {
    span: 6,
  },
  wrapperCol: {
    span: 18,
  },
};
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
  { value: 'c', label: 'C', disabled: true },
];

@Form.create()
class Index extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
    document.title = '新建XXXX'; // 此处需要自行修改，对应网页标签页的title
  }

  componentDidMount() {
    // 这里可以写dom操作、地图、图表等逻辑
  }

  submit = () => {
    const { form } = this.props;

    // 调用表单的自动检验功能
    form.validateFields((err, values) => {
      if (err) return; // 如果校验有问题，直接返回

      // 调用提交的接口
      request({
        ...urls.add,
        data: values,
      }).then(() => {
        message.success('成功');
      });
    });
  };

  render() {
    const { form } = this.props;
    const { getFieldDecorator } = form;

    return (
      <Form style={{ paddingTop: 20 }}>
        <Form.Item {...formItemLayout} label="下拉框">
          {getFieldDecorator('cityCode', {
            rules: [
              { required: true, message: '必填' }, // 配置输入项的校验规则，此处为必填
            ],
          })(
            <SelectMax
              url={urls.queryAllCitys} // 异步请求下拉数据，urls.queryAllCitys 需要在config文件配置
              style={{ width: 200 }}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="数字输入框">
          {getFieldDecorator('mount')(
            <InputNumber // 数字输入框，文档可以参考venom
              min={0}
              precision={0}
            />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label="输入框">
          {getFieldDecorator('name')(<Input maxLength={20} />)}{' '}
        </Form.Item>
        <Form.Item {...formItemLayout} label="复选框">
          {getFieldDecorator('agreement', {
            initialValue: ['A', 'B'],
          })(<Choice type="checkbox" options={options} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="单选框">
          {getFieldDecorator('agreement', {
            initialValue: ['A', 'B'],
          })(<Choice type="radio" options={options} />)}
        </Form.Item>
        <Form.Item {...formItemLayout} label="Switch">
          {getFieldDecorator('switch', { valuePropName: 'checked' })(
            <Switch />
          )}
        </Form.Item>
        <Form.Item {...formItemLayout} label=" ">
          <Button onClick={this.submit}>提交</Button>
        </Form.Item>
      </Form>
    );
  }
}
export default Index;
