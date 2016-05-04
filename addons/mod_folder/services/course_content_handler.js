// (C) Copyright 2015 Martin Dougiamas
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

angular.module('mm.addons.mod_folder')

/**
 * Mod Folder course content handler.
 *
 * @module mm.addons.mod_folder
 * @ngdoc service
 * @name $mmaModFolderCourseContentHandler
 */
.factory('$mmaModFolderCourseContentHandler', function($mmCourse, $mmaModFolder, $mmEvents, $state, $mmSite, $mmUtil, $mmFilepool,
            $mmCoursePrefetchDelegate, mmCoreDownloading, mmCoreNotDownloaded, mmCoreOutdated, mmCoreEventPackageStatusChanged,
            mmaModFolderComponent) {
    var self = {};

    /**
     * Whether or not the module is enabled for the site.
     *
     * @module mm.addons.mod_folder
     * @ngdoc method
     * @name $mmaModFolderCourseContentHandler#isEnabled
     * @return {Boolean}
     */
    self.isEnabled = function() {
        return true;
    };

    /**
     * Get the controller.
     *
     * @module mm.addons.mod_folder
     * @ngdoc method
     * @name $mmaModFolderCourseContentHandler#getController
     * @param {Object} module    The module info.
     * @param {Number} courseid  Course ID.
     * @param {Number} sectionid Section ID.
     * @return {Function}
     */
    self.getController = function(module, courseid, sectionid) {
        return function($scope) {
            var downloadBtn,
                refreshBtn,
                revision = $mmFilepool.getRevisionFromFileList(module.contents),
                timemodified = $mmFilepool.getTimemodifiedFromFileList(module.contents);

            // Prefetch folder contents.
            function prefetchFolder(e) {
                e.preventDefault();
                e.stopPropagation();
                $mmaModFolder.prefetchContent(module).catch(function() {
                    $mmUtil.showErrorModal('mm.core.errordownloading', true);
                });
            }

            downloadBtn = {
                hidden: true,
                icon: 'ion-ios-cloud-download-outline',
                label: 'mm.core.download',
                action: prefetchFolder
            };

            refreshBtn = {
                hidden: true,
                icon: 'ion-android-refresh',
                label: 'mm.core.refresh',
                action: prefetchFolder
            };

            $scope.icon = $mmCourse.getModuleIconSrc('folder');
            $scope.title = module.name;
            $scope.buttons = [downloadBtn, refreshBtn];
            $scope.spinner = false;

            $scope.action = function(e) {
                e.preventDefault();
                e.stopPropagation();
                $state.go('site.mod_folder', {module: module, courseid: courseid, sectionid: sectionid});
            };

            // Show buttons according to module status.
            function showStatus(status) {
                if (status) {
                    $scope.spinner = status === mmCoreDownloading;
                    downloadBtn.hidden = status !== mmCoreNotDownloaded;
                    refreshBtn.hidden = status !== mmCoreOutdated;
                }
            }

            // Listen for changes on this module status.
            var statusObserver = $mmEvents.on(mmCoreEventPackageStatusChanged, function(data) {
                if (data.siteid === $mmSite.getId() && data.componentId === module.id && data.component === mmaModFolderComponent) {
                    showStatus(data.status);
                }
            });

            // Get current status to decide which icon should be shown.
            $mmCoursePrefetchDelegate.getModuleStatus(module, revision, timemodified).then(showStatus);

            $scope.$on('$destroy', function() {
                statusObserver && statusObserver.off && statusObserver.off();
            });
        };
    };

    return self;
});
