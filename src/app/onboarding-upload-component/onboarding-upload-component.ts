import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../Service/ApiService ';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-onboarding-upload-component',
  imports: [CommonModule,FormsModule],
  templateUrl: './onboarding-upload-component.html',
  styleUrl: './onboarding-upload-component.css',
})
export class OnboardingUploadComponent {
  candidateId!: string;

  candidateName = '';

  selectedFiles: File[] = [];

  loading = false;

  successMessage = '';

  errorMessage = '';

  constructor(

    private route: ActivatedRoute,

    private apiService: ApiService
  ) {}

  ngOnInit(): void {

    this.candidateId =

      this.route.snapshot.paramMap
        .get('candidateId')!;
  }

  // FILE SELECT

  onFileChange(
  event: any
): void {

  const files =

    Array.from(
      event.target.files
    ) as File[];

  // APPEND FILES

  this.selectedFiles = [

    ...this.selectedFiles,

    ...files
  ];
}

  // UPLOAD DOCUMENTS

  uploadDocuments(): void {

    if (
      this.selectedFiles.length === 0
    ) {

      alert(
        'Please select documents'
      );

      return;
    }

    const formData =
      new FormData();

    // MULTIPLE FILES

    this.selectedFiles.forEach(file => {

      formData.append(
        'files',
        file
      );
    });

    formData.append(
      'candidateId',
      this.candidateId
    );

    formData.append(
      'candidateName',
      this.candidateName
    );

    this.loading = true;

    this.apiService
      .uploadDocuments(formData)
      .subscribe({

        next: (response: any) => {

          this.loading = false;

          this.successMessage =
            response.message;

          this.errorMessage = '';

          alert(
            'Documents uploaded successfully'
          );
           window.close();
        },

        error: (err) => {

          console.error(err);

          this.loading = false;

          this.errorMessage =
            'Upload failed';

          alert(
            'Failed to upload documents'
          );
        }
      });
  }
}


