import { NgModule } from "@angular/core";
import { MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule, MatRadioModule, MatExpansionModule } from "@angular/material";

@NgModule({
    imports: [MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule, MatRadioModule, MatExpansionModule ],
    exports: [MatDatepickerModule, MatSnackBarModule, MatSelectModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, MatToolbarModule, MatIconModule, MatSidenavModule, MatListModule, MatButtonModule, MatRadioModule, MatExpansionModule ]
})

export class ReqMatModule { }