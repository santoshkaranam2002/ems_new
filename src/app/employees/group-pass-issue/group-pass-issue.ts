import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-group-pass-issue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './group-pass-issue.html',
  styleUrl: './group-pass-issue.scss'
})
export class GroupPassIssue implements OnInit {
  title = 'Group Pass Issue';

  columns = [
    { key: 'gp', label: 'Group Pass No.' },
    { key: 'contractor', label: 'Contractor' },
    { key: 'wo', label: 'Work Order' },
    { key: 'members', label: 'Members' },
    { key: 'expiry', label: 'Expiry Date' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'contractor', label: 'Contractor', type: 'select', options: [] },
    { key: 'wo', label: 'Work Order', type: 'select', options: [] },
    { key: 'validity', label: 'Validity (months)', type: 'select', options: ['12', '6', '24'] },
    { key: 'employeeCodes', label: 'Employee IDs (comma separated)', type: 'text' }
  ];

  rows: Row[] = [];
  contractorsList: any[] = [];
  workOrdersList: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.searchContractors('').subscribe({
      next: (r: any) => {
        this.contractorsList = r?.data ?? [];
        const f = this.fields.find(x => x.key === 'contractor');
        if (f) f.options = this.contractorsList.map((c: any) => c.contractorName);
        this.cdr.detectChanges();
      }, error: () => {}
    });
    this.emsService.searchWorkOrders().subscribe({
      next: (r: any) => {
        this.workOrdersList = r?.data ?? [];
        const f = this.fields.find(x => x.key === 'wo');
        if (f) f.options = this.workOrdersList.map((w: any) => w.workOrderNo);
        this.cdr.detectChanges();
      }, error: () => {}
    });
  }

  private pushGroupPass(d: any): void {
    const row: Row = {
      _id: d.groupPassID,
      gp: d.groupPassNo ?? '',
      contractor: this.contractorsList.find((c: any) => c.contractorID === d.contractorID)?.contractorName ?? d.contractorName ?? '',
      wo: this.workOrdersList.find((w: any) => w.workOrderID === d.workOrderID)?.workOrderNo ?? d.workOrderNo ?? '',
      members: d.memberCount ?? d.members?.length ?? '',
      expiry: d.expiryDate ? String(d.expiryDate).substring(0, 10) : '',
      status: d.groupPassStatus ?? 'Active'
    };
    const i = this.rows.findIndex(r => r['_id'] === row['_id']);
    if (i >= 0) this.rows[i] = row; else this.rows = [row, ...this.rows];
    this.cdr.detectChanges();
  }

  // Search by Group Pass ID: type a numeric ID in the search box to fetch from server
  lookupById(): void {
    const id = Number(this.searchTerm.trim());
    if (!id) return;
    this.emsService.getGroupPassById(id).subscribe({
      next: (res: any) => { if (res?.data) this.pushGroupPass(res.data); },
      error: () => {}
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
  onSearch() { this.page = 1; this.lookupById(); }
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
    // Show members of the selected group pass, then offer cancellation
    this.emsService.getGroupPassMembers(row['_id']).subscribe({
      next: (res: any) => {
        const members = (res?.data ?? []).map((m: any) => `${m.employeeCode ?? m.employeeID} - ${m.employeeName ?? ''}`).join('\n');
        const cancel = confirm(`Group Pass ${row['gp']} members:\n\n${members || '(none)'}\n\nPress OK to CANCEL this group pass, or Cancel to close.`);
        if (cancel) {
          this.emsService.cancelGroupPass(row['_id']).subscribe({
            next: () => { row['status'] = 'Cancelled'; this.cdr.detectChanges(); },
            error: (err: any) => { toastError(err?.error?.message || 'Cancellation failed.'); }
          });
        }
      },
      error: (err: any) => { toastError(err?.error?.message || 'Could not load group pass members.'); }
    });
  }

  closeModal() { this.showModal = false; }

  save() {
    const contractorId = this.contractorsList.find((c: any) => c.contractorName === this.form['contractor'])?.contractorID;
    const workOrderId = this.workOrdersList.find((w: any) => w.workOrderNo === this.form['wo'])?.workOrderID;
    if (!contractorId || !workOrderId) { toastError('Please select contractor and work order.'); return; }
    const employeeIds = String(this.form['employeeCodes'] ?? '')
      .split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (employeeIds.length === 0) { toastError('Please enter at least one employee ID.'); return; }
    this.emsService.issueGroupPass(contractorId, workOrderId, Number(this.form['validity'] || 12), employeeIds).subscribe({
      next: (res: any) => {
        toastSuccess('Group pass issued successfully.');
        this.showModal = false;
        this.page = 1;
        if (res?.data) this.pushGroupPass(res.data);
      },
      error: (err: any) => { toastError(err?.error?.message || 'Group pass issue failed.'); }
    });
  }

  // ── print / export ──
  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => String(r[c.key] ?? '')));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }
}
