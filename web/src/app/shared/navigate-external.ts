export function navigateExternal(href: string): void {
  const hook = (window as unknown as { __rqNav?: (h: string) => boolean | void }).__rqNav;
  if (typeof hook === 'function' && hook(href) === true) return;
  window.location.href = href;
}
