.DEFAULT_GOAL := apply-patches

gradle-simul:
	@( cd app/App_Resources/Android; cp app.gradle.simul app.gradle )
	@perl -pi -e "s/org.c4dt.personhood2/ch.epfl.personhood2/" package.json

gradle-prod:
	@( cd app/App_Resources/Android; cp app.gradle.prod app.gradle )
	@perl -pi -e "s/ch.epfl.personhood2/org.c4dt.personhood2/" package.json

clean: gradle-simul
	rm -rf node_modules platforms hooks

npm-install: clean
	npm ci
	find app -name "*js" | xargs rm -f

apply-patches: npm-install
	patch -p0 < nodeify_temporary_patch.patch
	rm -rf node_modules/public-encrypt/test/

android-dev: apply-patches
	tns prepare android

android-check:
	@if [ ! "$$PERSONHOOD2_ANDROID_PASS" ]; then echo "Please set PERSONHOOD2_ANDROID_PASS"; exit 1; fi
	@if grep -q "testingMode = true" app/lib/user-data.ts; then echo "\nPUT TESTING TO FALSE IN lib/user-data.ts !!\n"; exit 1; fi

update-version:
	@REL=$$( grep version package.json | head -n 1 | sed -e "s/.*: .\(.*\).,/\1/" ); \
	perl -pi -e "s/(versionName=\").*\"/\$${1}$$REL\"/" app/App_Resources/Android/src/main/AndroidManifest.xml; \
	perl -0pi -e "s:(<key>CFBundleVersion</key>.*?<string>).*?</:\$${1}$$REL</:s" app/App_Resources/iOS/Info.plist; \
	perl -pi -e "s/appVersion.*/appVersion = \"$$REL\";/" app/lib/user-data.ts

android-compile: update-version
	@tns build android --key-store-path c4dt-development.jks --key-store-password $$PERSONHOOD2_ANDROID_PASS \
		--key-store-alias personhood --key-store-alias-password $$PERSONHOOD2_ANDROID_PASS --release
	@echo "Build successful - apk is at platforms/android/app/build/outputs/apk/release/app-release.ap"

android-release: android-check apply-patches gradle-prod android-compile gradle-simul
	@mkdir -p releases; \
	REL=$$( grep versionName app/App_Resources/Android/src/main/AndroidManifest.xml | sed -e "s:.*\"\(.*\)\".*:\1:" ); \
	cp -n platforms/android/app/build/outputs/apk/release/app-release.apk releases/personhood2.$$REL.apk

android-release-32: gradle-simul android-check apply-patches android-compile
	@mkdir -p releases; \
	REL=$$( grep versionName app/App_Resources/Android/src/main/AndroidManifest.xml | sed -e "s:.*\"\(.*\)\".*:\1:" ); \
	cp -n platforms/android/app/build/outputs/apk/release/app-release.apk releases/personhood2-32.$$REL.apk

android-run: android-check gradle-simul
	@tns run android --key-store-path c4dt-development.jks --key-store-password $$PERSONHOOD2_ANDROID_PASS \
		--key-store-alias personhood --key-store-alias-password $$PERSONHOOD2_ANDROID_PASS

release-key:
	if [ -e c4dt-development.jks ]; then echo "Please remove c4dt-development.jks first"; exit 1; fi
	keytool -genkey -v -storetype pkcs12 -keystore c4dt-development.jks -keyalg RSA -keysize 4096 -validity 10000 -alias personhood

ios-dev: apply-patches
	tns prepare ios

# To be able to use ios-release you need to first run a manual
# build once, which will use Xcode to download the signing profile.
ios-release: apply-patches
	tns prepare ios --release
	rm -rf platforms/ios/build
	xcodebuild -workspace platforms/ios/mobile.xcworkspace -scheme mobile -destination generic/platform=iOS archive -archivePath `pwd`/platforms/ios/build/mobile.xcarchive
	xcodebuild -exportArchive -archivePath `pwd`/platforms/ios/build/mobile.xcarchive -exportOptionsPlist app/App_Resources/iOS/ExportOptions.plist -exportPath `pwd`/platforms/ios/build
	ls -l `pwd`/platforms/ios/build/mobile.ipa

xcode-dev: ios-dev
	open platforms/ios/mobile.xcworkspace/



cothority_src: dynacred_src cothority-pull app/lib/cothority

app/lib/cothority: cothority/external/js/cothority/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/cothority:~/lib/cothority:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

cothority_npm: kyber_npm
	@echo "Using cothority-npm libraries"
	@if [ ! -d app/lib/cothority ]; then \
		echo "there is no cothority-source present"; \
		exit 0; \
	fi; \
	find app/lib/cothority -name "*.js" | xargs rm ;\
	find app/lib/cothority -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove; \
	diff -Naurq cothority/external/js/cothority/src/ app/lib/cothority/ || \
		( echo "Moving changes to cothority"; cp -a app/lib/cothority/ cothority/external/js/cothority/src ); \
	rm -rf app/lib/cothority; \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/cothority:\@c4dt/cothority:"

cothority:
	git clone --depth 1 https://github.com/c4dt/cothority

cothority-pull: cothority
	cd cothority && git pull

kyber_src: cothority_src app/lib/kyber

app/lib/kyber: cothority/external/js/kyber/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/kyber:~/lib/kyber:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

kyber_npm:
	@echo "Using kyber-npm libraries"
	@if [ ! -d app/lib/kyber ]; then \
		echo "there is no kyber-source present, aborting"; \
		exit 0; \
	fi; \
	find app/lib/kyber -name "*.js" | xargs rm ;\
	find app/lib/kyber -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove; \
	diff -Naurq cothority/external/js/kyber/src/ app/lib/kyber/ || \
		( echo "Moving changes to kyber"; cp -a app/lib/kyber/ cothority/external/js/kyber/src ); \
	rm -rf app/lib/kyber; \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/kyber:\@dedis/kyber:"

dynacred_src: app/lib/dynacred

app/lib/dynacred: ../dynacred/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@c4dt/dynacred:~/lib/dynacred:"
	@find $@ -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh

dynacred_npm: cothority_npm
	@echo "Using dynacred-npm libraries"
	@if [ ! -d app/lib/dynacred ]; then \
		echo "there is no dynacred-source present, aborting"; \
		exit 0; \
	fi; \
	find app/lib/dynacred -name "*.js" | xargs rm ; \
	find app/lib/dynacred -name "*.ts" | grep -v .d.ts | xargs -n 1 ./nodeify.sh remove; \
	diff -Naurq ../dynacred/src/ app/lib/dynacred/ || \
		( echo "Moving changes to dynacred"; cp -a app/lib/dynacred/* ../dynacred/src ); \
	rm -rf app/lib/dynacred; \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/dynacred:\@c4dt/dynacred:"; \
	cd ../dynacred; npm run lint:fix

src: cothority_src

npm: dynacred_npm
