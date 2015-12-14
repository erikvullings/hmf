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
    }

    export interface IHmfWidgetScope extends ng.IScope {
        vm: HmfWidgetCtrl;
        data: HmfWidgetData;
        minimized: boolean;
        child: Child;
    }

    export class HmfWidgetCtrl {
        private scope: IHmfWidgetScope;
        private widget: csComp.Services.IWidget;
        private parentWidget: JQuery;

        private genders: string[];
        private transportoptions: string[];
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
            this.setGenders();
            this.setTransportOptions();
            this.setDefaultChild();
        }

        private selectFeature(feature: csComp.Services.IFeature) {

        }

        private setDefaultChild() {
            let c = new Child();
            c.name = '';
            c.age = 8;
            c.gender = hmf.PersonGender.male;
            c.time = new Date();
            c.location = '';
            c.adhd = false;
            this.$scope.child = c;
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

        private openCalendar(e: Event) {
            e.preventDefault();
            e.stopPropagation();

            this.isOpen = true;
        };
    }
}