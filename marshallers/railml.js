const _ = require('lodash');
const cheerio = require('cheerio');
const track = require('./track');
const config = require('../config');
const infrastructure = require('./infrastructure');
const infrastructureVis = require('./infrastructure-vis');

const XML_NAMESPACES = {
    'version': '2.2', 'xmlns': 'http://www.railml.org/schemas/2013',
    'xmlns:xsi': 'http://www.railml.org/schemas/2013'
    //'xsi:schemaLocation': 'http://www.railml.org/schemas/2013 http://schemas.railml.org/2013/railML-2.2/railML.xsd'
};

const RAILML_STUB = '<?xml version="1.0" encoding="UTF-8"?><railml/>';

/**
 * Infra-API base types from which the railML track elements are created.
 */
const BaseType = {
    RAILS: 'raiteet',
    KILOMETERS: 'kilometrit'
};

/**
 * Track element marshallers for base types.
 */
const TRACK_MARSHALLERS = {
    kilometrit: track.fromKilometer,
    raiteet: track.fromRail
};

/**
 * Marshall given base types to railML tracks.
 */
function marshall(baseType, index) {

    const objects = index[baseType];
    const transformer = TRACK_MARSHALLERS[baseType];

    return new Promise((resolve, reject) => {
    
        if (!objects || !transformer) {
            reject(new Error(`Invalid base type '${baseType}'.`));
        }

        const absPos = index.from * 1000; // FIXME assumes each track kilometer being exactly 1000m
        const memo = { index, absPos, tracks: [], speeds: [], trackRefs: [], marshalled: [], previousTrack: '' };
        const results = _.transform(objects, transformer, memo);

        const $ = cheerio.load(RAILML_STUB, config.cheerio);
        _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));
        
        const infra = infrastructure.marshall(results);
        $('railml').append(infra);

        if (config.railml.visualize === true) {
            const visuals = infrastructureVis.marshall(baseType, results);
            $('railml').append(visuals);
        }

        resolve($.xml());
    });
}

module.exports = {
    BaseType, marshall
};
