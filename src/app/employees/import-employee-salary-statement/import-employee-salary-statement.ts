import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-import-employee-salary-statement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-employee-salary-statement.html',
  styleUrl: './import-employee-salary-statement.scss'
})
export class ImportEmployeeSalaryStatement implements OnInit {
  title = 'Import Employee Salary Statement';

  columns = [
    { key: 'batch', label: 'Batch No.' },
    { key: 'contractor', label: 'Contractor' },
    { key: 'month', label: 'Wage Month' },
    { key: 'records', label: 'Records' },
    { key: 'success', label: 'Success' },
    { key: 'failed', label: 'Failed' },
    { key: 'status', label: 'Status' }
  ];

  fields: any[] = [
    { key: 'contractor', label: 'Contractor', type: 'select', options: [] },
    { key: 'month', label: 'Wage Month', type: 'date' },
    { key: 'fileName', label: 'File Name', type: 'text' },
    { key: 'csvRows', label: 'Rows: EmpCode,Days,Basic,DA,OtherAllow,PF,ESIC,OtherDed (one per line)', type: 'text' },
    { key: 'markPaid', label: 'Mark batch as Paid after import', type: 'select', options: ['No', 'Yes'] }
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
        if (f) f.options = this.contractorsList.map((c: any) => c.contractorName);
        this.cdr.detectChanges();
      }, error: () => {}
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
    toastSuccess(`Batch #${row['batch']} — ${row['records']} records, ${row['success']} success, ${row['failed']} failed.`);
  }

  closeModal() { this.showModal = false; }

  save() {
    const contractorId = this.contractorsList.find((c: any) => c.contractorName === this.form['contractor'])?.contractorID;
    if (!contractorId) { toastError('Please select a contractor.'); return; }
    if (!this.form['month']) { toastError('Please select the wage month.'); return; }
    const lines = String(this.form['csvRows'] ?? '').split(/[\n;]+/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { toastError('Please enter at least one salary row.'); return; }
    const rows = lines.map((l, i) => {
      const p = l.split(',').map(s => s.trim());
      return {
        rowNumber: i + 1,
        employeeCode: p[0] ?? '',
        daysWorked: Number(p[1] || 0),
        basicWage: Number(p[2] || 0),
        da: Number(p[3] || 0),
        otherAllowances: Number(p[4] || 0),
        pfDeduction: Number(p[5] || 0),
        esicDeduction: Number(p[6] || 0),
        otherDeductions: Number(p[7] || 0)
      };
    });
    const payload = {
      contractorID: contractorId,
      wageMonth: this.form['month'],
      fileName: this.form['fileName'] || 'manual-entry.csv',
      rows
    };
    this.emsService.importSalaryBatch(payload).subscribe({
      next: (res: any) => {
        const d = res?.data ?? {};
        this.rows = [{
          batch: d.importBatchID ?? '—',
          contractor: this.form['contractor'],
          month: this.form['month'],
          records: d.totalRows ?? rows.length,
          success: d.successRows ?? '—',
          failed: d.failedRows ?? ((d.totalRows ?? 0) - (d.successRows ?? 0)),
          status: (d.failedRows ?? 0) > 0 ? 'Partial' : 'Imported'
        }, ...this.rows];
        this.showModal = false;
        this.page = 1;
        if (this.form['markPaid'] === 'Yes') {
          this.emsService.markSalaryPaid(contractorId, this.form['month']).subscribe({
            next: () => toastSuccess('Batch imported and marked as Paid.'),
            error: (err: any) => toastError(err?.error?.message || 'Imported, but Mark Paid failed.')
          });
        }
        this.cdr.detectChanges();
      },
      error: (err: any) => { toastError(err?.error?.message || 'Import failed.'); }
    });
  }

  // ── print / export ──
  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => String(r[c.key] ?? '')));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }
}
