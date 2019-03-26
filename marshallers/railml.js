const _ = require('lodash');
const cheerio = require('cheerio');
const track = require('./track');
const config = require('../config');
const trackRef = require('./track-ref');
const trackVis = require('./track-vis');


const XML_NAMESPACES = {
    'version': '2.2',
    'xmlns': '',
    'xmlns:xsi': 'http://www.railml.org/schemas/2013',
    'xsi:schemaLocation': 'http://www.railml.org/schemas/2013 http://schemas.railml.org/2013/railML-2.2/railML.xsd'
};

const RAILML_STUB =
    '<?xml version="1.0" encoding="UTF-8"?><railml><infrastructure><infraAttrGroups/><tracks/><trackGroups/></infrastructure><infrastructureVisualizations/></railml>';

/**
 * Convert given track kilometers to rail-ml tracks.
 */
function fromKilometers(trackId, kilometers) {

    return new Promise((resolve) => {

        const from = _.first(kilometers).ratakm || 0;
        const to = _.last(kilometers).ratakm || kilometers.length;

        const $ = cheerio.load(RAILML_STUB, config.cheerio);
        _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));

        const infra = $('railml > infrastructure');
        infra.attr('id', `${trackId}_${from}-${to}`);
        infra.attr('name', `Rata ${trackId} (${from}-${to} km)`)

        const accumulator = { absPos: from * 1000, tracks: [], speeds: [], previousKm: '' };

        const result = _.transform(kilometers, (acc, km) => {
            const t = track.fromKilometer(km, acc.absPos, acc.previousKm);
            acc.tracks.push(t.element);
            acc.speeds.push(t.speeds);
            acc.absPos += (km.pituus || km.ratakm * 1000);
            acc.previousKm = km.kilometrimerkki.tunniste;
            return acc;
        }, accumulator);

        $('railml > infrastructure > tracks').append(result.tracks);
        $('railml > infrastructure > infraAttrGroups').append(_.flatten(result.speeds));

        const lineId = `${trackId}_${from}_${to}`;
        const trackRefs = _.map(kilometers, trackRef.marshall);
        $('railml > infrastructure > trackGroups').append(`<line id="${lineId}" name="${trackId} ${from}-${to}"/>`)
        $('railml > infrastructure > trackGroups > line').append(trackRefs);

        const visualization = _.map(kilometers, trackVis.marshall);
        $('railml > infrastructureVisualizations').append(`<lineVis ref="${lineId}"/>`);
        $('railml > infrastructureVisualizations > lineVis').append(visualization);

        resolve($.html());
    });
}

module.exports = {
    fromKilometers
};
