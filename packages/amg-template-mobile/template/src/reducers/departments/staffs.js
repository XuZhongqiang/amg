import { combineReducers } from 'redux';
import { buildReduce } from '@wxfe/utils';
import { getType } from '@/utils';

const list = buildReduce(
  {
    STAFF_LIST_UPDATE: (state, action) => {
      const { data } = action;
      return {
        isLoading:
          getType(data.isLoading) === 'boolean'
            ? data.isLoading
            : state.isLoading,
        dataList: data.dataList || state.dataList,
        filter: { ...state.filter, ...data.filter },
        pagination: data.pagination || state.pagination,
      };
    },
    STAFF_LIST_RESET: state => {
      const filter = {
        name: {
          value: '',
        },
        depart: {
          value: '',
        },
      };
      return { ...state, ...{ filter } };
    },
  },
  {
    isLoading: false,
    dataList: [],
    filter: {
      name: {
        value: '',
      },
      depart: {
        value: '',
      },
    },
    pagination: {
      current: 1,
      pageSize: 10,
    },
  }
);

export default combineReducers({
  list,
});
