import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../Service/ApiService ';

@Component({
  selector: 'app-asset-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './asset-dashboard-component.html',
  styleUrls: ['./asset-dashboard-component.css'],
})
export class AssetDashboardComponent implements OnInit, OnDestroy {
  assets: any[] = [];
  loadingAssets = true;
  loading = false;
  editing = false;
  editingAssetId = '';
  searchQuery = '';
  currentTime = new Date();

  private clockInterval: any;
  private refreshInterval: any;

  asset = {
    id: '',
    assetId: '',
    assetName: '',
    category: '',
    brand: '',
    serialNumber: '',
  };

 assignData = {
  assetId: '',
  employeeId: '',
  assetType: '',
  condition: '',
  remarks: '',

  mouse: false,
  headphone: false,
  keyboard: false
};
  returnData = { assetId: '', employeeId: '' };

  toast: {
    show: boolean;

    message: string;

    type: 'success' | 'error';
  } = {
      show: false,

      message: '',

      type: 'success',
    };
  private toastTimer: any;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef, 
  ) { }

  ngOnInit(): void {
  
    setTimeout(() => {
      this.getAllAssets();
    }, 0);

    
    this.clockInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);

    
    this.refreshInterval = setInterval(() => {
      this.getAllAssets(true);
    }, 30000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
    clearInterval(this.refreshInterval);
  }



  get filteredAssets(): any[] {
    if (!this.searchQuery.trim()) return this.assets;
    const q = this.searchQuery.toLowerCase();
    return this.assets.filter(
      (a) =>
        (a.assetId || '').toLowerCase().includes(q) ||
        (a.assetName || '').toLowerCase().includes(q) ||
        (a.brand || '').toLowerCase().includes(q) ||
        (a.category || '').toLowerCase().includes(q) ||
        (a.serialNumber || '').toLowerCase().includes(q) ||
        (a.status || '').toLowerCase().includes(q),
    );
  }

  getPercent(status: string): number {
    if (!this.assets.length) return 0;
    return Math.round(
      (this.assets.filter((a) => a.status === status).length / this.assets.length) * 100,
    );
  }

  showToast(
    message: string,

    type: 'success' | 'error' = 'success',
  ): void {
    clearTimeout(this.toastTimer);

    this.toast.show = false;

    setTimeout(() => {
      this.toast.message = message;

      this.toast.type = type;

      this.toast.show = true;
    }, 100);

    this.toastTimer = setTimeout(() => {
      this.toast.show = false;
    }, 3000);
  }



  getAllAssets(silent = false): void {
    if (!silent) this.loadingAssets = true;

    this.apiService.getAllAssets().subscribe({
      next: (response: any) => {
        this.assets = response;
        this.loadingAssets = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('Failed to load assets', err);
        this.loadingAssets = false;
        this.cdr.detectChanges();
      },
    });
  }

  

  createAsset(): void {
    if (!this.asset.assetId || !this.asset.assetName) {
      this.showToast('Asset ID and Name are required', 'error');
      return;
    }

    this.loading = true;

    if (this.editing) {
      this.apiService.updateAsset(this.editingAssetId, this.asset).subscribe({
        next: () => {
          this.loading = false;
          this.showToast('Asset updated successfully');
          this.resetForm();
          this.getAllAssets();
        },
        error: (err) => {
          this.loading = false;
          this.showToast(err.error?.message || 'Update failed', 'error');
        },
      });
      return;
    }

    this.apiService.createAsset(this.asset).subscribe({
      next: () => {
        this.loading = false;
        this.showToast('Asset created successfully');
        this.resetForm();
        this.getAllAssets();
      },
      error: (err) => {
        this.loading = false;
        this.showToast(err.error?.message || 'Asset creation failed', 'error');
      },
    });
  }


  assignAsset(): void {
  if (!this.assignData.assetId || !this.assignData.employeeId) {
    this.showToast(
      'Asset ID and Employee ID are required',
      'error'
    );
    return;
  }

  const assignedBy =
    localStorage.getItem('employeeName') || 'HR';

  const accessories: string[] = [];

  if (this.assignData.mouse) {
    accessories.push('Mouse');
  }

  if (this.assignData.headphone) {
    accessories.push('Headphone');
  }

  if (this.assignData.keyboard) {
    accessories.push('Keyboard');
  }

  const accessoriesString = accessories.join(',');

  this.apiService.assignAsset(
    this.assignData.assetId,
    this.assignData.employeeId,
    assignedBy,
    this.assignData.assetType,
    this.assignData.condition,
    this.assignData.remarks,
    accessoriesString
  ).subscribe({
    next: () => {
      this.showToast('Asset assigned successfully');

      this.assignData = {
        assetId: '',
        employeeId: '',
        assetType: '',
        condition: '',
        remarks: '',

        mouse: false,
        headphone: false,
        keyboard: false
      };

      this.getAllAssets();
    },

    error: (err) => {
      console.log('FULL ERROR = ', err);

      let errorMessage = 'Assignment failed';

      if (err.error && typeof err.error === 'object') {
        errorMessage = err.error.message;
      } else if (typeof err.error === 'string') {
        try {
          const parsed = JSON.parse(err.error);
          errorMessage = parsed.message;
        } catch {
          errorMessage = err.error;
        }
      }

      this.showToast(errorMessage, 'error');
      this.cdr.detectChanges();
    }
  });
}


  returnAsset(): void {
    if (!this.returnData.assetId || !this.returnData.employeeId) {
      this.showToast('Asset ID and Employee ID are required', 'error');
      return;
    }

    this.apiService.returnAsset(this.returnData.assetId, this.returnData.employeeId).subscribe({
      next: () => {
        this.showToast('Asset returned successfully');
        this.returnData = { assetId: '', employeeId: '' };
        this.getAllAssets();
      },
      error: (err) => {
        this.showToast(err.error?.message || 'Return failed', 'error');
      },
    });
  }

 

  editAsset(asset: any): void {
    console.log('EDIT ASSET = ', asset);

    this.editing = true;

    this.editingAssetId = asset.id;

    this.asset = {
      id: asset.id,

      assetId: asset.assetId || '',

      assetName: asset.assetName || '',

      category: asset.category || '',

      brand: asset.brand || '',

      serialNumber: asset.serialNumber || '',
    };

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ── DELETE ───────────────────────────────────────────────────────────────

  deleteAsset(id: string): void {
    if (!confirm('Delete this asset?')) return;

    this.apiService.deleteAsset(id).subscribe({
      next: () => {
        this.showToast('Asset deleted successfully');

        this.getAllAssets();
      },

      error: (err) => {
        console.error(err);

        this.showToast(err.error?.message || 'Delete failed', 'error');
      },
    });
  }



  resetForm(): void {
    this.editing = false;
    this.editingAssetId = '';
    this.asset = { id: '', assetId: '', assetName: '', category: '', brand: '', serialNumber: '' };
  }
}
