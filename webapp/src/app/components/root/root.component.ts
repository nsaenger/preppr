import { Component } from '@angular/core';
import {MatListItem, MatNavList} from '@angular/material/list';
import {NgSwitch, NgSwitchCase} from '@angular/common';
import {DashboardComponent} from '../../views/dashboard/dashboard.component';
import {StorageComponent} from '../../views/storage/storage.component';
import {NutrientsComponent} from '../../views/nutrients/nutrients.component';
import {EmergencyComponent} from '../../views/emergency/emergency.component';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'root',
  templateUrl: 'root.component.html',
  styleUrl: 'root.component.scss',
  imports: [
    MatNavList,
    MatListItem,
    NgSwitch,
    NgSwitchCase,
    DashboardComponent,
    StorageComponent,
    NutrientsComponent,
    EmergencyComponent,
    MatIcon
  ]
})
export class RootComponent {
  public currentView: string = 'storage';
  public sidebarVisible: boolean = true;

  constructor() {}

  setView(view: string) {
    this.currentView = view;
  }
}
