const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

// https://wiki.railml.org/index.php?title=IS:ocp

const NameType = {
    OPERATIONAL: 'operationalName',
    TRAFFIC: 'trafficName',
    LOCAL: 'localName',
    OTHER: (val) => `other:${val}`
};

const OperationalType = {
    STATION: 'station',
    STOPPING_POINT: 'stoppingPoint',
    DEPOT: 'depot',
    CROSSOVER: 'crossover',
    JUNCTION: 'junction',
    BLOCK_POST: 'blockPost',
    BLOCK_SIGNAL: 'blockSignal',
    SIDING: 'siding',
    OTHER: (val) => `other:${val}`
};

module.exports = {
    marshall: (liikennepaikka) => {

        if (_.isEmpty(liikennepaikka)) {
            return undefined;
        }

         // TODO Other types available in API?
        const opType = OperationalType.STATION; 
        
        const $ = cheerio.load('<ocp/>', config.cheerio);
        $('ocp').attr('id', liikennepaikka.tunniste);
        $('ocp').attr('code', liikennepaikka.lyhenne);
        $('ocp').attr('name', liikennepaikka.kuljettajaAikatauluNimi);
        $('ocp').attr('type', NameType.OPERATIONAL);
        $('ocp').attr('abbrevation', liikennepaikka.lyhenne);
        $('ocp').append(`<propOperational operationalType="${opType}"/>`);

        return $.xml();        
    }
};
