import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class HeaderComponent {
  @Input() pageTitle = 'Employee Management System';
  @Output() toggleSidenav = new EventEmitter<void>();

  dropdownOpen = false;

  today = new Date();

  constructor(private router: Router) {}

  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }
  closeDropdown()  { this.dropdownOpen = false; }

  logout() {
    this.dropdownOpen = false;
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header__avatar-wrap')) {
      this.dropdownOpen = false;
    }
  }
}
