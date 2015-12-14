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
        gender: hmf.PersonGender;
        transport: hmf.TransportType;
    }

    export interface IHmfWidgetScope extends ng.IScope {
        vm: HmfWidgetCtrl;
        data: HmfWidgetData;
        minimized: boolean;
        child: Child;
        poi: hmf.PersonOfInterest;
        attractors: hmf.Attractor[];
    }

    export class HmfWidgetCtrl {
        private scope: IHmfWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        private genders: string[];
        private poitypes: string[];
        private transportoptions: string[];
        private pois: hmf.PersonOfInterest[];
        private isOpen: boolean;

        public static $inject = [
            '$scope',
            '$timeout',
            'layerService',
            'messageBusService',
            'mapService'
        ];

        constructor(
            private $scope: IHmfWidgetScope,
            private $timeout: ng.ITimeoutService,
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
            this.setPoiTypes();
            this.resetPoi();
            this.setDefaultAttractors();
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
            this.$scope.poi = new hmf.PersonOfInterest();
        }

        private editPoi(poi: hmf.PersonOfInterest) {
            let p = JSON.parse(JSON.stringify(poi)); //clone
            this.removePoi(poi);
            this.$scope.poi = p;
        }

        private removePoi(poi: hmf.PersonOfInterest) {
            if (this.pois.indexOf(poi) > -1) {
                this.pois.splice(this.pois.indexOf(poi), 1);
            }
        }

        private zoomToPoi(poi: hmf.PersonOfInterest) {
            return;
        }

        private setDefaultChild() {
            let c = new Child();
            c.name = '';
            c.age = 8;
            c.gender = hmf.PersonGender.male;
            c.time = new Date();
            c.location = '';
            c.adhd = false;
            c.transport = hmf.TransportType.bike;
            this.$scope.child = c;
        }

        private setDefaultAttractors() {
            let a = new Attractor(AttractorType.school, 80);
            let b = new Attractor(AttractorType.shop | AttractorType.toy, 60);
            this.$scope.attractors = [a, b];
        }

        private setGenders() {
            this.genders = [];
            this.genders.push('Jongen');
            this.genders.push('Meisje');
        }

        private setTransportOptions() {
            this.transportoptions = [];
            this.transportoptions.push('Lopend');
            this.transportoptions.push('Fiets');
            this.transportoptions.push('Step');
        }

        private setPoiTypes() {
            this.poitypes = [];
            this.poitypes.push('Kind');
            this.poitypes.push('Ouder');
            this.poitypes.push('Broer');
            this.poitypes.push('Zus');
            this.poitypes.push('Verzorger');
            this.poitypes.push('Familielid');
            this.poitypes.push('Vriend');
        }

        private openCalendar(e: Event) {
            e.preventDefault();
            e.stopPropagation();

            this.isOpen = true;
        };
    }
}