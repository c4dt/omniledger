apply-patches: npm-install
	patch -p0 < nodeify_temporary_patch.patch

npm-install: clean
	npm ci
	find app -name "*js" | xargs rm

clean:
	rm -rf node_modules platforms hooks

android-dev: apply-patches
	tns prepare android

android-release: apply-patches
	@if [ ! "$$PERSONHOOD_ANDROID_PASS" ]; then echo "Please set PERSONHOOD_ANDROID_PASS"; exit 1; fi
	@if ! grep -q "Testing: false" app/lib/Defaults.ts; then echo "\nPUT TESTING TO FALSE IN Defaults.ts !!\n"; exit 1; fi
	@tns build android --key-store-path dedis-development.jks --key-store-password $$PERSONHOOD_ANDROID_PASS \
	    --key-store-alias personhood --key-store-alias-password $$PERSONHOOD_ANDROID_PASS --release
	@echo "Build successful - apk is at platforms/android/app/build/outputs/apk/release/app-release.ap"

release-key:
	if [ -e dedis-development.jks ]; then echo "Please remove dedis-development.jks first"; exit 1; fi
	keytool -genkey -v -storetype pkcs12 -keystore dedis-development.jks -keyalg RSA -keysize 4096 -validity 10000 -alias personhood

ios-dev: apply-patches
	tns prepare ios

# To be able to use ios-release you need to first run a manual
# build once, which will use Xcode to download the signing profile.
ios-release: apply-patches
	tns prepare ios --release
	rm -rf platforms/ios/build
	xcodebuild -workspace platforms/ios/personhoodonline.xcworkspace -scheme personhoodonline -destination generic/platform=iOS archive -archivePath `pwd`/platforms/ios/build/personhood.xcarchive
	xcodebuild -exportArchive -archivePath `pwd`/platforms/ios/build/personhood.xcarchive -exportOptionsPlist app/App_Resources/iOS/ExportOptions.plist -exportPath `pwd`/platforms/ios/build
	ls -l `pwd`/platforms/ios/build/personhoodonline.ipa

xcode-dev: ios-dev
	open platforms/ios/personhoodonline.xcworkspace/



cothority_src: dynacred_src cothority-pull app/lib/cothority

app/lib/cothority: cothority/external/js/cothority/src
	@cp -a $< $@
	@find app/ -name "*.ts" | xargs perl -pi -e "s:\@dedis/cothority:~/lib/cothority:"
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
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/cothority:\@dedis/cothority:"

cothority:
	git clone --depth 1 https://github.com/dedis/cothority

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

app/lib/dynacred: dynacred
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
	diff -Naurq dynacred/ app/lib/dynacred/ || \
		( echo "Moving changes to dynacred"; cp -a app/lib/dynacred/ dynacred ); \
	rm -rf app/lib/dynacred; \
	find app/ -name "*.ts" | xargs perl -pi -e "s:~/lib/dynacred:\@c4dt/dynacred:"

src: cothority_src

npm: dynacred_npm
