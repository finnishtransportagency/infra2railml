const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const balise = require('./balise');
const signal = require('./signal');
const _switch = require('./switch');
const crossing = require('./crossing');
const speedChange = require('./speed-change');
const electrificationChange = require('./electrification-change');
const speeds = require('./speeds');
const trackRef = require('./track-ref');

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

    const electrificationChanges = _.map(elements.erotinjakso, (ej) => electrificationChange.marshall(absPos, ej));
    if (!_.isEmpty(electrificationChanges)) {
        $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
    }

    return {
        element: $.html(),
        speeds: _.uniq(_.flatMap(nopeudet, speeds.marshall)),
        trackRef: trackRef.marshall(km)
    };
}

function marshallRail(rail, index) {

    const ratakmvali = _.find(rail.ratakmvalit, { ratanumero: index.trackId });
    const { alku, loppu } = ratakmvali;

    const elements = _.uniqBy(_.filter(index.elementit, (e) => isRailElement(e, rail.tunniste, index.trackId, alku, loppu)), 'tunniste');
    const elementGroups = _.groupBy(elements, 'tyyppi');

    // track element
    const railId = rail.tunniste;
    const name = `Raide ${index.trackId} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const $ = cheerio.load(`<track id="${railId}" name="${name}"><trackTopology/><trackElements/><ocsElements/></track>`, config.cheerio);

    console.log(name);

    // track begin / end
    const beginAbsPos = alku.ratakm * 1000 + alku.etaisyys;
    const endAbsPos = loppu.ratakm * 1000 + loppu.etaisyys;
    const endPos = endAbsPos - beginAbsPos;
    $('trackTopology').append(`<trackBegin id="tb_${railId}" pos="0.0000" absPos="${beginAbsPos}">`);
    $('trackTopology').append(`<trackEnd id="te_${railId}" pos="${endPos}" absPos="${endAbsPos}">`); 
        
    const beginElement = findConnectingElement(alku.ratakm, alku.etaisyys, elementGroups.vaihde, elementGroups.puskin);
    const endElement = findConnectingElement(loppu.ratakm, loppu.etaisyys, elementGroups.vaihde, elementGroups.puskin);
    
    if (beginElement && beginElement.tyyppi === 'vaihde') {
        $('trackBegin').append(`<connection id="tbc_${railId}" ref="${beginElement.tunniste}" />`);
    } else if (beginElement && beginElement.tyyppi === 'puskin') {
        $('trackBegin').append(`<bufferStop id="tbbs_${railId}" name="${beginElement.nimi || beginElement.tunniste}" />`);
    }

    if (endElement && endElement.tyyppi === 'vaihde') {
        $('trackEnd').append(`<connection id="tec_${railId}" ref="${endElement.tunniste}" />`);
    } else if (endElement && endElement.tyyppi === 'puskin') {
        $('trackEnd').append(`<bufferStop id="tebs_${railId}" name="${endElement.nimi || beginElement.tunniste}" />`);
    }

    const switches = _.map(elementGroups.vaihde, (v) => _switch.marshall(index.trackId, beginAbsPos, v));
    const risteykset = _.filter(elements.vaihde, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const crossings = _.map(risteykset, (r) => crossing.marshall(km.ratanumero, absPos, r));
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
    const nopeudet = _.filter(rail.nopeusrajoitukset, (nr) => isRailSpeedChange(nr, index.trackId, alku, loppu));
    const speedAttrs = _.uniq(_.flatMap(nopeudet, speeds.marshall));
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(beginAbsPos, n)));
    if (!_.isEmpty(speedChanges)) {
        $('trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    const electrificationChanges = _.map(elementGroups.erotusjakso, (ej) => electrificationChange.marshall(absPos, ej));
    if (!_.isEmpty(electrificationChanges)) {
        $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
    }

    return {
        element: $.html(),
        speeds: speedAttrs,
        trackRef: trackRef.marshall(rail),
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
    acc.trackRefs = _.concat(acc.trackRefs, track.trackRef);
    acc.absPos += (km.pituus || 1000);
    acc.previousTrack = km.kilometrimerkki.tunniste || '';
    
    return acc;
}

function fromRail(acc, rail) {
    
    const track = marshallRail(rail, acc.index);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.speeds = _.concat(acc.speeds, track.speeds);
    acc.trackRefs = _.concat(acc.trackRefs, track.trackRef);

    return acc;
}

function findConnectingElement(km, etaisyys, vaihteet, puskimet) {
    const vaihde = _.find(vaihteet, (v) => _.find(v.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys }));
    const puskin = _.find(puskimet, (p) => _.find(p.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys }));
    return vaihde || puskin;
}

function isRailElement(element, railId, trackId, raideAlku, raideLoppu) {
    const included = _.map(element.raiteet, 'tunniste').includes(railId);
    const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });
    return included && !_.isEmpty(sijainti) &&
        sijainti.ratakm >= raideAlku.ratakm &&
        sijainti.etaisyys >= raideAlku.etaisyys &&
        sijainti.ratakm <= raideLoppu.ratakm &&
        sijainti.etaisyys <= raideLoppu.etaisyys;
}

function isRailSpeedChange(speed, raideRataNr, raideAlku, raideLoppu) {
    const { ratanumero, alku } = speed.ratakmvali;
    return ratanumero === raideRataNr &&
        alku.ratakm >= raideAlku.ratakm &&
        alku.etaisyys >= raideAlku.etaisyys &&
        alku.ratakm <= raideLoppu.ratakm &&
        alku.etaisyys <= raideLoppu.etaisyys;
}

module.exports = {
    fromKilometer, fromRail
};