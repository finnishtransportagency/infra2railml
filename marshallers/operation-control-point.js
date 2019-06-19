const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

// https://wiki.railml.org/index.php?title=IS:ocp

const OcpType = {
    OPERATIONAL_NAME: 'operationalName',
    TRAFFIC_NAME: 'trafficName',
    LOCAL_NAME: 'localName',
    OTHER: (val) => `other:${val}`
};

module.exports = {
    marshall: (liikennepaikanRaide) => {

        if (!liikennepaikanRaide || _.isEmpty(liikennepaikanRaide.liikennepaikka)) {
            return undefined;
        }

        // TODO rid unnecessary array in services/station.js
        const liikennepaikka = _.first(liikennepaikanRaide.liikennepaikka);

        const $ = cheerio.load('<ocp/>', config.cheerio);
        $('ocp').attr('id', liikennepaikka.tunniste);
        $('ocp').attr('code', liikennepaikka.lyhenne);
        $('ocp').attr('name', liikennepaikka.kuljettajaAikatauluNimi);
        $('ocp').attr('abbrevation', liikennepaikka.lyhenne);
        $('ocp').attr('type', OcpType.OPERATIONAL_NAME);

        return $.xml();        
    }
};
