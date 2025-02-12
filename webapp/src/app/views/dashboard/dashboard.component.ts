import { Component } from '@angular/core';
import {NgForOf} from '@angular/common';

@Component({
  selector: 'dashboard',
  imports: [
    NgForOf
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  public numbers: number[] = [];

  constructor() {
    for (let i = 0; i < 100; i++) {
      this.numbers.push(i);
    }
  }

}
