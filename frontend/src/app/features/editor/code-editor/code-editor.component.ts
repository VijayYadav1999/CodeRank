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
  template: `
    <div class="editor-container">
      <div class="editor-header">
        <h1>Code Executor</h1>
      </div>

      <div class="editor-main">
        <div class="editor-panel">
          <div class="language-selector">
            <label for="language">Language:</label>
            <select
              id="language"
              (change)="onLanguageChange($event)"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div class="editor-area">
            <textarea
              [(ngModel)]="code"
              placeholder="Write your code here..."
              class="code-editor"
            ></textarea>
          </div>

          <div class="input-area">
            <label>Input (optional):</label>
            <textarea
              [(ngModel)]="input"
              placeholder="Provide input here..."
              class="input-textarea"
            ></textarea>
          </div>

          <button
            (click)="executeCode()"
            [disabled]="executing"
            class="execute-btn"
          >
            {{ executing ? 'Executing...' : 'Execute Code' }}
          </button>
        </div>

        <div class="output-panel">
          <div class="output-header">
            <h3>Output</h3>
            <span
              class="execution-time"
              *ngIf="executionTime"
            >
              Execution Time: {{ executionTime }}ms
            </span>
          </div>

          <div class="output-content">
            <div
              *ngIf="output || error"
              class="result"
            >
              <div
                *ngIf="output"
                class="output"
              >
                <strong>Output:</strong>
                <pre>{{ output }}</pre>
              </div>
              <div
                *ngIf="error"
                class="error-output"
              >
                <strong>Error:</strong>
                <pre>{{ error }}</pre>
              </div>
            </div>
            <div
              *ngIf="!output && !error && !executing"
              class="placeholder"
            >
              Execute your code to see results...
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .editor-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: #1e1e1e;
        color: #d4d4d4;
      }

      .editor-header {
        background: #252526;
        padding: 20px;
        border-bottom: 1px solid #3e3e42;
      }

      .editor-header h1 {
        margin: 0;
        color: #669eea;
      }

      .editor-main {
        display: flex;
        flex: 1;
        gap: 10px;
        padding: 10px;
      }

      .editor-panel,
      .output-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: #252526;
        border: 1px solid #3e3e42;
        border-radius: 5px;
        overflow: hidden;
      }

      .language-selector {
        padding: 10px;
        border-bottom: 1px solid #3e3e42;
      }

      .language-selector label {
        display: inline-block;
        margin-right: 10px;
      }

      .language-selector select {
        padding: 5px 10px;
        background: #3c3c3c;
        color: #d4d4d4;
        border: 1px solid #555;
        border-radius: 3px;
      }

      .editor-area {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .code-editor {
        flex: 1;
        padding: 10px;
        background: #1e1e1e;
        color: #d4d4d4;
        border: none;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 14px;
        resize: none;
      }

      .code-editor:focus {
        outline: none;
        background: #252526;
      }

      .input-area {
        padding: 10px;
        border-top: 1px solid #3e3e42;
        max-height: 100px;
      }

      .input-textarea {
        width: 100%;
        height: 80px;
        padding: 5px;
        background: #1e1e1e;
        color: #d4d4d4;
        border: 1px solid #3e3e42;
        border-radius: 3px;
        font-family: monospace;
        resize: none;
      }

      .execute-btn {
        margin: 10px;
        padding: 10px 20px;
        background: #669eea;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.3s;
      }

      .execute-btn:hover:not(:disabled) {
        background: #5282cc;
      }

      .execute-btn:disabled {
        background: #999;
        cursor: not-allowed;
      }

      .output-header {
        padding: 10px;
        border-bottom: 1px solid #3e3e42;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .output-header h3 {
        margin: 0;
      }

      .execution-time {
        font-size: 12px;
        color: #888;
      }

      .output-content {
        flex: 1;
        overflow: auto;
        padding: 10px;
      }

      .result {
        font-family: monospace;
        white-space: pre-wrap;
        word-break: break-word;
      }

      .output {
        color: #4ec9b0;
      }

      .error-output {
        color: #f48771;
      }

      pre {
        margin: 0;
        background: #1e1e1e;
        padding: 10px;
        border-radius: 3px;
        overflow-x: auto;
      }

      .placeholder {
        color: #666;
        text-align: center;
        padding-top: 50px;
      }
    `,
  ],
})
export class CodeEditorComponent implements OnInit {
  code = '';
  input = '';
  output = '';
  error = '';
  executing = false;
  executionTime = 0;
  language = 'python';

  constructor(private codeExecutionService: CodeExecutionService) {}

  ngOnInit(): void {
    this.loadSampleCode();
  }

  loadSampleCode(): void {
    const samples: Record<string, string> = {
      python: 'print("Hello, CodeRank!")',
      javascript: 'console.log("Hello, CodeRank!")',
      java: 'public class Main { public static void main(String[] args) { System.out.println("Hello"); } }',
      cpp: '#include <iostream>\nusing namespace std;\nint main() { cout << "Hello" << endl; }',
      csharp: 'using System;\nclass Program { static void Main() { Console.WriteLine("Hello"); } }',
    };

    this.code = samples[this.language];
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
          // Result contains submissionId instead of direct output
          if (result.submissionId) {
            // Poll for results
            this.pollForResults(result.submissionId);
          }
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Execution failed';
          this.executing = false;
        },
      });
  }

  private pollForResults(submissionId: string, attempts = 0): void {
    const maxAttempts = 60; // Max 60 seconds (1 second interval)

    if (attempts > maxAttempts) {
      this.error = 'Execution timeout - taking too long';
      this.executing = false;
      return;
    }

    setTimeout(() => {
      this.codeExecutionService.getSubmission(submissionId).subscribe({
        next: (result: any) => {
          if (result.status === 'completed' || result.status === 'failed') {
            // Execution completed
            this.output = result.output || '';
            this.error = result.error || '';
            this.executionTime = result.executionTime || 0;
            this.executing = false;
          } else {
            // Still executing, poll again
            this.pollForResults(submissionId, attempts + 1);
          }
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Failed to fetch results';
          this.executing = false;
        },
      });
    }, 500); // Poll every 500ms
  }
}
