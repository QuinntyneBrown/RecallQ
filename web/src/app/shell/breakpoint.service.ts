import { Injectable, signal, Signal } from '@angular/core';
import { BREAKPOINT_MINS } from './breakpoints.util';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  private readonly _xs = signal(false);
  private readonly _sm = signal(false);
  private readonly _md = signal(false);
  private readonly _lg = signal(false);
  private readonly _xl = signal(false);

  readonly xs: Signal<boolean> = this._xs.asReadonly();
  readonly sm: Signal<boolean> = this._sm.asReadonly();
  readonly md: Signal<boolean> = this._md.asReadonly();
  readonly lg: Signal<boolean> = this._lg.asReadonly();
  readonly xl: Signal<boolean> = this._xl.asReadonly();

  constructor() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const wire = (min: number, s: ReturnType<typeof signal<boolean>>) => {
      const mql = window.matchMedia(`(min-width: ${min}px)`);
      s.set(mql.matches);
      const listener = (e: MediaQueryListEvent) => s.set(e.matches);
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', listener);
      } else if (typeof (mql as MediaQueryList).addListener === 'function') {
        (mql as MediaQueryList).addListener(listener);
      }
    };
    wire(BREAKPOINT_MINS.xs, this._xs);
    wire(BREAKPOINT_MINS.sm, this._sm);
    wire(BREAKPOINT_MINS.md, this._md);
    wire(BREAKPOINT_MINS.lg, this._lg);
    wire(BREAKPOINT_MINS.xl, this._xl);
  }
}
