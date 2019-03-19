const _ = require('lodash');
const cheerio = require('cheerio');
const baliseMarshaller = require('./balise-marshaller');
const signalMarshaller = require('./signal-marshaller');
const switchMarshaller = require('./switch-marshaller');

const elementMarshaller = require('./switch-marshaller');


const XML_NAMESPACES = {
    'version': '2.2',
    'xmlns': '',
    'xmlns:xsi': 'http://www.railml.org/schemas/2013',
    'xsi:schemaLocation': 'http://www.railml.org/schemas/2013 http://schemas.railml.org/2013/railML-2.2/railML.xsd'
};

const RAILML_STUB = '<?xml version="1.0" encoding="UTF-8"?><railml><infrastructure><tracks/></infrastructure></railml>';

const cheerioOpts = {
    xmlMode: true,
    normalizeWhitespace: true
};

/**
 * Convert given track kilometers in railML.
 */
function _convert(trackId, from, to, track) {

    const $ = cheerio.load(RAILML_STUB, cheerioOpts);
    _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));

    const infra = $('railml > infrastructure');
    infra.attr('id', `${trackId}_${from}-${to}`);
    infra.attr('name', `Rata ${trackId} (${from}-${to} km)`)

    const kilometers = _.map(track, _createKilometer);
    $('railml > infrastructure > tracks').append(kilometers);

    return Promise.resolve($.html());
}

/**
 * Convert one track kilometer to railML.
 */
function _createKilometer(km, index) {
    
    const $ = cheerio.load(`<track id="${km.ratanumero}-${km.ratakm}"><trackTopology/><trackElements/><ocsElements/></track>`, cheerioOpts);

    const topology = $('trackTopology');
    topology.append(`<trackBegin id="x${km.ratakm}" pos="0.0000" absPos="${km.ratakm*1000}" />`);
    topology.append(`<trackEnd id="y${km.ratakm}" pos="${km.pituus}" absPos="${(km.ratakm*1000)+km.pituus}" />`);
    topology.append('<connections/>');
    
    const switches = _.map(getElements(km.elementit, 'vaihde'), (v) => switchMarshaller.marshall(km.ratanumero, v));
    $('trackTopology > connections').append(switches);

    const signals = _.map(getElements(km.elementit, 'opastin'), (s) => signalMarshaller.marshall(km.ratanumero, s));
    $('ocsElements').append('<signals/>')
    $('ocsElements > signals').append(signals);

    const balices = _.map(getElements(km.elementit, 'baliisi'), (b) => baliseMarshaller.marshall(km.ratanumero, b));
    $('ocsElements').append('<balises/>')
    $('ocsElements > balises').append(balices);

    return $.html();
}

function getElements(elements, type) {
    return _.filter(elements, { tyyppi: type });
}

module.exports = {
    convert: _convert
};
