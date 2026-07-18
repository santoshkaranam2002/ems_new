import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-contractors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contractors.html',
  styleUrl: './contractors.scss'
})
export class Contractors implements OnInit {
  title = 'Contractors';

  columns = [
  {
    "key": "name",
    "label": "Contractor"
  },
  {
    "key": "code",
    "label": "Code"
  },
  {
    "key": "contact",
    "label": "Contact Person"
  },
  {
    "key": "mobile",
    "label": "Mobile"
  },
  {
    "key": "licence",
    "label": "Labour Licence"
  },
  {
    "key": "licenceValid",
    "label": "Licence Valid To"
  },
  {
    "key": "status",
    "label": "Status"
  }
];

  fields: any[] = [
  {
    "key": "name",
    "label": "Contractor Name",
    "type": "text"
  },
  {
    "key": "contact",
    "label": "Contact Person",
    "type": "text"
  },
  {
    "key": "address",
    "label": "Address",
    "type": "text"
  },
  {
    "key": "phone",
    "label": "Phone",
    "type": "text"
  },
  {
    "key": "mobile",
    "label": "Mobile",
    "type": "text"
  },
  {
    "key": "email",
    "label": "Email",
    "type": "text"
  },
  {
    "key": "pfCode",
    "label": "PF Code",
    "type": "text"
  },
  {
    "key": "pfGroup",
    "label": "PF Group",
    "type": "text"
  },
  {
    "key": "insurancePolicyNo",
    "label": "Insurance Policy No",
    "type": "text"
  },
  {
    "key": "insuranceValidFrom",
    "label": "Insurance Valid From",
    "type": "date"
  },
  {
    "key": "insuranceValidTo",
    "label": "Insurance Valid To",
    "type": "date"
  },
  {
    "key": "noOfPersonsInsured",
    "label": "Persons Insured",
    "type": "number"
  },
  {
    "key": "licence",
    "label": "Labour Licence No",
    "type": "text"
  },
  {
    "key": "licenceValidFrom",
    "label": "Licence Valid From",
    "type": "date"
  },
  {
    "key": "licenceValid",
    "label": "Licence Valid To",
    "type": "date"
  },
  {
    "key": "noOfPersonsLicensed",
    "label": "Persons Licensed",
    "type": "number"
  },
  {
    "key": "workScope",
    "label": "Work Scope",
    "type": "text"
  },
  {
    "key": "bocwRegnNo",
    "label": "BOCW Regn No",
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
    this.emsService.searchContractors(this.searchTerm).subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.contractorID,
          name: d.contractorName ?? '',
          code: d.contractorCode ?? '',
          contact: d.contactPerson ?? '',
          address: d.address ?? '',
          phone: d.phone ?? '',
          mobile: d.mobile ?? '',
          email: d.email ?? '',
          pfCode: d.pfCode ?? '',
          pfGroup: d.pfGroup ?? '',
          insurancePolicyNo: d.insurancePolicyNo ?? '',
          insuranceValidFrom: d.insuranceValidFrom ? String(d.insuranceValidFrom).substring(0, 10) : '',
          insuranceValidTo: d.insuranceValidTo ? String(d.insuranceValidTo).substring(0, 10) : '',
          noOfPersonsInsured: d.noOfPersonsInsured ?? '',
          licence: d.labourLicenceNo ?? '',
          licenceValidFrom: d.licenceValidFrom ? String(d.licenceValidFrom).substring(0, 10) : '',
          licenceValid: d.licenceValidTo ? String(d.licenceValidTo).substring(0, 10) : '',
          noOfPersonsLicensed: d.noOfPersonsLicensed ?? '',
          workScope: d.workScope ?? '',
          bocwRegnNo: d.bocwRegnNo ?? '',
          status: d.active === 1 ? 'Active' : 'Inactive'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Contractors from server.';
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
      contractorName: this.form['name'],
      contactPerson: this.form['contact'],
      address: this.form['address'],
      phone: this.form['phone'],
      mobile: this.form['mobile'],
      email: this.form['email'],
      pfCode: this.form['pfCode'],
      pfGroup: this.form['pfGroup'],
      insurancePolicyNo: this.form['insurancePolicyNo'],
      insuranceValidFrom: this.form['insuranceValidFrom'] || null,
      insuranceValidTo: this.form['insuranceValidTo'] || null,
      noOfPersonsInsured: this.form['noOfPersonsInsured'] ? Number(this.form['noOfPersonsInsured']) : null,
      labourLicenceNo: this.form['licence'],
      licenceValidFrom: this.form['licenceValidFrom'] || null,
      licenceValidTo: this.form['licenceValid'] || null,
      noOfPersonsLicensed: this.form['noOfPersonsLicensed'] ? Number(this.form['noOfPersonsLicensed']) : null,
      workScope: this.form['workScope'],
      bocwRegnNo: this.form['bocwRegnNo']
    };
    if (this.editIndex >= 0) {
      payload.contractorID = this.form['_id'];
      this.emsService.updateContractor(payload).subscribe({
        next: () => { this.showModal = false; toastSuccess('Updated successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Update failed.'); }
      });
    } else {
      this.emsService.addContractor(payload).subscribe({
        next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
      });
    }
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete this record permanently?`)) return;
    this.emsService.deleteContractor(row['_id']).subscribe({
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
