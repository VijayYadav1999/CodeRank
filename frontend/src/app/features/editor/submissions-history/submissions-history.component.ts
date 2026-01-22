/**
 * Submissions History Component (Standalone)
 * Displays all past code submissions and executions
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeExecutionService } from '@core/services/code-execution.service';

interface Submission {
  id: string;
  language: string;
  code: string;
  output: string;
  error: string | null;
  executionTime: number;
  memory: number;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-submissions-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Submission History</h2>
        <button
          (click)="refreshSubmissions()"
          [disabled]="loading"
          class="refresh-btn"
        >
          {{ loading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>

      <div
        *ngIf="loading"
        class="loading-state"
      >
        <p>Loading submissions...</p>
      </div>

      <div
        *ngIf="!loading && submissions.length === 0"
        class="empty-state"
      >
        <p>No submissions yet. Start coding!</p>
      </div>

      <div
        *ngIf="!loading && submissions.length > 0"
        class="submissions-list"
      >
        <div
          *ngFor="let submission of submissions; let i = index"
          class="submission-item"
        >
          <div class="submission-header">
            <div class="submission-info">
              <span
                class="language-badge"
                [ngClass]="'lang-' + submission.language"
              >
                {{ submission.language.toUpperCase() }}
              </span>
              <span
                class="status-badge"
                [ngClass]="'status-' + submission.status"
              >
                {{ submission.status === 'success' ? '✓ Success' : '✗ Error' }}
              </span>
              <span class="time-info">
                {{ formatDate(submission.createdAt) }}
              </span>
            </div>
            <button
              (click)="toggleSubmission(i)"
              class="expand-btn"
            >
              {{ expandedIndex === i ? '▼' : '▶' }}
            </button>
          </div>

          <div
            *ngIf="expandedIndex === i"
            class="submission-details"
          >
            <div class="code-section">
              <h4>Code:</h4>
              <pre class="code-block"><code>{{ submission.code }}</code></pre>
            </div>

            <div class="output-section">
              <h4>Output:</h4>
              <pre
                class="output-block"
                *ngIf="submission.status === 'success'"
                >{{ submission.output || '(No output)' }}</pre
              >
              <pre
                class="error-block"
                *ngIf="submission.status === 'error'"
                >{{ submission.error || submission.output }}</pre
              >
            </div>

            <div class="execution-stats">
              <span>⏱️ Time: {{ submission.executionTime }}ms</span>
              <span>💾 Memory: {{ submission.memory }}MB</span>
            </div>

            <button
              (click)="copyCode(submission.code)"
              class="copy-btn"
            >
              Copy Code
            </button>
          </div>
        </div>
      </div>

      <div
        *ngIf="error"
        class="error-message"
      >
        {{ error }}
        <button
          (click)="dismissError()"
          class="close-btn"
        >
          ×
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .history-container {
        padding: 20px;
        background: #f9f9f9;
        border-radius: 8px;
        margin: 10px 0;
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #ddd;
        padding-bottom: 10px;
      }

      .history-header h2 {
        margin: 0;
        color: #333;
        font-size: 1.5rem;
      }

      .refresh-btn {
        padding: 8px 16px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s;
      }

      .refresh-btn:hover:not(:disabled) {
        background: #0056b3;
      }

      .refresh-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .loading-state,
      .empty-state {
        padding: 30px;
        text-align: center;
        color: #666;
        background: white;
        border-radius: 4px;
        margin: 10px 0;
      }

      .submissions-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .submission-item {
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        overflow: hidden;
        transition: box-shadow 0.3s;
      }

      .submission-item:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .submission-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: #f5f5f5;
        cursor: pointer;
        user-select: none;
      }

      .submission-info {
        display: flex;
        gap: 12px;
        align-items: center;
        flex: 1;
      }

      .language-badge,
      .status-badge {
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: bold;
        white-space: nowrap;
      }

      .lang-python {
        background: #3776ab;
        color: white;
      }

      .lang-javascript {
        background: #f7df1e;
        color: #333;
      }

      .lang-cpp {
        background: #00599c;
        color: white;
      }

      .status-success {
        background: #28a745;
        color: white;
      }

      .status-error {
        background: #dc3545;
        color: white;
      }

      .time-info {
        color: #666;
        font-size: 0.9rem;
      }

      .expand-btn {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0 10px;
        color: #666;
      }

      .submission-details {
        padding: 20px;
        border-top: 1px solid #eee;
        background: #fafafa;
      }

      .code-section,
      .output-section {
        margin-bottom: 15px;
      }

      .code-section h4,
      .output-section h4 {
        margin: 0 0 10px 0;
        color: #333;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .code-block,
      .output-block,
      .error-block {
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 12px;
        margin: 0;
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        max-height: 200px;
        overflow-y: auto;
        color: #333;
      }

      .error-block {
        background: #fff5f5;
        border-color: #ffcccc;
        color: #d00;
      }

      .execution-stats {
        display: flex;
        gap: 20px;
        margin: 15px 0;
        padding: 10px;
        background: white;
        border-radius: 4px;
        border: 1px solid #ddd;
        font-size: 0.9rem;
        color: #666;
      }

      .copy-btn {
        padding: 8px 16px;
        background: #28a745;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s;
      }

      .copy-btn:hover {
        background: #218838;
      }

      .error-message {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 12px 16px;
        border-radius: 4px;
        margin-top: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #721c24;
        padding: 0;
      }

      @media (max-width: 768px) {
        .submission-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .expand-btn {
          align-self: flex-end;
          margin-top: 10px;
        }

        .submission-info {
          flex-wrap: wrap;
        }

        .code-block,
        .output-block,
        .error-block {
          font-size: 0.75rem;
        }
      }
    `,
  ],
})
export class SubmissionsHistoryComponent implements OnInit {
  submissions: Submission[] = [];
  loading = false;
  error = '';
  expandedIndex: number | null = null;

  constructor(private codeExecutionService: CodeExecutionService) {}

  ngOnInit() {
    this.loadSubmissions();
  }

  /**
   * Load submissions from API
   */
  loadSubmissions() {
    this.loading = true;
    this.error = '';

    this.codeExecutionService.getSubmissions().subscribe({
      next: (response: any) => {
        console.log('History response:', response);
        // Backend returns data.submissions, not data.data
        const submissions = response.data?.submissions || response.submissions || [];
        this.submissions = submissions.map((sub: any) => ({
          id: sub._id,
          language: sub.language,
          code: sub.code,
          output: sub.output || '',
          error: sub.error || null,
          executionTime: sub.executionTime || 0,
          memory: sub.memory || 0,
          status:
            sub.status === 'completed' ? 'success' : sub.status === 'failed' ? 'error' : 'pending',
          createdAt: sub.createdAt,
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading submissions:', err);
        this.error = 'Failed to load submissions. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Refresh submissions list
   */
  refreshSubmissions() {
    this.loadSubmissions();
  }

  /**
   * Toggle submission details visibility
   */
  toggleSubmission(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  /**
   * Copy code to clipboard
   */
  copyCode(code: string) {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        alert('Code copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy code:', err);
        alert('Failed to copy code');
      });
  }

  /**
   * Format date to readable string
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Dismiss error message
   */
  dismissError() {
    this.error = '';
  }
}
