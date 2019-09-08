﻿/*
In NativeScript, the app.ts file is the entry point to your application.
You can use this file to perform app-level initialization, but the primary
purpose of the file is to pass control to the app’s first module.
*/

import { localize } from "nativescript-localize";
import * as application from "tns-core-modules/application";
import { isIOS } from "tns-core-modules/platform";
import Log from "~/lib/cothority/log";

application.on("orientationChanged", (evt) => {
    Log.lvl3("Orientation-change:", evt);
});

application.setResources({L: localize});

// iOS has one less frame that needs to be unwound than Android does.
if (isIOS) {
    Log.print("are in iOS");
    Log.stackFrameOffset = -1;
}

application.run({moduleName: "app-root"});

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/