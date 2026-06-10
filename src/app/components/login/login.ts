import { Component, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UserService } from '../../services/user';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { ApiResponse, AuthenticationData, LoginRequest } from '../../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  user: LoginRequest = {
    username: '',
    password: ''
  };

  message = '';
  isError = false;
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    if (!this.canSubmit) {
      this.isError = true;
      this.message = 'Vui long nhap day du username va password.';
      return;
    }

    this.message = '';
    this.isError = false;
    this.isSubmitting = true;

    this.userService.login(this.user).subscribe({
      next: (res: ApiResponse<AuthenticationData>) => {
        const authData = res.data;

        if (authData?.authenticated && authData.token) {
          localStorage.setItem('accessToken', authData.token);

          // Decode JWT token to check user role
          let targetUrl = '/';
          try {
            const payload = JSON.parse(atob(authData.token.split('.')[1]));
            if (payload.scope === 'ADMIN' || payload.scope === 'ROLE_ADMIN') {
              targetUrl = '/admin';
            }
          } catch (e) {
            console.error('Error decoding token', e);
          }

          this.message = 'Đăng nhập thành công! Đang chuyển hướng...';
          this.isError = false;
          this.isSubmitting = false;
          this.cdr.detectChanges();

          // Chuyển trang sau 1 giây để người dùng thấy thông báo
          setTimeout(() => {
            this.router.navigate([targetUrl]);
          }, 1000);
          return;
        }

        this.isError = true;
        this.message = res.message ?? 'Dang nhap that bai';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      },
      error: (error: HttpErrorResponse) => {
        this.isError = true;
        this.message = error.error?.message ?? 'Khong the ket noi den may chu';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  get canSubmit(): boolean {
    return this.user.username.trim().length > 0 && this.user.password.length > 0;
  }
}
