const _ = require('lodash');
const cheerio = require('cheerio');
const balise = require('./balise');
const signal = require('./signal');
const _switch = require('./switch');
const cheerioOpts = { xmlMode: true, normalizeWhitespace: true };

/**
 * Convert one track kilometer to railML.
 */
function fromKilometer(km, absPos, prevKmId) {
    
    const $ = cheerio.load(`<track id="${km.kilometrimerkki.tunniste}" name="${km.ratanumero} - ${km.ratakm}"><trackTopology/><trackElements/><ocsElements/></track>`, cheerioOpts);

    const topology = $('trackTopology');

    topology.append(`<trackBegin id="tb_${km.ratakm}" pos="0.0000" absPos="${absPos}"><connection id="tbc_${km.ratakm}" ref="${prevKmId}"/></trackBegin>`);
    topology.append(`<trackEnd id="te_${km.ratakm}" pos="${km.pituus}" absPos="${absPos + km.pituus}"><connection id="tec_${km.ratakm}" ref="tbc_${km.ratakm + 1}" />`);
    topology.append('<connections/>');

    const switches = _.map(getElements(km.elementit, 'vaihde'), (v) => _switch.marshall(km.ratanumero, absPos, v));
    $('trackTopology > connections').append(switches);

    const signals = _.map(getElements(km.elementit, 'opastin'), (s) => signal.marshall(km.ratanumero, absPos, s));
    $('ocsElements').append('<signals/>')
    $('ocsElements > signals').append(signals);

    const balices = _.map(getElements(km.elementit, 'baliisi'), (b) => balise.marshall(km.ratanumero, absPos, b));
    $('ocsElements').append('<balises/>')
    $('ocsElements > balises').append(balices);

    return $.html();
}

function getElements(elements, type) {
    return _.filter(elements, { tyyppi: type });
}

module.exports = {
    fromKilometer: fromKilometer,
    // TODO fromRails
};
