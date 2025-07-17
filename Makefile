target=node18-macos-arm64
build-dir=build
exec-name=abc
root-dir=.

build-dep:
	mkdir -p build

# set TLS verification as false if it fails due to cert error by running `export NODE_TLS_REJECT_UNAUTHORIZED=0`
build: build-dep
	npm run build

compile: build-dep
	pkg $(root-dir) --targets $(target) --output $(build-dir)/$(exec-name)

install:
	npm -i install

clean:
	rm -rf build/*

.PHONY: build-dep build compile install clean
