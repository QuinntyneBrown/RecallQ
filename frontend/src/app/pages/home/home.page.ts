import { Component, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { ContactsService } from '../../contacts/contacts.service';
import { StacksService } from '../../stacks/stacks.service';
import { StackCardComponent } from '../../ui/stack-card/stack-card.component';
import { SuggestionsService } from '../../suggestions/suggestions.service';
import { SuggestionCardComponent } from '../../ui/suggestion-card/suggestion-card.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [StackCardComponent, SuggestionCardComponent],
  template: `
    <section class="home">
      <section aria-labelledby="hero-title">
        <p class="greeting">Good {{ timeOfDay() }}, {{ greetingName() }}</p>
        <h1 id="hero-title" class="hero-title">Find anyone.</h1>
        <p class="hero-sub">By meaning, not memory.</p>
        <p class="hero-subtitle" data-testid="hero-subtitle">{{ heroSubtitle() }}</p>

        <div class="search-wrap">
          <label class="sr-only" for="q">Search contacts</label>
          <i class="ph ph-magnifying-glass search-icon" aria-hidden="true"></i>
          <input id="q" class="search-input" type="search" role="searchbox"
                 aria-label="Search contacts"
                 placeholder="Search contacts"
                 (keyup.enter)="goSearch($event)" />
        </div>
      </section>

      @if (suggestionsService.suggestion()) {
        <app-suggestion-card [suggestion]="suggestionsService.suggestion()!" (dismiss)="handleDismiss($event)"/>
      }

      @if (stacksService.stacks().length > 0) {
        <section class="stacks-row" aria-labelledby="stacks-heading">
          <h2 id="stacks-heading">Smart stacks <a href="/stacks" (click)="$event.preventDefault()">See all</a></h2>
          <div class="stacks-scroll">
            @for (s of stacksService.stacks(); track s.id) {
              <app-stack-card [stack]="s"/>
            }
          </div>
        </section>
      }

      <a class="add-link" href="/contacts/new" (click)="goAdd($event)">Add contact</a>
      <a class="add-link" href="/import" (click)="goImport($event)">Import CSV</a>
    </section>
  `,
  styles: [`
    .home {
      padding: 24px;
      color: var(--foreground-primary);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .greeting {
      margin: 0;
      font-size: 14px;
      color: var(--foreground-muted);
    }
    .hero-title {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      line-height: 1.1;
    }
    .hero-sub {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      line-height: 1.1;
      color: var(--foreground-muted);
    }
    .hero-subtitle {
      margin: 8px 0 0;
      font-size: 14px;
      color: var(--foreground-secondary);
    }
    .search-wrap {
      position: relative;
      margin-top: 8px;
    }
    .search-icon {
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--foreground-muted);
      font-size: 20px;
      pointer-events: none;
    }
    .search-input {
      width: 100%;
      height: 56px;
      border-radius: var(--radius-full);
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      padding: 0 24px 0 52px;
      color: var(--foreground-primary);
      font-size: 16px;
      outline: none;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .search-input:focus {
      border-color: var(--accent-primary);
    }
    /* T031: --accent-primary (#7C3AFF) on --surface-primary (#0A0A16) fails WCAG AA (3.65:1).
       Use --accent-tertiary (cyan #4BE8FF) which passes comfortably. */
    .add-link {
      margin-top: 4px;
      font-size: 14px;
      color: var(--accent-tertiary);
      text-decoration: none;
      align-self: flex-start;
    }
    .stacks-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .eyebrow {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.08em;
      color: var(--foreground-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    .eyebrow a {
      color: var(--accent-tertiary);
      text-decoration: none;
      font-size: 12px;
      letter-spacing: normal;
      font-weight: 400;
    }
    .stacks-scroll {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 0 24px;
      margin: 0 -24px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class HomePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly contactsService = inject(ContactsService);
  protected readonly stacksService = inject(StacksService);
  protected readonly suggestionsService = inject(SuggestionsService);
  private readonly router = inject(Router);

  readonly contactCount = this.contactsService.contactCount;
  readonly interactionCount = this.contactsService.interactionCount;

  readonly heroSubtitle = computed(() => {
    const c = this.contactCount();
    const i = this.interactionCount();
    const contacts = c === 1 ? '1 contact' : `${c} contacts`;
    const interactions = i === 1 ? '1 interaction' : `${i} interactions`;
    return `Semantic search across ${contacts} and ${interactions}.`;
  });

  readonly greetingName = computed(() => {
    const s = this.auth.authState();
    if (!s) return '';
    const local = s.email.split('@')[0];
    return local.length === 0 ? '' : local.charAt(0).toUpperCase() + local.slice(1);
  });

  readonly timeOfDay = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'evening';
  });

  ngOnInit(): void {
    void this.contactsService.refreshCount();
    void this.stacksService.refresh();
    void this.suggestionsService.refresh();
  }

  handleDismiss(key: string): void {
    void this.suggestionsService.dismiss(key);
  }

  goSearch(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const q = input.value.trim();
    void this.router.navigate(['/search'], { queryParams: { q } });
  }

  goAdd(ev: Event): void {
    ev.preventDefault();
    void this.router.navigate(['/contacts/new']);
  }

  goImport(ev: Event): void {
    ev.preventDefault();
    void this.router.navigate(['/import']);
  }
}
