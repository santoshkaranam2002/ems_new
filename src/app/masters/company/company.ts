import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company.html',
  styleUrl: './company.scss'
})
export class Company implements OnInit {
  title = 'Company';

  columns = [
  {
    "key": "name",
    "label": "Company"
  },
  {
    "key": "code",
    "label": "Code"
  },
  {
    "key": "city",
    "label": "City"
  },
  {
    "key": "phone",
    "label": "Phone"
  },
  {
    "key": "status",
    "label": "Status"
  }
];

  fields: any[] = [
  {
    "key": "name",
    "label": "Company Name",
    "type": "text"
  },
  {
    "key": "code",
    "label": "Code",
    "type": "text"
  },
  {
    "key": "address",
    "label": "Address",
    "type": "text"
  },
  {
    "key": "city",
    "label": "City",
    "type": "text"
  },
  {
    "key": "state",
    "label": "State",
    "type": "text"
  },
  {
    "key": "pincode",
    "label": "Pincode",
    "type": "text"
  },
  {
    "key": "phone",
    "label": "Phone",
    "type": "text"
  },
  {
    "key": "fax",
    "label": "Fax",
    "type": "text"
  },
  {
    "key": "cstNo",
    "label": "CST No",
    "type": "text"
  }
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
    this.emsService.getAllCompanies().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.companyID,
          name: d.companyName ?? '',
          code: d.companyCode ?? '',
          address: d.address ?? '',
          city: d.city ?? '',
          state: d.state ?? '',
          pincode: d.pincode ?? '',
          phone: d.phone ?? '',
          fax: d.fax ?? '',
          cstNo: d.cstNo ?? '',
          status: d.active === 1 ? 'Active' : 'Inactive'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Company from server.';
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
    for (const f of this.fields) this.form[f.key] = f.type === 'select' ? ((f as any).options?.[0] ?? '') : '';
    this.showModal = true;
  }

  openEdit(row: Row) {
    this.editIndex = this.rows.indexOf(row);
    this.form = { ...row };
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  save() {
    const first = this.fields[0].key;
    if (!String(this.form[first] ?? '').trim()) { toastError(this.fields[0].label + ' is required'); return; }
    const payload: any = {
      companyID: 0,
      companyName: this.form['name'],
      companyCode: this.form['code'],
      address: this.form['address'],
      city: this.form['city'],
      state: this.form['state'],
      pincode: this.form['pincode'],
      phone: this.form['phone'],
      fax: this.form['fax'],
      cstNo: this.form['cstNo']
    };
    if (this.editIndex >= 0) {
      payload.companyID = this.form['_id'];
      this.emsService.updateCompany(payload).subscribe({
        next: () => { this.showModal = false; toastSuccess('Updated successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Update failed.'); }
      });
    } else {
      this.emsService.addCompany(payload).subscribe({
        next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
      });
    }
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete this record permanently?`)) return;
    this.emsService.deleteCompany(row['_id']).subscribe({
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
