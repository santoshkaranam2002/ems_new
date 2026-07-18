# HNPCL EMS — Contract Employees Management System (Design Demo)

Premium design-only Angular 21 project for HNPCL. Crimson + gold theme, fully responsive.
No backend / no functionality — pure interface demo. Login → Sign In → Dashboard.

## Run

```bash
npm install
npm start        # ng serve  →  http://localhost:4200
```

Login with any username/password and click **Sign In to EMS**.

## Structure (mirrors lompose-admin)

- `src/styles.scss` — **centralized theme**. Change `--primary-h/s/l` at the top to retheme the entire app. All shared UI (buttons, cards, forms, tables, pills, page headers) lives here; component `.scss` files stay tiny.
- `src/app/layout/` — layout + header + sidenav (+ nav-icon)
- `src/app/auth/login/` — split-screen login
- `src/app/pages/dashboard/` — stats, charts, tables
- `src/app/masters/` — Company, Consignee, Contractors, Work Orders, Location, Wages, Holiday Information, Village, Consignee Type
- `src/app/employees/` — Registration (full form), Renew, Cancelation, Group Pass Issue, Salary Statement, Import Salary Statement, Assign Village
- `src/app/reports/report-viewer/` — one designed report screen reused by all 15 report menu routes (title comes from route data)
- `src/app/utilities/` — Users, Change Password

No `.spec.ts` files anywhere.
