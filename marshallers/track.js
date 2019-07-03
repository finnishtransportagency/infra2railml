const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const trackBegin = require('./track-begin');
const trackEnd = require('./track-end');
const _switch = require('./switch');
const crossing = require('./crossing');
const trackRef = require('./track-ref');
const mileageChange = require('./mileage-change');
const trackElements = require('./track-elements');
const ocsElements = require('./ocs-elements');
const railUtils = require('../utils/rail-utils');
const visualizationUtils = require('../utils/visualization-utils');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// Notice: the order of child elements is significant.
// https://wiki.railml.org/index.php?title=IS:track

/**
 * Rail/track marshaller function.
 */
function marshallTrack(raide, memo) {

    const { index, marshalled } = memo;
    const raideId = raide.tunniste;
    const ratakmvali = _.find(raide.ratakmvalit, { ratanumero: index.trackId }) || _.first(raide.ratakmvalit);
    const { ratanumero, alku, loppu } = ratakmvali;

    console.info(`Generating track ${raideId} (${ratakmvali.ratanumero} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys})`);

    const trackName = `Raide ${ratanumero} ${alku.ratakm}+${alku.etaisyys} - ${loppu.ratakm}+${loppu.etaisyys}`;
    const $ = cheerio.load('<track><trackTopology/></track>', config.cheerio);
    $('track').attr('id', raideId);
    $('track').attr('name', trackName);

    // find all kilometers along the current rail, so we can calculate the distances accurately
    const allKilometers = _.concat(index.kilometrit, index.extraKilometrit);
    const kilometrit = _.filter(allKilometers, (km) => railUtils.isOverlapping(ratanumero, alku, loppu, km));

    // find all elements related to current rail and resolve begin/end elements (regardless of them being marshalled or not)
    const elements = _.uniqBy(_.filter(index.elementit, (e) => railUtils.isRailElement(raideId, e)), 'tunniste');
    const elementsByType = _.groupBy(elements, 'tyyppi');
    $('track > trackTopology').append(trackBegin.marshall(raideId, alku, elementsByType));
    $('track > trackTopology').append(trackEnd.marshall(raideId, alku, loppu, kilometrit, elementsByType));
    
    // mileage changes, i.e. absPos corrections due to track kilometers not always being exactly 1000 meters
    const onRailMileposts = _.filter(kilometrit, (k) => railUtils.isMilepostOnRail(ratanumero, alku, loppu, k));    
    const mileageChanges = _.reject(_.map(onRailMileposts, (k) => mileageChange.marshall(raideId, alku, loppu, kilometrit, k)), _.isEmpty);
    if (!_.isEmpty(mileageChanges)) {
        $('track > trackTopology').append('<mileageChanges/>');
        $('track > trackTopology > mileageChanges').append(mileageChanges);
    }

    // Find topology related elements for marshalling; each switch/crossing is marshalled only once and
    // must be nested under a main track (straight direction). Otherwise the connection between main and
    // side tracks is unresolvable because switches only refer the side tracks (parting direction).
    const unmarshalledElements = _.reject(elements, (e) => marshalled.includes(e.tunniste));
    const unmarshalledGroups = _.groupBy(unmarshalledElements, 'tyyppi');
    const vaihteet = railUtils.getRailSwitches(raideId, ratanumero, alku, loppu, unmarshalledGroups);
    const risteykset = railUtils.getRailCrossings(raideId, ratanumero, alku, loppu, unmarshalledGroups);
    
    const switches = _.map(vaihteet, (v) => _switch.marshall(ratanumero, alku, kilometrit, v));
    const crossings = _.map(risteykset, (r) => crossing.marshall(ratanumero, alku, kilometrit, r));
    const switchesAndCrossings = _.flatten(_.concat(switches, crossings));

    if (!_.isEmpty(switchesAndCrossings)) {
        $('trackTopology').append('<connections/>');
        $('trackTopology > connections').append(switchesAndCrossings);
    }

    memo.marshalled = _.concat(memo.marshalled, _.map(_.concat(vaihteet, risteykset), 'tunniste'));

    // Find "normal" elements located between rail begin and end. Notice that the first and last
    // kilometers may also contain elements related to previous/next rail, because the rails don't
    // usally begin/end at the mileposts. These elements are generally "unique" and appear only once
    // as children of a certain rail, thus no need to keep track on marshalling.
    const onRailElements = _.filter(elements, (e) => railUtils.isOnRail(e, ratanumero, alku, loppu));
    const onRailElementGroups = _.groupBy(onRailElements, 'tyyppi');
    
    $('track').append(trackElements.marshall(raide, ratanumero, alku, loppu, onRailElementGroups, kilometrit, index.kaltevuudet));
    $('track').append(ocsElements.marshall(raide, ratanumero, alku, loppu, onRailElementGroups, kilometrit));

    // Keep track of all the elements that should be visualized in RailML
    // Only add elements that are marshalled
    // TODO: This will probably still need work to get the right elements included
    const typesToVisualize = ['vaihde', 'baliisi', 'opastin', 'raideeristys', 'akselinlaskija', 'erotusjakso', 'puskin'];
    const elementsToVisualize = _.filter(onRailElements, (e) => typesToVisualize.includes(e.tyyppi));

    /*
    let elementsToBeVisualized = [];

    // From track.js
    //_.each(onRailMileposts, (e) => elementsToBeVisualized.push(e));
    _.each(vaihteet, (e) => elementsToBeVisualized.push(e));
    _.each(risteykset, (e) => elementsToBeVisualized.push(e));

    // From track-element.js
    //const speedChanges = railUtils.getSpeedLimits(raide, ratanumero, alku, loppu);
    //_.each(speedChanges, (e) => elementsToBeVisualized.push(e));
    _.each(onRailElementGroups.erotusjakso, (e) => elementsToBeVisualized.push(e));

    // From ocs-elements.js
    _.each(onRailElementGroups.opastin, (e) => elementsToBeVisualized.push(e));
    //_.each(onRailMileposts, (e) => elementsToBeVisualized.push(e));
    _.each(onRailElementGroups.akselinlaskija, (e) => elementsToBeVisualized.push(e));
    _.each(onRailElementGroups.raideeristys, (e) => elementsToBeVisualized.push(e));
    _.each(onRailElementGroups.baliisi, (e) => elementsToBeVisualized.push(e));

    // From track-end.js
    const loppuElementti = elementUtils.getConnectingElement(loppu, elementsByType);
    if(loppuElementti)
        elementsToBeVisualized.push(loppuElementti);

    // From track-begin.js
    const alkuElementti = elementUtils.getConnectingElement(alku, elementsByType);
    if(alkuElementti)
        elementsToBeVisualized.push(alkuElementti);

    const relativeStartPosition = positionUtils.getAbsolutePosition(alku);
    const relativeEndPosition = positionUtils.getAbsolutePosition(loppu);
    const trackLength = (relativeEndPosition- relativeStartPosition);
    const trackCoordinates = visualizationUtils.getElementCoordinates(raide);

    _.forEach(onRailMileposts, (milepost) => {
        elementsToBeVisualized.push(milepost.kilometrimerkki);
        milepost.kilometrimerkki.tyyppi = "milepost";
        milepost.kilometrimerkki.etaisyys = milepost.kilometrimerkki.pituus;

    });
    */
    const trackData = visualizationUtils.getTracksVisualizationData(ratanumero, raide, elementsToVisualize);
    memo.visualElements.push(trackData);

    return {
        element: $.xml(),
        trackRef: trackRef.marshall(raide)
    };
}

/**
 * Single rail to track transformer function.
 */
function marshall(acc, rail) {
    
    const track = marshallTrack(rail, acc);
    acc.tracks = _.concat(acc.tracks, track.element);
    acc.trackRefs = _.concat(acc.trackRefs, track.trackRef);

    return acc;
}

module.exports = {
    marshall
};