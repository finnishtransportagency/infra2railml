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
    
    const trackId = km.kilometrimerkki.tunniste;
    const trackName = `${km.ratanumero} - ${km.ratakm}`;
    const stub = `<track id="${trackId}" name="${trackName}"><trackTopology/><trackElements/><ocsElements/></track>`;
    const $ = cheerio.load(stub, config.cheerio);

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
        element: $.xml(),
        speeds: _.uniq(_.flatMap(nopeudet, speeds.marshall)),
        trackRef: trackRef.marshall(km)
    };
}

function marshallRail(rail, memo) {

    const { index, marshalled } = memo;

    const ratakmvali = _.find(rail.ratakmvalit, { ratanumero: index.trackId });
    const { alku, loppu } = ratakmvali;

    const elements = _.uniqBy(_.filter(index.elementit, (e) => isRailElement(e, rail.tunniste, index.trackId, alku, loppu)), 'tunniste');
    const elementGroups = _.groupBy(elements, 'tyyppi');

    // track element
    const railId = rail.tunniste;
    const name = `Raide ${index.trackId} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const stub = `<track id="${railId}" name="${name}"><trackTopology/><trackElements/><ocsElements/></track>`;
    const $ = cheerio.load(stub, config.cheerio);

    // track begin / end
    const beginAbsPos = alku.ratakm * 1000 + alku.etaisyys;
    const endAbsPos = loppu.ratakm * 1000 + loppu.etaisyys;
    const endPos = endAbsPos - beginAbsPos;
    $('trackTopology').append(`<trackBegin id="tb_${railId}" pos="0.0000" absPos="${beginAbsPos}">`);
    $('trackTopology').append(`<trackEnd id="te_${railId}" pos="${endPos}" absPos="${endAbsPos}">`); 
        
    const beginElement = findConnectingElement(alku.ratakm, alku.etaisyys, elementGroups);
    const endElement = findConnectingElement(loppu.ratakm, loppu.etaisyys, elementGroups);
    
    if (beginElement && beginElement.tyyppi === 'vaihde') {
        const beginSwitchConnection = findSwitchConnection(railId, beginElement);
        $('trackBegin').append(`<connection id="tbc_${railId}" ref="swc${beginSwitchConnection}_${beginElement.tunniste}" />`);
    } else if (beginElement && beginElement.tyyppi === 'puskin') {
        $('trackBegin').append(`<bufferStop id="tbbs_${railId}" name="${beginElement.nimi || beginElement.tunniste}" />`);
    }

    if (endElement && endElement.tyyppi === 'vaihde') {
        const endSwitchConnection = findSwitchConnection(railId, endElement);        
        $('trackEnd').append(`<connection id="tec_${railId}" ref="swc${endSwitchConnection}_${endElement.tunniste}" />`);
    } else if (endElement && endElement.tyyppi === 'puskin') {
        $('trackEnd').append(`<bufferStop id="tebs_${railId}" name="${endElement.nimi || beginElement.tunniste}" />`);
    }

    // rule out switches that may have been already marshalled for some other rail
    const unmarshalledElements = _.reject(elements, (e) => marshalled.includes(e.tunniste));
    const unmarshalledGroups = _.groupBy(unmarshalledElements, 'tyyppi');
    const switches = _.map(unmarshalledGroups.vaihde, (v) => _switch.marshall(index.trackId, beginAbsPos, v));
    const risteykset = _.filter(unmarshalledGroups.vaihde, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const crossings = _.map(risteykset, (r) => crossing.marshall(km.ratanumero, absPos, r));
    $('trackTopology').append('<connections/>');    
    if (!_.isEmpty(switches)) {
        $('trackTopology > connections').append(switches);
    }
    if (!_.isEmpty(crossings)) {
        $('trackTopology > connections').append(crossings);
    }

    memo.marshalled = _.concat(memo.marshalled, _.map(unmarshalledElements, 'tunniste'));


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
        element: $.xml(),
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
    
    const track = marshallRail(rail, acc);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.speeds = _.concat(acc.speeds, track.speeds);
    acc.trackRefs = _.concat(acc.trackRefs, track.trackRef);

    return acc;
}

/**
 * Resolve the track begin/end element, e.g. switch or stop buffer.
 */
function findConnectingElement(km, etaisyys, elements) {
    const vaihde = _.find(elements.vaihde, (v) => !!_.find(v.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys }));
    const puskin = _.find(elements.puskin, (p) => !!_.find(p.ratakmsijainnit, { ratakm: km, etaisyys: etaisyys }));
    return vaihde || puskin;
}

/**
 * Resolve reference from track begin/end connection to switch connection (swc1, swc2 or swc3)
 */
function findSwitchConnection(railId, element) {

    if (!element || !element.vaihde) {
        return '';
    }

    const mista = _.find(element.vaihde.raideyhteydet, (y) => y.mista === railId);
    const minne = _.find(element.vaihde.raideyhteydet, (y) => y.minne === railId);
    const yhteys = mista || minne;

    if (!yhteys) return '';

    if (yhteys.mista === railId && yhteys.mistaRooli === 'etu') return 1
    else if (yhteys.mista === railId && yhteys.mistaRooli === 'taka') return 2
    else if (yhteys.minne === railId && yhteys.minneRooli === 'etu') return 1
    else if (yhteys.minne === railId && yhteys.minneRooli === 'taka') return 2
    
    return 3;
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