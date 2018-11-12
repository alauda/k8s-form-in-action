import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class PathProviderService {
  subject = new BehaviorSubject<string[]>([]);
}
