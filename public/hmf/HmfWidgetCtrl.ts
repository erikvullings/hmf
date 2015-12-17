module hmf {
    export class HmfWidgetData {
        title: string;
    }

    export class Child {
        name: string;
        location: csComp.Services.IGeoJsonGeometry;
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
        interest: Interest;
    }

    export class HmfWidgetCtrl {
        private scope: IHmfWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        private genders: { [key: string]: any };
        private poinames: string[];
        private poitypes: { [key: string]: any };
        private interestTypes: { [key: string]: any };
        private transportoptions: { [key: string]: any };
        private pois: PointOfInterest[];
        private interests: Interest[];
        private attractors: Attractor[];
        private isOpen: boolean;
        private mapClickHandle: any;
        private editingPoi: PointOfInterest;

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

            this.$messageBus.subscribe('hmf', (title, data: any) => {
                switch (title) {
                    case 'child':
                        break;
                    case 'pois':
                        break;
                    case 'attractors':
                        this.setAttractors(data);
                        break;
                    case 'interests':
                        this.setInterests(data);
                        break;
                    case 'addpoi':
                        this.setPoiFromActionService(data);
                        break;
                }
            });
        }

        private init() {
            this.pois = [];
            this.setGenders();
            this.setTransportOptions();
            this.setDefaultChild();
            this.setInterestTypes();
            this.resetInterest();
            this.setDefaultInterests();
            this.setPoiTypes();
            this.resetPoi();
            this.setDefaultPois();
        }

        private selectFeature(feature: csComp.Services.IFeature) {
            return;
        }

        /** Send the updated child information to the hmf service */
        private updateChild() {
            let c = JSON.parse(JSON.stringify(this.$scope.child));
            this.$messageBus.publish('hmf', 'child', c);
        }

        /** Send the updated interests to the hmf service */
        private updateInterests() {
            let i = JSON.parse(JSON.stringify(this.interests));
            this.$messageBus.publish('hmf', 'interests', i);
            return;
        }

        /** Send the updated pois to the hmf service */
        private updatePois() {
            let p = JSON.parse(JSON.stringify(this.pois));
            this.$messageBus.publish('hmf', 'pois', p);
        }

        /** Store POI in the list of poi's */
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
            var latlon = new L.LatLng(poi.location.coordinates[1], poi.location.coordinates[0]);
            this.$mapService.zoomToLocation(latlon);
            return;
        }

        private setPoiFromActionService(f: IFeature) {
            var poi = new PointOfInterest();
            poi.location = f.geometry;
            this.openPoiModal(poi);
        }

        private openAddPoiModal() {
            var poi = new PointOfInterest();
            this.openPoiModal(poi);
        }

        private selectLocationFunc = (e) => { this.selectLocation(e); };

        private openPoiModal(inPoi: PointOfInterest) {
            // if (this.$modal.getPromiseChain()) return; //returns null when no modal is opened 
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
            modalInstance.result.then((data: any) => {
                if (data.selectLocation) {
                    this.editingPoi = data.poi;
                    this.$mapService.map.on('click', this.selectLocationFunc);
                } else {
                    if (data.poi.hasOwnProperty('type') && data.poi.hasOwnProperty('name') && data.poi.hasOwnProperty('location')) {
                        this.pois.push(data.poi);
                    }
                }
            }, () => {
                if (backupPoi.hasOwnProperty('type') && backupPoi.hasOwnProperty('name') && backupPoi.hasOwnProperty('location')) {
                    this.pois.push(backupPoi);
                }
            });
        }

        private selectLocation(e: any) {
            var ll: L.LatLng = e.latlng;
            if (!this.editingPoi.location) this.editingPoi.location = { type: 'Point', coordinates: [] };
            this.editingPoi.location.coordinates = [ll.lng, ll.lat];
            this.$mapService.map.off('click', this.selectLocationFunc);
            this.openPoiModal(this.editingPoi);
            return;
        }

        private addInterest() {
            let a = JSON.parse(JSON.stringify(this.$scope.interest)); //clone
            this.interests.push(a);
            this.resetInterest();
            return;
        }

        private resetInterest() {
            if (this.$scope.interest) delete this.$scope.interest;
            this.$scope.interest = new Interest(InterestType.unknown, 0);
        }

        private editInterest(intr: Interest) {
            let a = JSON.parse(JSON.stringify(intr)); //clone
            this.removeInterest(intr);
            this.$scope.interest = a;
        }

        private removeInterest(intr: Interest) {
            if (this.interests.indexOf(intr) > -1) {
                this.interests.splice(this.interests.indexOf(intr), 1);
            }
        }

        private getInterestName(type: number): string {
            return InterestType[type];
        }

        private zoomToAttractor(attr: Attractor) {
            var latlon = new L.LatLng(attr.location.coordinates[1], attr.location.coordinates[0]);
            this.$mapService.zoomToLocation(latlon);
            return;
        }

        private setDefaultChild() {
            let c = new Child();
            c.name = '';
            c.age = 8;
            c.gender = PersonGender.male;
            c.time = new Date();
            c.location = { type: 'point', coordinates: [0, 0] };
            c.adhd = false;
            c.transport = TransportType.bike;
            this.$scope.child = c;
        }

        private setDefaultInterests() {
            this.interests = [];
            for (var key in this.interestTypes) {
                if (this.interestTypes.hasOwnProperty(key)) {
                    let a = new Interest(this.interestTypes[key], 0);
                    this.interests.push(a);
                }
            }
        }

        private setInterests(interests: Interest[]) {
            interests.forEach((interest) => {
                let interestNr = -1;
                this.interests.some((i, index) => {
                    if (i.interestType === interest.interestType) {
                        interestNr = index;
                        return true;
                    }
                    return false;
                });
                if (interestNr > -1) {
                    this.interests[interestNr] = JSON.parse(JSON.stringify(interest));
                }
            });
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
            this.poinames = [];
            Object.keys(this.poitypes).forEach(key => this.poinames.push(key));
        }

        private setInterestTypes() {
            this.interestTypes = this.getKeysAndValuesOfEnum(InterestType);
        }

        private setAttractors(attrs: Attractor[]) {
            this.attractors = attrs;
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