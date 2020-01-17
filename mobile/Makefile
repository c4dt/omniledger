## Default
## $ make
## sets up system for
## $ tns run (android|ios)

.DEFAULT_GOAL := apply-patches

##
## Release related targets
##

gradle-simul:
	cd app/App_Resources/Android && cp app.gradle.simul app.gradle

gradle-prod:
	cd app/App_Resources/Android && cp app.gradle.prod app.gradle

clean: gradle-simul
	rm -rf node_modules platforms hooks

../dynacred/build/index.js:
	make -C ../dynacred

npm-install: clean ../dynacred/build/index.js
	# if dynacred is installed from the parent's directory with `npm i ../dynacred`,
	# npm will install all dependencies, including @dedis/cothority, and this will conflict with
	# the @dedis/cothority in mobile, which will lead to structures form the different cothorities not
	# being recognized as the same, e.g., `r instanceof Roster` will not work over the two packages...
	[ -d dynacred ] || ln -s $$(pwd)/../dynacred .
	rm -rf dynacred/node_modules
	npm ci
	find app -name "*js" -delete

apply-patches: npm-install
	patch -p0 < nodeify_temporary_patch.patch
	cp nodeify_noxml.js node_modules/nativescript-nodeify/nodeify.js
	rm -rf node_modules/public-encrypt/test/

android-dev: apply-patches
	tns prepare android

roster-check:
	[ -n "$$PERSONHOOD3_ANDROID_PASS" ]
	@if grep -q -l '^export const bcDef = bdDEDIS' app/lib/byzcoin-def.ts; then \
	  echo "Correct roster"; else \
	  echo "\nPUT 'bcDef = bdDEDIS' IN app/lib/byzcoin-def.ts !!\n"; exit 1; fi

update-version:
	@REL=$$( grep version package.json | head -n 1 | sed -e "s/.*: .\(.*\).,/\1/" ) && \
	perl -pi -e "s/(versionName=\").*\"/\$${1}$$REL\"/" app/App_Resources/Android/src/main/AndroidManifest.xml && \
	perl -0pi -e "s:(<key>CFBundleVersion</key>.*?<string>).*?</:\$${1}$$REL</:s" app/App_Resources/iOS/Info.plist && \
	perl -pi -e "s/appVersion.*/appVersion = \"$$REL\";/" app/lib/user-data.ts

android-compile: update-version
	[ -n "$$PERSONHOOD3_ANDROID_PASS" ]
	@tns build android --key-store-path c4dt-development.jks --key-store-password $$PERSONHOOD3_ANDROID_PASS \
		--key-store-alias personhood --key-store-alias-password $$PERSONHOOD3_ANDROID_PASS --release
	@echo "Build successful - apk is at platforms/android/app/build/outputs/apk/release/app-release.ap"

android-release-copy:
	@mkdir -p releases && \
	REL=$$( grep versionName app/App_Resources/Android/src/main/AndroidManifest.xml | sed -e "s:.*\"\(.*\)\".*:\1:" ) && \
	cp -n platforms/android/app/build/outputs/apk/release/app-release.apk releases/personhood2.$$REL.apk

android-release: roster-check apply-patches gradle-prod android-compile gradle-simul android-release-copy

android-release-32-copy:
	@mkdir -p releases && \
	REL=$$( grep versionName app/App_Resources/Android/src/main/AndroidManifest.xml | sed -e "s:.*\"\(.*\)\".*:\1:" ) && \
	cp -n platforms/android/app/build/outputs/apk/release/app-release.apk releases/personhood2-32.$$REL.apk

android-release-32: gradle-simul roster-check apply-patches android-compile android-release-32-copy

android-run: roster-check gradle-simul
	[ -n "$$PERSONHOOD3_ANDROID_PASS" ]
	@tns run android --key-store-path c4dt-development.jks --key-store-password $$PERSONHOOD3_ANDROID_PASS \
		--key-store-alias personhood --key-store-alias-password $$PERSONHOOD3_ANDROID_PASS

release-key:
	if [ -e c4dt-development.jks ]; then echo "Please remove c4dt-development.jks first"; exit 1; fi
	keytool -genkey -v -storetype pkcs12 -keystore c4dt-development.jks -keyalg RSA -keysize 4096 -validity 10000 -alias personhood

ios-prepare: update-version
	perl -pi -e "s/org.c4dt.personhood2/ch.epfl.personhood2/" package.json
	tns prepare ios
	perl -pi -e "s/ch.epfl.personhood2/org.c4dt.personhood2/" package.json

ios-dev: apply-patches ios-prepare

# To be able to use ios-release you need to first run a manual
# build once, which will use Xcode to download the signing profile.
ios-release: apply-patches
	tns prepare ios --release
	rm -rf platforms/ios/build
	xcodebuild -workspace platforms/ios/mobile.xcworkspace -scheme mobile -destination generic/platform=iOS archive -archivePath `pwd`/platforms/ios/build/mobile.xcarchive
	xcodebuild -exportArchive -archivePath `pwd`/platforms/ios/build/mobile.xcarchive -exportOptionsPlist app/App_Resources/iOS/ExportOptions.plist -exportPath `pwd`/platforms/ios/build

xcode-dev: ios-dev
	open platforms/ios/mobile.xcworkspace/

release: android-release-32 gradle-prod android-compile gradle-simul android-release-copy ios-prepare
	open platforms/ios/mobile.xcworkspace/

##
## Code-related targets
##

cothority-pull:
	make -C .. cothority-pull

kyber_src: cothority_src app/lib/kyber
	npm r @dedis/kyber

app/lib/kyber: ../cothority/external/js/kyber/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/kyber:~/lib/kyber:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

kyber_npm:
	@echo "Using kyber-npm libraries"
	@if [ ! -d app/lib/kyber ]; then \
		echo "there is no kyber-source present, aborting"; \
		exit 1; \
	fi
	@find app/lib/kyber -name "*.js" -delete && \
	find app/lib/kyber -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove; \
	diff -Naurq ../cothority/external/js/kyber/src/ app/lib/kyber/ || \
		( echo "Moving changes to kyber"; cp -a app/lib/kyber/ ../cothority/external/js/kyber/src ); \
	rm -rf app/lib/kyber && \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/kyber:\@dedis/kyber:" && \
	npm i -s @dedis/kyber

cothority_src: dynacred_src cothority-pull app/lib/cothority
	npm r @dedis/cothority

app/lib/cothority: ../cothority/external/js/cothority/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/cothority:~/lib/cothority:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

cothority_npm: kyber_npm
	@echo "Using cothority-npm libraries"
	@if [ ! -d app/lib/cothority ]; then \
		echo "there is no cothority-source present"; \
		exit 1; \
	fi; \
	find app/lib/cothority -name "*.js" | xargs rm && \
	find app/lib/cothority -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove; \
	diff -Naurq ../cothority/external/js/cothority/src/ app/lib/cothority/ || \
		( echo "Moving changes to cothority"; cp -a app/lib/cothority/ ../cothority/external/js/cothority/src ); \
	rm -rf app/lib/cothority && \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/cothority:\@dedis/cothority:" && \
	npm i -s @dedis/cothority

dynacred_src: app/lib/dynacred
	npm r @c4dt/dynacred

app/lib/dynacred: ../dynacred/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/dynacred:~/lib/dynacred:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

dynacred_npm: cothority_npm
	@echo "Using dynacred-npm libraries"
	@if [ ! -d app/lib/dynacred ]; then \
		echo "there is no dynacred-source present, aborting"; \
		exit 1; \
	fi; \
	find app/lib/dynacred -name "*.js" | xargs rm && \
	find app/lib/dynacred -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove && \
	diff -Naurq ../dynacred/src/ app/lib/dynacred/ || \
		( echo "Moving changes to dynacred"; cp -a app/lib/dynacred/* ../dynacred/src ); \
	rm -rf app/lib/dynacred && \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/dynacred:\@c4dt/dynacred:" && \
	( cd ../dynacred; npm run lint:fix ) && \
	npm i -s @c4dt/dynacred

src: kyber_src

npm: dynacred_npm
