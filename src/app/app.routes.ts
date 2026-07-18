import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout';
import { Login } from './auth/login/login';
import { Dashboard } from './pages/dashboard/dashboard';

// Masters
import { Company } from './masters/company/company';
import { Consignee } from './masters/consignee/consignee';
import { Contractors } from './masters/contractors/contractors';
import { WorkOrders } from './masters/work-orders/work-orders';
import { Location } from './masters/location/location';
import { Wages } from './masters/wages/wages';
import { HolidayInformation } from './masters/holiday-information/holiday-information';
import { Village } from './masters/village/village';
import { ConsigneeType } from './masters/consignee-type/consignee-type';

// Employees
import { Registration } from './employees/registration/registration';
import { Renew } from './employees/renew/renew';
import { Cancelation } from './employees/cancelation/cancelation';
import { GroupPassIssue } from './employees/group-pass-issue/group-pass-issue';
import { EmployeeSalaryStatement } from './employees/employee-salary-statement/employee-salary-statement';
import { ImportEmployeeSalaryStatement } from './employees/import-employee-salary-statement/import-employee-salary-statement';
import { AssignVillageToEmployee } from './employees/assign-village-to-employee/assign-village-to-employee';

// Reports — separate component per report
import { EmployeeInformation } from './reports/employee-information/employee-information';
import { ContractorWiseEmployees } from './reports/contractor-wise-employees/contractor-wise-employees';
import { GeneralPassExpiry } from './reports/general-pass-expiry/general-pass-expiry';
import { Form6A } from './reports/form-6a/form-6a';
import { BloodGroupInformation } from './reports/blood-group-information/blood-group-information';
import { SafetyTraining } from './reports/safety-training/safety-training';
import { PersonalInformation } from './reports/personal-information/personal-information';
import { GroupPassExpiry } from './reports/group-pass-expiry/group-pass-expiry';
import { SalaryNotIssued } from './reports/salary-not-issued/salary-not-issued';
import { ContractorWiseInformation } from './reports/contractor-wise-information/contractor-wise-information';
import { ContractorWiseWorkOrders } from './reports/contractor-wise-work-orders/contractor-wise-work-orders';
import { EmployeeFromMainVillage } from './reports/employee-from-main-village/employee-from-main-village';
import { PfReport } from './reports/pf-report/pf-report';
import { Adjustment } from './reports/adjustment/adjustment';
import { ContractorWiseReleased } from './reports/contractor-wise-released/contractor-wise-released';

// Utilities
import { Users } from './utilities/users/users';
import { ChangePassword } from './utilities/change-password/change-password';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login — NO sidebar/header
  { path: 'login', component: Login },

  // Everything inside layout — HAS sidebar/header
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', component: Dashboard },

      {
        path: 'masters',
        children: [
          { path: 'company', component: Company },
          { path: 'consignee', component: Consignee },
          { path: 'contractors', component: Contractors },
          { path: 'work-orders', component: WorkOrders },
          { path: 'location', component: Location },
          { path: 'wages', component: Wages },
          { path: 'holiday-information', component: HolidayInformation },
          { path: 'village', component: Village },
          { path: 'consignee-type', component: ConsigneeType },
        ]
      },

      {
        path: 'employees',
        children: [
          { path: 'registration', component: Registration },
          { path: 'renew', component: Renew },
          { path: 'cancelation', component: Cancelation },
          { path: 'group-pass-issue', component: GroupPassIssue },
          { path: 'salary-statement', component: EmployeeSalaryStatement },
          { path: 'import-salary-statement', component: ImportEmployeeSalaryStatement },
          { path: 'assign-village', component: AssignVillageToEmployee },
        ]
      },

      {
        path: 'reports',
        children: [
          { path: 'employee-information',            component: EmployeeInformation },
          { path: 'contractor-wise-employees',       component: ContractorWiseEmployees },
          { path: 'general-pass-expiry',             component: GeneralPassExpiry },
          { path: 'form-6a',                         component: Form6A },
          { path: 'blood-group-information',         component: BloodGroupInformation },
          { path: 'safety-training',                 component: SafetyTraining },
          { path: 'personal-information',            component: PersonalInformation },
          { path: 'group-pass-expiry',               component: GroupPassExpiry },
          { path: 'salary-not-issued',               component: SalaryNotIssued },
          { path: 'contractor-wise-information',     component: ContractorWiseInformation },
          { path: 'contractor-wise-work-orders',     component: ContractorWiseWorkOrders },
          { path: 'employee-from-main-village',      component: EmployeeFromMainVillage },
          { path: 'pf-report',                       component: PfReport },
          { path: 'adjustment',                      component: Adjustment },
          { path: 'contractor-wise-released',        component: ContractorWiseReleased },
        ]
      },

      {
        path: 'utilities',
        children: [
          { path: 'users', component: Users },
          { path: 'change-password', component: ChangePassword },
        ]
      },

      { path: '**', component: Dashboard }
    ]
  }
];
