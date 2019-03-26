const _ = require('lodash');
const cheerio = require('cheerio');
const balise = require('./balise');
const signal = require('./signal');
const _switch = require('./switch');
const crossing = require('./crossing');
const speedChange = require('./speed-change');
const speeds = require('./speeds');

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

    // group elements by type
    const elementTypes = _.filter(_.map(km.elementit, 'tyyppi'), _.isNotEmpty);
    const elements = _.transform(elementTypes, (result, type) => {
        result[type] = _.filter(km.elementit, { tyyppi: type });
        return result;
    }, {});

    const switches = _.map(elements.vaihde, (v) => _switch.marshall(km.ratanumero, absPos, v));
    $('trackTopology > connections').append(switches);

    const risteykset = _.filter(elements.vaihde, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const crossings = _.map(risteykset, (r) => crossing.marshall(km.ratanumero, absPos, r));
    $('trackTopology > connections').append(crossings);

    const signals = _.map(elements.opastin, (o) => signal.marshall(km.ratanumero, absPos, o));    
    $('ocsElements').append(`<signals>${_.join(signals, '')}</signals>`)

    const balises = _.map(elements.baliisi, (b) => balise.marshall(km.ratanumero, absPos, b));    
    $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);

    const raiteet = _.filter(_.uniqBy(_.filter(_.flatMap(km.elementit, (e) => e.raiteet), _.isNotEmpty), 'tunniste'), { 'tyyppi': 'linja' });
    const nopeudet = _.filter(_.flatMap(raiteet, (r) => r.nopeusrajoitukset), (nr) => nr.ratakmvali.ratanumero === km.ratanumero && nr.ratakmvali.alku.ratakm === km.ratakm);
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(km.ratanumero, absPos, n)));
    $('track > trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);

    return { 'element': $.html(), 'speeds': _.uniq(_.flatMap(nopeudet, speeds.marshall)) };
}

module.exports = {
    fromKilometer
    // TODO fromRails
};
