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
function marshallKm(km, absPos, prevTrackId) {
    
    const $ = cheerio.load(`<track id="${km.kilometrimerkki.tunniste}" name="${km.ratanumero} - ${km.ratakm}"><trackTopology/><trackElements/><ocsElements/></track>`, cheerioOpts);

    const topology = $('trackTopology');
    topology.append(`<trackBegin id="tb_${km.ratakm}" pos="0.0000" absPos="${absPos}"><connection id="tbc_${km.ratakm}" ref="${prevTrackId}"/></trackBegin>`);
    topology.append(`<trackEnd id="te_${km.ratakm}" pos="${km.pituus}" absPos="${absPos + km.pituus}"><connection id="tec_${km.ratakm}" ref="tbc_${km.ratakm + 1}" />`);
    topology.append('<connections/>');

    const elements = _.groupBy(km.elementit, 'tyyppi');

    const switches = _.map(elements.vaihde, (v) => _switch.marshall(km.ratanumero, absPos, v));
    if (!_.isEmpty(switches)) {
        $('trackTopology > connections').append(switches);
    }

    const risteykset = _.filter(elements.vaihde, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const crossings = _.map(risteykset, (r) => crossing.marshall(km.ratanumero, absPos, r));
    if (!_.isEmpty(crossings)) {
        $('trackTopology > connections').append(crossings);
    }

    const signals = _.map(elements.opastin, (o) => signal.marshall(km.ratanumero, absPos, o));    
    if (!_.isEmpty(signals)) {
        $('ocsElements').append(`<signals>${_.join(signals, '')}</signals>`);
    }

    const balises = _.map(elements.baliisi, (b) => balise.marshall(km.ratanumero, absPos, b));
    if (!_.isEmpty(balises)) {
        $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
    }

    const raiteet = _.filter(_.uniqBy(_.reject(_.flatMap(km.elementit, (e) => e.raiteet), _.isUndefined), 'tunniste'), { 'tyyppi': 'linja' });
    const nopeudet = _.filter(_.flatMap(raiteet, (r) => r.nopeusrajoitukset), (nr) => nr.ratakmvali.ratanumero === km.ratanumero && nr.ratakmvali.alku.ratakm === km.ratakm);
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(absPos, n)));
    
    if (!_.isEmpty(speedChanges)) {
        $('track > trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    return {
        'element': $.html(),
        'speeds': _.uniq(_.flatMap(nopeudet, speeds.marshall))
    };
}

/**
 * Kilometer transformer function.
 */
function fromKilometer(acc, km) {
    const track = marshallKm(km, acc.absPos, acc.previousTrack);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.speeds = _.concat(acc.speeds, track.speeds);
    acc.absPos += (km.pituus || km.ratakm * 1000);
    acc.previousTrack = km.kilometrimerkki.tunniste || '';
    return acc;
}

function fromRail(acc, rail, i) {

    const { index } = acc;
    const km = _.find(rail.ratakmvalit, { ratanumero: index.trackId });

    const id = rail.tunniste;
    const name = `Raide ${index.trackId} ${km.alku.ratakm}+${km.alku.etaisyys} - ${km.loppu.ratakm}+${km.loppu.etaisyys}`;
    const beginAbsPos = km.alku.ratakm * 1000 + km.alku.etaisyys;
    const endAbsPos = km.loppu.ratakm * 1000 + km.loppu.etaisyys;
    const endPos = endAbsPos - beginAbsPos;

    const elements = _.uniqBy(_.filter(index.elementit, (e) => _.find(e.raiteet, (r) => r.tunniste === rail.tunniste)), 'tunniste');
    const elementGroups = _.groupBy(elements, 'tyyppi');

    const trackBeginRef = findTrackConnectionRef(elementGroups.vaihde, km.alku.ratakm, km.alku.etaisyys);
    const trackEndRef = findTrackConnectionRef(elementGroups.vaihde, km.loppu.ratakm, km.loppu.etaisyys);

    const $ = cheerio.load(`<track id="${id}" name="${name}"><trackTopology></trackTopology><trackElements/><ocsElements/></track>`, cheerioOpts);
    
    const topology = $('trackTopology');
    topology.append(`<trackBegin id="tb_${id}" pos="0.0000" absPos="${beginAbsPos}"><connection id="tbc_${id}" ref="${trackBeginRef}" /></trackBegin>`);
    topology.append(`<trackEnd id="te_${id}" pos="${endPos}" absPos="${endAbsPos}"><connection id="tec_${id}" ref="${trackEndRef}" /></trackEnd>`);

    const switches = _.map(elementGroups.vaihde, (v) => _switch.marshall(index.trackId, beginAbsPos, v));
    if (!_.isEmpty(switches)) {
        topology.append('<connections/>');
        $('trackTopology > connections').append(switches);
    }

    const signals = _.map(elementGroups.opastin, (o) => signal.marshall(index.trackId, beginAbsPos, o));    
    if (!_.isEmpty(signals)) {
        $('ocsElements').append(`<signals>${_.join(signals, '')}</signals>`);
    }

    const balises = _.map(elementGroups.baliisi, (b) => balise.marshall(index.trackId, beginAbsPos, b));
    if (!_.isEmpty(balises)) {
        $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
    }

    const nopeudet = _.filter(rail.nopeusrajoitukset, (nr) => nr.ratakmvali.ratanumero === index.trackId);
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(beginAbsPos, n)));
    if (!_.isEmpty(speedChanges)) {
        $('track > trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    acc.tracks.push($.html());
    acc.speeds.push(_.uniq(_.flatMap(nopeudet, speeds.marshall)))
    acc.previousTrack = trackEndRef;
    return acc; 
}

function findTrackConnectionRef(switches, km, etaisyys) {
    const s = _.find(switches, (s) => _.find(s.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys }));
    return s ? s.tunniste : 'undefined';
}

module.exports = {
    fromKilometer, fromRail
};