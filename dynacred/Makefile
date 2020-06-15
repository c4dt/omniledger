build: deps
	npm run build

deps:
	npm ci

figures: roundtrip.png

roundtrip.png: roundtrip.txt
	plantuml roundtrip.txt

clean:
	@test -d ../cothority && ( echo "Cannot build with ../cothority present!"; exit 1 ) || true
	rm -rf build

version:
	@VERSION=$$( grep version package.json | head -n 1 | sed -e "s/.*:.*\"\(.*\)\",/\1/" ); \
	echo "Found version $$VERSION"; \
	if git tag | grep -q v$$VERSION; then \
		echo "git-tag $$VERSION already present"; exit 1; \
	else \
		if grep version package-lock.json | head -n 1 | grep -q $$VERSION; then \
			git tag v$$VERSION; \
			git push origin v$$VERSION; \
		else \
			echo "Run 'npm i' to update version in package-lock.json"; exit 1; \
		fi; \
	fi

publish: version clean build
	npm publish
