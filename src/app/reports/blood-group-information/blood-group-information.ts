import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';

interface Row { [key: string]: string; }

@Component({
  selector: 'app-blood-group-information',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blood-group-information.html',
  styleUrl: './blood-group-information.scss'
})
export class BloodGroupInformation implements OnInit {
  title = 'Employee Blood Group Information';

  contractors: string[] = ['All Contractors'];
  locations: string[] = ['All Locations'];
  private contractorList: any[] = [];
  private locationList: any[] = [];

  selContractor = 'All Contractors';
  selLocation   = 'All Locations';
  fromDate = '';
  toDate   = '';
  generatedAt: Date | null = null;
  loading = false;

  columns = [
  {
    key: "code",
    label: "Emp Code"
  },
  {
    key: "name",
    label: "Employee"
  },
  {
    key: "contractor",
    label: "Contractor"
  },
  {
    key: "bloodGroup",
    label: "Blood Group"
  },
  {
    key: "mobile",
    label: "Mobile"
  },
  {
    key: "workArea",
    label: "Work Area"
  }
];

  rows: Row[] = [];

  page = 1;
  pageSize = 6;

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.emsService.searchContractors().subscribe({
      next: (res: any) => {
        this.contractorList = res?.data || [];
        this.contractors = ['All Contractors'].concat(this.contractorList.map((x: any) => x.contractorName));
        this.cdr.detectChanges();
      }
    });
    this.emsService.getAllLocations().subscribe({
      next: (res: any) => {
        this.locationList = res?.data || [];
        this.locations = ['All Locations'].concat(this.locationList.map((x: any) => x.locationName));
        this.cdr.detectChanges();
      }
    });
    this.generate();
  }

  private contractorId(): number | undefined {
    const f = this.contractorList.find((x: any) => x.contractorName === this.selContractor);
    return f ? f.contractorID : undefined;
  }

  private locationId(): number | undefined {
    const f = this.locationList.find((x: any) => x.locationName === this.selLocation);
    return f ? f.locationID : undefined;
  }

  fmtDate(d: any): string {
    if (!d) { return '—'; }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) { return '—'; }
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  fmtMonth(d: any): string {
    if (!d) { return '—'; }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) { return '—'; }
    return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  get filtered(): Row[] {
    let list = this.rows;
    if (this.selContractor !== 'All Contractors') {
      list = list.filter(r => !('contractor' in r) || r['contractor'] === this.selContractor);
    }
    return list;
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.filtered.length / this.pageSize)); }
  get pages(): number[] { return Array.from({ length: this.totalPages }, (_, i) => i + 1); }
  get paged(): Row[] {
    const p = Math.min(this.page, this.totalPages);
    return this.filtered.slice((p - 1) * this.pageSize, p * this.pageSize);
  }
  setPage(p: number) { if (p >= 1 && p <= this.totalPages) this.page = p; }

  generate() {
    this.page = 1;
    this.generatedAt = new Date();
    this.loading = true;
    this.emsService.searchEmployees(this.contractorId(), this.locationId(), undefined, '', '', 1, 500).subscribe({
      next: (res: any) => {
        this.loading = false;
        const data = res?.data || [];
        this.rows = data.map((r: any) => ({
          _id: String(r.employeeID || ''),
          code: r.employeeCode || '',
          name: r.employeeName || '',
          contractor: r.contractorName || '',
          bloodGroup: '—',
          mobile: '—',
          workArea: r.workArea || '—'
        }));
        this.enrichDetails((row, e, detail) => {
          row['bloodGroup'] = e.bloodGroup || e.BloodGroup || '—';
          const addrs = detail.addresses || [];
          if (addrs[0] && addrs[0].mobile) { row['mobile'] = addrs[0].mobile; }
        });
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.rows = []; this.cdr.detectChanges(); }
    });
  }

  private enrichDetails(mapFn: (row: Row, e: any, detail: any) => void): void {
    const cap = Math.min(this.rows.length, 60);
    for (let i = 0; i < cap; i++) {
      const row = this.rows[i];
      const id = Number(row['_id']);
      if (!id) { continue; }
      this.emsService.getEmployeeById(id).subscribe({
        next: (res: any) => {
          const d = res?.data;
          if (d && d.employee) { mapFn(row, d.employee, d); }
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }


  // ── row detail view ──
  viewRow: Row | null = null;
  viewEmp: any = null;
  viewLoading = false;

  openView(r: Row) {
    this.viewRow = r;
    this.viewEmp = null;
    const id = Number((r as any)['_id'] || 0);
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
    return this.columns.map(c => [c.label, String(this.viewRow![c.key] ?? '\u2014')]);
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

  pill = pillClass;
  isPillCol(key: string): boolean { return key === 'status'; }

  private matrix(): string[][] {
    return this.filtered.map(r => this.columns.map(c => r[c.key] ?? ''));
  }
  doExport() { exportCsv(this.title, this.columns.map(c => c.label), this.matrix()); }
  doPrint() { printTable(this.title, this.columns.map(c => c.label), this.matrix()); }
}
