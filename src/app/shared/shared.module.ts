import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../pipes/translate.pipe';
import { SafePipe } from '../../utilities/pipe/safe.pipe';

/** Declares and re-exports shared pipes so both HomeModule and lazy sub-modules can use them. */
@NgModule({
  declarations: [TranslatePipe, SafePipe],
  imports: [CommonModule],
  exports: [TranslatePipe, SafePipe, CommonModule],
})
export class SharedModule {}
