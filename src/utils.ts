export function patch(klass, methodName, newMethod) {
  var oldMethod = klass.prototype[methodName];
  klass.prototype[methodName] = function () {
    return newMethod.bind(this)(oldMethod.bind(this), ...arguments);
  };
}
