import DemoForm from './index.js';

export default {
  path: 'demo-form',
  childRoutes: [
    {
      path: 'index',
      component: DemoForm,
    },
  ],
};
