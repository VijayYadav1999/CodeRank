/**
 * Code Execution Service
 * Handles code execution API calls
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface ExecuteCodeRequest {
  code: string;
  language: string;
  input?: string;
  title?: string;
}

export interface ExecutionResult {
  submissionId: string;
  output: string;
  error: string | null;
  executionTime: number;
  status: 'completed' | 'failed';
}

export interface CodeExecutionResponse {
  success: boolean;
  data: ExecutionResult;
  message: string;
  timestamp: string;
}

export interface CodeSubmission {
  _id: string;
  title: string;
  code: string;
  language: string;
  output?: string;
  error?: string;
  status: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CodeExecutionService {
  private apiUrl = `${environment.apiUrl}/code`;

  constructor(private http: HttpClient) {}

  execute(request: ExecuteCodeRequest): Observable<ExecutionResult> {
    return this.http
      .post<CodeExecutionResponse>(`${this.apiUrl}/execute`, request)
      .pipe(map((response: CodeExecutionResponse) => response.data));
  }

  getHistory(page: number = 1, limit: number = 10): Observable<{ submissions: CodeSubmission[] }> {
    return this.http.get<{ submissions: CodeSubmission[] }>(
      `${this.apiUrl}/history?page=${page}&limit=${limit}`
    );
  }

  getSubmission(submissionId: string): Observable<CodeSubmission> {
    return this.http.get<any>(`${this.apiUrl}/submission/${submissionId}`).pipe(
      map((response: any) => {
        // Handle both direct response and wrapped response
        return response.data || response;
      })
    );
  }
}
