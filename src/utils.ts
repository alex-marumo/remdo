export function patch(Class, methodName, newMethod) {
  const oldMethod = Class.prototype[methodName];
  Class.prototype[methodName] = function (...args) {
    return newMethod.bind(this)(oldMethod.bind(this), ...args);
  };
}
