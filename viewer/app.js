// openSeadragonApp: Defines the Angular application ==================================================================================================================================
var openSeadragonApp = angular.module('openSeadragonApp', ['ERMrest']);

// ERMrestService: A service for operations that deal with the ERMrest db =============================================================================================================
openSeadragonApp.service('ERMrestService', ['ermrestClientFactory', '$http', function(ermrestClientFactory, $http) {
    var client = ermrestClientFactory.getClient(window.location.origin + '/ermrest', null);
    var catalog = client.getCatalog(1);

    // Get a reference to the ERMrestService service
    var self = this;

    // Parse Chaise url to determine required parameters to find the requested entity
    this.path = window.location.hash;
    this.params = this.path.split('/');
    this.catalogId = this.params[0].substring(1);
    this.schemaName = this.params[1].split(':')[0];
    this.tableName = this.params[1].split(':')[1];
    this.entityId = this.params[2].split('=')[1];

    var ERMREST_ENDPOINT = window.location.origin + '/ermrest/catalog/';
    if (chaiseConfig['ermrestLocation'] != null) {
        ERMREST_ENDPOINT = chaiseConfig['ermrestLocation'] + '/ermrest/catalog';
    }

    // Returns a Schema object from ERMrest
    this.getSchema = function getSchema() {
        return catalog.introspect().then(function(schemas) {
            return schemas[self.schemaName];
        });
    };

    // Returns the uri value from a row in rbk:image (filtered by the id found in URL)
    this.getEntity = function getEntity() {
        return this.getSchema().then(function(schema) {
            var table = schema.getTable(self.tableName);
            var filteredTable = table.getFilteredTable(["id=" + self.entityId]);
            return filteredTable.getRows().then(function(rows) {
                return rows[0].data.uri;
            });
        });
    };

    this.insertRoi = function insertRoi(x, y, width, height, context) {
        var timestamp = new Date().toISOString();
        var coordinates = [x, y, width, height];
        var roi = [{
            "id": null,
            "image_id": parseInt(this.entityId),
            "author": null,
            "timestamp": timestamp,
            "coords": coordinates,
            "context_uri": context,
            "anatomy": null
        }];
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi?defaults=id,author';
        return $http.post(entityPath, roi);
    };

    this.insertRoiComment = function insertRoiComment(roiId, comment) {
        var timestamp = new Date().toISOString();
        var roiComment = [{
            "id": null,
            "roi_id": roiId,
            "author": null,
            "timestamp": timestamp,
            "comment": comment
        }];

        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi_comment?defaults=id,author';
        return $http.post(entityPath, roiComment);
    };
    // TODO: Rewrite this with ermrestjs
    this.createAnnotation = function createAnnotation(x, y, width, height, context, comment, successCallback) {
        var newAnnotation = {};
        // First create a row in rbk:roi...
        this.insertRoi(x, y, width, height, context).then(function(response) {
            if (response.data) {
                newAnnotation = response.data[0];
                return response.data[0];
            } else {
                return 'Error: Region of interest could not be created. ' + response.status + ' ' + response.statusText;
            }
        // Then create a row in roi_comment, filling in the roi_id column with the result of insertRoi()
        }).then(function(data) {
            var roiId = data.id;
            self.insertRoiComment(roiId, comment).then(function(response) {
                if (response.data) {
                    var commentData = response.data[0];
                    newAnnotation.comments = {id: commentData.id, roiId: commentData.roi_id, author: commentData.author, comment: commentData.comment, timestamp: commentData.timestamp};
                    return response.data[0];
                } else {
                    return 'Error: Comment could not be created. ' + response.status + ' ' + response.statusText;
                }
            });
            successCallback(newAnnotation);
        });
    };

    // TODO: Rewrite this with ermrestjs
    this.editAnnotation = function editAnnotation(annotation) {
        var editedComment = [{
            "id": annotation.comments.id,
            "roi_id": annotation.id,
            "author": null,
            "timestamp": annotation.comments.timestamp,
            "comment": annotation.comments.comment
        }];
        var entityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi_comment';
        return $http.put(entityPath, editedComment);
    };

    this.getAnnotations = function getAnnotations() {
        var annotations = [];
        this.getSchema().then(function(schema) {
            var roiTable = schema.getTable('roi');
            var filteredRoiTable = roiTable.getFilteredTable(["image_id=" + self.entityId]);
            return filteredRoiTable.getRows().then(function(roiRows) {
                if (roiRows.length > 0) {
                    return Promise.all(roiRows.map(function(roi) {
                        return roi.getRelatedTable(self.schemaName, 'roi_comment').getRows().then(function(commentRows) {
                            return Promise.all(commentRows.map(function(comment) {
                                roi.data.comments = {id: comment.data.id, roiId: comment.data.roi_id, author: comment.data.author, comment: comment.data.comment, timestamp: comment.data.timestamp};
                                annotations.push(roi.data);
                            }));
                        });
                    }));
                } else {
                    console.log('No annotations found for this image.')
                }
            });
        });
        return annotations;
    };

    this.deleteAnnotation = function deleteAnnotation(annotation) {
        // Delete the comment from roi_comment
        var commentEntityPath = ERMREST_ENDPOINT + this.catalogId + '/entity/' + this.schemaName + ':roi_comment/id=' + annotation.comments.id;
        return $http.delete(commentEntityPath).then(function() {
            // Delete the roi itself
            var roiEntityPath = ERMREST_ENDPOINT + self.catalogId + '/entity/' + self.schemaName + ':roi/id=' + annotation.id;
            return $http.delete(roiEntityPath);
        });
    };
}]);

// MainController: An Angular controller to update the view ===========================================================================================================================
openSeadragonApp.controller('MainController', ['$scope', 'ERMrestService', function($scope, ERMrestService) {
    $scope.annotations = ERMrestService.getAnnotations();
    $scope.viewer = null;
    $scope.viewerReady = false;
    $scope.viewerSource = null;
    $scope.highlightedAnnotation = null; // Track which one is highlighted/centered right now
    $scope.creatingANewAnnotation = false;
    $scope.editMode = false; // True if user is currently editing an annotation
    $scope.editedAnnotation = null; // Track which one is being edited right now
    $scope.editedAnnotationText = ''; // The new annotation text to be used when updating an annotation

    // Fetch uri from image table to load OpenSeadragon
    ERMrestService.getEntity().then(function(uri) {
        // Initialize OpenSeadragon with the uri
        $scope.viewerSource = uri;
    });

    // Listen for events from OpenSeadragon/iframe
    // TODO: Maybe figure out an Angular way to listen to the postMessage event
    window.addEventListener('message', function(event) {
        if (event.origin === window.location.origin) {
            var data = event.data;
            var messageType = data.messageType;
            switch (messageType) {
                case 'myAnnoReady':
                    $scope.viewerReady = data.content;
                    if ($scope.viewerReady) {
                        $scope.viewer = window.frames[0];
                        $scope.viewer.postMessage({messageType: 'annotationsList', content: $scope.annotations}, window.location.origin);
                    }
                    break;
                case 'onAnnotationCreated':
                    var annotation = JSON.parse(event.data.content);
                    var coordinates = annotation.data.shapes[0].geometry;
                    ERMrestService.createAnnotation(coordinates.x, coordinates.y, coordinates.width, coordinates.height, annotation.data.context, annotation.data.text, $scope.pushAnnotationToScope);
                    break;
                default:
                    console.log('Invalid message type. No action performed.');
            }
        } else {
            console.log('Invalid event origin. Event origin: ', origin, '. Expected origin: ', window.location.origin);
        }
    });

    // A success callback fn to push new annotations into this controller's scope
    $scope.pushAnnotationToScope = function pushAnnotationToScope(newAnnotation) {
        $scope.annotations.push(newAnnotation);
    };

    $scope.highlightAnnotation = function highlightAnnotation(annotation) {
        $scope.viewer.postMessage({messageType: 'highlightAnnotation', content: annotation}, window.location.origin);
    };

    $scope.setHighlightedAnnotation = function setHighlightedAnnotation(annotationIndex) {
        $scope.highlightedAnnotation = annotationIndex;
    };

    // Activates the drawing selector tool in Annotorious
    $scope.drawNewAnnotation = function drawNewAnnotation() {
        $scope.creatingANewAnnotation = true;
        $scope.viewer.postMessage({messageType: 'drawNewAnnotation'}, window.location.origin);
    };

    $scope.editAnnotation = function editAnnotation(annotation) {
        $scope.editedAnnotation = annotation.id;
        $scope.editMode = true;
    };

    $scope.saveAnnotation = function saveAnnotation(annotation) {
        $scope.editedAnnotation = null;
        $scope.editMode = false;
        var timestamp = new Date().toISOString();
        annotation.comments.timestamp = timestamp;
        annotation.comments.comment = annotation.comments.comment;
        $scope.viewer.postMessage({messageType: 'saveAnnotation', content: annotation}, window.location.origin);
        ERMrestService.editAnnotation(annotation);
    }

    $scope.deleteAnnotation = function deleteAnnotation(annotation) {
        var index = $scope.annotations.indexOf(annotation);
        $scope.annotations.splice(index, 1);
        $scope.viewer.postMessage({messageType: 'deleteAnnotation', content: annotation}, window.location.origin);
        ERMrestService.deleteAnnotation(annotation);
    };

    // $scope.writtenNewAnnotation = function writtenNewAnnotation() {
    //     // 1. Create the new annotation in ERMrest and Annotorious
    //
    //     $scope.creatingANewAnnotation = false;
    // };
}]);

// Trusted: A filter that tells Angular when a url is trusted =========================================================================================================================
openSeadragonApp.filter('trusted', ['$sce', function($sce) {
    return function(url) {
        return $sce.trustAsResourceUrl(url);
    };
}]);

// Refreshes page when the window's hash changes
window.onhashchange = function() {
    if (window.location.hash != '#undefined') {
        location.reload();
    } else {
        history.replaceState("", document.title, window.location.pathname);
        location.reload();
    }
    function goBack() {
        window.location.hash = window.location.lasthash[window.location.lasthash.length-1];
        window.location.lasthash.pop();
    }
}
