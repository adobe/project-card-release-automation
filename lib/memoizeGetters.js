
module.exports = obj => {
  Object.keys(obj).forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (typeof descriptor.get === "function") {
      Object.defineProperty(obj, key, { get: () => {
        delete obj[key];
        return obj[key] = descriptor.get.call(obj);
      }});
    }
  });
  return obj;
};