import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-cancelation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancelation.html',
  styleUrl: './cancelation.scss'
})
export class Cancelation implements OnInit {
  title = 'Pass Cancellation';

  contractors: string[] = ['All Contractors'];
  contractorsList: any[] = [];
  villagesList: any[] = [];
  selContractor = 'All Contractors';
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  columns = [{'key': 'code', 'label': 'Emp Code'}, {'key': 'name', 'label': 'Employee'}, {'key': 'contractor', 'label': 'Contractor'}, {'key': 'passExpiry', 'label': 'Pass Expiry'}, {'key': 'status', 'label': 'Status'}];

  popupFields: any[] = [{'key': 'reason', 'label': 'Cancellation Reason', 'type': 'select', 'options': ['Left organisation', 'Contract completed', 'Medical grounds', 'Disciplinary']}, {'key': 'remarks', 'label': 'Remarks', 'type': 'text'}];

  rows: Row[] = [];

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.searchContractors('').subscribe({
      next: (r: any) => {
        this.contractorsList = r?.data ?? [];
        this.contractors = ['All Contractors', ...this.contractorsList.map((c: any) => c.contractorName)];
        this.cdr.detectChanges();
      }, error: () => {}
    });
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const contractorId = this.contractorsList.find(c => c.contractorName === this.selContractor)?.contractorID;
    this.emsService.searchEmployees(contractorId, undefined, undefined, '', this.searchTerm, 1, 200).subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _empId: d.employeeID,
          code: d.employeeCode ?? '',
          name: d.employeeName ?? '',
          contractor: d.contractorName ?? '',
          passExpiry: d.passExpiryDate ? String(d.passExpiryDate).substring(0, 10) : '—',
          status: d.passStatus ?? d.empStatus ?? 'Active'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load employees from server.';
        this.cdr.detectChanges();
      }
    });
  }

  page = 1;
  pageSize = 5;

  get filtered(): Row[] {
    let list = this.rows;
    if (this.selContractor !== 'All Contractors') list = list.filter(r => r['contractor'] === this.selContractor);
    const t = this.searchTerm.trim().toLowerCase();
    if (t) list = list.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(t)));
    return list;
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
  isDisabled(r: Row): boolean { return r['status'] === 'Cancelled' || r['status'] === 'Released'; }

  // ── action popup ──
  showModal = false;
  target: Row | null = null;
  form: Row = {};

  openAction(row: Row) {
    this.target = row;
    this.form = {};
    for (const f of this.popupFields) this.form[f.key] = f.type === 'select' ? (f.options?.[0] ?? '') : '';
    this.showModal = true;
  }
  closeModal() { this.showModal = false; this.target = null; }

  confirmAction() {
    if (!this.target) return;
    const reason = `${this.form['reason']}${this.form['remarks'] ? ' - ' + this.form['remarks'] : ''}`;
    const empId = this.target['_empId'];
    this.emsService.getEmployeeById(empId).subscribe({
      next: (res: any) => {
        const gp = res?.data?.latestGatePass;
        const gpId = gp?.gatePassID ?? gp?.GatePassID;
        const release = () => this.emsService.releaseEmployee(empId, reason).subscribe({
          next: () => { this.showModal = false; this.target = null; toastSuccess('Employee released and pass cancelled.'); this.loadData(); },
          error: (err: any) => { toastError(err?.error?.message || 'Release failed.'); }
        });
        if (gpId) {
          this.emsService.cancelGatePass(gpId, reason).subscribe({ next: () => release(), error: () => release() });
        } else {
          release();
        }
      },
      error: () => toastError('Could not load employee details.')
    });
  }

  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => String(r[c.key] ?? '')));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }

  // ── row detail view ──
  viewRow: any = null;
  viewEmp: any = null;
  viewLoading = false;

  openView(r: any) {
    this.viewRow = r;
    this.viewEmp = null;
    const id = Number(r['_empId'] || r['_id'] || 0);
    if (id) {
      this.viewLoading = true;
      this.emsService.getEmployeeById(id).subscribe({
        next: (res: any) => { this.viewLoading = false; this.viewEmp = res?.data || null; this.cdr.detectChanges(); },
        error: () => { this.viewLoading = false; this.cdr.detectChanges(); }
      });
    }
    this.cdr.detectChanges();
  }

  closeView() { this.viewRow = null; this.viewEmp = null; this.cdr.detectChanges(); }

  get viewPairs(): string[][] {
    if (!this.viewRow) { return []; }
    return this.columns.map((c: any) => [c.label, String(this.viewRow[c.key] ?? '\u2014')]);
  }

  get empPairs(): string[][] {
    const e = this.viewEmp?.employee;
    if (!e) { return []; }
    const out: string[][] = [];
    for (const k of Object.keys(e)) {
      const v = (e as any)[k];
      if (v === null || v === undefined || v === '') { continue; }
      if (k.toLowerCase().endsWith('id') && k.toLowerCase() !== 'trainingid') { continue; }
      let val = String(v);
      if (/date/i.test(k) && val.indexOf('T') > 0) { val = val.substring(0, 10); }
      out.push([this.prettyKey(k), val]);
    }
    return out;
  }

  get addrList(): any[] { return this.viewEmp?.addresses || []; }
  get gatePassView(): any { return this.viewEmp?.latestGatePass || null; }

  prettyKey(k: string): string {
    return k.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
  }

  fmtAny(d: any): string {
    if (!d) { return '\u2014'; }
    const s = String(d);
    return s.indexOf('T') > 0 ? s.substring(0, 10) : s;
  }
}
