import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmsService } from '../../services/ems.service';

interface KpiItem {
  label: string;
  value: string;
  trend: string;
  up: boolean;
}

interface PassSlice {
  label: string;
  value: number;
  color: string;
}

interface Gauge {
  label: string;
  pct: number;
  tone: string;
  sub: string;
}

interface ActivityItem {
  time: string;
  title: string;
  desc: string;
  tone: 'green' | 'blue' | 'orange' | 'red' | 'gold';
}

interface LeaderRow {
  rank: number;
  name: string;
  employees: number;
  workOrders: number;
  compliance: number;
}

interface RecentEmployee {
  name: string;
  code: string;
  contractor: string;
  passExpiry: string;
  status: 'Active' | 'Expiring' | 'Renewed' | 'Pending';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  today = new Date();

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadTrend();
    this.loadActivity();
    this.loadRecentEmployees();
  }

  loadSummary(): void {
    this.emsService.getDashboardSummary().subscribe({
      next: (res: any) => {
        const d = res?.data;
        if (!d) { return; }
        const fmt = (n: any) => (n === null || n === undefined) ? '0' : Number(n).toLocaleString('en-IN');
        this.kpis = [
          { label: 'Total Employees', value: fmt(d.totalEmployees), trend: fmt(d.activeEmployees) + ' active', up: true },
          { label: 'Active Passes',   value: fmt(d.activePasses),   trend: (d.totalEmployees ? ((d.activePasses / d.totalEmployees) * 100).toFixed(1) : '0') + '% coverage', up: true },
          { label: 'Contractors',     value: fmt(d.totalContractors), trend: fmt(d.openWorkOrders) + ' open WOs', up: true },
          { label: 'Passes Expiring', value: fmt(d.expiringPasses), trend: 'next 30 days', up: false },
        ];
        const cancelled = Math.max(0, (d.totalEmployees || 0) - (d.activePasses || 0) - (d.expiringPasses || 0) - (d.expiredPasses || 0));
        this.passSlices = [
          { label: 'Active',    value: d.activePasses || 0,   color: '#16a34a' },
          { label: 'Expiring',  value: d.expiringPasses || 0, color: '#ea8a0c' },
          { label: 'Expired',   value: d.expiredPasses || 0,  color: '#dc2626' },
          { label: 'Other',     value: cancelled,             color: '#c9bfc3' },
        ];
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadTrend(): void {
    this.emsService.getRegistrationTrend(6).subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        if (!rows.length) { return; }
        const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        this.trendMonths = rows.map((r: any) => {
          const dt = new Date(r.monthStart);
          return names[dt.getMonth()];
        });
        this.trendValues = rows.map((r: any) => r.registeredCount || 0);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadActivity(): void {
    this.emsService.getRecentActivity(6).subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        if (!rows.length) { return; }
        const toneFor = (action: string): 'green' | 'blue' | 'orange' | 'red' | 'gold' => {
          const s = (action || '').toLowerCase();
          if (s.indexOf('delete') >= 0 || s.indexOf('cancel') >= 0 || s.indexOf('release') >= 0) { return 'red'; }
          if (s.indexOf('update') >= 0 || s.indexOf('renew') >= 0) { return 'blue'; }
          if (s.indexOf('insert') >= 0 || s.indexOf('create') >= 0 || s.indexOf('register') >= 0) { return 'green'; }
          return 'gold';
        };
        const nice = (txt: string): string => {
          return String(txt || '').replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
        };
        this.activities = rows.map((r: any) => {
          let time = '';
          if (r.createdDate) {
            const d2 = new Date(r.createdDate);
            time = d2.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          }
          const title = nice(r.action) + ' · ' + nice(r.tableName);
          const desc = (r.changedByName ? 'By ' + r.changedByName : 'System') +
                       (r.recordID ? ' · Record #' + r.recordID : '');
          return { time: time, title: title, desc: desc, tone: toneFor(r.action) };
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadRecentEmployees(): void {
    this.emsService.searchEmployees(undefined, undefined, undefined, undefined, undefined, 1, 5).subscribe({
      next: (res: any) => {
        const rows = res?.data || [];
        if (!rows.length) { return; }
        this.recentEmployees = rows.map((r: any) => {
          let expiry = '—';
          if (r.passExpiryDate) {
            expiry = new Date(r.passExpiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
          }
          let status: 'Active' | 'Expiring' | 'Renewed' | 'Pending' = 'Active';
          const ps = (r.passStatus || '').toLowerCase();
          if (ps.indexOf('expir') >= 0) { status = 'Expiring'; }
          else if (ps.indexOf('renew') >= 0) { status = 'Renewed'; }
          else if (!ps || ps.indexOf('pend') >= 0) { status = 'Pending'; }
          return {
            name: r.employeeName || '',
            code: r.employeeCode || '',
            contractor: r.contractorName || '',
            passExpiry: expiry,
            status: status
          };
        });
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ── Command strip KPIs ──
  kpis: KpiItem[] = [
    { label: 'Total Employees', value: '2,847', trend: '+128 this month', up: true },
    { label: 'Active Passes',   value: '2,412', trend: '84.7% coverage',  up: true },
    { label: 'Contractors',     value: '46',    trend: '39 engaged',      up: true },
    { label: 'Passes Expiring', value: '93',    trend: 'next 30 days',    up: false },
  ];

  // ── Donut: pass status ──
  passSlices: PassSlice[] = [
    { label: 'Active',    value: 2412, color: '#16a34a' },
    { label: 'Expiring',  value: 93,   color: '#ea8a0c' },
    { label: 'Expired',   value: 187,  color: '#dc2626' },
    { label: 'Cancelled', value: 155,  color: '#c9bfc3' },
  ];

  get passTotal(): number {
    return this.passSlices.reduce((a, s) => a + s.value, 0);
  }

  get donutGradient(): string {
    const total = this.passTotal;
    if (!total) { return 'conic-gradient(#e9e4e2 0deg 360deg)'; }
    let acc = 0;
    const stops = this.passSlices.map(s => {
      const from = (acc / total) * 360;
      acc += s.value;
      const to = (acc / total) * 360;
      return `${s.color} ${from}deg ${to}deg`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  slicePct(s: PassSlice): string {
    if (!this.passTotal) { return '0%'; }
    return ((s.value / this.passTotal) * 100).toFixed(1) + '%';
  }

  // ── Compliance gauges ──
  gauges: Gauge[] = [
    { label: 'Safety Training', pct: 91, tone: '#16a34a', sub: '2,203 of 2,412 trained' },
    { label: 'PF Enrollment',   pct: 96, tone: '#2563eb', sub: '2,733 accounts linked' },
    { label: 'ESIC Coverage',   pct: 88, tone: '#b8862e', sub: '2,505 employees covered' },
  ];

  gaugeStyle(g: Gauge): string {
    return `conic-gradient(${g.tone} ${g.pct * 3.6}deg, #e9e4e2 0deg)`;
  }

  // ── Area chart: registrations Feb–Jul ──
  trendValues = [96, 132, 118, 171, 149, 128];
  trendMonths = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  get trendPoints(): string {
    if (!this.trendValues.length) { return '0,180 600,180'; }
    const max = Math.max(1, Math.max(...this.trendValues)) * 1.15;
    const stepX = this.trendValues.length > 1 ? 600 / (this.trendValues.length - 1) : 600;
    if (this.trendValues.length === 1) {
      const y = 180 - (this.trendValues[0] / max) * 180;
      return `0,${y} 600,${y}`;
    }
    return this.trendValues
      .map((v, i) => `${i * stepX},${180 - (v / max) * 180}`)
      .join(' ');
  }

  get trendArea(): string {
    return `0,180 ${this.trendPoints} 600,180`;
  }

  trendX(i: number): number {
    if (this.trendValues.length <= 1) { return 0; }
    return i * (600 / (this.trendValues.length - 1));
  }

  trendY(i: number): number {
    if (!this.trendValues.length) { return 180; }
    const max = Math.max(1, Math.max(...this.trendValues)) * 1.15;
    return 180 - (this.trendValues[i] / max) * 180;
  }

  // ── Activity timeline ──
  activities: ActivityItem[] = [
    { time: '09:42', title: 'New registration approved',  desc: 'K. Ramesh Naidu · SVR Engineering Works', tone: 'green' },
    { time: '09:10', title: 'Group pass issued',          desc: '14 members · WO/2026/0141 · Boiler Maint.', tone: 'gold' },
    { time: '08:47', title: 'Pass renewed',               desc: 'S. Anil Kumar · valid till 30 Jun 2027', tone: 'blue' },
    { time: '08:15', title: 'Pass expiring alert',        desc: 'B. Venkata Rao · 4 days remaining', tone: 'orange' },
    { time: 'Yest.', title: 'Salary statement imported',  desc: 'Coastal Infra Services · June 2026', tone: 'blue' },
    { time: 'Yest.', title: 'Pass cancelled',             desc: 'G. Mahesh · left organisation', tone: 'red' },
  ];

  // ── Contractor leaderboard ──
  leaders: LeaderRow[] = [
    { rank: 1, name: 'SVR Engineering Works',  employees: 486, workOrders: 14, compliance: 97 },
    { rank: 2, name: 'Coastal Infra Services', employees: 402, workOrders: 11, compliance: 93 },
    { rank: 3, name: 'Godavari Mech Pvt Ltd',  employees: 331, workOrders: 9,  compliance: 91 },
    { rank: 4, name: 'Sai Teja Enterprises',   employees: 264, workOrders: 7,  compliance: 88 },
    { rank: 5, name: 'Vizag Power Solutions',  employees: 197, workOrders: 6,  compliance: 84 },
  ];

  // ── Recent registrations ──
  recentEmployees: RecentEmployee[] = [
    { name: 'K. Ramesh Naidu', code: 'EMP-24817', contractor: 'SVR Engineering Works',  passExpiry: '08 Jan 2027', status: 'Active' },
    { name: 'P. Suresh Kumar', code: 'EMP-24816', contractor: 'Coastal Infra Services', passExpiry: '21 Jul 2026', status: 'Expiring' },
    { name: 'M. Lakshmi Devi', code: 'EMP-24815', contractor: 'Godavari Mech Pvt Ltd',  passExpiry: '02 Dec 2026', status: 'Active' },
    { name: 'B. Venkata Rao',  code: 'EMP-24814', contractor: 'Sai Teja Enterprises',   passExpiry: '15 Jul 2026', status: 'Expiring' },
    { name: 'G. Padma Priya',  code: 'EMP-24812', contractor: 'Vizag Power Solutions',  passExpiry: '—',           status: 'Pending' },
  ];

  statusClass(status: string): string {
    switch (status) {
      case 'Active':   return 'pill-green';
      case 'Expiring': return 'pill-orange';
      case 'Renewed':  return 'pill-blue';
      case 'Pending':  return 'pill-gold';
      default:         return 'pill-gray';
    }
  }
}
