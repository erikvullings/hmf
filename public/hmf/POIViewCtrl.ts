module hmf {
    // 'use strict';

    export interface IPOIViewScope extends ng.IScope {
        vm: POIViewCtrl;
    }

    export class POIViewCtrl {

        static $inject = [
            '$scope',
            '$modalInstance',
            'layerService',
            '$translate',
            'messageBusService',
            'poi',
            'poitypes'
        ];

        constructor(
            private $scope: IPOIViewScope,
            private $modalInstance: any,
            private $layerService: csComp.Services.LayerService,
            private $translate: ng.translate.ITranslateService,
            private messageBusService: csComp.Services.MessageBusService,
            private poi?: hmf.PointOfInterest,
            private poitypes?: { [key: string]: any }
        ) {
            $scope.vm = this;
        }

        /**
         * Create a new POI
         */
        save() {
            this.$modalInstance.close({poi: this.poi, selectLocation: false});
        }

        cancel() {
            this.$modalInstance.dismiss('cancel');
        }

        findZip() {
            if (!this.poi.location) this.poi.location = { type: 'Point', coordinates: [0, 0] };
            var zip = this.poi.address.zip.replace(/\ /g, '').toUpperCase();
            var nr = this.poi.address.houseNumber;
            var url = 'https://postcode-api.apiwise.nl/v2/addresses/?postcode=' + zip + '&number=' + nr;
            $.ajax({url: url,
                headers: { 'X-Api-Key': ''},
                success: (res) => {
                    console.log('Got result from postcode-api');
                    if (!res) {
                        console.log('No answer from postcode-api');
                        return;
                    }
                    if (!res.hasOwnProperty('_embedded')) {
                        console.log('No valid answer from postcode-api');
                        return;
                    }
                    if (!res['_embedded'].hasOwnProperty('addresses')) {
                        console.log('No valid answer from postcode-api');
                        return;
                    }
                    var adr = res['_embedded']['addresses'];
                    if (adr.length > 0) {
                        this.poi.location.coordinates = adr[0].geo.center.wgs84.coordinates;
                        this.poi.address.street = adr[0].street;
                        this.poi.address.city = adr[0].city.label;
                        if (this.$scope.$root.$$phase !== '$apply' && this.$scope.$root.$$phase !== '$digest') { this.$scope.$apply(); }
                    }
                }
            });
        }

        selectLocation() {
            this.$modalInstance.close({poi: this.poi, selectLocation: true});
        }
    }
} 