module hmf {
    export interface IAddress {
        street:                string;
        houseNumber:           number;
        houseNumberExtension?: string;
        zip:                   string;
        city:                  string;
    }

    export class Address implements IAddress {
        street:               string;
        houseNumber:          number;
        houseNumberExtension: string;
        zip:                  string;
        city:                 string;
    }

    export enum PersonGender {
        male = 0,
        female = 1
    }

    export enum PersonType {
        child,
        parent,
        brother,
        sister,
        caretaker,
        family,
        friend
    }

    export class PersonOfInterest {
        name:        string;
        description: string;
        address:     Address;
        type:        PersonType;
        age:         number;
    }

    export enum AttractorType {
        unknown      = 0,
        school       = 1,
        park         = 2,
        shop         = 4,
        toy          = 8,
        doll         = 16,
        construction = 32,
        event        = 64
    }

    export class Attractor {
        address: Address;

        constructor(private attractorType: AttractorType, public attractiveness: number) {
        }
    }

    export class Attractors {
        static category1: Attractor[] = [
            new Attractor(AttractorType.school, 80),
            new Attractor(AttractorType.shop | AttractorType.toy, 60)
        ];
        static category2: Attractor[] = [
            new Attractor(AttractorType.school, 60),
            new Attractor(AttractorType.shop | AttractorType.toy, 50)
        ];
    }

    export enum TransportType {
        walk = 0,
        bike = 1,
        childscooter = 2 //step
    }

    export class hmfSvc {
        private personsOfInterest: PersonOfInterest[];
        private attractors: csComp.Services.IFeature[] = [];

        static $inject = [
            '$rootScope',
            'layerService',
            'messageBusService',
            'mapService',
            'dashboardService',
            '$http'
        ];

        constructor(
            private $rootScope: ng.IRootScopeService,
            private layerService: csComp.Services.LayerService,
            private messageBusService: csComp.Services.MessageBusService,
            private mapService: csComp.Services.MapService,
            private dashboardService: csComp.Services.DashboardService,
            private $http: ng.IHttpService) {
            this.dashboardService.widgetTypes['hmfwidget'] = <csComp.Services.IWidget>{
                id: 'hmfwidget',
                icon: 'images/missing_boy.png',
                description: 'Show HMF widget'
            }

            this.messageBusService.subscribe('project', (title) => {
                if (title !== 'loaded') return;
                this.loadLayers();
            });

            this.messageBusService.subscribe('layer', (title, layer: csComp.Services.ProjectLayer) => {
                if (title !== 'activated') return;
                this.loadFeatures(layer);
            });

        }

        /** Load all available layers. */
        private loadLayers() {
            // Walk through all available (but not loaded) layers
            this.layerService.project.groups.forEach(group => {
                if (!group.layers) return;
                group.layers.forEach(layer => {
                    this.layerService.addLayer(layer);
                });
            });
        }

        /** Load all features in a layer and turn the layer off. */
        private loadFeatures(layer: csComp.Services.ProjectLayer) {
            for (var key in layer.group.markers) {
                this.attractors.push(layer.group.markers[key].feature);
            };
            //this.layerService.removeLayer(layer);
        }

        /** Add a person of interest */
        add(p: PersonOfInterest) {
            this.personsOfInterest.push(p);
        }

        /** Remove a person of interest */
        remove(p: PersonOfInterest) {
            var index = this.personsOfInterest.indexOf(p);
            if (index < 0) return;
            this.personsOfInterest.splice(index, 1);
        }

        /** A set of default attractor types, such as schools, parks, toy shops, etc. with a default attractiveness for this particular child. */
        getAttractorTypes() {
            // Specify the logic to select a specific category.
            return Attractors.category1;
        }

        /** Return a list of specific attractors, including their attractiveness, e.g. a specific toy shop or school. */
        getAttractors() {
            var attractors: Attractor[] = [];
            // Walk through all available layers, turn the layers on that are interesting (based on their type), 
            // and set the attractiveness of each feature. 
            return attractors;
        }
    }

    /**
     * Register service
     */
    var moduleName = 'csComp';

    /**
      * Module
      */
    export var myModule;
    try {
        myModule = angular.module(moduleName);
    } catch (err) {
        // named module does not exist, so create one
        myModule = angular.module(moduleName, []);
    }

    myModule.service('hmfService', hmf.hmfSvc);
}