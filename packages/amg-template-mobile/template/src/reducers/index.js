import { routerReducer as routing } from 'react-router-redux';
import { combineReducers } from 'redux';
import departmentsReducer from './departments';

export default combineReducers({
  routing,
  departmentsReducer,
});
