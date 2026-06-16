export const TODOS_CHANGED_EVENT = 'todos-changed';

export function dispatchTodosChanged(): void {
  window.dispatchEvent(new CustomEvent(TODOS_CHANGED_EVENT));
}
