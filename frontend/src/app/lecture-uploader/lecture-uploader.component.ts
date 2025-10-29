import { Component } from '@angular/core';
import { LectureUploaderService } from './lecture-uploader.service';

@Component({
  selector: 'app-lecture-uploader',
  templateUrl: './lecture-uploader.component.html',
  styleUrls: ['./lecture-uploader.component.css']
})
export class LectureUploaderComponent {
  selectedFile: File | null = null;
  jobId: string | null = null;
  summary: any = null;
  status: string | null = null;
  isProcessing = false;
  isDragOver = false;
  error: string | null = null;

  constructor(private service: LectureUploaderService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0] || null;
    if (this.selectedFile) {
      this.upload();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
      this.upload();
    }
  }

  upload() {
    if (!this.selectedFile) return;
    this.isProcessing = true;
    this.status = 'Uploading...';

    this.service.uploadFile(this.selectedFile).subscribe({
      next: (res) => {
        this.handleUploadResponse(res);
      },
      error: (err) => {
        console.error(err);
        this.status = 'Error uploading file';
        this.isProcessing = false;
      }
    });
  }

  handleUploadResponse(response: any) {
    if (!response) {
      this.error = 'Invalid response from server';
      this.isProcessing = false;
      return;
    }
    
    if (response.job_id) {
      this.jobId = response.job_id;
      this.checkStatus();
    } else if (response.status === 'completed' && response.summary) {
      // Handle direct response (if the API returns the result immediately)
      this.processSummary(response.summary);
      this.status = 'completed';
      this.isProcessing = false;
    } else {
      this.status = 'Received unexpected response from server';
      this.isProcessing = false;
    }
  }

  checkStatus() {
    if (!this.jobId) {
      this.error = 'No job ID available to check status';
      this.isProcessing = false;
      return;
    }
    
    this.service.getStatus(this.jobId).subscribe({
      next: (response) => {
        if (!response) {
          this.error = 'Invalid status response from server';
          this.isProcessing = false;
          return;
        }
        
        if (response.status === 'completed') {
          if (response.summary) {
            this.processSummary(response.summary);
          } else {
            this.error = 'No summary data in completed job';
            this.isProcessing = false;
          }
        } else if (response.status === 'processing') {
          // Check again after 2 seconds
          setTimeout(() => this.checkStatus(), 2000);
        } else if (response.status?.startsWith('error:')) {
          this.error = response.status.replace('error:', '').trim();
          this.isProcessing = false;
          // Clear error after 5 seconds
          setTimeout(() => this.error = null, 5000);
        } else {
          this.error = `Unexpected status: ${response.status}`;
          this.isProcessing = false;
        }
      },
      error: (error) => {
        console.error('Error checking status:', error);
        this.error = error.message || 'Failed to check processing status';
        this.isProcessing = false;
        // Clear error after 5 seconds
        setTimeout(() => this.error = null, 5000);
      }
    });
  }
  
  private processSummary(summaryData: any) {
    try {
      if (typeof summaryData === 'string') {
        // Try to parse if it's a JSON string
        summaryData = JSON.parse(summaryData);
      }
      
      this.summary = summaryData;
      this.isProcessing = false;
      
      // Scroll to results
      setTimeout(() => {
        const resultsElement = document.getElementById('results');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
    } catch (e) {
      console.error('Error processing summary:', e);
      this.error = 'Failed to process the summary data';
      this.isProcessing = false;
    }
  }

  pollStatus() {
    if (!this.jobId) return;
    const interval = setInterval(() => {
      this.service.getStatus(this.jobId!).subscribe((res) => {
        this.status = res.status;
        if (res.status === 'completed' || res.status.startsWith('error')) {
          clearInterval(interval);
          this.summary = res.summary;
          this.isProcessing = false;
        }
      });
    }, 2000);
  }

  toggleFlashcard(card: any) {
    card.flipped = !card.flipped;
  }

  downloadPDF() {
    if (!this.summary) return;

    // Create a new window with formatted content for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const title = this.summary.title || 'Lecture Summary';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            h1 {
              color: #667eea;
              text-align: center;
              margin-bottom: 40px;
              font-size: 2.5rem;
              font-weight: 800;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h2 {
              color: #4a5568;
              margin-top: 40px;
              margin-bottom: 20px;
              font-size: 1.5rem;
              font-weight: 600;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .summary {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
              border-left: 5px solid #667eea;
            }
            .takeaways {
              background: #e8f5e8;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
              border-left: 5px solid #48bb78;
            }
            .takeaway-item {
              margin-bottom: 15px;
              padding: 10px;
              background: white;
              border-radius: 8px;
              border-left: 4px solid #48bb78;
            }
            .notes {
              background: #fff3cd;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
              border-left: 5px solid #ed8936;
            }
            .note-item {
              margin-bottom: 10px;
              padding: 8px;
              background: white;
              border-radius: 6px;
              border-left: 3px solid #ed8936;
            }
            .flashcards {
              background: #d1ecf1;
              padding: 25px;
              border-radius: 12px;
              margin-bottom: 30px;
              border-left: 5px solid #319795;
            }
            .flashcard {
              margin-bottom: 20px;
              padding: 20px;
              background: white;
              border-radius: 12px;
              border: 1px solid #bee3f8;
              page-break-inside: avoid;
            }
            .flashcard-question {
              font-weight: bold;
              color: #2c5282;
              margin-bottom: 10px;
            }
            .flashcard-answer {
              color: #2c5282;
              font-style: italic;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              font-size: 0.9rem;
              color: #718096;
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>

          <div class="summary">
            <h2>📝 Main Summary</h2>
            <p>${this.summary.summary}</p>
          </div>

          <div class="takeaways">
            <h2>💡 Key Takeaways</h2>
            ${this.summary.key_takeaways?.map((takeaway: string, index: number) =>
              `<div class="takeaway-item"><strong>${index + 1}.</strong> ${takeaway}</div>`
            ).join('')}
          </div>

          <div class="notes">
            <h2>📋 Detailed Notes</h2>
            ${this.summary.bulleted_notes?.map((note: string) =>
              `<div class="note-item">${note}</div>`
            ).join('')}
          </div>

          ${this.summary.flashcards?.length > 0 ? `
            <div class="flashcards">
              <h2>🃏 Flashcards</h2>
              ${this.summary.flashcards.map((card: any, index: number) => `
                <div class="flashcard">
                  <div class="flashcard-question">Q${index + 1}: ${card.question}</div>
                  <div class="flashcard-answer">A${index + 1}: ${card.answer}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="footer">
            Generated by Video/Audio Lecture Summarizer
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  private downloadAsText() {
    const content = this.generateTextContent();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.summary.title || 'lecture-summary'}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private generateTextContent(): string {
    let content = `${this.summary.title || 'Lecture Summary'}\n\n`;

    content += `📝 MAIN SUMMARY\n${this.summary.summary}\n\n`;

    content += `💡 KEY TAKEAWAYS\n`;
    this.summary.key_takeaways?.forEach((takeaway: string, index: number) => {
      content += `${index + 1}. ${takeaway}\n`;
    });

    content += `\n📋 DETAILED NOTES\n`;
    this.summary.bulleted_notes?.forEach((note: string) => {
      content += `• ${note}\n`;
    });

    content += `\n🃏 FLASHCARDS\n`;
    this.summary.flashcards?.forEach((card: any) => {
      content += `Q: ${card.question}\nA: ${card.answer}\n\n`;
    });

    return content;
  }
}
