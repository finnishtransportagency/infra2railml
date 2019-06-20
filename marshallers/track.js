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
const trainDetector = require('./train-detector');
const trackCircuitBorder = require('./track-circuit-border');
const platformEdge = require('./platform-edge');
const stopPost = require('./stop-post');
const elementUtils = require('../utils/element-utils');
const railUtils = require('../utils/rail-utils');
const positionUtils = require('../utils/position-utils');

/**
 * Rail/track marshaller function.
 */
function marshallTrack(rail, memo) {

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
    const onRailMileposts = _.filter(kilometrit, (k) => railUtils.isMilepostOnRail(ratanumero, alku, loppu, k));
    
    // mileage changes, i.e. absPos corrections due to track kilometers not always being exactly 1000 meters
    // TODO preceeding kilometer has to be included!
    const mileageChanges = _.reject(_.map(onRailMileposts, (k) => mileageChange.marshall(railId, alku, kilometrit, k)), _.isEmpty);
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

    $('ocsElements').append('<trainDetectionElements/>');

    const trainDetectors = _.map(onRailElementGroups.akselinlaskija, (al) => trainDetector.marshall(ratanumero, alku, kilometrit, al));
    $('ocsElements > trainDetectionElements').append(trainDetectors);

    const trackCircuitBorders = _.map(onRailElementGroups.raideeristys, (re) => trackCircuitBorder.marshall(ratanumero, alku, kilometrit, re));
    $('ocsElements > trainDetectionElements').append(trackCircuitBorders);

    const stops = stopPost.marshall(railId, alku, kilometrit, rail.liikennepaikanRaide);
    if (!_.isEmpty(stops)) { 
        $('ocsElements').append(`<stopPosts>${_.join(stops, '')}</stopPosts>`);
    }

    // trackElements
    const nopeudet = _.filter(rail.nopeusrajoitukset, (nr) => railUtils.isSpeedChangeOnRail(ratanumero, alku, loppu, nr));
    const speedAttrs = _.uniq(_.flatMap(nopeudet, (n) => speeds.marshall(railId, n)));
    const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(railId, alku, kilometrit, n)));
    if (!_.isEmpty(speedChanges)) {
        $('trackElements').append(`<speedChanges>${_.join(speedChanges, '')}</speedChanges>`);
    }

    // TODO is electrificationChange correct railML term?
    const electrificationChanges = _.map(onRailElementGroups.erotusjakso, (ej) => electrificationChange.marshall(ratanumero, alku, kilometrit, ej));
    if (!_.isEmpty(electrificationChanges)) {
        $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
    }

    const platform = platformEdge.marshall(railId, alku, kilometrit, rail.liikennepaikanRaide);
    if (!_.isEmpty(platform)) {
        $('trackElements').append(`<platformEdges>${platform}</platformEdges>`);
    }

    return {
        element: $.xml(),
        speeds: speedAttrs,
        trackRef: trackRef.marshall(rail), // TODO group by track/line number
        length: endPos
    };
}

/**
 * Rail/track transformer function.
 */
function marshall(acc, rail) {
    
    const track = marshallTrack(rail, acc);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.speeds = _.concat(acc.speeds, track.speeds);
    acc.trackRefs = _.concat(acc.trackRefs, track.trackRef);

    return acc;
}

module.exports = {
    marshall
};