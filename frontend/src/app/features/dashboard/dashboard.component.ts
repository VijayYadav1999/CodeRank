/**
 * Dashboard Layout Component
 * Main container for code editor and other dashboard features
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="dashboard-container">
      <nav class="dashboard-nav">
        <div class="nav-brand">
          <h2>CodeRank</h2>
        </div>

        <ul class="nav-links">
          <li>
            <a
              routerLink="/dashboard/editor"
              class="nav-link"
            >
              📝 Editor
            </a>
          </li>
          <li>
            <a
              routerLink="/dashboard/history"
              class="nav-link"
            >
              📚 History
            </a>
          </li>
        </ul>

        <div class="nav-user">
          <span class="user-name">{{ userName }}</span>
          <button
            (click)="logout()"
            class="logout-btn"
          >
            Logout
          </button>
        </div>
      </nav>

      <main class="dashboard-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #f5f5f5;
      }

      .dashboard-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #2c3e50;
        padding: 15px 30px;
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        gap: 30px;
      }

      .nav-brand h2 {
        margin: 0;
        color: #3498db;
        font-size: 1.8rem;
        letter-spacing: 1px;
      }

      .nav-links {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        gap: 20px;
        flex: 1;
      }

      .nav-link {
        color: #ecf0f1;
        text-decoration: none;
        padding: 10px 15px;
        border-radius: 4px;
        transition: all 0.3s;
        font-weight: 500;
      }

      .nav-link:hover {
        background: #34495e;
        color: #3498db;
      }

      .nav-user {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-left: auto;
      }

      .user-name {
        color: #ecf0f1;
        font-weight: 500;
      }

      .logout-btn {
        padding: 8px 16px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.3s;
      }

      .logout-btn:hover {
        background: #c0392b;
      }

      .dashboard-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      @media (max-width: 768px) {
        .dashboard-nav {
          flex-direction: column;
          gap: 15px;
          padding: 15px;
        }

        .nav-links {
          width: 100%;
          justify-content: center;
        }

        .nav-user {
          width: 100%;
          justify-content: space-between;
          margin-left: 0;
        }

        .nav-brand h2 {
          font-size: 1.4rem;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  userName: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.loadUserName();
  }

  loadUserName() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user) {
          this.userName = user.firstName + ' ' + user.lastName;
        }
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
