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
        attractiveness: number = 1;
    }

    export class Interest {
        constructor(public interestType: InterestType, public attractiveness: number) {
        }
    }

    export class Attractor {
        visited: boolean = false;
        location: csComp.Services.IGeoJsonGeometry;
        constructor(private name: string, public attractorType: InterestType, public attractiveness: number) {
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

    export class Cell {
        value: number = 0.0; // likelihood of presence
        distance: number = 0.0; // distance to location 'last seen' (meters)
        constructor(public location: csComp.Services.IGeoJsonGeometry) {
        }
    }

    export enum TransportType {
        walk = 0,
        bike = 1,
        childscooter = 2 //step
    }

    export class hmfSvc {
        private child: Child;
        private pointsOfInterest: PointOfInterest[] = [];
        private attractors: Attractor[] = []; // all attractors loaded from layers
        private relevantAttractors: Attractor[] = []; // relevant attractors
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
            };

            proj4.defs('RD', '+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 ' +
                ' +ellps=bessel +towgs84=565.417,50.3319,465.552,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs');

            this.messageBusService.subscribe('project', (title) => {
                if (title !== 'loaded') return;
                this.loadLayers();
            });

            this.messageBusService.subscribe('layer', (title, layer: csComp.Services.ProjectLayer) => {
                if (title !== 'activated') return;
                this.loadFeatures(layer);
                this.messageBusService.publish('hmf', 'attractors', this.attractors);
                this.messageBusService.publish('hmf', 'attractors', this.relevantAttractors);
            });

            this.messageBusService.subscribe('hmf', (title, data: any) => {
                switch (title) {
                    case 'child':
                        this.updateChild(data);
                        return;
                    case 'pois':
                        this.updatePOIs(data);
                        break;
                    case 'visited':
                        this.visitedAttractor(data);
                        break;
                }
            });
        }

        private updateChild(child: Child) {
            this.child = child;
            if (!child.hasOwnProperty('age') || !child.hasOwnProperty('gender')) return;

            // Set the interests for the child category
            if (child.age < 10) {
                this.interests = Interests.category1;
            } else {
                this.interests = Interests.category2;
            }
            // Publish the interests
            this.messageBusService.publish('hmf', 'interests', this.interests);

            // update attractors
            this.updateAttractors();

            // update heatmap
            this.createHeatMap(this.child);
        }

        private updatePOIs(pois: PointOfInterest[]) {
            this.pointsOfInterest = pois;
            return;
        }

        /** select and push relevant attractors */
        private updateAttractors() {
            this.relevantAttractors = [];

            // select relevant attractors            
            for (var j: number = 0; j < this.attractors.length; j++) {
                var attr: Attractor = this.attractors[j];

                for (var i: number = 0; i < this.interests.length; i++) {
                    var interest: Interest = this.interests[i];
                    if (attr.attractorType == interest.interestType) {
                        attr.attractiveness = interest.attractiveness;
                        break;
                    }
                }

                if (attr.attractiveness > 0 && this.calculateDistance(this.child.location, attr.location) < 5000) {
                    this.relevantAttractors.push(attr);
                }
            }

            console.log('Relevant Attractors: ' + this.relevantAttractors.length);

            // publish attractor list
            this.messageBusService.publish('hmf', 'attractors', this.relevantAttractors);
        }

        private visitedAttractor(attr: Attractor) {
            // For now the attractiveness is set to 0; Just to see something happen
            attr.attractiveness = 0;
            return;
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
            this.pointsOfInterest.push(p);
        }

        /** Remove a person of interest */
        remove(p: PointOfInterest) {
            var index = this.pointsOfInterest.indexOf(p);
            if (index < 0) return;
            this.pointsOfInterest.splice(index, 1);
        }

        /** A set of default attractor types, such as schools, parks, toy shops, etc. with a default attractiveness for this particular child. */
        getInterestTypes() {
            // Specify the logic to select a specific category.
            return Interests.category1;
        }

        /** Return a list of specific attractors, including their attractiveness, e.g. a specific toy shop or school. */
        getAttractors() {
            var attractors: Attractor[] = [];
            // Walk through all available layers, turn the layers on that are interesting (based on their type), 
            // and set the attractiveness of each feature. 
            return attractors;
        }

        /** Return the distance in meters between 2 Points from WGS84 degrees  */
        public calculateDistance(loc1: csComp.Services.IGeoJsonGeometry, loc2: csComp.Services.IGeoJsonGeometry): number {
            var converter = proj4('RD');
            var wgs1 = converter.forward(loc1.coordinates);
            var wgs2 = converter.forward(loc2.coordinates);
            var dx = wgs2[0] - wgs1[0];
            var dy = wgs2[1] - wgs1[1];
            var dist = Math.sqrt((dx * dx) + (dy * dy));
            return dist;
        }

        /** calculate cell likelihood (HMF approach) */
        private calculateCellLikelihood(child: Child, cell: Cell): number {
            var value = this.getPriorValue(child, cell.distance);

            var bf: number = 1;

            // loop over attractors, adjust Bayes Factor
            for (var j: number = 0; j < this.relevantAttractors.length; j++) {
                var attr: Attractor = this.relevantAttractors[j];
                var attrDistance = this.calculateDistance(attr.location, cell.location);

                // 
                if (attrDistance > 0) {
                    var bfTemp = 1 + 10 * attr.attractiveness / 100 * 1 / (attrDistance / 100) * 1 / (this.calculateDistance(child.location, attr.location) / 100);
                    bf = bf * bfTemp;
                }
            }

            // loop over points of interest, adjust Bayes Factor
            for (var j: number = 0; j < this.pointsOfInterest.length; j++) {
                var poi: PointOfInterest = this.pointsOfInterest[j];
                var poiDistance = this.calculateDistance(poi.location, cell.location);

                // update bf. Note that poi attractiveness is fixed to 1.
                var bfTemp = 1 + 10 * poi.attractiveness * 1 / (poiDistance / 100) * 1 / (this.calculateDistance(child.location, poi.location) / 100);
                bf = bf * bfTemp;
            }

            // adjust value with Bayes formula
            value = (bf * (value / (1 - value))) / (1 + (bf * (value / (1 - value))))

            return value;
        }

        /** create heatmap with likelihood value per cell */
        public createHeatMap(child: Child) {
            var centrePoint = child.location;

            if (centrePoint.coordinates == null) {
                return;
            }

            var nCols = 36;
            var nRows = 24;
            var deltaLon = 0.0014584288488676631;
            var deltaLat = -0.0008877224387042511;

            var xllcorner = centrePoint.coordinates[0] - 0.5 * nCols * deltaLon;
            var yllcorner = centrePoint.coordinates[1] + 0.5 * nRows * deltaLat; // +, because deltaLat is negative
            var yTopLeftCorner = centrePoint.coordinates[1] - 0.5 * nRows * deltaLat;

            // initialize grid: create grid cells
            var grid: Cell[][] = [];
            for (var i: number = 0; i < nRows; i++) {
                grid[i] = [];
                for (var j: number = 0; j < nCols; j++) {

                    // find centre location of cell   
                    var location: csComp.Services.IGeoJsonGeometry = { type: 'Point', coordinates: [] };
                    // Use topleftcorner instead of lower left, because the grid array starts at the top
                    location.coordinates = [xllcorner + (j + 0.5) * deltaLon, yTopLeftCorner + (i + 0.5) * deltaLat];

                    // init cell with some value
                    var cell = new Cell(location);
                    cell.distance = this.calculateDistance(centrePoint, location);
                    cell.value = this.calculateCellLikelihood(child, cell);
                    // add to grid
                    grid[i][j] = cell;
                }
            }

            // create text string for file
            var text = '';
            text = text + 'ncols ' + nCols + '\n'
                + 'nrows ' + nRows + '\n'
                + 'xllcorner ' + xllcorner + '\n'
                + 'yllcorner ' + yllcorner + '\n'
                + 'NODATA_value  -1\n\n';

            for (var i: number = 0; i < nRows; i++) {
                var row = grid[i];
                for (var j: number = 0; j < nCols; j++) {
                    var cell: Cell = row[j];
                    text = text + Math.floor(cell.value * 100) + ' ';
                }
                text = text + '\n';

            }
            console.log(text);

            // update grid layer (send to server)            
            this.updateGridLayer(text);

        }

        /** Accepts a grid string and sends it to the server */
        private updateGridLayer(data: string) {
            $.ajax({
                type: 'POST',
                url: 'http://localhost:3003/api/hmf',
                data: { grid: data },
                success: () => { }
            });
        }

        /** returns % of children found back within bandwidth. Values from Garmpian Police*/
        public getPriorValue(child: Child, distance: number): number {
            if (!child.hasOwnProperty('age') || !child.hasOwnProperty('gender')) return 0;

            // children from 1 to 4
            if (child.age <= 4) {
                if (distance < 160) {
                    return 0.3;
                } else if (distance < 400) {
                    return 0.2;
                } else if (distance < 600) {
                    return 0.2;
                } else if (distance < 900) {
                    return 0.1;
                } else if (distance < 1200) {
                    return 0.08;
                } else {
                    return 0.05;
                }
            }

            // children 5 to 8            
            if (child.age <= 8) {
                if (distance < 350) {
                    return 0.3;
                } else if (distance < 550) {
                    return 0.2;
                } else if (distance < 1100) {
                    return 0.2;
                } else if (distance < 1300) {
                    return 0.1;
                } else if (distance < 1800) {
                    return 0.1;
                } else if (distance < 6800) {
                    return 0.09;
                } else {
                    return 0.05;
                }
            }

            // children 9 to 11            
            if (child.age <= 11) {
                if (distance < 800) {
                    return 0.3;
                } else if (distance < 1500) {
                    return 0.2;
                } else if (distance < 3200) {
                    return 0.2;
                } else if (distance < 5000) {
                    return 0.1;
                } else if (distance < 8000) {
                    return 0.1;
                } else {
                    return 0.05;
                }
            }

            // children 12 to 14            
            if (child.age < 14) {
                if (distance <= 1000) {
                    return 0.3;
                } else if (distance < 3000) {
                    return 0.2;
                } else if (distance < 8000) {
                    return 0.2;
                } else if (distance < 18000) {
                    return 0.1;
                } else if (distance < 43000) {
                    return 0.1;
                } else {
                    return 0.05;
                }
            }

            // children 12 to 14            
            if (child.age <= 16) {
                if (distance < 2300) {
                    return 0.3;
                } else if (distance < 7000) {
                    return 0.2;
                } else if (distance < 23000) {
                    return 0.2;
                } else if (distance < 40000) {
                    return 0.1;
                } else if (distance < 80000) {
                    return 0.1;
                } else {
                    return 0.05;
                }
            }
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
