import { Component, OnInit, AfterViewInit, ChangeDetectorRef, PLATFORM_ID, Inject, ViewEncapsulation } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { VehicleService } from '../../services/vehicle';
import { RentalService } from '../../services/rental';
import { UserService } from '../../services/user';
import { AdminStateService } from '../../services/admin-state';
import { DashboardTabComponent } from './tabs/dashboard-tab/dashboard-tab';
import { VehiclesTabComponent } from './tabs/vehicles-tab/vehicles-tab';
import { RentalsTabComponent } from './tabs/rentals-tab/rentals-tab';
import { UsersTabComponent } from './tabs/users-tab/users-tab';
import { PartnershipsTabComponent } from './tabs/partnerships-tab/partnerships-tab';
import { NotificationsTabComponent } from './tabs/notifications-tab/notifications-tab';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    DashboardTabComponent, VehiclesTabComponent, RentalsTabComponent,
    UsersTabComponent, PartnershipsTabComponent, NotificationsTabComponent
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, AfterViewInit {
  activeTab = 'dashboard';
  isDarkMode = false;
  isLoading = false;

  // Modals & Drawers
  showAddModal = false;
  showEditDrawer = false;
  showVehicleDrawer = false;
  showRentalDrawer = false;
  showUserDrawer = false;
  showDeleteConfirmModal = false;
  vehicleIdToDelete: number | null = null;
  vehicleNameToDelete = '';

  selectedVehicle: any = null;
  selectedRental: any = null;
  selectedUser: any = null;

  // Form Models
  newVehicle: any = {
    name: '', brand: '', model: '', year: 2026, color: '', licensePlate: '',
    batteryKwh: 0, rangeKm: 0, chargeType: 'DC FastCharge',
    pricePerHour: 50000, pricePerDay: 500000, pricePerWeek: 3000000,
    location: 'Hà Nội', status: 'AVAILABLE', description: '', imageUrl: ''
  };
  editVehicleData: any = {};
  imageInputType = 'url';
  imageUrlInput = '';
  uploadingImage = false;
  uploadError = '';
  editImageInputType = 'url';
  editImageUrlToAdd = '';
  editUploadingImage = false;
  editUploadError = '';

  constructor(
    public state: AdminStateService,
    private vehicleService: VehicleService,
    private rentalService: RentalService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    const token = localStorage.getItem('accessToken');
    if (!token) { this.router.navigate(['/login']); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.scope !== 'ADMIN' && payload.scope !== 'ROLE_ADMIN') {
        this.router.navigate(['/']); return;
      }
    } catch (e) { this.router.navigate(['/login']); return; }
    
    this.route.paramMap.subscribe(params => {
      const tab = params.get('tab');
      if (tab) {
        this.activeTab = tab;
        this.cdr.detectChanges();
      }
    });

    this.loadAllData();
  }

  ngAfterViewInit() {}

  loadAllData() {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.vehicleService.getVehicles().subscribe({
      next: (res) => {
        if (res?.data) { this.state.vehicles.set(res.data); this.calculateStats(); }
      },
      error: () => this.state.showToast('Lỗi khi tải dữ liệu xe', 'error')
    });

    this.rentalService.getAllRentals().subscribe({
      next: (res: any) => {
        if (res) { this.state.rentals.set(res.data || res); this.calculateStats(); }
      },
      error: () => this.state.showToast('Lỗi khi tải dữ liệu đơn thuê', 'error')
    });

    this.userService.getUsers().subscribe({
      next: (res) => {
        if (res?.data) this.state.users.set(res.data);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.state.showToast('Lỗi khi tải dữ liệu người dùng', 'error'); this.isLoading = false; this.cdr.detectChanges(); }
    });
  }

  calculateStats() {
    const vehicles = this.state.vehicles();
    const rentals = this.state.rentals();
    this.state.totalVehicles.set(vehicles.length);
    this.state.pendingRentalsCount.set(rentals.filter(r => r.rentalStatus === 'PENDING').length);
    this.state.activeRentalsCount.set(rentals.filter(r => r.rentalStatus === 'ACTIVE').length);

    const today = new Date();
    const currentDay = today.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(today); monday.setDate(today.getDate() - distanceToMonday); monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
    let totalRev = 0;
    rentals.forEach(r => {
      const d = new Date(r.rentalDate || r.createdAt);
      if (d >= monday && d <= sunday) totalRev += r.totalPrice || ((r.depositAmount || 0) + (r.remainingAmount || 0));
    });
    this.state.totalRevenue.set(totalRev);

    const todayStr = new Date().toDateString();
    this.state.todayRentalsCount.set(rentals.filter(r => {
      const dateStr = r.rentalDate || r.createdAt;
      return dateStr && new Date(dateStr).toDateString() === todayStr;
    }).length);
    this.cdr.detectChanges();
  }

  selectTab(tab: string) {
    this.router.navigate(['/admin', tab]);
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    this.state.isDarkMode.set(this.isDarkMode);
    this.cdr.detectChanges();
  }

  getFirstImage(url: string | null | undefined): string {
    const def = 'https://placehold.co/400x300?text=No+Image';
    if (!url) return def;
    return url.split(',')[0].trim() || def;
  }

  getVehicleImages(imageUrlStr: string): string[] {
    if (!imageUrlStr) return [];
    return imageUrlStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }

  removeEditImage(index: number) {
    let urls = this.getVehicleImages(this.editVehicleData.imageUrl);
    urls.splice(index, 1);
    this.editVehicleData.imageUrl = urls.join(',');
    this.cdr.detectChanges();
  }

  addEditImageUrl() {
    if (!this.editImageUrlToAdd?.trim()) return;
    const current = this.editVehicleData.imageUrl?.trim() || '';
    this.editVehicleData.imageUrl = current ? current + ',' + this.editImageUrlToAdd.trim() : this.editImageUrlToAdd.trim();
    this.editImageUrlToAdd = '';
    this.cdr.detectChanges();
  }

  // ===== VEHICLE CRUD =====
  openAddModal() {
    this.newVehicle = { name: '', brand: '', model: '', year: 2026, color: '', licensePlate: '', batteryKwh: 0, rangeKm: 0, chargeType: 'DC FastCharge', pricePerHour: 50000, pricePerDay: 500000, pricePerWeek: 3000000, location: 'Hà Nội', status: 'AVAILABLE', description: '', imageUrl: '' };
    this.imageUrlInput = '';
    this.showAddModal = true;
    this.cdr.detectChanges();
  }
  closeAddModal() { this.showAddModal = false; this.cdr.detectChanges(); }

  saveVehicle() {
    if (!this.newVehicle.name || !this.newVehicle.brand || !this.newVehicle.model || !this.newVehicle.pricePerDay) {
      this.state.showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'error'); return;
    }
    if (this.imageUrlInput) this.newVehicle.imageUrl = this.imageUrlInput;
    this.vehicleService.createVehicle(this.newVehicle).subscribe({
      next: () => { this.state.showToast('Thêm phương tiện mới thành công!', 'success'); this.closeAddModal(); this.loadAllData(); },
      error: (err) => this.state.showToast('Lỗi: ' + (err.error?.message || 'Thêm xe thất bại'), 'error')
    });
  }

  openEditDrawer(vehicle: any) { this.editVehicleData = { ...vehicle }; this.showEditDrawer = true; this.cdr.detectChanges(); }
  closeEditDrawer() { this.showEditDrawer = false; this.cdr.detectChanges(); }

  updateVehicle() {
    if (!this.editVehicleData?.id) return;
    this.vehicleService.updateVehicle(this.editVehicleData.id, this.editVehicleData).subscribe({
      next: () => { this.state.showToast('Cập nhật phương tiện thành công!', 'success'); this.closeEditDrawer(); this.loadAllData(); },
      error: (err) => this.state.showToast('Lỗi: ' + (err.error?.message || 'Cập nhật xe thất bại'), 'error')
    });
  }

  openVehicleDrawer(vehicle: any) { this.selectedVehicle = vehicle; this.showVehicleDrawer = true; this.cdr.detectChanges(); }
  closeVehicleDrawer() { this.showVehicleDrawer = false; this.cdr.detectChanges(); }

  openDeleteConfirm(vehicle: any) { this.vehicleIdToDelete = vehicle.id; this.vehicleNameToDelete = vehicle.name; this.showDeleteConfirmModal = true; this.cdr.detectChanges(); }
  closeDeleteConfirm() { this.showDeleteConfirmModal = false; this.vehicleIdToDelete = null; this.vehicleNameToDelete = ''; this.cdr.detectChanges(); }

  confirmDeleteVehicle() {
    if (this.vehicleIdToDelete !== null) {
      this.vehicleService.deleteVehicle(this.vehicleIdToDelete).subscribe({
        next: () => { this.state.showToast('Xóa phương tiện thành công!', 'success'); this.closeDeleteConfirm(); this.loadAllData(); },
        error: () => { this.state.showToast('Xóa phương tiện thất bại', 'error'); this.closeDeleteConfirm(); }
      });
    }
  }

  // ===== RENTAL =====
  openRentalDrawer(rental: any) { this.selectedRental = rental; this.showRentalDrawer = true; this.cdr.detectChanges(); }
  closeRentalDrawer() { this.showRentalDrawer = false; this.cdr.detectChanges(); }

  updateRentalStatus(rentalId: number, status: string) {
    this.rentalService.updateRental(rentalId, { rentalStatus: status as any }).subscribe({
      next: () => { this.state.showToast(`Đã chuyển đơn sang: ${status}`, 'success'); this.loadAllData(); this.cdr.detectChanges(); },
      error: () => this.state.showToast('Lỗi cập nhật trạng thái đơn', 'error')
    });
  }

  // ===== USERS =====
  openUserDrawer(user: any) { this.selectedUser = user; this.showUserDrawer = true; this.cdr.detectChanges(); }
  closeUserDrawer() { this.showUserDrawer = false; this.cdr.detectChanges(); }

  toggleUserLock(user: any) {
    user.locked = !user.locked;
    this.userService.updateUser(user.id, { username: user.username, firstname: user.firstname, lastname: user.lastname, age: user.age, email: user.email, role: user.role }).subscribe({
      next: () => { this.state.showToast(`${user.locked ? 'Khóa' : 'Mở khóa'} tài khoản ${user.username} thành công!`, 'success'); this.cdr.detectChanges(); },
      error: () => { user.locked = !user.locked; this.state.showToast('Lỗi thay đổi trạng thái tài khoản', 'error'); }
    });
  }

  // ===== FILE UPLOAD =====
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files?.length) return;
    this.uploadingImage = true; this.uploadError = ''; this.cdr.detectChanges();
    let uploadedUrls: string[] = this.imageUrlInput ? this.imageUrlInput.split(',').map(u => u.trim()).filter(u => u) : [];
    let completed = 0; let hasError = false;
    Array.from(files).forEach(file => {
      this.vehicleService.uploadImage(file).subscribe({
        next: (res) => { if (res?.data) uploadedUrls.push(res.data); completed++; if (completed === files.length) { this.uploadingImage = false; this.imageUrlInput = uploadedUrls.join(','); if (hasError) this.state.showToast('Lỗi tải ảnh một phần', 'error'); else this.state.showToast('Tải ảnh thành công', 'success'); this.cdr.detectChanges(); } },
        error: () => { hasError = true; completed++; if (completed === files.length) { this.uploadingImage = false; this.uploadError = 'Một số ảnh không thể tải lên.'; this.cdr.detectChanges(); } }
      });
    });
  }

  onEditFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files?.length) return;
    this.editUploadingImage = true; this.editUploadError = ''; this.cdr.detectChanges();
    let completed = 0; let hasError = false;
    Array.from(files).forEach(file => {
      this.vehicleService.uploadImage(file).subscribe({
        next: (res) => { if (res?.data) { const current = this.editVehicleData.imageUrl?.trim() || ''; this.editVehicleData.imageUrl = current ? current + ',' + res.data : res.data; } completed++; if (completed === files.length) { this.editUploadingImage = false; if (!hasError) this.state.showToast('Tải ảnh thành công', 'success'); this.cdr.detectChanges(); } },
        error: () => { hasError = true; completed++; if (completed === files.length) { this.editUploadingImage = false; this.editUploadError = 'Một số ảnh không thể tải lên.'; this.cdr.detectChanges(); } }
      });
    });
  }
}
