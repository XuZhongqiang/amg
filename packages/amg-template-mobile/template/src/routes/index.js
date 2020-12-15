import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';
import Index from '@/containers/index';
import routeConfig from './routeConfig';

export default (
  <Route path="/" component={Index}>
    <IndexRedirect to="/departments/staffs" />

    <Route path="departments">
      <Route path="staffs">
        <IndexRoute getComponent={routeConfig.staffs} />
      </Route>
    </Route>
  </Route>
);
