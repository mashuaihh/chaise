//'use strict';

/* Model Module */

var facebaseModel = angular.module('facebaseModel', []);

//angular.module('ermrestApp').factory('FacebaseData', function() {
facebaseModel.factory('FacebaseData', function() {
	return {
		'box': {},
		'chooseColumns': {},
		'collectionsPredicate': '',
		'colsDefs': [],
		'colsDescr': {},
		'colsGroup': {},
		'datasetFiles': {},
		'denormalizedView': {},
		'detailColumns': [],
		'detailRows': [],
		'details': false,
		'entryRow': [],
		'entityPredicates': [],
		'entry3Dview': '',
		'entrySubtitle': '',
		'entryTitle': '',
		'ermrestData': [],
		'facetClass': {},
		'facets': [],
		'files': [],
		'filterAllText': '',
		'filterOptions': {
			filterText: "",
			useExternalFilter: true
		},
		'filterSearchAllTimeout': null,
		'filterSliderTimeout': null,
		'filterTextTimeout': null,
		'level': 0,
		'linearizeView': {},
		'maxPages': 0,
		'metadata': {},
		'modalIndex': -1,
		'moreFlag': false,
		'narrow': {},
		'pageMap': {},
		'pageNavigation': false,
		'pagingOptions': {
			pageSizes: [25, 50, 100],
			pageSize: 25,
			currentPage: 1},
			'pageRange': [],
			'ready': false,
			'score': [],
			'selectedEntity': null,
			'sortColumns': [''],
			'sortDirection': 'asc',
			'sortDirectionOptions': ['asc', 'desc'],
			'sortFacet': '',
			'sortInfo': {'fields': [], 'directions': []},
			'spinner': [],
			'table': '',
			'tables': [],
			'tagPages': 5,
			'textEntryRow': [],
			'tiles': [],
			'totalServerItems': 0,
			'tree': [],
			'viewer3dFile': []
	};
});