import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminStateService } from '../../../../services/admin-state';

@Component({
  selector: 'app-users-tab',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-tab.html'
})
export class UsersTabComponent implements OnInit {
  @Output() viewUser = new EventEmitter<any>();
  @Output() toggleLock = new EventEmitter<any>();

  userSearch = '';
  filteredUsers: any[] = [];

  constructor(public state: AdminStateService) {}

  ngOnInit() { this.filterUsers(); }

  filterUsers() {
    this.filteredUsers = this.state.users().filter(u => {
      return !this.userSearch ||
        u.username?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        u.firstname?.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        u.lastname?.toLowerCase().includes(this.userSearch.toLowerCase());
    });
  }

  onViewUser(u: any) { this.viewUser.emit(u); }
  onToggleLock(u: any) { this.toggleLock.emit(u); }
}
