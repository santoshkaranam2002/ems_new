import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss'
})
export class ChangePassword {
  oldPassword = '';
  newPassword = '';
  confirmPassword = '';
  isSaving = false;

  constructor(private emsService: EmsService, private cdr: ChangeDetectorRef) {}

  updatePassword(): void {
    if (!this.oldPassword || !this.newPassword) { toastError('Please enter current and new password'); return; }
    if (this.newPassword.length < 8) { toastError('New password must be at least 8 characters'); return; }
    if (this.newPassword !== this.confirmPassword) { toastError('New password and confirm password do not match'); return; }
    const stored = localStorage.getItem('emsUser');
    const user = stored ? JSON.parse(stored) : null;
    const userID = user?.userID || user?.userId;
    if (!userID) { toastError('No logged-in user found. Please login again.'); return; }
    this.isSaving = true;
    this.emsService.changePassword(userID, this.oldPassword, this.newPassword).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        toastSuccess(res?.message || 'Password changed successfully');
        this.oldPassword = ''; this.newPassword = ''; this.confirmPassword = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.isSaving = false;
        toastError('Failed to change password: ' + (err?.error?.message || err?.message || 'Unknown error'));
        this.cdr.detectChanges();
      }
    });
  }
}
