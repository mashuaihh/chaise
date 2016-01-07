// Each suite should begin with a `describe`
describe('In the Chaise search app,', function () {
    var EC = protractor.ExpectedConditions;

    describe('on load,', function () {
        beforeAll(function () {
            browser.get('');
        });
        it('should show the spinner', function (done) {
            var spinner = element(by.id('spinner'));
            // Browser waits (up to 500ms) for spinner to become visible before continuing
            browser.wait(EC.visibilityOf(spinner), 500).then(function () {
                expect(spinner.isDisplayed()).toBe(true);
                done();
            });
        });

        it('should open the initial sidebar', function (done) {
            var spinner = element(by.id('spinner'));
            var sidebar = element(by.id('sidebar'));
            browser.wait(EC.visibilityOf(sidebar), 10000).then(function () {
                expect(sidebar.isDisplayed()).toBe(true);
                expect(spinner.isDisplayed()).toBe(false);
                done();
            });
        });

        it('should have > 1 visible facets to choose from', function (done) {
            var facets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            facets.then(function () {
                expect(facets.count()).toBeGreaterThan(0);
            });
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            hiddenFacets.then(function () {
                expect(hiddenFacets.count()).toBeLessThan(facets.count());
                done();
            });
        });
    });

    describe('the initial facet selection sidebar', function () {
        var expectedFacetsNum = 0;
        //choose the first element found, because it's the one we are looking for
        //use first() instead of [0], so the Promise can be resolved
        var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
        it('should display 0 attributes when searching for something nonexistent', function (done) {
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.sendKeys('hello');
            });

            var allFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function () {
                //use then to get the resolved result of Promise count()
                hiddenFacets.count().then(function () {
                    allFacets.count().then(function (allFacetsNum) {
                        hiddenFacets.count().then(function (hiddenFacetsNum) {
                            expect(allFacetsNum).toBeGreaterThan(0);
                            expect(hiddenFacetsNum).toBeGreaterThan(0);
                            var shownFacetsNum = allFacetsNum - hiddenFacetsNum;
                            expect(shownFacetsNum).toEqual(expectedFacetsNum);
                            done();
                        });
                    });
                });
            });
        });
    });

    describe('The sidebar filter input ', function () {

        it('should find 8 attributes when searching for \'RNA\' in the search box', function (done) {
            var expectedAttrNum = 8;
            var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
            browser.wait(EC.visibilityOf(searchBox), 500).then(function () {
                // Set values (usually inputs) via sendKeys();
                searchBox.clear();
                searchBox.sendKeys('RNA');
            });
            var allFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope'));
            var hiddenFacets = element.all(by.css('#sidebar ul.sidebar-nav li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function () {
                //use then to get the resolved result of Promise count()
                hiddenFacets.count().then(function () {
                    allFacets.count().then(function (allFacetsNum) {
                        hiddenFacets.count().then(function (hiddenFacetsNum) {
                            expect(allFacetsNum).toBeGreaterThan(0);
                            expect(hiddenFacetsNum).toBeGreaterThan(0);
                            var shownFacetsNum = allFacetsNum - hiddenFacetsNum;
                            expect(shownFacetsNum).toEqual(expectedAttrNum);
                            done();
                        });
                    });
                });
            });
        });

        it('should show 3 attributes after clicking \"Experiment Type\"', function (done) {
            var searchBox = element.all(by.model('FacetsData.searchFilter')).first();
            var expectedAttrNum = 3;
            var searchBoxInput = searchBox.getAttribute('value');
            expect(searchBoxInput).toBe('RNA');

            var experimentFacet = element(by.cssContainingText('.field-toggle.ng-binding', 'Experiment Type'));
            browser.wait(EC.visibilityOf(experimentFacet), 500).then(function () {
                experimentFacet.click();
            });
            var allFacets = element.all(by.css('#editfilter ul.nav.filteritems li.ng-scope'));
            var hiddenFacets = element.all(by.css('#editfilter ul.nav.filteritems li.ng-scope.ng-hide'));
            //use then to get the resolved result of Promise count()
            allFacets.count().then(function (allFacetsNum) {
                //use then to get the resolved result of Promise count()
                hiddenFacets.count().then(function (hiddenFacetsNum) {
                    expect(allFacetsNum).toBeGreaterThan(0);
                    expect(hiddenFacetsNum).toBeGreaterThan(0);
                    var shownFacets = allFacetsNum - hiddenFacetsNum;
                    expect(shownFacets).toBe(expectedAttrNum);
                    done();
                });
            });
        });

        it('should find \'RNA express (microarray)\', click it and wait for 5s', function (done) {
            var nameOfResultFilter = 'RNA expression (microarray)';
            //var microarrayFilterLabel = element(by.cssContainingText('label.ng-binding.toggler', nameOfResultFilter))
            var microarrayFilterLabelLi = element(by.cssContainingText('div.editvalue-container li', nameOfResultFilter));
            var microarrayFilterLabel = microarrayFilterLabelLi.element(by.css('input'));
            browser.wait(EC.visibilityOf(microarrayFilterLabel), 500).then(function () {
                microarrayFilterLabel.click().then(function () {
                    setTimeout(function () {
                        done();
                    }, 5000);
                });
            });
        });
    });

    var expectedEntityTitle = '';
    var detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
    describe('Result content area ', function () {
        it('should show 25 out of 42 results', function (done) {
            var expectedShownResultsNum = 25;
            var expectedTotalResultsNum = 42;
            var allResults = element.all(by.repeater('row in FacetsData.ermrestData'));
            //choose the second #results_tally
            var resultTally = element.all(by.css('#results_tally')).get(1);
            var totalResults = resultTally.element(by.binding("FacetsData.totalServerItems"));
            allResults.count().then(function (allResultsNum) {
                totalResults.getText().then(function (totalResultsText) {
                    //test = "42"
                    expect(totalResultsText).toBe(expectedTotalResultsNum + "");
                    expect(allResultsNum).toBe(expectedShownResultsNum);
                    done();
                });
            });
        });

        it('should get the entity title and it\'s not empty', function (done) {
            var titleSpan = element.all(by.css('span.panel-title.ng-binding')).first();
            titleSpan.getText().then(function (text) {
                //get the entity title in results list
                expectedEntityTitle = text;
                expect(text).not.toBe('');
                done();
            });
        });

        detailUrl = "https://dev.misd.isi.edu/chaise/record/#1/legacy:dataset/id=263";
        it('should go to the correct URL when clicked', function (done) {
            //var titleSpan = element(by.cssContainingText('span.panel-title', titleTxt));
            var titleSpan = element.all(by.css('span.panel-title.ng-binding')).first();
            titleSpan.click();
            browser.rootEl = "#recordApp";
            // 'browser.ignoreSynchronization = true' tells Protractor not to sync(wait for Angular's finishing async operations).
            //It is not supposed to be used here, but somehow using it resolves the 'Hashtag' problem.
            //Before, the problem was, Angualr(or Browser) adds automatically a slash after '#', making '/#1/' become '/#/1/'.
            browser.ignoreSynchronization = true;
            setTimeout(function () {
                expect(browser.getCurrentUrl()).toBe(detailUrl);
                done();
            }, 5000);
        });

    });

    describe('the record detail page', function () {
        //turn on sync again
        browser.ignoreSynchronization = false;
        it('should still have the correct URL when sync is turned on', function (done) {
            //make sure after turning on Sync, the URL is not changed.
            expect(browser.getCurrentUrl()).toBe(detailUrl);
            done();
        });

        it('should have the correct title', function (done) {
            var entityTitleEle = element(by.css('#entity-title'));
            entityTitleEle.getText().then(function (entityTitle) {
                expect(entityTitleEle.isDisplayed()).toBe(true);
                expect(entityTitle).toBe(expectedEntityTitle);
                done();
            });
        });

        it('should have non-empty Description', function (done) {
            var descriptionEle = element(by.cssContainingText('.entity-key.ng-binding', 'description'));
            descriptionEle.getText().then(function (text) {
                expect(descriptionEle.isDisplayed()).toBe(true);
                expect(text).not.toBe('');
                var descriptionValueEle = descriptionEle.element(by.xpath('following-sibling::td'));
                descriptionValueEle.getText().then(function (desText) {
                    expect(desText).not.toBe('');
                    done();
                });
            });
        });

        it('should have \'Data Type\' and its label is clickable', function (done) {
            var dataTypeEle = element(by.cssContainingText('.entity-key.ng-binding', 'data type'));
            dataTypeEle.getText().then(function (text) {
                expect(dataTypeEle.isDisplayed()).toBe(true);
                expect(text).not.toBe('');
                var dataTypeValueLabelEle = dataTypeEle.element(by.xpath('following-sibling::td')).element(by.css('a'));
                dataTypeValueLabelEle.getText().then(function (labelText) {
                    expect(labelText).not.toBe('');
                    done();
                })
            });
        });

        it('should open a table when \'DATA SOMITE COUNT\' is clicked', function (done) {
            var dataEle = element(by.cssContainingText('.panel-heading', 'dataset somite count'));
            //click on the DATA SOMITE COUNT
            dataEle.click().then(function () {
                var datasetSomiteTableEle = dataEle.element(by.xpath('following-sibling::div'));
                expect(datasetSomiteTableEle.isDisplayed()).toBe(true);

                var wrapperEle = datasetSomiteTableEle.element(by.css('.table-wrapper.wrapper'));
                var wrapperEleTbody = wrapperEle.element(by.css('tbody'));
                var ftListArray = wrapperEleTbody.all(by.repeater('reference in ft.list'));
                var firstRow = ftListArray.first();
                var firstRowKeyArray = firstRow.all(by.repeater('key in ft.keys'));
                var UrlEle = firstRowKeyArray.last();
                UrlEle.element(by.css('a')).getAttribute('href').then(function (linkText) {
                    expect(firstRow.isDisplayed()).toBe(true);
                    expect(firstRowKeyArray.count()).toBe(3);
                    expect(linkText).toContain('http');
                    done();
                });
            });
        });

        it('should show one file when \'FILES\' is clicked', function(done) {
            var expectedFileName = 'FB00000008.zip';
            var fileEle = element(by.cssContainingText('.panel-heading', 'Files'));
            var fileCollapedEle = fileEle.element(by.xpath('following-sibling::div'));
            expect(fileCollapedEle.isDisplayed()).toBe(false);

            fileEle.click().then(function() {
                expect(fileCollapedEle.isDisplayed()).toBe(true);
                var fileList = fileCollapedEle.all(by.repeater('file in entity.files'));
                var imgEle = fileList.first().element(by.css('img'));
                var fileNameEle = imgEle.all(by.xpath('following-sibling::div')).first();
                expect(fileNameEle.getText()).toBe(expectedFileName);
                expect(fileList.count()).toBe(1);
                done();
            });
        });
    });


});
