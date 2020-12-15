const preFix =
  process.env.NODE_ENV === 'development' ? 'http://120.55.225.31:8888' : '';

export const transformUrls = (obj = {}, projectPre = '') =>
  Object.keys(obj).reduce((ret, key) => {
    ret[key] = { ...obj[key], url: `${preFix}${projectPre}${obj[key].url}` };

    return ret;
  }, {});
