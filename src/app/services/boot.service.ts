import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BootService {
  readonly enter$ = new Subject<void>();
}
