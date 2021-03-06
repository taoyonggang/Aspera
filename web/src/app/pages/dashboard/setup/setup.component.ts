import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { constants } from '../../../lib/model';
import { I18nService } from 'src/app/lib/i18n/i18n.service';
import { MatSelectChange } from '@angular/material';

@Component({
    selector: 'app-setup',
    styleUrls: ['./setup.component.css'],
    templateUrl: './setup.component.html'
})
export class SetupComponent implements OnInit {

    public languages: Array<any>;
    public currentLanguage: any;

    constructor(private i18n: I18nService) {
    }

    ngOnInit() {
        this.languages = constants.languages;
        this.currentLanguage = this.i18n.currentLanguage;
    }

    setLanguage(event: MatSelectChange) {
        this.currentLanguage = event.value;
        this.i18n.setLanguage(event.value)
    }

}
