import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {Item} from '@shared/types/item';


@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  private inventory: BehaviorSubject<Item[]> = new BehaviorSubject([]);

  constructor() {
  }
}
