const routeConfig = {
  staffs: (location, callback) => {
    require.ensure(
      [],
      require => {
        callback(null, require('../containers/departments/staffs').default);
      },
      'departments'
    );
  },
};

export default routeConfig;
