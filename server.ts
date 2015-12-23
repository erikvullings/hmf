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
    port : 3003
});
cs.start(() => {
    console.log('started');
    cs.server.post('/api/hmf', (req, res) => {
        console.log('!!! SAVE DATA : %j', req.body);
        //fs.writeFile(__dirname+'/public/data/projects/hmf/hmfheatmap.asc', req.body, function (err) {
        //    if (err) throw err;
        //    console.log(req.body + '/n  It\'s saved again!');
        //});

        res.end();
    });
});
