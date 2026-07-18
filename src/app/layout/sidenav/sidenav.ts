import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavIconComponent } from './nav-icon';

export interface NavChild {
  label: string;
  route: string;
}

export interface NavItem {
  label: string;
  route: string | null;
  icon: string;
  badge: number;
  children: NavChild[] | null;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [CommonModule, RouterModule, NavIconComponent],
  templateUrl: './sidenav.html',
  styleUrl: './sidenav.scss'
})
export class SidenavComponent {
  @Input() mobileOpen = false;
  @Output() closeMobile = new EventEmitter<void>();

  expandedMenus = signal<Set<string>>(new Set(['Masters']));

  navSections: NavSection[] = [
    {
      title: 'MAIN',
      items: [
        { label: 'Dashboard', route: '/dashboard', icon: 'grid', badge: 0, children: null }
      ]
    },
    {
      title: 'MODULES',
      items: [
        {
          label: 'Masters', icon: 'layers', route: null, badge: 0,
          children: [
            { label: 'Company', route: '/masters/company' },
            { label: 'Consignee', route: '/masters/consignee' },
            { label: 'Contractors', route: '/masters/contractors' },
            { label: 'Work Orders', route: '/masters/work-orders' },
            { label: 'Location', route: '/masters/location' },
            { label: 'Wages', route: '/masters/wages' },
            { label: 'Holiday Information', route: '/masters/holiday-information' },
            { label: 'Village', route: '/masters/village' },
            { label: 'Consignee Type', route: '/masters/consignee-type' }
          ]
        },
        {
          label: 'Employees', icon: 'users', route: null, badge: 0,
          children: [
            { label: 'Registration', route: '/employees/registration' },
            { label: 'Renew', route: '/employees/renew' },
            { label: 'Cancelation', route: '/employees/cancelation' },
            { label: 'Group Pass Issue', route: '/employees/group-pass-issue' },
            { label: 'Employee Salary Statement', route: '/employees/salary-statement' },
            { label: 'Import Salary Statement', route: '/employees/import-salary-statement' },
            { label: 'Assign Village to Employee', route: '/employees/assign-village' }
          ]
        },
        {
          label: 'Reports', icon: 'file-text', route: null, badge: 0,
          children: [
            { label: 'Employee Information', route: '/reports/employee-information' },
            { label: 'Contractor wise Employees', route: '/reports/contractor-wise-employees' },
            { label: 'General Pass Expiry', route: '/reports/general-pass-expiry' },
            { label: 'Form 6A', route: '/reports/form-6a' },
            { label: 'Blood Group Information', route: '/reports/blood-group-information' },
            { label: 'Safety Training', route: '/reports/safety-training' },
            { label: 'Personal Information', route: '/reports/personal-information' },
            { label: 'Group Pass Expiry', route: '/reports/group-pass-expiry' },
            { label: 'Salary Not Issued', route: '/reports/salary-not-issued' },
            { label: 'Contractor Wise Information', route: '/reports/contractor-wise-information' },
            { label: 'Contractor Wise Work Orders', route: '/reports/contractor-wise-work-orders' },
            { label: 'Employee From Main Village', route: '/reports/employee-from-main-village' },
            { label: 'PF Report', route: '/reports/pf-report' },
            { label: 'Adjustment', route: '/reports/adjustment' },
            { label: 'Contractor wise Released', route: '/reports/contractor-wise-released' }
          ]
        }
      ]
    },
    {
      title: 'UTILITIES',
      items: [
        { label: 'Users', route: '/utilities/users', icon: 'shield-user', badge: 0, children: null },
        { label: 'Change Password', route: '/utilities/change-password', icon: 'key', badge: 0, children: null }
      ]
    }
  ];

  toggleMenu(label: string) {
    const next = new Set(this.expandedMenus());
    if (next.has(label)) { next.delete(label); } else { next.add(label); }
    this.expandedMenus.set(next);
  }

  isExpanded(label: string) {
    return this.expandedMenus().has(label);
  }

  onLinkClick() {
    this.closeMobile.emit();
  }
}
