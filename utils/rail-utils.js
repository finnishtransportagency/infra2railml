const _ = require('lodash');
const elementUtils = require('./element-utils');

// elementti.vaihde.tyyppi values for crossings in the API
// rr = raideristeys, srr = sovitettu raideristeys
const CROSSING_TYPES = ['rr', 'srr'];

/**
 * Tells if the given element is anyhow related to specified rail,
 * regardless of it's track number, position etc.
 */
function isRailElement(railId, element) {
    return _.map(element.raiteet, 'tunniste').includes(railId);
}

/**
 * Ensures the given element is somewhere between rail begin and
 * end positions, thus "on rail".
 */
function isOnRail(element, ratanumero, raideAlku, raideLoppu) {
    const sijainti = elementUtils.getPosition(ratanumero, element);
    return isBetween(raideAlku, raideLoppu, sijainti);
}

/**
 * Tells if the given given track kilometer overlaps with specified track range.
 */
function isOverlapping(ratanumero, alku, loppu, km) {    
    return km.ratanumero === ratanumero &&
        km.ratakm >= alku.ratakm && km.ratakm <= loppu.ratakm;
}

/**
 * Tells if given position (km+distance) is within given begin and
 * end positions range.
 */
function isBetween(alku, loppu, sijainti) {
    return !_.isEmpty(alku) && !_.isEmpty(loppu) && !_.isEmpty(sijainti) &&
        ((sijainti.ratakm > alku.ratakm && sijainti.ratakm < loppu.ratakm) ||
        (sijainti.ratakm === alku.ratakm && sijainti.etaisyys >= alku.etaisyys) ||
        (sijainti.ratakm === loppu.ratakm && sijainti.etaisyys <= loppu.etaisyys));
}

/**
 * Tells if the given speed change is between rail begin and end points.
 */
function isSpeedChangeOnRail(raideRataNr, raideAlku, raideLoppu, nopeudet) {
    const { ratanumero, alku } = nopeudet.ratakmvali;
    return ratanumero === raideRataNr && isBetween(raideAlku, raideLoppu, alku);
}


/**
 * Tells if the beginning of given kilometer is within specified track range.
 */
function isMilepostOnRail(ratanumero, alku, loppu, km) {
    return isOverlapping(ratanumero, alku, loppu, km) && km.ratakm > alku.ratakm;
}

/**
 * Tells if the given switch is referred by the track begin or end.
 */
function isReferredSwitch(vaihde, beginRef, endRef) {
    const possibleRefs = [
        `swc_${vaihde.tunniste}`,
        `crci_${vaihde.tunniste}`,
        `crco_${vaihde.tunniste}`
    ];
    return possibleRefs.includes(beginRef) || possibleRefs.includes(endRef);
}

/**
 * Returns the rail speed limits.
 */
function getSpeedLimits(raide, ratanumero, alku, loppu) {
    return _.filter(raide.nopeusrajoitukset, (nr) => isSpeedChangeOnRail(ratanumero, alku, loppu, nr));
}

/**
 * Returns all switches and crossings to be nested under given track.
 */
function findRailSwitches(raideId, ratanumero, alku, loppu, elementit) {

    const beginElement = elementUtils.getConnectingElement(alku, elementit);
    const beginRef = elementUtils.getReference(raideId, 'begin', beginElement);

    const endElement = elementUtils.getConnectingElement(loppu, elementit);
    const endRef = elementUtils.getReference(raideId, 'end', endElement);

    return _.filter(elementit.vaihde, (v) =>
        isOnRail(v, ratanumero, alku, loppu) && !isReferredSwitch(v, beginRef, endRef));
};

/**
 * Returns the switches to be nested under given track.
 */
function getRailSwitches(raideId, ratanumero, alku, loppu, elementit) {
    const vaihteet = findRailSwitches(raideId, ratanumero, alku, loppu, elementit);
    return _.filter(vaihteet, (v) => !CROSSING_TYPES.includes(v.vaihde.tyyppi));
}

/**
 * Returns the crossings to be nested under given track.
 */
function getRailCrossings(raideId, ratanumero, alku, loppu, elementit) {
    const vaihteet = findRailSwitches(raideId, ratanumero, alku, loppu, elementit);
    return _.filter(vaihteet, (v) => CROSSING_TYPES.includes(v.vaihde.tyyppi));
}

module.exports = {
   isRailElement,
   isOnRail,
   isOverlapping,
   isSpeedChangeOnRail,
   isMilepostOnRail,
   isReferredSwitch,
   getSpeedLimits,
   getRailSwitches,
   getRailCrossings
};
