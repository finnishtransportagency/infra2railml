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

const RAILML_STUB =
    '<?xml version="1.0" encoding="UTF-8"?><railml><infrastructure><tracks/></infrastructure></railml>';

const cheerioOpts = { xmlMode: true, normalizeWhitespace: true };

/**
 * Convert given track kilometers in railML.
 */
function _convert(trackId, from, to, track) {

    const $ = cheerio.load(RAILML_STUB, { xmlMode: true, normalizeWhitespace: true });
    _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));

    const infra = $('railml > infrastructure');
    infra.attr('id', `${trackId}_${from}-${to}`);
    infra.attr('name', `Rata ${trackId} (${from}-${to} km)`)

    const accumulator = { absPos: from * 1000, kilometers: [] };
    const result = _.transform(track, _createKilometer, accumulator);
    $('railml > infrastructure > tracks').append(result.kilometers);

    return Promise.resolve($.html());
}

/**
 * Convert one track kilometer to railML.
 */
function _createKilometer(result, km) {
    
    const $ = cheerio.load(`<track id="${km.kilometrimerkki.tunniste}" name="${km.ratanumero} - ${km.ratakm}"><trackTopology/><trackElements/><ocsElements/></track>`, cheerioOpts);

    const topology = $('trackTopology');

    topology.append(`<trackBegin id="tb_${km.ratakm}" pos="0.0000" absPos="${result.absPos}"><connection id="tbc_${km.ratakm}" ref="${result.previousKm || ''}"/></trackBegin>`);
    topology.append(`<trackEnd id="te_${km.ratakm}" pos="${km.pituus}" absPos="${result.absPos + km.pituus}"><connection id="tec_${km.ratakm}" ref="tbc_${km.ratakm + 1}" />`);
    topology.append('<connections/>');

    const switches = _.map(getElements(km.elementit, 'vaihde'), (v) => switchMarshaller.marshall(km.ratanumero, result.absPos, v));
    $('trackTopology > connections').append(switches);

    const signals = _.map(getElements(km.elementit, 'opastin'), (s) => signalMarshaller.marshall(km.ratanumero, result.absPos, s));
    $('ocsElements').append('<signals/>')
    $('ocsElements > signals').append(signals);

    const balices = _.map(getElements(km.elementit, 'baliisi'), (b) => baliseMarshaller.marshall(km.ratanumero, result.absPos, b));
    $('ocsElements').append('<balises/>')
    $('ocsElements > balises').append(balices);

    // accumulate results
    result.absPos += km.pituus;
    result.previousKm = `tec_${km.ratakm}`;
    result.kilometers.push($.html());

    return result;
}

function getElements(elements, type) {
    return _.filter(elements, { tyyppi: type });
}

module.exports = {
    convert: _convert
};
