'use strict';

(function () {
    function fetchFromObject(obj, prop) {
        if (typeof obj === 'undefined' || typeof prop === 'undefined') {
            return;
        }
        var _index = prop.indexOf('.');
        if (_index > -1) {
            return fetchFromObject(obj[prop.substring(0, _index)], prop.substr(_index + 1));
        }
        return obj[prop];
    }

    function getService(name) {
        return angular.injector(['ng']).invoke([name, function (service) {
            return service;
        }]);
    }

    function noopPromise() {
        var def = getService('$q').defer();
        def.resolve();
        return def.promise;
    }

    function AccordionGroup() {
    }

    function defaultAccordionGroupOptions() {
        return {
            open: false,
            disabled: false,
            beforeOpen: noopPromise,
            beforeHide: noopPromise,
            animateOpen: function (animationFn) {
                this.body[animationFn]('slow');
            },
            animateClose: function (animationFn) {
                this.body[animationFn]();
            }
        };
    }

    function Accordion() {
        this.groups = [];
        this.options = {
            closeOthers: true
        };
    }

    function errorlogger(error) {
        getService('$log').error(error);
    }

    AccordionGroup.prototype.$animate = function (animationFn, action, callback) {
        var _self = this;
        getService('$q').when(_self.options[action]()).then(function () {
            _self.options[callback].call(_self, animationFn);
        }, errorlogger);
    };
    //AccordionGroup.prototype.show = function (animationFn) {
    //    var _self = this;
    //    getService('$q').when(_self.options.beforeOpen()).then(function () {
    //        _self.options.animateOpen.call(_self,animationFn);
    //    }, errorlogger );
    //};
    //AccordionGroup.prototype.hide = function (animationFn) {
    //    var _self = this;
    //    getService('$q').when(_self.options.beforeHide()).then(function () {
    //        _self.options.animateClose.call(_self,animationFn);
    //    }, errorlogger);
    //};

    Accordion.prototype.addGroup = function (group) {
        this.groups.push(group);
    };
    Accordion.prototype.getGroups = function () {
        return this.groups;
    };
    Accordion.prototype.applyState = function (group) {
        if (group) {
            if (group.options.open) {
                group.$animate('slideDown', 'beforeOpen', 'animateOpen');
                this.closeOthers(group);
            } else {
                group.$animate('slideUp', 'beforeHide', 'animateClose');
            }
        }

    };
    Accordion.prototype.closeOthers = function (group) {
        if (this.options.closeOthers) {
            for (var a = 0; a < this.groups.length; a++) {
                if (group === this.groups[a]) {

                } else {
                    this.groups[a].hide('slideUp', 'beforeHide', 'animateClose');
                }
            }
        }
    };
    function getDefaultAccordion() {
        return new Accordion();
    }

    var _ngAccordion = function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs, controller) {
                var options = fetchFromObject(scope, attrs.options);
                if (options) {
                    angular.extend(controller.accordion.options, options);
                }
                scope.$watchCollection(attrs.options, function (n, o) {
                    if (n && n !== o) {
                        angular.extend(controller.accordion.options, n);
                    }
                });
            },
            controller: function () {
                this.accordion = getDefaultAccordion();
            }
        };
    };
    var _ngAccordionGroup = function ($q, $timeout) {
        return {
            require: ['^ngAccordion', 'ngAccordionGroup'],
            restrict: 'EA',
            controller: function () {
                var headerDef, bodyDef;
                headerDef = $q.defer();
                bodyDef = $q.defer();
                this.setHeaderElement = function (element) {
                    headerDef.resolve(element);
                };
                this.getHeaderElement = function () {
                    return headerDef.promise;
                };
                this.setBodyElement = function (element) {
                    bodyDef.resolve(element);
                };
                this.getBodyElement = function () {
                    return bodyDef.promise;
                };
            },
            scope: {
                options: '='
            },
            link: function (scope, element, attrs, controllers) {
                var accordionCtrl, controller, accordion, accordionGroup;
                controller = controllers[1];
                accordionCtrl = controllers[0];
                accordion = accordionCtrl.accordion;
                accordionGroup = new AccordionGroup();
                if (!scope.options) {
                    scope.options = defaultAccordionGroupOptions();
                }
                accordionGroup.options = angular.extend(defaultAccordionGroupOptions(), scope.options);

                scope.$watchCollection('options', function (n) {
                    accordionGroup.options = angular.extend(defaultAccordionGroupOptions(), n);
                    if (n && !n.disabled) {
                        accordion.applyState(accordionGroup);
                    }
                }, true);

                $q.all([controller.getHeaderElement(), controller.getBodyElement()]).then(function (results) {
                    accordionGroup.header = results[0];
                    accordionGroup.body = results[1];
                    if (scope.options.open) {
                        accordionGroup.$animate('show', 'beforeOpen', 'animateOpen');
                    } else {
                        accordionGroup.$animate('hide', 'beforeHide', 'animateClose');
                    }
                    accordionGroup.header.on('click', function () {
                        if (!scope.options.disabled) {
                            scope.options.open = !scope.options.open;
                        }
                        $timeout(function () {
                            scope.$apply();
                        });
                    });
                    accordion.addGroup(accordionGroup);
                });

            }
        };
    };
    var _ngAccordionBody = function () {
        return {
            require: '^ngAccordionGroup',
            restrict: 'EA',
            link: function (scope, element, attrs, accordionCtrl) {
                accordionCtrl.setBodyElement(element);
            }
        };
    };
    var _ngAccordionHeading = function () {
        return {
            require: '^ngAccordionGroup',
            restrict: 'EA',
            link: function (scope, element, attrs, accordionCtrl) {
                accordionCtrl.setHeaderElement(element);
            }
        };
    };
    angular.module('uiAccordion', []);
    angular.module('uiAccordion').directive('ngAccordion', _ngAccordion);
    angular.module('uiAccordion').directive('ngAccordionGroup', _ngAccordionGroup);
    angular.module('uiAccordion').directive('ngAccordionBody', _ngAccordionBody);
    angular.module('uiAccordion').directive('ngAccordionHeading', _ngAccordionHeading);

})();
