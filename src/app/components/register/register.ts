import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiResponse, RegisterRequest } from '../../models/user';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class RegisterComponent {
  user: RegisterRequest = {
    username: '',
    firstname: '',
    lastname: '',
    age: null,
    email: '',
    password: ''
  };

  phone = '';
  confirmPassword = '';
  message = '';
  isError = false;
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  register() {
    if (!this.canSubmit) {
      this.isError = true;
      this.message = 'Vui lòng nhập đầy đủ và đúng định dạng thông tin.';
      return;
    }

    if (this.user.password !== this.confirmPassword) {
      this.isError = true;
      this.message = 'Mật khẩu xác nhận không khớp.';
      return;
    }

    this.message = '';
    this.isError = false;
    this.isSubmitting = true;

    // Automatically map missing fields to satisfy backend constraints
    this.user.username = this.user.email.split('@')[0];
    if (this.user.username.length < 3) {
      this.user.username = this.user.email;
    }
    this.user.age = 25;
    this.user.lastname = 'Khách';

    this.userService.register(this.user).subscribe({
      next: (res: ApiResponse<unknown>) => {
        this.message = res.message ?? 'Đăng ký thành công! Đang chuyển hướng...';
        this.isError = false;
        this.isSubmitting = false;
        this.cdr.detectChanges();

        // Chuyển sang trang đăng nhập sau 1.5 giây
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1000);
      },
      error: (error: HttpErrorResponse) => {
        this.isError = true;
        this.message = error.error?.message ?? 'Không thể kết nối đến máy chủ';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  get canSubmit(): boolean {
    const firstnameValid = this.user.firstname.trim().length > 0;
    const phoneValid = this.phone.trim().length >= 10;
    const emailValid = this.user.email.includes('@');
    const passwordValid = this.user.password.length >= 8;
    const confirmPasswordValid = this.confirmPassword.length >= 8;

    return firstnameValid && phoneValid && emailValid && passwordValid && confirmPasswordValid;
  }
}
