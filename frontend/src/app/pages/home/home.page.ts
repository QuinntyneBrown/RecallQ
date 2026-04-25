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
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
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
