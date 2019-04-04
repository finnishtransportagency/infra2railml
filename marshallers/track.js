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
        element: $.html(),
        speeds: _.uniq(_.flatMap(nopeudet, speeds.marshall))
    };
}

function marshallRail(rail, index) {

    const ratakmvali = _.find(rail.ratakmvalit, { ratanumero: index.trackId });
    const { alku, loppu } = ratakmvali;

    const elements = _.uniqBy(_.filter(index.elementit, (e) => isRailElement(e, rail.tunniste, index.trackId, alku.ratakm, alku.etaisyys, loppu.ratakm, loppu.etaisyys)), 'tunniste');
    const elementGroups = _.groupBy(elements, 'tyyppi');
   
    // track element
    const railId = rail.tunniste;
    const name = `Raide ${index.trackId} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const $ = cheerio.load(`<track id="${railId}" name="${name}"><trackTopology></trackTopology><trackElements/><ocsElements/></track>`, cheerioOpts);

    console.log(name);

    // trackTopology element
    const beginAbsPos = alku.ratakm * 1000 + alku.etaisyys;
    const endAbsPos = loppu.ratakm * 1000 + loppu.etaisyys;
    const endPos = endAbsPos - beginAbsPos;
    const trackBeginRef = findTrackConnectionRef(alku.ratakm, alku.etaisyys, elementGroups.vaihde, elementGroups.puskin);
    const trackEndRef = findTrackConnectionRef(loppu.ratakm, loppu.etaisyys, elementGroups.vaihde, elementGroups.puskin);
    const switches = _.map(elementGroups.vaihde, (v) => _switch.marshall(index.trackId, beginAbsPos, v));
    
    const risteykset = _.filter(elements.vaihde, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const crossings = _.map(risteykset, (r) => crossing.marshall(km.ratanumero, absPos, r));
    
    $('trackTopology').append(`<trackBegin id="tb_${railId}" pos="0.0000" absPos="${beginAbsPos}"><connection id="tbc_${railId}" ref="${trackBeginRef}" /></trackBegin>`);
    $('trackTopology').append(`<trackEnd id="te_${railId}" pos="${endPos}" absPos="${endAbsPos}"><connection id="tec_${railId}" ref="${trackEndRef}" /></trackEnd>`);
    $('trackTopology').append('<connections/>');    
    if (!_.isEmpty(switches)) {
        $('trackTopology > connections').append(switches);
    }
    if (!_.isEmpty(crossings)) {
        $('trackTopology > connections').append(crossings);
    }

    // ocsElements
    const signals = _.map(elementGroups.opastin, (o) => signal.marshall(index.trackId, beginAbsPos, o));    
    if (!_.isEmpty(signals)) {
        $('ocsElements').append(`<signals>${_.join(signals, '')}</signals>`);
    }
    const balises = _.map(elementGroups.baliisi, (b) => balise.marshall(index.trackId, beginAbsPos, b));
    if (!_.isEmpty(balises)) {
        $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
    }

    // trackElements
    const speeds = _.filter(rail.nopeusrajoitukset, (nr) => isRailSpeedChange(nr, index.trackId, alku.ratakm, alku.etaisyys, loppu.ratakm, loppu.etaisyys));
    const speedChanges = _.uniq(_.flatMap(speeds, (n) => speedChange.marshall(beginAbsPos, n)));
    if (!_.isEmpty(speedChanges)) {
        $('trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    return {
        element: $.html(),
        speeds,
        length: endPos
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

function fromRail(acc, rail) {
    
    const track = marshallRail(rail, acc.index);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.speeds = _.concat(acc.speeds, track.speeds);

    return acc;
}

function findTrackConnectionRef(km, etaisyys, vaihteet, puskimet) {
    const vaihde = _.find(vaihteet, (v) => _.find(v.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys })) || {};
    const puskin = _.find(puskimet, (p) => _.find(p.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys })) || {};
    return vaihde.tunniste || puskin.tunniste || '';
}

function isRailElement(element, railId, trackId, kmMin, distMin, kmMax, distMax) {
    const included = _.map(element.raiteet, 'tunniste').includes(railId);
    const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });
    return included && !_.isEmpty(sijainti) && sijainti.ratakm >= kmMin && sijainti.etaisyys >= distMin && sijainti.ratakm <= kmMax && sijainti.etaisyys <= distMax;
}

function isRailSpeedChange(speed, trackId, kmMin, distMin, kmMax, distMax) {
    const { ratanumero, alku } = speed.ratakmvali;
    return ratanumero === trackId && alku.ratakm >= kmMin && alku.etaisyys >= distMin && alku.ratakm <= kmMax && alku.etaisyys <= distMax;
}

module.exports = {
    fromKilometer, fromRail
};