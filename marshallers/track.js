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
const milepost = require('./milepost');

/**
 * Convert one track kilometer to railML. Produces a simple line level model without
 * individual rails.
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
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(railId, absPos, n)));
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

/**
 * Rail marshaller.
 */
function marshallRail(rail, memo) {

    const { index, marshalled } = memo;

    const ratakmvali = _.find(rail.ratakmvalit, { ratanumero: index.trackId }) || _.first(rail.ratakmvalit);
    const { ratanumero, alku, loppu } = ratakmvali;

    console.log(`\nGenerating track ${rail.tunniste} (${ratakmvali.ratanumero} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys})`);
    
    // find & group all elements related to current rail
    const elements = _.uniqBy(_.filter(index.elementit, (e) => isRailElement(rail.tunniste, e)), 'tunniste');
    const elementsByType = _.groupBy(elements, 'tyyppi');

    // main track element
    const railId = rail.tunniste;
    const name = `Raide ${ratanumero} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const stub = `<track id="${railId}" name="${name}"><trackTopology/><trackElements/><ocsElements/></track>`;
    const $ = cheerio.load(stub, config.cheerio);

    // track begin/end elements
    const beginAbsPos = alku.ratakm * 1000 + alku.etaisyys;
    const endAbsPos = loppu.ratakm * 1000 + loppu.etaisyys;
    const endPos = endAbsPos - beginAbsPos;
    $('trackTopology').append(`<trackBegin id="tb_${railId}" pos="0.0000" absPos="${beginAbsPos}">`);
    $('trackTopology').append(`<trackEnd id="te_${railId}" pos="${endPos}" absPos="${endAbsPos}">`); 
        
    // find the incoming/outgoing elements of rail, typically a switch or buffer stop
    const beginElement = findConnectingElement('begin', alku.ratakm, alku.etaisyys, elementsByType);
    const beginRef = findConnectionRef(railId, 'begin', beginElement);

    const endElement = findConnectingElement('end', loppu.ratakm, loppu.etaisyys, elementsByType);
    const endRef = findConnectionRef(railId, 'end', endElement);

    if (beginElement && beginRef && beginElement.tyyppi === 'vaihde') {
        $('trackBegin').append(`<connection id="tbc_${railId}" ref="${beginRef}" />`);
    } else if (beginElement && beginElement.tyyppi === 'puskin') {
        $('trackBegin').append(`<bufferStop id="tbbs_${railId}" name="${beginElement.nimi || beginElement.tunniste}" />`);
    } else {
        $('trackBegin').append(`<openEnd id="tboe_${railId}" name="${rail.tunniste}" />`);
    }

    if (endElement && endRef && endElement.tyyppi === 'vaihde') {
        $('trackEnd').append(`<connection id="tec_${railId}" ref="${endRef}" />`);
    } else if (endElement && endElement.tyyppi === 'puskin') {
        $('trackEnd').append(`<bufferStop id="tebs_${railId}" name="${endElement.nimi || beginElement.tunniste}" />`);
    } else {
        $('trackEnd').append(`<openEnd id="teoe_${railId}" name="${rail.tunniste}" />`);
    }

    // avoid duplicate switch elements by rejecting the already processed ones
    const unmarshalledElements = _.reject(elements, (e) => marshalled.includes(e.tunniste));
    const unmarshalledGroups = _.groupBy(unmarshalledElements, 'tyyppi');

    const vaihteet = _.filter(unmarshalledGroups.vaihde, (v) => isAtRailEnds(v, ratanumero, alku, loppu));
    const risteykset = _.filter(vaihteet, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const switches = _.map(vaihteet, (v) => _switch.marshall(ratanumero, beginAbsPos, v));
    const crossings = _.map(risteykset, (r) => crossing.marshall(ratanumero, beginAbsPos, r));
    
    $('trackTopology').append('<connections/>');    
    if (!_.isEmpty(switches)) {
        $('trackTopology > connections').append(switches);
    }
    if (!_.isEmpty(crossings)) {
        $('trackTopology > connections').append(crossings);
    }

    memo.marshalled = _.concat(memo.marshalled, _.map(vaihteet, 'tunniste'));

    // Find elements located between rail begin and end, as the first and last kilometers may
    // also contain elements related to previous/next rail.
    const onRailElements = _.filter(elements, (e) => isOnRail(e, ratanumero, alku, loppu));
    const onRailElementGroups = _.groupBy(onRailElements, 'tyyppi');
    const railKmPosts = _.filter(index.kilometrit, (k) => isKilometerChangeOnRail(ratanumero, alku, loppu, k));
    
    // ocsElements
    const signals = _.map(onRailElementGroups.opastin, (o) => signal.marshall(ratanumero, beginAbsPos, o));
    const mileposts = _.map(railKmPosts, (p) => milepost.marshall(ratanumero, railId, alku, p));
    const signalsAndPosts = _.flatten(_.concat(signals, mileposts));
    if (!_.isEmpty(signals)) {
        $('ocsElements').append(`<signals>${_.join(signalsAndPosts, '')}</signals>`);
    }
    const balises = _.map(onRailElementGroups.baliisi, (b) => balise.marshall(ratanumero, beginAbsPos, b));
    if (!_.isEmpty(balises)) {
        $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
    }

    // trackElements
    const nopeudet = _.filter(rail.nopeusrajoitukset, (nr) => isRailSpeedChange(ratanumero, alku, loppu, nr));
    const speedAttrs = _.uniq(_.flatMap(nopeudet, (n) => speeds.marshall(railId, n)));
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(railId, beginAbsPos, n)));
    if (!_.isEmpty(speedChanges)) {
        $('trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    // TODO is electrificationChange correct railML term?
    const electrificationChanges = _.map(onRailElementGroups.erotusjakso, (ej) => electrificationChange.marshall(ratanumero, beginAbsPos, ej));
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

/**
 * Rail transformer function.
 */
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
function findConnectingElement(type, km, etaisyys, elements) {

    const position = { ratakm: km, etaisyys: etaisyys };
    const vaihde = _.find(elements.vaihde, (v) => !!_.find(v.ratakmsijainnit, position));
    const puskin = _.find(elements.puskin, (p) => !!_.find(p.ratakmsijainnit, position));
    const element = vaihde || puskin;

    if (element) {
        console.info(`- ${type} element ${element.tunniste} (${element.tyyppi})`)
    } else {
        console.info(`- ${type} element not found`)
    }

    return element;
}

/**
 * Resolve reference from track begin/end connection to track or switch connection. The connections
 * determined here are to follow OpenTrack generated models where only the parting switch direction is
 * referenced by tracks and the straight direction references are from track end to track beginning.
 */
function findConnectionRef(railId, type, element) {

    if (!element || !element.vaihde) return '';

    const nousevat = _.filter(element.vaihde.raideyhteydet, (y) => y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva');
    const mista = _.find(nousevat, (y) => y.mista === railId);
    const minne = _.find(nousevat, (y) => y.minne === railId);
    const yhteys = mista || minne;

    if (!yhteys) return '';

    console.log(`- ${type} ref: ${yhteys.mista} --> ${yhteys.minne}`);

    if (yhteys.mista === yhteys.minne) {
        // Infra-API special case where a switch is located "in the middle" of a rail,
        // i.e. "mista" and "minne" references are the same rail. This may not be the
        // correct solution, but at least it avoids the self-reference / loop.
        console.warn(`- WARN: ${type} switch ${element.tunniste} references rail ${yhteys.mista} both in and out.`);
        return ''; //`swc_${element.tunniste}`;

    } else if (yhteys.mistaRooli === 'vasen' || yhteys.mistaRooli === 'oikea') {
        // incoming from parting direction
        return `swc_${element.tunniste}`;

    } else if (yhteys.minneRooli === 'vasen' || yhteys.minneRooli === 'oikea') {
        // outgoing parting direction
        return `swc_${element.tunniste}`;

    } else if (yhteys.mista === railId) {
        // straight, incoming track referencing the next track's begin connection
        return `tbc_${yhteys.minne}`;
    
    } else if (yhteys.minne === railId) {
        // straight, outgoing track referencing the previous track's end connection
        return `tec_${yhteys.mista}`;
    }

    console.warn(`- failed to determine ${type} connection ref for track ${railId}!`);

    return '';
}


/**
 * Tells if the given element is (anyhow) related to specified rail.
 */
function isRailElement(railId, element) {
    return _.flatMap(element.raiteet, 'tunniste').includes(railId);
}

/**
 * Tells if the given element is between rail begin and end points, i.e. "on rail".
 */
function isOnRail(element, trackId, raideAlku, raideLoppu) {
    const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });
    return isBetween(raideAlku, raideLoppu, sijainti);
}

function isAtRailEnds(element, trackId, raideAlku, raideLoppu) {
    const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });
    return isBeginOrEnd(raideAlku, raideLoppu, sijainti);
}

/**
 * Tells if the given speed change is between rail begin and end points.
 */
function isRailSpeedChange(raideRataNr, raideAlku, raideLoppu, nopeudet) {
    const { ratanumero, alku } = nopeudet.ratakmvali;
    return ratanumero === raideRataNr && isBetween(raideAlku, raideLoppu, alku);
}

/**
 * Tells if given position (km+distance) is within given begin/end positions.
 */
function isBetween(alku, loppu, sijainti) {
    return !_.isEmpty(alku) && !_.isEmpty(loppu) && !_.isEmpty(sijainti) &&
        (sijainti.ratakm > alku.ratakm && sijainti.ratakm < loppu.ratakm) ||
        ((sijainti.ratakm === alku.ratakm && sijainti.etaisyys >= alku.etaisyys) ||
        (sijainti.ratakm === loppu.ratakm && sijainti.etaisyys <= loppu.etaisyys));
}

function isBeginOrEnd(alku, loppu, sijainti) {
    return !_.isEmpty(alku) && !_.isEmpty(loppu) && !_.isEmpty(sijainti) &&
        ((sijainti.ratakm === alku.ratakm && sijainti.etaisyys === alku.etaisyys) ||
        (sijainti.ratakm === loppu.ratakm && sijainti.etaisyys === loppu.etaisyys));
}

/**
 * Tells if hte given kilometer/mileage post is within given track range.
 */
function isKilometerChangeOnRail(ratanumero, alku, loppu, km) {
    return km.ratanumero === ratanumero &&
        (km.ratakm > alku.ratakm && km.ratakm <= loppu.ratakm);
}


module.exports = {
    fromKilometer, fromRail
};