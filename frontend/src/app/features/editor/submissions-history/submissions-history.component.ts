/**
 * Submissions History Component (Standalone)
 * Displays user's code execution history with details
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
  status: 'success' | 'error' | 'pending';
  createdAt: string;
}

@Component({
  selector: 'app-submissions-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './submissions-history.component.html',
  styleUrls: ['./submissions-history.component.css'],
})
export class SubmissionsHistoryComponent implements OnInit {
  submissions: Submission[] = [];
  loading = false;
  error = '';
  expandedIndex: number | null = null;

  constructor(private codeExecutionService: CodeExecutionService) {}

  ngOnInit(): void {
    this.loadSubmissions();
  }

  /**
   * Load submissions from API
   */
  loadSubmissions(): void {
    this.loading = true;
    this.error = '';

    this.codeExecutionService.getSubmissions().subscribe({
      next: (response: any) => {
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
      error: () => {
        this.error = 'Failed to load submissions. Please try again.';
        this.loading = false;
      },
    });
  }

  /**
   * Refresh submissions list
   */
  refreshSubmissions(): void {
    this.loadSubmissions();
  }

  /**
   * Toggle submission details visibility
   */
  toggleSubmission(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  /**
   * Copy code to clipboard
   */
  copyCode(code: string): void {
    navigator.clipboard.writeText(code).catch(() => {
      alert('Failed to copy code');
    });
    alert('Code copied to clipboard!');
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
  dismissError(): void {
    this.error = '';
  }
}
