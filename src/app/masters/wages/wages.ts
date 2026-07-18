import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-wages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wages.html',
  styleUrl: './wages.scss'
})
export class Wages implements OnInit {
  title = 'Wages';

  columns = [
    { key: 'category', label: 'Emp Category' },
    { key: 'basis', label: 'Wage Basis' },
    { key: 'basic', label: 'Basic Rate' },
    { key: 'da', label: 'DA' },
    { key: 'effectiveFrom', label: 'Effective From' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'category', label: 'Emp Category', type: 'select', options: [] },
    { key: 'basis', label: 'Wage Basis', type: 'select', options: ['Daily', 'Monthly'] },
    { key: 'basic', label: 'Basic Rate', type: 'number' },
    { key: 'da', label: 'DA', type: 'number' },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date' }
  ];

  rows: Row[] = [];
  categories: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.getAllEmpCategories().subscribe({
      next: (r: any) => {
        this.categories = r?.data ?? [];
        const f = this.fields.find(x => x.key === 'category');
        if (f) f.options = this.categories.map(c => c.categoryName);
        this.loadData();
      },
      error: () => this.loadData()
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.emsService.getCurrentWages().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.wageID,
          category: d.categoryName ?? this.categories.find(c => c.empCategoryID === d.empCategoryID)?.categoryName ?? '',
          basis: d.wageBasis ?? '',
          basic: d.basicRate ?? 0,
          da: d.da ?? 0,
          effectiveFrom: d.effectiveFrom ? String(d.effectiveFrom).substring(0, 10) : '',
          status: d.active === 1 ? 'Active' : 'Inactive'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Wages from server.';
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
    // Wage rows are immutable — a revision is entered as a new rate
    this.editIndex = -1;
    this.form = { ...row };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    const catId = this.categories.find(c => c.categoryName === this.form['category'])?.empCategoryID;
    if (!catId) { toastError('Please select an employee category.'); return; }
    if (!this.form['effectiveFrom']) { toastError('Please select the effective date.'); return; }
    const payload = {
      empCategoryID: catId,
      wageBasis: this.form['basis'],
      basicRate: Number(this.form['basic'] || 0),
      da: Number(this.form['da'] || 0),
      effectiveFrom: this.form['effectiveFrom']
    };
    this.emsService.addWageNewRate(payload).subscribe({
      next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
    });
  }

  // ── delete ──
  deleteRow(row: Row) {
    toastError('Wage history cannot be deleted. Enter a new rate to supersede the current one.');
  }

  // ── print / export ──
  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => String(r[c.key] ?? '')));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }
}
