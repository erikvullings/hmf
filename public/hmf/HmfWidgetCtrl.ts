module hmf {
    export class HmfWidgetData {
        title: string;
    }

    export class Child {
        name: string;
        location: string;
        time: Date;
        adhd: boolean;
        age: number;
        gender: PersonGender;
        transport: TransportType;
    }

    export interface IHmfWidgetScope extends ng.IScope {
        vm: HmfWidgetCtrl;
        data: HmfWidgetData;
        minimized: boolean;
        child: Child;
        poi: PointOfInterest;
        attractor: Attractor;
    }

    export class HmfWidgetCtrl {
        private scope: IHmfWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        private genders: { [key: string]: any };
        private poitypes: { [key: string]: any };
        private attractorTypes: { [key: string]: any };
        private transportoptions: { [key: string]: any };
        private pois: PointOfInterest[];
        private attractors: Attractor[];
        private isOpen: boolean;

        public static $inject = [
            '$scope',
            '$timeout',
            '$uibModal',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IHmfWidgetScope,
            private $timeout: ng.ITimeoutService,
            private $modal: any,
            private $layerService: csComp.Services.LayerService,
            private $messageBus: csComp.Services.MessageBusService,
            private $mapService: csComp.Services.MapService
        ) {
            $scope.vm = this;
            var par = <any>$scope.$parent;
            this.widget = par.widget;

            $scope.data = <HmfWidgetData>this.widget.data;

            this.parentWidget = $('#' + this.widget.elementId).parent();

            this.isOpen = false;
            this.init();

            this.$messageBus.subscribe('feature', (action: string, feature: csComp.Services.IFeature) => {
                switch (action) {
                    case 'onFeatureDeselect':
                    case 'onFeatureSelect':
                        this.selectFeature(feature);
                        break;
                    default:
                        break;
                }
            });
        }

        private init() {
            this.pois = [];
            this.setGenders();
            this.setTransportOptions();
            this.setDefaultChild();
            this.setAttractorTypes();
            this.resetAttractor();
            this.setDefaultAttractors();
            this.setPoiTypes();
            this.resetPoi();
            this.setDefaultPois();
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            return;
        }

        /** Send the updated child information to the hmf service */
        private saveChild() {
            // this.$scope.child;
            return;
        }

        /** Send the updated attractors to the hmf service */
        private saveAttractors() {
            // this.$scope.attractors;
            return;
        }

        /** Send the POI to the hmf service and store it in the list of poi's */
        private addPoi() {
            if (!this.$scope.poi.hasOwnProperty('type')) return;
            let p = JSON.parse(JSON.stringify(this.$scope.poi)); //clone
            this.pois.push(p);
            this.resetPoi();
            return;
        }

        private resetPoi() {
            if (this.$scope.poi) delete this.$scope.poi;
            this.$scope.poi = new PointOfInterest();
        }

        private editPoi(poi: PointOfInterest) {
            this.openPoiModal(poi);
        }

        private removePoi(poi: PointOfInterest) {
            if (this.pois.indexOf(poi) > -1) {
                this.pois.splice(this.pois.indexOf(poi), 1);
            }
        }

        private zoomToPoi(poi: PointOfInterest) {
            return;
        }

        private openAddPoiModal() {
            var poi = new PointOfInterest();
            this.openPoiModal(poi);
        }

        private openPoiModal(inPoi: PointOfInterest) {
            var backupPoi = JSON.parse(JSON.stringify(inPoi));
            this.removePoi(inPoi);
            var modalInstance = this.$modal.open({
                templateUrl: 'hmf/POIView.tpl.html',
                controller: POIViewCtrl,
                resolve: {
                    poi: () => inPoi,
                    poitypes: () => this.poitypes
                }
            });
            modalInstance.result.then((poi: PointOfInterest) => {
                if (poi.hasOwnProperty('type') && poi.hasOwnProperty('name') && poi.hasOwnProperty('location')) {
                    this.pois.push(poi);
                }
            }, () => {
                if (backupPoi.hasOwnProperty('type') && backupPoi.hasOwnProperty('name') && backupPoi.hasOwnProperty('location')) {
                    this.pois.push(backupPoi);
                }
            });
        }

        private addAttractor() {
            let a = JSON.parse(JSON.stringify(this.$scope.attractor)); //clone
            this.attractors.push(a);
            this.resetAttractor();
            return;
        }

        private resetAttractor() {
            if (this.$scope.attractor) delete this.$scope.attractor;
            this.$scope.attractor = new Attractor(AttractorType.unknown, 0);
        }

        private editAttractor(attr: Attractor) {
            let a = JSON.parse(JSON.stringify(attr)); //clone
            this.removeAttractor(attr);
            this.$scope.attractor = a;
        }

        private removeAttractor(attr: Attractor) {
            if (this.attractors.indexOf(attr) > -1) {
                this.attractors.splice(this.attractors.indexOf(attr), 1);
            }
        }

        private getAttractorName(type: number): string {
            return AttractorType[type];
        }

        private zoomToAttractor(attr: Attractor) {
            return;
        }

        private setDefaultChild() {
            let c = new Child();
            c.name = '';
            c.age = 8;
            c.gender = PersonGender.male;
            c.time = new Date();
            c.location = '';
            c.adhd = false;
            c.transport = TransportType.bike;
            this.$scope.child = c;
        }

        private setDefaultAttractors() {
            this.attractors = [];
            for (var key in this.attractorTypes) {
                if (this.attractorTypes.hasOwnProperty(key)) {
                    let a = new Attractor(this.attractorTypes[key], 0);
                    this.attractors.push(a);
                }
            }
        }

        private setDefaultPois() {
            let p = new PointOfInterest();
            p.name = 'Jan de Vries';
            p.address = { zip: '1111AA', houseNumber: 1, street: 'Kerkstraat', houseNumberExtension: null, city: 'Ons Dorp' };
            p.location = { type: 'Point', coordinates: [4.888, 51.977] };
            p.type = PointOfInterestType.family;
            this.pois = [p];
        }

        private setGenders() {
            this.genders = this.getKeysAndValuesOfEnum(PersonGender);
        }

        private setTransportOptions() {
            this.transportoptions = this.getKeysAndValuesOfEnum(TransportType);
        }

        private setPoiTypes() {
            this.poitypes = this.getKeysAndValuesOfEnum(PointOfInterestType);
        }

        private setAttractorTypes() {
            this.attractorTypes = this.getKeysAndValuesOfEnum(AttractorType);
        }

        private openCalendar(e: Event) {
            e.preventDefault();
            e.stopPropagation();

            this.isOpen = true;
        };

        private getKeysAndValuesOfEnum(e: any): { [key: string]: any } {
            let result = {};
            let keys = Object.keys(e)
                .filter(v => isNaN(parseInt(v, 10)));
            let vals = Object.keys(e)
                .map(v => parseInt(v, 10))
                .filter(v => !isNaN(v));
            if (keys.length === vals.length) {
                keys.forEach((k, index) => {
                    result[k] = vals[index];
                });
            }
            return result;
        }
    }
}