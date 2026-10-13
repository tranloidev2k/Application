/** Controls, menus and dialogs: a click on (or inside) one of these must never also activate a clickable row or card. */
export const INTERACTIVE_SELECTOR = 'a, button, input, select, textarea, label, [role="menu"], [role="dialog"]'

export const isInteractiveTarget = (target: EventTarget | null) => target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null
