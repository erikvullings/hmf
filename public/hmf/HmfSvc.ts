module hmf {
	export class hmfSvc {
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
           this.dashboardService.widgetTypes['hmfwidget'] = <csComp.Services.IWidget> {
               id: 'hmfwidget',
               icon: 'images/missing_boy.png',
               description: 'Show HMF widget'
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