module hmf {
    export interface IAddress {
        street: string;
        houseNumber: number;
        houseNumberExtension?: string;
        zip: string;
        city: string;
    }

    export class Address implements IAddress {
        street: string;
        houseNumber: number;
        houseNumberExtension: string;
        zip: string;
        city: string;
    }

    export enum PersonGender {
        male = 0,
        female = 1
    }

    export enum PointOfInterestType {
        family,
        friend,
        school,
        sportsclub,
        shop,
        other
    }

    export enum InterestType {
        unknown = 0,
        school = 1,
        park = 2,
        shop = 4,
        toy = 8,
        doll = 16,
        construction = 32,
        event = 64
    }

    export class PointOfInterest {
        name: string;
        description: string;
        address: Address;
        type: PointOfInterestType;
        location: csComp.Services.IGeoJsonGeometry;
    }

    export class Interest {
        constructor(private interestType: InterestType, public attractiveness: number) {
        }
    }

    export class Attractor {
        location: csComp.Services.IGeoJsonGeometry;
        constructor(private name: string, private attractorType: InterestType, public attractiveness: number) {
        }
    }

    export class Interests {
        static category1: Interest[] = [
            new Interest(InterestType.school, 80),
            new Interest(InterestType.shop, 40),
            new Interest(InterestType.toy, 60)
        ];
        static category2: Interest[] = [
            new Interest(InterestType.school, 70),
            new Interest(InterestType.shop, 40),
            new Interest(InterestType.park, 90)
        ];
    }

    export enum TransportType {
        walk = 0,
        bike = 1,
        childscooter = 2 //step
    }

    export class hmfSvc {
        private personsOfInterest: PointOfInterest[];
        private attractors: Attractor[] = [];
        private interests: Interest[] = [];

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
                this.messageBusService.publish('hmf', 'attractors', this.attractors);
            });

            this.messageBusService.subscribe('hmf', (title, data: any) => {
                if (title === 'child') { this.updateChild(data)}
            });

        }
        
        private updateChild(child: Child) {
            this.messageBusService.publish('hmf', 'interests', this.interests);
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
                let f: IFeature = layer.group.markers[key].feature;
                let a: Attractor = new Attractor(f.properties['Name'] || 'Unknown', (InterestType.shop | InterestType.toy), Math.floor(Math.random() * 100));
                a.location = f.geometry;
                this.attractors.push(a);
            };
            //this.layerService.removeLayer(layer);
        }

        /** Add a person of interest */
        add(p: PointOfInterest) {
            this.personsOfInterest.push(p);
        }

        /** Remove a person of interest */
        remove(p: PointOfInterest) {
            var index = this.personsOfInterest.indexOf(p);
            if (index < 0) return;
            this.personsOfInterest.splice(index, 1);
        }

        /** A set of default attractor types, such as schools, parks, toy shops, etc. with a default attractiveness for this particular child. */
        getInterestTypes() {
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