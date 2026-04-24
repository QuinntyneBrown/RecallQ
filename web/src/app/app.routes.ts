import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'login', loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage) },
  { path: 'logout', loadComponent: () => import('./pages/logout/logout.page').then(m => m.LogoutPage) },
  { path: 'home', canMatch: [authGuard], loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage) },
  { path: 'contacts/new', canMatch: [authGuard], loadComponent: () => import('./pages/add-contact/add-contact.page').then(m => m.AddContactPage) },
  { path: 'search', canMatch: [authGuard], loadComponent: () => import('./pages/search/search.page').then(m => m.SearchResultsPage) },
  { path: 'ask', canMatch: [authGuard], loadComponent: () => import('./pages/ask/ask.page').then(m => m.AskPlaceholderPage) },
  { path: 'contacts/:id/interactions/new', canMatch: [authGuard], loadComponent: () => import('./pages/add-interaction/add-interaction.page').then(m => m.AddInteractionPage) },
  { path: 'contacts/:id/activity', canMatch: [authGuard], loadComponent: () => import('./pages/contact-detail/all-activity.page').then(m => m.AllActivityPage) },
  { path: 'contacts/:id', canMatch: [authGuard], loadComponent: () => import('./pages/contact-detail/contact-detail.page').then(m => m.ContactDetailPage) },
  { path: '**', redirectTo: 'login' },
];
