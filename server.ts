import Winston = require('winston');
import * as csweb from "csweb";
import fs = require('fs');

Winston.remove(Winston.transports.Console);
Winston.add(Winston.transports.Console, <Winston.ConsoleTransportOptions>{
    colorize: true,
    label: 'csWeb',
    prettyPrint: true
})

var cs = new csweb.csServer(__dirname, <csweb.csServerOptions>{
    port: 3003
});
cs.start(() => {
    console.log('started');
    cs.server.post('/api/hmf', (req, res) => {
        if (req.body.hasOwnProperty('grid')) {
            var grid = req.body.grid;
            fs.writeFile(__dirname + '/public/data/projects/hmf/hmfheatmap.asc', grid, (err) => {
                if (err) {
                    console.log('Error writing heatmap: ' + err);
                }
                console.log('Heatmap saved successfully!');
            });
        } else {
            console.log('No grid data found');
        }
        res.end();
    });
});
