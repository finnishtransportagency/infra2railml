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
const mileageChange = require('./mileage-change');
const elementUtils = require('../utils/element-utils');
const railUtils = require('../utils/rail-utils');
const positionUtils = require('../utils/position-utils');
/**
 * Convert one track kilometer to railML. Produces a simple line level model without
 * individual rails.
 */
function marshallKm(km, absPos, prevTrackId) {
    
    const trackId = km.kilometrimerkki.tunniste;
    const trackName = `${km.ratanumero} - ${km.ratakm}`;
    const stub = `<track id="${trackId}" name="${trackName}"><trackTopology/><trackElements/><ocsElements/></track>`;
    const $ = cheerio.load(stub, config.cheerio);

    console.log(`\nGenerating track ${trackId} [${trackName}]..`);

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

    const raiteet = _.filter(_.uniqBy(_.reject(_.flatMap(km.elementit, 'raiteet'), _.isEmpty), 'tunniste'), { 'tyyppi': 'linja' });
    const nopeudet = _.filter(_.flatMap(raiteet, (r) => r.nopeusrajoitukset), (nr) => nr.ratakmvali.ratanumero === km.ratanumero && nr.ratakmvali.alku.ratakm === km.ratakm);
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(trackId, absPos, n)));
    if (!_.isEmpty(speedChanges)) {
        $('track > trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    const electrificationChanges = _.map(elements.erotinjakso, (ej) => electrificationChange.marshall(trackId, absPos, ej));
    if (!_.isEmpty(electrificationChanges)) {
        $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
    }

    return {
        element: $.xml(),
        speeds: _.uniq(_.flatMap(nopeudet, (s) => speeds.marshall(trackId, s))),
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
    const elements = _.uniqBy(_.filter(index.elementit, (e) => railUtils.isRailElement(rail.tunniste, e)), 'tunniste');
    const elementsByType = _.groupBy(elements, 'tyyppi');

    // all track kilometers along this rail
    const allKilometers = _.concat(index.kilometrit, index.extraKilometrit);
    const kilometrit = _.filter(allKilometers, (km) => railUtils.isOverlapping(ratanumero, alku, loppu, km));

    // main track element
    const railId = rail.tunniste;
    const name = `Raide ${ratanumero} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const stub = `<track id="${railId}" name="${name}"><trackTopology/><trackElements/><ocsElements/></track>`;
    const $ = cheerio.load(stub, config.cheerio);

    // track begin/end elements
    const beginAbsPos = positionUtils.getAbsolutePosition(alku);
    const endAbsPos = positionUtils.getAbsolutePosition(loppu);
    const endPos = positionUtils.getPosition(alku, loppu, kilometrit);
    $('trackTopology').append(`<trackBegin id="tb_${railId}" pos="0.0000" absPos="${beginAbsPos}">`);
    $('trackTopology').append(`<trackEnd id="te_${railId}" pos="${endPos}" absPos="${endAbsPos}">`); 
        
    // find the incoming/outgoing elements of rail, typically a switch or buffer stop
    const beginElement = elementUtils.getConnectingElement('begin', alku, elementsByType);
    const beginRef = elementUtils.getReference(railId, 'begin', beginElement);

    const endElement = elementUtils.getConnectingElement('end', loppu, elementsByType);
    const endRef = elementUtils.getReference(railId, 'end', endElement);

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

    // Find graph/topology related elements; each switch is marshalled only once and must be
    // nested under the main tracks. Otherwise, the connection between main and side tracks
    // is not resolvable because switches only refer to side tracks.
    const unmarshalledElements = _.reject(elements, (e) => marshalled.includes(e.tunniste));
    const unmarshalledGroups = _.groupBy(unmarshalledElements, 'tyyppi');

    // find switches to be nested under this track element
    const vaihteet = _.filter(unmarshalledGroups.vaihde, (v) =>
        railUtils.isOnRail(v, ratanumero, alku, loppu) && !railUtils.isReferredSwitch(v, beginRef, endRef));

    const risteykset = _.filter(vaihteet, (e) => e.vaihde && (e.vaihde.tyyppi === "rr" || e.vaihde.tyyppi === "srr"));
    const switches = _.map(vaihteet, (v) => _switch.marshall(ratanumero, alku, kilometrit, v));
    const crossings = _.map(risteykset, (r) => crossing.marshall(ratanumero, alku, kilometrit, r));
    
    $('trackTopology').append('<connections/>');
    if (!_.isEmpty(switches)) {
        $('trackTopology > connections').append(switches);
    }
    if (!_.isEmpty(crossings)) {
        $('trackTopology > connections').append(crossings);
    }

    memo.marshalled = _.concat(memo.marshalled, _.map(vaihteet, 'tunniste'));

    // Find "normal" elements located between rail begin and end. Notice that the first and last
    // kilometers may also contain elements related to previous/next rail, because the rails don't
    // usally begin/end at the mileposts.
    const onRailElements = _.filter(elements, (e) => railUtils.isOnRail(e, ratanumero, alku, loppu));
    const onRailElementGroups = _.groupBy(onRailElements, 'tyyppi');
    const onRailMileposts = _.filter(index.kilometrit, (k) => railUtils.isMilepostOnRail(ratanumero, alku, loppu, k));
    
    // TODO include extra kilometers in above!

    // mileage changes, i.e. absPos corrections due to track kilometers not always being exactly 1000 meters
    // TODO preceeding kilometer has to be included!
    const mileageChanges = _.reject(_.map(onRailMileposts, (k) => mileageChange.marshall(railId, alku, k)), _.isEmpty);
    if (!_.isEmpty(mileageChanges)) {
        $('trackTopology').append('<mileageChanges/>');
        $('trackTopology > mileageChanges').append(mileageChanges);
    }
    
    // ocsElements
    const signals = _.map(onRailElementGroups.opastin, (o) => signal.marshall(ratanumero, alku, kilometrit, o));
    const mileposts = _.map(onRailMileposts, (p) => milepost.marshall(ratanumero, railId, alku, kilometrit, p));
    const signalsAndPosts = _.flatten(_.concat(signals, mileposts));
    if (!_.isEmpty(signals)) {
        $('ocsElements').append(`<signals>${_.join(signalsAndPosts, '')}</signals>`);
    }
    const balises = _.map(onRailElementGroups.baliisi, (b) => balise.marshall(ratanumero, alku, kilometrit, b));
    if (!_.isEmpty(balises)) {
        $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
    }

    // trackElements
    const nopeudet = _.filter(rail.nopeusrajoitukset, (nr) => railUtils.isSpeedChangeOnRail(ratanumero, alku, loppu, nr));
    const speedAttrs = _.uniq(_.flatMap(nopeudet, (n) => speeds.marshall(railId, n)));
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(railId, alku, kilometrit, n)));
    if (!_.isEmpty(speedChanges)) {
        $('trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    // TODO is electrificationChange correct railML term? what is trackCircuitBorder?
    const electrificationChanges = _.map(onRailElementGroups.erotusjakso, (ej) => electrificationChange.marshall(ratanumero, alku, kilometrit, ej));
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

module.exports = {
    fromKilometer, fromRail
};