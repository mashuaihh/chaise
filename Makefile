# Makefile rules

# Disable built-in rules
.SUFFIXES:

# Project name
PROJ=chaise

# Node module dependencies
MODULES=node_modules

# Node bin scripts
BIN=$(MODULES)/.bin

# Mocha scripts
UNIT=$(BIN)/mocha

# Protractor scripts
E2E=test/e2e/search/protractor.conf.js \

# Rule to determine MD5 utility
ifeq ($(shell which md5 2>/dev/null),)
    MD5 = md5sum
else
    MD5 = md5 -q
endif

CAT=cat

# Bower front end components
BOWER=bower_components

# HTML
HTML=search/index.html \
	 login/index.html \
	 record/index.html

# CSS source
CSS=styles

CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/vendor/ng-grid.css \
	$(CSS)/vendor/rzslider.css \
	$(CSS)/vendor/angular-datepicker.css

CSS_SOURCE=$(CSS)/swoop-sidebar.css \
	$(CSS)/jquery.nouislider.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/ermrest.css \
	$(CSS)/app.css \
	$(CSS)/appheader.css

# JavaScript source and test specs
JS=scripts

JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/jquery-ui-tooltip.min.js \
	$(JS)/vendor/jquery.nouislider.all.min.js \
	$(JS)/vendor/bootstrap.min.js \
	$(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js \
	$(JS)/vendor/rzslider.js \
	$(JS)/vendor/angular-datepicker.js \
	$(JS)/vendor/ng-grid.js

JS_SOURCE=$(JS)/respond.js \
	$(JS)/variables.js \
	$(JS)/utils.js \
	$(JS)/ermrest.js \
	$(JS)/app.js \
	$(JS)/facetsModel.js \
	$(JS)/facetsService.js \
	$(JS)/controller/ermrestDetailController.js \
	$(JS)/controller/ermrestFilterController.js \
	$(JS)/controller/ermrestInitController.js \
	$(JS)/controller/ermrestLoginController.js \
	$(JS)/controller/ermrestLogoutController.js \
	$(JS)/controller/ermrestResultsController.js \
	$(JS)/controller/ermrestSideBarController.js

# HTML templates
TEMPLATES=views

TEMPLATES_DEPS=$(TEMPLATES)/erminit.html \
	$(TEMPLATES)/ermsidebar.html \
	$(TEMPLATES)/ermretrievefilters.html \
	$(TEMPLATES)/ermretrieveresults.html

# JavaScript and CSS source for Record app
RECORD_ASSETS=record/assets

RECORD_SHARED_JS_DEPS=$(JS)/vendor/jquery-latest.min.js \
	$(JS)/vendor/jquery.cookie.js \
	$(JS)/vendor/angular.js \
	$(JS)/vendor/angular-sanitize.js

RECORD_JS_DEPS=$(RECORD_ASSETS)/lib/angular-route.min.js \
	$(RECORD_ASSETS)/lib/angular-resource.min.js \
	$(RECORD_ASSETS)/lib/angular-animate.min.js \
	$(RECORD_ASSETS)/lib/angular-cookies.min.js \
	$(RECORD_ASSETS)/lib/ui-bootstrap-tpls-0.12.1.min.js \
	$(RECORD_ASSETS)/lib/filesize.min.js \
	$(RECORD_ASSETS)/lib/slippry/slippry.min.js \
	$(RECORD_ASSETS)/lib/fancybox/jquery.fancybox.pack.js \
	$(RECORD_ASSETS)/lib/jquery.floatThead.min.js

RECORD_JS_SOURCE= $(JS)/respond.js \
	$(JS)/variables.js \
	$(JS)/utils.js \
	$(JS)/ermrest.js \
	$(RECORD_ASSETS)/javascripts/app.js

RECORD_SHARED_CSS_DEPS=$(CSS)/vendor/bootstrap.min.css \
	$(CSS)/material-design/css/material-design-iconic-font.min.css \
	$(CSS)/appheader.css

RECORD_CSS_DEPS=$(RECORD_ASSETS)/lib/slippry/slippry.css \
	$(RECORD_ASSETS)/lib/fancybox/jquery.fancybox.css

RECORD_CSS_SOURCE=$(RECORD_ASSETS)/stylesheets/app.css

# Config file
JS_CONFIG=chaise-config.js

# Distribution target
DIST=dist

# Project package full/minified
PKG=$(DIST)/$(PROJ).js
MIN=$(DIST)/$(PROJ).min.js

# Documentation target
DOC=doc
API=$(DOC)/api.md
JSDOC=jsdoc

# Hidden target files (for make only)
LINT=.make-lint

.PHONY: all
# all should just do the minimal needed to deploy chaise
all: $(HTML)

.PHONY: build
build: $(PKG) $(MIN) $(HTML)

# Rule to build the full library
$(PKG): $(JS_SOURCE) $(BIN)
	mkdir -p $(DIST)
	cat $(JS_SOURCE) > $(PKG)

# Rule to build the minified package
$(MIN): $(JS_SOURCE) $(BIN)
	mkdir -p $(DIST)
	$(BIN)/ccjs $(JS_SOURCE) > $(MIN)

# Rule to lint the source (only changed source is linted)
$(LINT): $(JS_SOURCE) $(BIN)
	$(BIN)/jshint $(filter $(JS_SOURCE), $?)
	@touch $(LINT)

.PHONY: lint
lint: $(LINT)

# Rule for making markdown docs
$(DOC): $(API)

# Rule for making API doc
$(API): $(JS_SOURCE) $(BIN)
	mkdir -p $(DOC)
	$(BIN)/jsdoc2md $(JS_SOURCE) > $(API)

# jsdoc: target for html docs produced (using 'jsdoc')
$(JSDOC): $(JS_SOURCE) $(BIN)
	mkdir -p $(JSDOC)
	$(BIN)/jsdoc --pedantic -d $(JSDOC) $(JS_SOURCE)
	@touch $(JSDOC)

# Rule to ensure Node bin scripts are present
$(BIN): $(MODULES)
	node_modules/.bin/webdriver-manager update --standalone
	@touch $(BIN)

# Rule to install Node modules locally
$(MODULES): package.json
	npm install
	@touch $(MODULES)

# Rule to install Bower front end components locally
$(BOWER): $(BIN) bower.json
	$(BIN)/bower install
	@touch $(BOWER)

.PHONY: deps
deps: $(BIN) $(BOWER)

.PHONY: updeps
updeps:
	npm update
	$(BIN)/bower update

# Rule to clean project directory
.PHONY: clean
clean:
	rm $(HTML) || true
	rm -rf $(DIST)
	rm -rf $(JSDOC)
	rm -f .make-*

# Rule to clean the dependencies too
.PHONY: distclean
distclean: clean
	rm -rf $(MODULES)
	rm -rf $(BOWER)

# Rule to run tests
.PHONY: test
test: deps
	for file in $(E2E); do \
		$(BIN)/protractor $$file; \
	done

# Rule to run testem
.PHONY: testem
testem:
	$(BIN)/testem

# Rule to run karma
.PHONY: karma
karma:
	$(BIN)/karma start

# Rule to make html
.PHONY: html
html: $(HTML)

# Rules to attach checksums to JavaScript and CSS source in the header
search/index.html: search/index.html.in .make-asset-block .make-template-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		-e '/%TEMPLATES%/ {' -e 'r .make-template-block' -e 'd' -e '}' \
		search/index.html.in > search/index.html

login/index.html: login/index.html.in .make-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-asset-block' -e 'd' -e '}' \
		login/index.html.in > login/index.html

record/index.html: record/index.html.in .make-record-asset-block
	sed -e '/%ASSETS%/ {' -e 'r .make-record-asset-block' -e 'd' -e '}' \
		record/index.html.in > record/index.html

.make-asset-block: $(CSS_DEPS) $(CSS_SOURCE) $(JS_DEPS) $(JS_SOURCE) $(JS_CONFIG)
	> .make-asset-block
	for file in $(CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-asset-block ; \
	done
	for file in $(CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'>" >> .make-asset-block ; \
	done
	for file in $(JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-asset-block ; \
	done
	for file in $(JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-asset-block ; \
	done

.make-record-asset-block: $(RECORD_SHARED_CSS_DEPS) $(RECORD_CSS_DEPS) $(RECORD_CSS_SOURCE) $(RECORD_SHARED_JS_DEPS) $(RECORD_JS_DEPS) $(RECORD_JS_SOURCE) $(JS_CONFIG)
	> .make-record-asset-block
	for file in $(RECORD_SHARED_CSS_DEPS) $(RECORD_CSS_DEPS); do \
		echo "<link rel='stylesheet' type='text/css' href='../$$file'>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_CSS_SOURCE); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<link rel='stylesheet' type='text/css' href='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_SHARED_JS_DEPS) $(RECORD_JS_DEPS); do \
		echo "<script src='../$$file'></script>" >> .make-record-asset-block ; \
	done
	for file in $(RECORD_JS_SOURCE) $(JS_CONFIG); do \
		checksum=$$($(MD5) $$file | awk '{ print $$1 }') ; \
		echo "<script src='../$$file?v=$$checksum'></script>" >> .make-record-asset-block ; \
	done

.make-template-block: $(TEMPLATES_DEPS)
	> .make-template-block
	for file in $(TEMPLATES_DEPS); do \
		$(CAT) $$file >> .make-template-block ; \
	done

# Rules for help/usage
.PHONY: help usage
help: usage
usage:
	@echo "Available 'make' targets:"
	@echo "    all       - an alias for build"
	@echo "    deps      - local install of node and bower dependencies"
	@echo "    updeps    - update local dependencies"
	@echo "    lint      - lint the source"
	@echo "    build     - builds the package"
	@echo "    test      - runs commandline tests"
	@echo "    testem    - starts the testem service"
	@echo "    karma     - starts the karma service"
	@echo "    doc       - make autogenerated markdown docs"
	@echo "    jsdoc     - make autogenerated html docs"
	@echo "    clean     - cleans the dist dir"
	@echo "    distclean - cleans the dist dir and the dependencies"
