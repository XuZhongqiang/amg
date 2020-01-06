export function loadData(current) {
  return async (dispatch, getState) => {
    const { list } = getState().departmentsReducer.staffsReducer;
    const { pagination } = list;

    dispatch({
      type: 'STAFF_LIST_UPDATE',
      data: { isLoading: true },
    });

    try {
      const json = await new Promise(resolve => {
        setTimeout(() => {
          resolve({
            success: true,
            data: {
              list: [
                { id: 1, name: '张三', depart: '产品部' },
                { id: 2, name: '李四', depart: '技术部' },
                { id: 3, name: '王五', depart: '设计部' },
                { id: 4, name: '赵六', depart: '测试部' },
                { id: 5, name: '刘七', depart: '技术部' },
              ],
              total: 5,
            },
          });
        }, 500);
      });

      if (json.success) {
        const dataList = (json.data.list || []).map(item => ({
          id: item.id,
          key: item.id,
          name: item.name,
          depart: item.depart,
        }));

        dispatch({
          type: 'STAFF_LIST_UPDATE',
          data: {
            dataList,
            pagination: {
              current,
              pageSize: pagination.pageSize,
              total: json.data.total,
            },
          },
        });
      }
    } catch (e) {
      // console.log(e.message);
    } finally {
      dispatch({
        type: 'STAFF_LIST_UPDATE',
        data: { isLoading: false },
      });
    }
  };
}
