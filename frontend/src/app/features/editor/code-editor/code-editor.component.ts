/**
 * Code Editor Component (Standalone)
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
} from '@angular/forms';
import { CodeExecutionService } from '@core/services/code-execution.service';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './code-editor.component.html',
  styleUrls: ['./code-editor.component.css'],
})
export class CodeEditorComponent implements OnInit {
  code = '';
  input = '';
  output = '';
  error = '';
  executing = false;
  executionTime = 0;
  language = 'python';

  private readonly SAMPLE_CODE: Record<string, string> = {
    python: 'print("Hello, CodeRank!")',
    javascript: 'console.log("Hello, CodeRank!")',
    cpp: '#include <iostream>\nusing namespace std;\nint main() { cout << "Hello" << endl; }',
  };

  constructor(private codeExecutionService: CodeExecutionService) {}

  ngOnInit(): void {
    this.loadSampleCode();
  }

  onLanguageChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.language = target.value;
    this.loadSampleCode();
    this.output = '';
    this.error = '';
  }

  executeCode(): void {
    if (!this.code.trim()) {
      this.error = 'Please enter some code';
      return;
    }

    this.executing = true;
    this.output = '';
    this.error = '';
    this.executionTime = 0;

    this.codeExecutionService
      .execute({
        code: this.code,
        language: this.language,
        input: this.input || undefined,
      })
      .subscribe({
        next: (result: any) => {
          if (result.submissionId) {
            this.pollForResults(result.submissionId);
          }
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Execution failed';
          this.executing = false;
        },
      });
  }

  private loadSampleCode(): void {
    this.code = this.SAMPLE_CODE[this.language] || '';
  }

  private pollForResults(submissionId: string, attempts = 0): void {
    const maxAttempts = 60;

    if (attempts > maxAttempts) {
      this.error = 'Execution timeout - taking too long';
      this.executing = false;
      return;
    }

    setTimeout(() => {
      this.codeExecutionService.getSubmission(submissionId).subscribe({
        next: (result: any) => {
          if (result.status === 'completed' || result.status === 'failed') {
            this.output = result.output || '';
            this.error = result.error || '';
            this.executionTime = result.executionTime || 0;
            this.executing = false;
          } else {
            this.pollForResults(submissionId, attempts + 1);
          }
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to fetch results';
          this.executing = false;
        },
      });
    }, 500);
  }
}
