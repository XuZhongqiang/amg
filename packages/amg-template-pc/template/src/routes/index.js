import Index from '@/containers/index';
import DemoTable from '@/containers/demo-table/route';
import DemoForm from '@/containers/demo-form/route';

export default {
  path: '/',
  component: Index,
  childRoutes: [DemoTable, DemoForm],
};
