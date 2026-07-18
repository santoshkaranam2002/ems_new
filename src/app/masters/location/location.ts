import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { exportCsv, printTable, pillClass } from '../../shared/table-utils';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

interface Row { [key: string]: any; }

@Component({
  selector: 'app-location',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location.html',
  styleUrl: './location.scss'
})
export class Location implements OnInit {
  title = 'Location';

  columns = [
  {
    "key": "name",
    "label": "Location"
  },
  {
    "key": "code",
    "label": "Code"
  },
  {
    "key": "type",
    "label": "Type"
  },
  {
    "key": "gateNo",
    "label": "Gate No"
  },
  {
    "key": "status",
    "label": "Status"
  }
];

  fields: any[] = [
  {
    "key": "name",
    "label": "Location Name",
    "type": "text"
  },
  {
    "key": "code",
    "label": "Code",
    "type": "text"
  },
  {
    "key": "type",
    "label": "Location Type",
    "type": "select",
    "options": [
      "MainPlant",
      "Township",
      "Colony",
      "Other"
    ]
  },
  {
    "key": "gateNo",
    "label": "Gate No",
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
    this.emsService.getAllLocations().subscribe({
      next: (res: any) => {
        const list = res?.data ?? [];
        this.rows = list.map((d: any) => ({
          _id: d.locationID,
          name: d.locationName ?? '',
          code: d.locationCode ?? '',
          type: d.locationType ?? '',
          gateNo: d.gateNo ?? '',
          status: d.active === 1 ? 'Active' : 'Inactive'
        }));
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Failed to load Location from server.';
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
      locationID: 0,
      locationName: this.form['name'],
      locationCode: this.form['code'],
      locationType: this.form['type'],
      gateNo: this.form['gateNo']
    };
    if (this.editIndex >= 0) {
      payload.locationID = this.form['_id'];
      this.emsService.updateLocation(payload).subscribe({
        next: () => { this.showModal = false; toastSuccess('Updated successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Update failed.'); }
      });
    } else {
      this.emsService.addLocation(payload).subscribe({
        next: () => { this.showModal = false; this.page = 1; toastSuccess('Saved successfully.'); this.loadData(); },
        error: (err: any) => { toastError(err?.error?.message || 'Save failed.'); }
      });
    }
  }

  // ── delete ──
  deleteRow(row: Row) {
    if (!confirm(`Delete this record permanently?`)) return;
    this.emsService.deleteLocation(row['_id']).subscribe({
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
