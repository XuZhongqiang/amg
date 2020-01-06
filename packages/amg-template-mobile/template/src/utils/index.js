// Note: 不会拷贝函数和原型链
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function getType(obj) {
  return Object.prototype.toString
    .call(obj)
    .slice(8, -1)
    .toLowerCase();
}

export function padStart(str, len, ch = ' ') {
  const times = len - `${str}`.length;
  return times > 0 ? `${Array(times + 1).join(ch)}${str}` : str;
}
