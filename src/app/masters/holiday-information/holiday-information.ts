import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-holiday-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './holiday-information.html',
  styleUrl: './holiday-information.scss'
})
export class HolidayInformation implements OnInit {
  title = 'Holiday Information';

  year = new Date().getFullYear();

  columns = [
    { key: 'name', label: 'Holiday' },
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'name', label: 'Holiday Name', type: 'text' },
    { key: 'date', label: 'Holiday Date', type: 'date' },
    { key: 'type', label: 'Holiday Type', type: 'select', options: ['National', 'Festival', 'Optional'] }
  ];

  rows: Row[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.emsService.getHolidaysByYear(this.year).subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.holidayID,
          name: d.holidayName ?? '',
          date: d.holidayDate ? String(d.holidayDate).substring(0, 10) : '',
          type: d.holidayType ?? 'National',
          status: 'Active'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Holidays from server.';
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
    // No update API for holidays — delete and re-add to change a holiday
    this.editIndex = this.rows.indexOf(row);
    this.form = { ...row };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    if (!String(this.form['name'] ?? '').trim()) { toastError('Holiday name is required'); return; }
    if (!this.form['date']) { toastError('Please select the holiday date.'); return; }
    const payload = {
      holidayName: this.form['name'],
      holidayDate: this.form['date'],
      holidayType: this.form['type']
    };
    const doAdd = () => this.emsService.addHoliday(payload).subscribe({
      next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
    });
    if (this.editIndex >= 0 && this.form['_id']) {
      // simulate update: delete old record then insert the edited one
      this.emsService.deleteHoliday(this.form['_id']).subscribe({
        next: () => doAdd(),
        error: (err: any) => { toastError(err?.error?.message || 'Update failed.'); }
      });
    } else {
      doAdd();
    }
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete holiday "${row['name']}" permanently?`)) return;
    this.emsService.deleteHoliday(row['_id']).subscribe({
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
