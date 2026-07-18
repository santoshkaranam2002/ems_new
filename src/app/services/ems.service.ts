import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmsService {

  // private baseUrl = 'http://localhost:5080/api';
  private baseUrl = 'http://hnpclemsapi.thekgtech.com/api';

  constructor(private http: HttpClient) {}

  // ───────── Auth / Users ─────────
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/login`, { username, password });
  }

  createUser(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/users`, data);
  }

  getAllUsers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/users`);
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/users/${userId}`);
  }

  changePassword(userId: number, oldPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/change-password`, { userID: userId, oldPassword, newPassword });
  }

  lockUser(userId: number, lock: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/users/lock`, { userID: userId, lock });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/auth/users/${userId}`);
  }

  getAllRoles(): Observable<any> {
    return this.http.get(`${this.baseUrl}/auth/roles`);
  }

  // ───────── Consignee Type ─────────
  getAllConsigneeTypes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/consignee-types`);
  }

  getConsigneeTypeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/consignee-types/${id}`);
  }

  addConsigneeType(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/consignee-types`, data);
  }

  updateConsigneeType(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/consignee-types`, data);
  }

  deleteConsigneeType(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/consignee-types/${id}`);
  }

  // ───────── Consignee ─────────
  getAllConsignees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/consignees`);
  }

  getConsigneeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/consignees/${id}`);
  }

  addConsignee(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/consignees`, data);
  }

  updateConsignee(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/consignees`, data);
  }

  deleteConsignee(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/consignees/${id}`);
  }

  // ───────── Contractor ─────────
  searchContractors(nameLike: string = '', expiringLicenceOnly: boolean = false): Observable<any> {
    return this.http.get(`${this.baseUrl}/contractors?nameLike=${encodeURIComponent(nameLike)}&expiringLicenceOnly=${expiringLicenceOnly}`);
  }

  getContractorById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/contractors/${id}`);
  }

  addContractor(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/contractors`, data);
  }

  updateContractor(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/contractors`, data);
  }

  deleteContractor(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/contractors/${id}`);
  }

  // ───────── Work Order ─────────
  searchWorkOrders(contractorId?: number, fromDate?: string, toDate?: string): Observable<any> {
    let url = `${this.baseUrl}/work-orders?`;
    if (contractorId) url += `contractorId=${contractorId}&`;
    if (fromDate) url += `fromDate=${fromDate}&`;
    if (toDate) url += `toDate=${toDate}&`;
    return this.http.get(url);
  }

  getWorkOrderById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/work-orders/${id}`);
  }

  addWorkOrder(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/work-orders`, data);
  }

  updateWorkOrderStatus(id: number, woStatus: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/work-orders/${id}/status`, JSON.stringify(woStatus), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  deleteWorkOrder(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/work-orders/${id}`);
  }

  // ───────── Employee ─────────
  registerEmployee(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees`, data);
  }

  updateEmployee(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees`, data);
  }

  updateSafetyTraining(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/safety-training`, data);
  }

  upsertEmployeeAddress(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/employees/address`, data);
  }

  getEmployeeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/employees/${id}`);
  }

  searchEmployees(contractorId?: number, locationId?: number, villageId?: number,
                  empStatus: string = '', nameLike: string = '',
                  pageNumber: number = 1, pageSize: number = 50): Observable<any> {
    let url = `${this.baseUrl}/employees?pageNumber=${pageNumber}&pageSize=${pageSize}&`;
    if (contractorId) url += `contractorId=${contractorId}&`;
    if (locationId) url += `locationId=${locationId}&`;
    if (villageId) url += `villageId=${villageId}&`;
    if (empStatus) url += `empStatus=${encodeURIComponent(empStatus)}&`;
    if (nameLike) url += `nameLike=${encodeURIComponent(nameLike)}&`;
    return this.http.get(url);
  }

  releaseEmployee(employeeId: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/release`, { employeeID: employeeId, reason });
  }

  assignVillage(employeeId: number, newVillageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/employees/assign-village`, { employeeID: employeeId, newVillageID: newVillageId });
  }

  // ───────── Gate Pass ─────────
  getGatePassById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/gate-passes/${id}`);
  }

  issueGatePass(employeeId: number, validityMonths: number = 12): Observable<any> {
    return this.http.post(`${this.baseUrl}/gate-passes/issue`, { employeeID: employeeId, validityMonths });
  }

  renewGatePass(gatePassId: number, validityMonths: number = 12, remarks: string = ''): Observable<any> {
    return this.http.post(`${this.baseUrl}/gate-passes/renew`, { gatePassID: gatePassId, validityMonths, remarks });
  }

  cancelGatePass(gatePassId: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/gate-passes/cancel`, { gatePassID: gatePassId, reason });
  }

  getExpiringGatePasses(daysThreshold: number = 30): Observable<any> {
    return this.http.get(`${this.baseUrl}/gate-passes/expiring?daysThreshold=${daysThreshold}`);
  }

  rollGatePassStatus(): Observable<any> {
    return this.http.post(`${this.baseUrl}/gate-passes/roll-status`, {});
  }

  // ───────── Group Pass ─────────
  getGroupPassById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/group-passes/${id}`);
  }

  issueGroupPass(contractorId: number, workOrderId: number, validityMonths: number, employeeIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/group-passes/issue`, {
      contractorID: contractorId, workOrderID: workOrderId, validityMonths, employeeIDs: employeeIds
    });
  }

  addGroupPassMember(groupPassId: number, employeeId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/group-passes/members/add`, { groupPassID: groupPassId, employeeID: employeeId });
  }

  removeGroupPassMember(groupPassId: number, employeeId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/group-passes/members/remove`, { groupPassID: groupPassId, employeeID: employeeId });
  }

  cancelGroupPass(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/group-passes/${id}/cancel`, {});
  }

  getGroupPassMembers(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/group-passes/${id}/members`);
  }

  // ───────── Location ─────────
  getAllLocations(): Observable<any> {
    return this.http.get(`${this.baseUrl}/locations`);
  }

  getLocationById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/locations/${id}`);
  }

  addLocation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/locations`, data);
  }

  updateLocation(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/locations`, data);
  }

  deleteLocation(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/locations/${id}`);
  }

  // ───────── Company ─────────
  getAllCompanies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/companies`);
  }

  getCompanyById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/companies/${id}`);
  }

  addCompany(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/companies`, data);
  }

  updateCompany(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/companies`, data);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/companies/${id}`);
  }

  // ───────── Village ─────────
  searchVillages(nameLike: string = ''): Observable<any> {
    return this.http.get(`${this.baseUrl}/villages?nameLike=${encodeURIComponent(nameLike)}`);
  }

  getVillageById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/villages/${id}`);
  }

  addVillage(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/villages`, data);
  }

  updateVillage(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/villages`, data);
  }

  deleteVillage(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/villages/${id}`);
  }

  // ───────── Emp Category ─────────
  getAllEmpCategories(): Observable<any> {
    return this.http.get(`${this.baseUrl}/emp-categories`);
  }

  getEmpCategoryById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/emp-categories/${id}`);
  }

  addEmpCategory(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/emp-categories`, data);
  }

  // ───────── Wages ─────────
  getCurrentWages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/wages/current`);
  }

  getWageById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/wages/${id}`);
  }

  addWageNewRate(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/wages/new-rate`, data);
  }

  // ───────── Holidays ─────────
  getHolidaysByYear(year: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/holidays/${year}`);
  }

  getHolidayById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/holidays/by-id/${id}`);
  }

  addHoliday(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/holidays`, data);
  }

  deleteHoliday(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/holidays/${id}`);
  }

  // ───────── Salary ─────────
  getSalaryStatementById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/salary/statements/${id}`);
  }

  addSalaryStatement(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/salary/statements`, data);
  }

  verifySalaryStatement(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/salary/statements/${id}/verify`, {});
  }

  markSalaryPaid(contractorId: number, wageMonth: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/salary/statements/mark-paid`, { contractorID: contractorId, wageMonth });
  }

  getSalaryStatementsByEmployee(employeeId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/salary/statements/employee/${employeeId}`);
  }

  importSalaryBatch(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/salary/import`, data);
  }

  getAdjustmentById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/salary/adjustments/${id}`);
  }

  addAdjustment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/salary/adjustments`, data);
  }

  getAdjustmentsByEmployee(employeeId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/salary/adjustments/employee/${employeeId}`);
  }

  // ───────── Reports ─────────
  getEmployeePassExpiryReport(daysThreshold: number = 30): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/employee-pass-expiry?daysThreshold=${daysThreshold}`);
  }

  getContractorWiseEmployeesReport(contractorId?: number): Observable<any> {
    let url = `${this.baseUrl}/reports/contractor-wise-employees`;
    if (contractorId) url += `?contractorId=${contractorId}`;
    return this.http.get(url);
  }

  getForm6AReport(wageMonthFrom: string, wageMonthTo: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/form-6a?wageMonthFrom=${wageMonthFrom}&wageMonthTo=${wageMonthTo}`);
  }

  getPFReport(wageMonth: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/pf-report?wageMonth=${wageMonth}`);
  }

  getSalaryNotIssuedReport(): Observable<any> {
    return this.http.get(`${this.baseUrl}/reports/salary-not-issued`);
  }

  getContractorWiseWorkOrdersReport(contractorId?: number): Observable<any> {
    let url = `${this.baseUrl}/reports/contractor-wise-work-orders`;
    if (contractorId) url += `?contractorId=${contractorId}`;
    return this.http.get(url);
  }

  getReleasedEmployeesReport(fromDate?: string, toDate?: string): Observable<any> {
    let url = `${this.baseUrl}/reports/released-employees?`;
    if (fromDate) url += `fromDate=${fromDate}&`;
    if (toDate) url += `toDate=${toDate}&`;
    return this.http.get(url);
  }

  // ───────── Dashboard ─────────
  getDashboardSummary(): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/summary`);
  }

  getRegistrationTrend(monthsBack: number = 12): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/registration-trend?monthsBack=${monthsBack}`);
  }

  getRecentActivity(topN: number = 20): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard/recent-activity?topN=${topN}`);
  }
}
