import { transformUrls } from '@/configs';

/**
 * 写法一
 * 接口一级路由: '/daimler-manage-admin' '/car-manage'
 * 如果一个页面中包含多个不同一级路由的接口, 那么需要在每个url中完整地输入
 * 如果一个页面中的所有接口一级路由都相同的情况下, 那就按照第二种写法
 * url: 声明接口路由
 * method: 声明该接口的请求方法
 */
export const urls = transformUrls(
  {
    getCities: {
      url: '/daimler-manage-admin/dropdownBox/getUserCities',
      method: 'get',
    },
    queryServiceType: {
      url: '/car-manage/common/queryServiceType',
      method: 'get',
    },
  },
  ''
);

/**
 * 写法二
 * 将接口的一级路由作为第二个参数, 传入transformUrls方法
 */
export const anotherUrls = transformUrls(
  {
    api1: {
      url: '/api1',
      method: 'get',
    },
    api2: {
      url: '/api2',
      method: 'post',
    },
  },
  '/daimler-manage-admin'
);
