interface executeStrategyArgs<ChildrenFormElement extends HTMLElement> {
  value: string;
  adapter: (e: React.FormEvent<ChildrenFormElement>) => void;
}

const x = {} as HTMLElement;

const executeStrategy = <ChildrenFormElement extends HTMLElement = HTMLElement>(
  element: executeStrategyArgs<ChildrenFormElement>,
): Partial<HTMLElement> => {
  if (element instanceof HTMLInputElement) {
    return { ariaLabel: "input" };
  }
  if (element instanceof HTMLTextAreaElement) {
    return { ariaLabel: "textarea" };
  }
  if (element instanceof HTMLSelectElement) {
    return { ariaLabel: "select" };
  }
  return {};
};
