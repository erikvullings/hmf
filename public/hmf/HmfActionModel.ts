module hmf {

    import IFeature = csComp.Services.IFeature;
    import IActionOption = csComp.Services.IActionOption;

    export class HmfActionModel implements csComp.Services.IActionService {
        public id: string = 'HmfActionModel';
        private layerService: csComp.Services.LayerService

        stop() { }
        addFeature(feature: IFeature) { }
        removeFeature(feature: IFeature) { }
        selectFeature(feature: IFeature) { }

        getFeatureActions(feature: IFeature): IActionOption[] {
            var accessibilityOption1 = <IActionOption>{
                title: 'Set as POI'
            }
            accessibilityOption1.callback = this.setAsPOI;
            return [accessibilityOption1];
        }
        getFeatureHoverActions(feature: IFeature): IActionOption[] { return []; }
        deselectFeature(feature: IFeature) { }
        updateFeature(feature: IFeature) { }

        public setAsPOI(feature: IFeature, layerService: csComp.Services.LayerService) {
            console.log('hmf:setaspoi');
            layerService.$messageBusService.publish('hmf', 'addpoi', feature);
        }

        public init(layerService: csComp.Services.LayerService) {
            console.log('init ContourActionService');
        }
    }
}
