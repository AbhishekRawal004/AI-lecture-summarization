import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LectureUploaderService {
  private API_URL = 'http://127.0.0.1:8000'; // FastAPI backend

  constructor(private http: HttpClient) {}

  uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.API_URL}/upload`, formData).pipe(
      catchError(this.handleError)
    );
  }

  submitUrl(url: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post(
      `${this.API_URL}/transcribe`, 
      JSON.stringify({ url }), 
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.API_URL}/status/${jobId}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('API Error:', error);
    let errorMessage = 'An unexpected error occurred.';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server returned ${error.status}: ${error.statusText || ''}`;
      if (error.error && error.error.detail) {
        errorMessage += ` - ${error.error.detail}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
