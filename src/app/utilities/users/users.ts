import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users implements OnInit {
  title = 'Users';

  columns = [
    { key: 'name', label: 'User' },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'lastLogin', label: 'Last Login' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'name', label: 'Full Name', type: 'text' },
    { key: 'username', label: 'Username', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'password', label: 'Password', type: 'text' },
    { key: 'role', label: 'Role', type: 'select', options: [] }
  ];

  rows: Row[] = [];
  roles: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.getAllRoles().subscribe({
      next: (r: any) => {
        this.roles = r?.data ?? [];
        const f = this.fields.find(x => x.key === 'role');
        if (f) f.options = this.roles.map(x => x.roleName);
        this.loadData();
      },
      error: () => this.loadData()
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.emsService.getAllUsers().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.userID,
          name: d.fullName ?? '',
          username: d.username ?? '',
          email: d.email ?? '',
          role: d.roleName ?? '',
          lastLogin: d.lastLoginOn ? String(d.lastLoginOn).substring(0, 16).replace('T', ' ') : '—',
          _locked: !!d.isLocked,
          status: d.isLocked ? 'Locked' : (d.active === 1 ? 'Active' : 'Inactive')
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Users from server.';
        this.cdr.detectChanges();
      }
    });
  }

  // ── search / pagination ──
  searchTerm = '';
  page = 1;
  pageSize = 5;

  get filtered(): Row[] {
    const t = this.searchTerm.trim().toLowerCase();
    if (!t) return this.rows;
    return this.rows.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(t)));
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paged(): Row[] {
    const p = Math.min(this.page, this.totalPages);
    return this.filtered.slice((p - 1) * this.pageSize, p * this.pageSize);
  }
  onSearch() { this.page = 1; }
  setPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }

  pill = pillClass;

  // ── add / edit popup ──
  showModal = false;
  editIndex = -1;
  form: Row = {};

  openAdd() {
    this.editIndex = -1;
    this.form = {};
    for (const f of this.fields) this.form[f.key] = f.type === 'select' ? (f.options?.[0] ?? '') : '';
    this.showModal = true;
  }

  openEdit(row: Row) {
    // API has no user-update endpoint: edit toggles Lock/Unlock
    const action = row['_locked'] ? 'Unlock' : 'Lock';
    if (!confirm(`${action} user "${row['username']}"?`)) return;
    this.emsService.lockUser(row['_id'], !row['_locked']).subscribe({
      next: () => { toastSuccess('Deleted successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || `${action} failed.`); }
    });
  }

  closeModal() { this.showModal = false; }

  save() {
    if (!String(this.form['name'] ?? '').trim()) { toastError('Username is required'); return; }
    const roleId = this.roles.find(r => r.roleName === this.form['role'])?.roleID;
    if (!roleId) { toastError('Please select a role.'); return; }
    if (!String(this.form['password'] ?? '').trim()) { toastError('Please enter a password.'); return; }
    const payload = {
      username: this.form['username'],
      password: this.form['password'],
      fullName: this.form['name'],
      email: this.form['email'],
      roleID: roleId
    };
    this.emsService.createUser(payload).subscribe({
      next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
    });
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete user "${row['username']}" permanently?`)) return;
    this.emsService.deleteUser(row['_id']).subscribe({
      next: () => { toastSuccess('Deleted successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || 'Delete failed.'); }
    });
  }

  // ── print / export ──
  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => String(r[c.key] ?? '')));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }
}
