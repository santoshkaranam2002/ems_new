import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmsService } from '../../services/ems.service';
import { toastSuccess, toastError } from '../../shared/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  username     = '';
  password     = '';
  showPassword = false;
  rememberMe   = true;
  isLoading    = false;
  errorMessage = '';

  year = new Date().getFullYear();

  constructor(private router: Router, private emsService: EmsService) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  clearError(): void {
    this.errorMessage = '';
  }

  onSubmit(): void {
    this.clearError();

    if (!this.username.trim()) {
      this.errorMessage = 'Please enter your username.';
      return;
    }
    if (!this.password.trim()) {
      this.errorMessage = 'Please enter your password.';
      return;
    }

    this.isLoading = true;
    this.emsService.login(this.username.trim(), this.password).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const data = res?.data ?? res;
        if (res?.success && data?.success !== false) {
          localStorage.setItem('emsUser', JSON.stringify(data));
          toastSuccess('Welcome back, ' + (data?.fullName || data?.username || 'user') + '!');
          this.router.navigateByUrl('/dashboard');
        } else {
          this.errorMessage = data?.message || res?.message || 'Invalid username or password.';
          toastError(this.errorMessage);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.message || 'Unable to reach server. Please try again.';
        toastError(this.errorMessage);
      }
    });
  }
}
