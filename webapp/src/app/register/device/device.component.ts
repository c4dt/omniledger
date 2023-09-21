import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import URL from 'url-parse';

import Log from '@dedis/cothority/log';

import { Router } from '@angular/router';
import { ByzCoinService } from 'src/app/byz-coin.service';
import { showDialogInfo, showDialogOKC, showTransactions, TProgress } from 'src/lib/Ui';

@Component({
    selector: 'app-device',
    templateUrl: './device.component.html',
})
export class DeviceComponent implements OnInit {
    text: string;

    constructor(
        private router: Router,
        private snack: MatSnackBar,
        private bcs: ByzCoinService,
        private dialog: MatDialog,
    ) {
        this.text = 'Please wait';
    }

    async ngOnInit() {
        try {
            if (await this.bcs.hasUser()) {
                await this.bcs.loadUser();
                const url = new URL(window.location.href, true);
                if (url.query.credentialIID) {
                    const credID = Buffer.from(url.query.credentialIID, 'hex');
                    if (credID.equals(this.bcs.user.credStructBS.id)) {
                        await showDialogInfo(this.dialog, 'Already signed up',
                            'You used the signup link to return back to the omniledger ' +
                            'service. Please don\'t use the "Sign up" link twice. ' +
                            'If you deleted your previous account, please follow the section ' +
                            '"Troubleshooting" in the same account.', 'Understood');
                        return this.router.navigateByUrl('/');
                    }
                }
                if (!(await showDialogOKC(this.dialog, 'Overwrite user?', 'There seems to' +
                    'be a user already defined on this browser. Do you want to overwrite it?',
                    {OKButton: 'Overwrite', CancelButton: 'Keep existing'}))) {
                    return this.router.navigateByUrl('/');
                }
            }
            await showTransactions(this.dialog, 'Attaching to existing user',
                async (progress: TProgress) => {
                    progress(50, 'Attaching new device');
                    this.bcs.user = await this.bcs.retrieveUserByURL(window.location.href);
                });
            await this.router.navigateByUrl('/');
        } catch (e) {
            Log.catch(e, 'Couldn\'t register:');
            this.text = e.toString();
        }
    }
}
