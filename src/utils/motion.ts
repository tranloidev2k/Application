/** True when the user asked the OS for reduced motion. Call it from event handlers and effects only (never during render). */
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** 'smooth' scrolling, or 'auto' when the user prefers reduced motion. */
export const scrollBehavior = (): ScrollBehavior => prefersReducedMotion() ? 'auto' : 'smooth'
