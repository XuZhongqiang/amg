import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';
import Index from '@/containers/index';
import Staffs from '@/containers/departments/staffs';

export default (
  <Route path="/" component={Index}>
    <IndexRedirect to="/departments/staffs" />

    <Route path="departments">
      <Route path="staffs">
        <IndexRoute component={Staffs} />
      </Route>
    </Route>
  </Route>
);
