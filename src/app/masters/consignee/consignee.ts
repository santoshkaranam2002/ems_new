import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-consignee',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consignee.html',
  styleUrl: './consignee.scss'
})
export class Consignee implements OnInit {
  title = 'Consignee';

  columns = [
  {
    "key": "name",
    "label": "Consignee"
  },
  {
    "key": "code",
    "label": "Code"
  },
  {
    "key": "typeName",
    "label": "Type"
  },
  {
    "key": "contact",
    "label": "Contact Person"
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
    "label": "Consignee Name",
    "type": "text"
  },
  {
    "key": "code",
    "label": "Code",
    "type": "text"
  },
  {
    "key": "typeName",
    "label": "Consignee Type",
    "type": "select",
    "options": []
  },
  {
    "key": "companyName",
    "label": "Company",
    "type": "select",
    "options": []
  },
  {
    "key": "locationName",
    "label": "Location",
    "type": "select",
    "options": []
  },
  {
    "key": "siteAddress",
    "label": "Site Address",
    "type": "text"
  },
  {
    "key": "headOfficeAddress",
    "label": "Head Office Address",
    "type": "text"
  },
  {
    "key": "contact",
    "label": "Contact Person",
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
  }
];

  rows: Row[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadData();
    this.loadLookups();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.emsService.getAllConsignees().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.consigneeID,
          name: d.consigneeName ?? '',
          code: d.consigneeCode ?? '',
          typeName: this.typeName(d.consigneeTypeID),
          companyName: this.companyName(d.companyID),
          locationName: this.locationName(d.locationID),
          siteAddress: d.siteAddress ?? '',
          headOfficeAddress: d.headOfficeAddress ?? '',
          contact: d.contactPerson ?? '',
          phone: d.phone ?? '',
          fax: d.fax ?? '',
          status: d.active === 1 ? 'Active' : 'Inactive'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Consignee from server.';
        this.cdr.detectChanges();
      }
    });
  }

  consigneeTypes: any[] = [];
  companiesList: any[] = [];
  locationsList: any[] = [];

  loadLookups(): void {
    this.emsService.getAllConsigneeTypes().subscribe({ next: (r: any) => {
      this.consigneeTypes = r?.data ?? [];
      this.setOptions('typeName', this.consigneeTypes.map(t => t.typeName));
      this.loadData();
    }, error: () => {} });
    this.emsService.getAllCompanies().subscribe({ next: (r: any) => {
      this.companiesList = r?.data ?? [];
      this.setOptions('companyName', this.companiesList.map(c => c.companyName));
      this.loadData();
    }, error: () => {} });
    this.emsService.getAllLocations().subscribe({ next: (r: any) => {
      this.locationsList = r?.data ?? [];
      this.setOptions('locationName', this.locationsList.map(l => l.locationName));
      this.loadData();
    }, error: () => {} });
  }

  private setOptions(key: string, opts: string[]) {
    const f: any = this.fields.find(x => x.key === key);
    if (f) f.options = opts;
    this.cdr.detectChanges();
  }

  typeName(id: any): string { return this.consigneeTypes.find(t => t.consigneeTypeID === id)?.typeName ?? ''; }
  companyName(id: any): string { return this.companiesList.find(c => c.companyID === id)?.companyName ?? ''; }
  locationName(id: any): string { return this.locationsList.find(l => l.locationID === id)?.locationName ?? ''; }
  typeIdByName(n: any) { return this.consigneeTypes.find(t => t.typeName === n)?.consigneeTypeID ?? null; }
  companyIdByName(n: any) { return this.companiesList.find(c => c.companyName === n)?.companyID ?? 0; }
  locationIdByName(n: any) { return this.locationsList.find(l => l.locationName === n)?.locationID ?? null; }

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
      consigneeID: 0,
      consigneeName: this.form['name'],
      consigneeCode: this.form['code'],
      consigneeTypeID: this.typeIdByName(this.form['typeName']),
      companyID: this.companyIdByName(this.form['companyName']),
      locationID: this.locationIdByName(this.form['locationName']),
      siteAddress: this.form['siteAddress'],
      headOfficeAddress: this.form['headOfficeAddress'],
      contactPerson: this.form['contact'],
      phone: this.form['phone'],
      fax: this.form['fax']
    };
    if (this.editIndex >= 0) {
      payload.consigneeID = this.form['_id'];
      this.emsService.updateConsignee(payload).subscribe({
        next: () => { this.showModal = false; toastSuccess('Updated successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Update failed.'); }
      });
    } else {
      this.emsService.addConsignee(payload).subscribe({
        next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
      });
    }
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete this record permanently?`)) return;
    this.emsService.deleteConsignee(row['_id']).subscribe({
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
