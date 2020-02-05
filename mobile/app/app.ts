// tslint:disable-next-line
require("nativescript-nodeify");

import Log from "@dedis/cothority/log";
import { localize } from "nativescript-localize";
import * as application from "tns-core-modules/application";
import { isIOS } from "tns-core-modules/platform";

application.on("orientationChanged", (evt) => {
    Log.lvl3("Orientation-change:", evt);
});

application.setResources({L: localize});

// iOS has one less frame that needs to be unwound than Android does.
if (isIOS) {
    Log.stackFrameOffset = -1;
}

application.run({moduleName: "app-root"});

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
