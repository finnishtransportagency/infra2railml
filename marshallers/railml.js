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

/**
 * Main document composer.
 */
function marshall(infra, visuals) {

    const $ = cheerio.load(RAILML_STUB, config.cheerio);
    _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));
    
    $('railml').append(infra);
    $('railml').append(visuals);
    
    return $.html();
}

/**
 * Convert track kilometers to railML track elements.
 */
function fromKilometers(index) {

    return new Promise((resolve) => {

        // FIXME assumption of each track kilometer being exactly 1000 meters
        const absPos = index.from * 1000;

        const memo = { index, absPos, tracks: [], speeds: [], trackRefs: [], previousKm: '' };
        const results = _.transform(index.kilometrit, track.fromKilometer, memo);
       
        const infra = infrastructure.marshall(results);
        const visuals = infrastructureVis.marshallKm(results);
        const railml = marshall(infra, visuals);

        resolve(railml);
    });
}

/**
 * Convert track rails to railML track elements.
 */
function fromRails(index) {

    return new Promise((resolve) => {
        
        // FiXME assumption of each track kilometer being exactly 1000 meters
        const absPos = index.from * 1000;

        const memo = { index, absPos, speeds: [], tracks: [] };
        const results = _.transform(index.raiteet, track.fromRail, memo);
        const infra = infrastructure.marshall(results);
        const visuals = infrastructureVis.marshallRails(results)
        const railml = marshall(infra, visuals);
        
        resolve(railml);
    });
}

module.exports = {
    marshall, fromKilometers, fromRails
};
