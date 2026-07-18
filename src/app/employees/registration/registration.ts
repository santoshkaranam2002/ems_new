import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './registration.html',
  styleUrl: './registration.scss'
})
export class Registration implements OnInit {
  // Dropdown data loaded from API
  locations: string[] = [];
  companies: string[] = [];
  consignees: string[] = [];
  contractors: string[] = [];
  villageNames: string[] = [];
  categories: string[] = [];
  districts = ['Visakhapatnam', 'Vizianagaram', 'Srikakulam', 'East Godavari', 'West Godavari'];

  titles = ['Mr.', 'Ms.', 'Mrs.'];
  sexes = ['Male', 'Female', 'Other'];
  yesNo = ['Yes', 'No'];
  religions = ['Hindu', 'Muslim', 'Christian', 'Other'];
  idProofs = ['Aadhaar Card', 'Voter ID', 'Driving License', 'PAN Card'];
  salaryBases = ['Daily', 'Monthly', 'Piece Rate'];
  workAreas = ['Boiler Maintenance', 'Coal Handling Plant', 'Ash Handling', 'Turbine Section', 'Switch Yard'];
  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  states = ['Andhra Pradesh', 'Telangana', 'Odisha', 'Tamil Nadu'];
  heightPermits = ['Permitted', 'Not Permitted'];
  safetyTrainings = ['Completed', 'Scheduled', 'Not Done'];

  private locationList: any[] = [];
  private companyList: any[] = [];
  private consigneeList: any[] = [];
  private contractorList: any[] = [];
  private villageList: any[] = [];
  private categoryList: any[] = [];

  isSaving = false;
  statusText = 'New Registration';

  // ── photo capture ──
  photoPreview: string | null = null;
  photoName: string | null = null;
  showCamera = false;
  private cameraStream: MediaStream | null = null;
  @ViewChild('cameraVideo') cameraVideoRef?: ElementRef<HTMLVideoElement>;

  m: any = this.blankModel();

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadLookups();
  }

  blankModel(): any {
    return {
      location: '', company: '', consignee: '', contractor: '',
      labourCode: '', title: '', employeeName: '', fatherSpouseName: '',
      age: '', birthDate: '', sex: '', married: '',
      idMark1: '', idMark2: '', religion: '', residentOf: 'Local',
      above50: 'No', labourColony: 'No',
      passIssueDate: '', validityMonths: 12, expiryDate: '',
      idProofType: '', idProofNo: '',
      empCategory: '', workArea: '', skillCategory: '', designation: '',
      workExperience: '', salaryBasis: '', monthlySalary: '', otherAllowances: '',
      heightPermit: 'Not Permitted', contactPerson: '', contactPersonPhone: '',
      safetyTraining: 'Not Done', trainingDate: '', trainingId: '',
      natureOfWork: '',
      pAddress: '', pVillage: '', pDistrict: '', pState: 'Andhra Pradesh', pPincode: '', pMobile: '', pPhone: '',
      qAddress: '', qVillage: '', qDistrict: '', qState: 'Andhra Pradesh', qPincode: '', qMobile: '', qPhone: '',
      bloodGroup: '', boc: 'No', heightCM: '', weightKG: '',
      pfNo: '', esicNo: '', socRegNo: '', panNo: ''
    };
  }

  loadLookups(): void {
    this.emsService.getAllLocations().subscribe({
      next: (res: any) => {
        this.locationList = res?.data || [];
        this.locations = this.locationList.map((x: any) => x.locationName);
        if (!this.m.location && this.locations.length === 1) { this.m.location = this.locations[0]; }
        this.cdr.detectChanges();
      }
    });
    this.emsService.getAllCompanies().subscribe({
      next: (res: any) => {
        this.companyList = res?.data || [];
        this.companies = this.companyList.map((x: any) => x.companyName);
        if (!this.m.company && this.companies.length === 1) { this.m.company = this.companies[0]; }
        this.cdr.detectChanges();
      }
    });
    this.emsService.getAllConsignees().subscribe({
      next: (res: any) => {
        this.consigneeList = res?.data || [];
        this.consignees = this.consigneeList.map((x: any) => x.consigneeName);
        this.cdr.detectChanges();
      }
    });
    this.emsService.searchContractors().subscribe({
      next: (res: any) => {
        this.contractorList = res?.data || [];
        this.contractors = this.contractorList.map((x: any) => x.contractorName);
        this.cdr.detectChanges();
      }
    });
    this.emsService.searchVillages().subscribe({
      next: (res: any) => {
        this.villageList = res?.data || [];
        this.villageNames = this.villageList.map((x: any) => x.villageName);
        this.cdr.detectChanges();
      }
    });
    this.emsService.getAllEmpCategories().subscribe({
      next: (res: any) => {
        this.categoryList = res?.data || [];
        this.categories = this.categoryList.map((x: any) => x.empCategoryName || x.categoryName);
        this.cdr.detectChanges();
      }
    });
  }

  private idOf(list: any[], nameKey: string, idKey: string, name: string): number | null {
    const f = list.find((x: any) => x[nameKey] === name);
    return f ? f[idKey] : null;
  }

  copyPresentToPermanent(): void {
    this.m.qAddress = this.m.pAddress;
    this.m.qVillage = this.m.pVillage;
    this.m.qDistrict = this.m.pDistrict;
    this.m.qState = this.m.pState;
    this.m.qPincode = this.m.pPincode;
    this.m.qMobile = this.m.pMobile;
    this.m.qPhone = this.m.pPhone;
    this.cdr.detectChanges();
  }

  resetForm(): void {
    this.m = this.blankModel();
    this.statusText = 'New Registration';
    this.photoPreview = null;
    this.photoName = null;
    this.cdr.detectChanges();
  }

  exit(): void {
    this.router.navigate(['/dashboard']);
  }

  displayExisting(): void {
    const idStr = prompt('Enter Employee ID to display:');
    if (!idStr) { return; }
    const id = Number(idStr);
    if (!id) { toastError('Invalid Employee ID'); return; }
    this.emsService.getEmployeeById(id).subscribe({
      next: (res: any) => {
        const d = res?.data;
        if (!d || !d.employee) { toastError('Employee not found'); return; }
        const e = d.employee;
        this.m.employeeName = e.employeeName || '';
        this.m.labourCode = e.labourCode || '';
        this.m.title = e.title || '';
        this.m.fatherSpouseName = e.fatherSpouseName || '';
        this.m.birthDate = e.birthDate ? String(e.birthDate).substring(0, 10) : '';
        this.m.sex = e.sex || '';
        this.m.married = e.maritalStatus === 'Married' ? 'Yes' : (e.maritalStatus ? 'No' : '');
        this.m.idMark1 = e.idMark1 || '';
        this.m.idMark2 = e.idMark2 || '';
        this.m.religion = e.religion || '';
        this.m.residentOf = e.residentOf || '';
        this.m.designation = e.designation || '';
        this.m.workArea = e.workArea || '';
        this.m.workExperience = e.workExperience || '';
        this.m.salaryBasis = e.salaryBasis || '';
        this.m.monthlySalary = e.monthlySalary || '';
        this.m.otherAllowances = e.otherAllowances || '';
        this.m.contactPerson = e.contactPerson || '';
        this.m.contactPersonPhone = e.contactPersonPhone || '';
        this.m.natureOfWork = e.natureOfWork || '';
        this.m.bloodGroup = e.bloodGroup || '';
        this.m.heightCM = e.heightCM || '';
        this.m.weightKG = e.weightKG || '';
        this.m.pfNo = e.pfNo || '';
        this.m.esicNo = e.esicNo || '';
        this.m.socRegNo = e.socRegNo || '';
        this.m.panNo = e.panNo || '';
        const addrs = d.addresses || [];
        const pres = addrs.find((a: any) => (a.addressType || '').toLowerCase().indexOf('pres') >= 0) || addrs[0];
        const perm = addrs.find((a: any) => (a.addressType || '').toLowerCase().indexOf('perm') >= 0) || addrs[1];
        if (pres) {
          this.m.pAddress = pres.addressLine || '';
          this.m.pDistrict = pres.district || '';
          this.m.pState = pres.state || '';
          this.m.pPincode = pres.pincode || '';
          this.m.pMobile = pres.mobile || '';
          this.m.pPhone = pres.phone || '';
        }
        if (perm) {
          this.m.qAddress = perm.addressLine || '';
          this.m.qDistrict = perm.district || '';
          this.m.qState = perm.state || '';
          this.m.qPincode = perm.pincode || '';
          this.m.qMobile = perm.mobile || '';
          this.m.qPhone = perm.phone || '';
        }
        this.statusText = 'Displaying: ' + (e.employeeCode || ('#' + id)) + ' — ' + (e.employeeName || '');
        if (d.latestGatePass) {
          this.m.passIssueDate = d.latestGatePass.issueDate ? String(d.latestGatePass.issueDate).substring(0, 10) : '';
          this.m.expiryDate = d.latestGatePass.expiryDate ? String(d.latestGatePass.expiryDate).substring(0, 10) : '';
        }
        this.cdr.detectChanges();
      },
      error: () => { toastError('Failed to load employee'); }
    });
  }


  onPhotoSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) { return; }
    if (!file.type.startsWith('image/')) { toastError('Please select an image file'); return; }
    if (file.size > 4 * 1024 * 1024) { toastError('Image must be under 4 MB'); return; }
    this.photoName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      this.photoPreview = String(reader.result);
      toastSuccess('Photo attached');
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }

  openCamera(): void {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toastError('Camera is not supported in this browser');
      return;
    }
    this.showCamera = true;
    this.cdr.detectChanges();
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        this.cameraStream = stream;
        const video = this.cameraVideoRef?.nativeElement;
        if (video) {
          video.srcObject = stream;
          video.play().catch(() => {});
        }
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.showCamera = false;
        toastError('Could not access the camera. Please allow camera permission.');
        this.cdr.detectChanges();
      });
  }

  capturePhoto(): void {
    const video = this.cameraVideoRef?.nativeElement;
    if (!video || !video.videoWidth) { toastError('Camera is not ready yet'); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }
    ctx.drawImage(video, 0, 0);
    this.photoPreview = canvas.toDataURL('image/jpeg', 0.85);
    this.photoName = 'camera-capture-' + Date.now() + '.jpg';
    this.closeCamera();
    toastSuccess('Photo captured');
  }

  closeCamera(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(tr => tr.stop());
      this.cameraStream = null;
    }
    this.showCamera = false;
    this.cdr.detectChanges();
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.photoName = null;
    this.cdr.detectChanges();
  }

  save(): void {
    if (!this.m.employeeName) { toastError('Employee Name is required'); return; }
    const locId = this.idOf(this.locationList, 'locationName', 'locationID', this.m.location);
    const compId = this.idOf(this.companyList, 'companyName', 'companyID', this.m.company);
    const contId = this.idOf(this.contractorList, 'contractorName', 'contractorID', this.m.contractor);
    if (!locId) { toastError('Please select a Location'); return; }
    if (!compId) { toastError('Please select a Company'); return; }
    if (!contId) { toastError('Please select a Contractor'); return; }
    const villageId = this.idOf(this.villageList, 'villageName', 'villageID', this.m.pVillage)
      || this.idOf(this.villageList, 'villageName', 'villageID', this.m.qVillage);
    const payload: any = {
      locationID: locId,
      companyID: compId,
      consigneeID: this.idOf(this.consigneeList, 'consigneeName', 'consigneeID', this.m.consignee),
      contractorID: contId,
      labourCode: this.m.labourCode || null,
      title: this.m.title || null,
      employeeName: this.m.employeeName,
      fatherSpouseName: this.m.fatherSpouseName || null,
      birthDate: this.m.birthDate || null,
      sex: this.m.sex || null,
      maritalStatus: this.m.married === 'Yes' ? 'Married' : 'Single',
      idMark1: this.m.idMark1 || null,
      idMark2: this.m.idMark2 || null,
      religion: this.m.religion || null,
      residentOf: this.m.residentOf || null,
      isAbove50KM: this.m.above50 === 'Yes',
      inLabourColony: this.m.labourColony === 'Yes',
      identityProofType: this.m.idProofType || null,
      identityProofNo: this.m.idProofNo || null,
      empCategoryID: this.idOf(this.categoryList, 'empCategoryName', 'empCategoryID', this.m.empCategory)
        || this.idOf(this.categoryList, 'categoryName', 'empCategoryID', this.m.empCategory),
      workArea: this.m.workArea || null,
      designation: this.m.designation || null,
      workExperience: this.m.workExperience || null,
      salaryBasis: this.m.salaryBasis || null,
      monthlySalary: this.m.monthlySalary ? Number(this.m.monthlySalary) : null,
      otherAllowances: this.m.otherAllowances ? Number(this.m.otherAllowances) : null,
      heightPermit: this.m.heightPermit === 'Permitted',
      contactPerson: this.m.contactPerson || null,
      contactPersonPhone: this.m.contactPersonPhone || null,
      natureOfWork: this.m.natureOfWork || null,
      bloodGroup: this.m.bloodGroup || null,
      isBOC: this.m.boc === 'Yes',
      heightCM: this.m.heightCM ? Number(this.m.heightCM) : null,
      weightKG: this.m.weightKG ? Number(this.m.weightKG) : null,
      pfNo: this.m.pfNo || null,
      esicNo: this.m.esicNo || null,
      socRegNo: this.m.socRegNo || null,
      panNo: this.m.panNo || null,
      photoPath: this.photoName || null,
      villageID: villageId,
      presentAddress: {
        addressLine: this.m.pAddress || null,
        villageID: this.idOf(this.villageList, 'villageName', 'villageID', this.m.pVillage),
        district: this.m.pDistrict || null,
        state: this.m.pState || null,
        pincode: this.m.pPincode || null,
        mobile: this.m.pMobile || null,
        phone: this.m.pPhone || null
      },
      permanentAddress: {
        addressLine: this.m.qAddress || null,
        villageID: this.idOf(this.villageList, 'villageName', 'villageID', this.m.qVillage),
        district: this.m.qDistrict || null,
        state: this.m.qState || null,
        pincode: this.m.qPincode || null,
        mobile: this.m.qMobile || null,
        phone: this.m.qPhone || null
      },
      passValidityMonths: this.m.validityMonths ? Number(this.m.validityMonths) : 12
    };
    this.isSaving = true;
    this.emsService.registerEmployee(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        const d = res?.data;
        const newId = d?.employeeID || d?.employeeId;
        let msg = 'Employee registered successfully.';
        if (d?.employeeCode) { msg += '\nEmployee Code: ' + d.employeeCode; }
        if (d?.gatePassNo) { msg += '\nGate Pass No: ' + d.gatePassNo; }
        toastSuccess(msg);
        if (newId && this.m.safetyTraining && this.m.safetyTraining !== 'Not Done') {
          this.emsService.updateSafetyTraining({
            employeeID: newId,
            safetyTrainingStatus: this.m.safetyTraining,
            trainingDate: this.m.trainingDate || null,
            trainingID: this.m.trainingId || null
          }).subscribe({ next: () => {}, error: () => {} });
        }
        this.resetForm();
      },
      error: (err: any) => {
        this.isSaving = false;
        let msg = err?.error?.message || err?.message || 'Unknown error';
        const errs = err?.error?.errors;
        if (errs && typeof errs === 'object') {
          const parts: string[] = [];
          for (const k of Object.keys(errs)) {
            const v = errs[k];
            parts.push(k + ': ' + (Array.isArray(v) ? v.join(', ') : String(v)));
          }
          if (parts.length) { msg = parts.join('\n'); }
        }
        toastError('Registration failed:\n' + msg);
        this.cdr.detectChanges();
      }
    });
  }
}
