import { NgModule } from "@angular/core";
import { MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule } from "@angular/material";

@NgModule({
    imports: [MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule],
    exports: [MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule]
})

export class ReqMatModule { }