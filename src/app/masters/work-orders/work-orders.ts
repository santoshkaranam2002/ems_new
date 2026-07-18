import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.scss'
})
export class WorkOrders implements OnInit {
  title = 'Work Orders';

  columns = [
    { key: 'woNo', label: 'Work Order No' },
    { key: 'contractor', label: 'Contractor' },
    { key: 'woTitle', label: 'Title' },
    { key: 'value', label: 'Value' },
    { key: 'fromDate', label: 'From' },
    { key: 'toDate', label: 'To' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'contractor', label: 'Contractor', type: 'select', options: [] },
    { key: 'woTitle', label: 'Title', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'value', label: 'Work Order Value', type: 'number' },
    { key: 'fromDate', label: 'From Date', type: 'date' },
    { key: 'toDate', label: 'To Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed', 'Suspended'] }
  ];

  rows: Row[] = [];
  contractorsList: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.searchContractors('').subscribe({
      next: (r: any) => {
        this.contractorsList = r?.data ?? [];
        const f = this.fields.find(x => x.key === 'contractor');
        if (f) f.options = this.contractorsList.map(c => c.contractorName);
        this.loadData();
      },
      error: () => this.loadData()
    });
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.emsService.searchWorkOrders().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.workOrderID,
          _contractorId: d.contractorID,
          woNo: d.workOrderNo ?? '',
          contractor: d.contractorName ?? this.contractorName(d.contractorID),
          woTitle: d.title ?? '',
          notes: d.notes ?? '',
          value: d.workOrderValue ?? '',
          fromDate: d.fromDate ? String(d.fromDate).substring(0, 10) : '',
          toDate: d.toDate ? String(d.toDate).substring(0, 10) : '',
          status: d.woStatus ?? 'Open'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Work Orders from server.';
        this.cdr.detectChanges();
      }
    });
  }

  contractorName(id: any): string {
    return this.contractorsList.find(c => c.contractorID === id)?.contractorName ?? '';
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
    this.editIndex = this.rows.indexOf(row);
    this.form = { ...row };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    if (this.editIndex >= 0) {
      // API supports status update only for existing work orders
      this.emsService.updateWorkOrderStatus(this.form['_id'], this.form['status']).subscribe({
        next: () => { this.showModal = false; toastSuccess('Updated successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Status update failed.'); }
      });
      return;
    }
    const contractorId = this.contractorsList.find(c => c.contractorName === this.form['contractor'])?.contractorID;
    if (!contractorId) { toastError('Please select a contractor.'); return; }
    if (!this.form['fromDate'] || !this.form['toDate']) { toastError('Please select From and To dates.'); return; }
    const payload = {
      contractorID: contractorId,
      title: this.form['woTitle'],
      notes: this.form['notes'],
      workOrderValue: this.form['value'] ? Number(this.form['value']) : null,
      fromDate: this.form['fromDate'],
      toDate: this.form['toDate']
    };
    this.emsService.addWorkOrder(payload).subscribe({
      next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
      error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
    });
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete work order ${row['woNo']} permanently?`)) return;
    this.emsService.deleteWorkOrder(row['_id']).subscribe({
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
