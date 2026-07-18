import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidenavComponent } from './sidenav/sidenav';
import { HeaderComponent } from './header/header';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidenavComponent, HeaderComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class LayoutComponent {
  sidenavOpen = signal(false);

  toggleSidenav() { this.sidenavOpen.update(v => !v); }
  closeSidenav()  { this.sidenavOpen.set(false); }
}
