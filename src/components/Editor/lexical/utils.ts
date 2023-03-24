import { $getNearestNodeFromDOMNode, $isDecoratorNode } from "lexical";

//copied, unexported function from lexical/packages/lexical-rich-text/src/index.ts
export function $isTargetWithinDecorator(target: HTMLElement): boolean {
  const node = $getNearestNodeFromDOMNode(target);
  return $isDecoratorNode(node);
}
