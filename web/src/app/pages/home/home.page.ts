import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  template: `<section class="home"><h1>Home</h1></section>`,
  styles: [`
    .home {
      padding: 24px;
      color: var(--foreground-primary);
    }
    h1 {
      margin: 0;
      font-size: 28px;
    }
  `],
})
export class HomePage {}
