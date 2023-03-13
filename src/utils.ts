export function patch(Class, methodName, newMethod) {
  const oldMethod = Class.prototype[methodName];
  Class.prototype[methodName] = function (...args) {
    return newMethod.bind(this)(oldMethod.bind(this), ...args);
  };
}

export function isBeforeEvent(element: HTMLElement, event: MouseEvent) {
  //code below mimics li::before:hover css rule which is currently not supported by browsers
  //in the current use cases Y is already checked by the li:hover rule, so we can focus only on X
  const beforeStyle = window.getComputedStyle(element, "::before");
  const liRect = element.getBoundingClientRect();

  return Math.abs(event.x - liRect.x) < parseFloat(beforeStyle.width) - 1;
}
