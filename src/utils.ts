export function patch(Class, methodName, newMethod) {
  const oldMethod = Class.prototype[methodName];
  Class.prototype[methodName] = function () {
    return newMethod.bind(this)(oldMethod.bind(this), ...arguments);
  };
}
