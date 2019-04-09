const _ = require('lodash');
const cheerio = require('cheerio');
const track = require('./track');
const config = require('../config');
const infrastructure = require('./infrastructure');
const infrastructureVis = require('./infrastructure-vis');

const XML_NAMESPACES = {
    'version': '2.2', 'xmlns': '',
    'xmlns:xsi': 'http://www.railml.org/schemas/2013',
    'xsi:schemaLocation': 'http://www.railml.org/schemas/2013 http://schemas.railml.org/2013/railML-2.2/railML.xsd'
};

const RAILML_STUB = '<?xml version="1.0" encoding="UTF-8"?><railml/>';

const TRACK_MARSHALLERS = {
    kilometrit: track.fromKilometer,
    raiteet: track.fromRail
};

/**
 * Marshall given index to railML.
 */
function marshall(baseType, index) {
    return new Promise((resolve) => {
    
        const objects = index[baseType];
        const transformer = TRACK_MARSHALLERS[baseType];

        const absPos = index.from * 1000; // FIXME assumption of each track kilometer being exactly 1000 meters
        const memo = { index, absPos, tracks: [], speeds: [], trackRefs: [], previousKm: '' };
        const results = _.transform(objects, transformer, memo);

        const $ = cheerio.load(RAILML_STUB, config.cheerio);
        _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));
        
        const infra = infrastructure.marshall(results);
        const visuals = infrastructureVis.marshall(baseType, results)

        $('railml').append(infra);
        $('railml').append(visuals);

        resolve( $.html());
    });
}

module.exports = {
    marshall
};
