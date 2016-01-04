import Winston = require('winston');
import * as csweb from "csweb";
import fs = require('fs');
import path = require('path');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
});

var apiLayersFolder = path.join(__dirname, 'public', 'data', 'api', 'layers');
// Create empty heatmap layer
var layer = createGridLayer('');

// Clean old heatmap layers before starting the server
fs.readdir(apiLayersFolder, (err, files) => {
    if (err) {
        console.log(err);
    } else {
        files.forEach((f) => {
            fs.unlink(path.join(apiLayersFolder, f), (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Deleted ' + f);
                }
                fs.writeFile(path.join(apiLayersFolder, 'hmfheatmap.json'), JSON.stringify(layer), (err) => {
                    (err) ? console.log(err.message) : console.log('Written layer file to ' + apiLayersFolder);
                });
            });
        });
    }
});

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: 3003
});
cs.start(() => {
    console.log('started');
    cs.server.post('/api/hmf', (req, res) => {
        if (req.body.hasOwnProperty('grid')) {
            var grid = req.body.grid;
            var layer = createGridLayer(grid);
            cs.api.addUpdateLayer(layer, {}, () => {
                console.log('Heatmap saved');
            });
        } else {
            console.log('No grid data found');
        }
        res.end();
    });
});

function createGridLayer(grid: string) {
    var layer: csweb.ILayer = {
        id: 'hmfheatmap',
        title: 'Heatmap',
        description: 'Overlay showing probable locations of finding the missing child',
        features: [],
        storage: 'file',
        enabled: true,
        isDynamic: true,
        data: grid,
        url: 'api/layers/hmfheatmap',
        typeUrl: `data/resourcetypes/hmfheatmaptypes.json`,
        type: 'grid',
        renderType: 'gridlayer',
        dataSourceParameters: <csweb.IGridDataSourceParameters>{
            propertyName: 'h',
            gridType: 'esri',
            projection: 'WGS84',
            contourLevels: [
                0,
                20,
                40,
                60,
                80,
                100
            ],
            skipLines: 5
        },
        defaultFeatureType: 'heat',
        defaultLegendProperty: 'h'
    };
    return layer;
}