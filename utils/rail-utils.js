const _ = require('lodash');
const elementUtils = require('./element-utils');

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
    const switchRef = `swc_${vaihde.tunniste}`;
    return beginRef === switchRef || endRef === switchRef;
}

/**
 * The track kilometers may not always be exactly 1000 meters due to historical
 * reasons, e.g. changes in track infra or route, which may affect greatly in the
 * rail element positioning.
 * 
 * In railML this is handled by calculating the pos attribute values with actual
 * kilometer lengths taken into account and by nesting mileageChange elements in
 * track elements that span over kilometers with varying lengths.
 * 
 * This function calculates the precise pos attribute value, based on specified
 * rail begin position, position on rail and true length of corresponding track
 * kilometers. For example, given with positions in format "milepost + distance
 * in meters",
 * 
 *  M1         M2         M3          M4     (mileposts, i.e. track kilometers)
 *  |  1000    |   925    |   1000    |      (actual length between mileposts)
 * 
 *       A------------------P------B         (position P on rail A-B) 
 *     1+500              3+100  3+500
 * 
 * For P, pos = sum(M1.length, M2.length, M3.length) - A.distance + P.distance
 * 
 * With above values,
 * 
 * (1000 + 925 + 1000) - 500 + 100 = 2525 m
 * 
 * While without correction,
 *  
 * ((3 * 1000) + 100) - 500 = 2600 m
 */
function getPrecisePos(raideAlku, sijainti, kilometrit) {

    // rail begin and position within the same kilometer
    if (raideAlku.ratakm === sijainti.ratakm) {
        return sijainti.etaisyys - raideAlku.etaisyys;
    }

    // calculate the actual length of leading kilometers
    const kms = _.filter(kilometrit, (km) => km.ratakm < sijainti.ratakm);
    const length = _.sumBy(kms, 'pituus');
    
    return length - raideAlku.etaisyys + sijainti.etaisyys;
}

module.exports = {
   isRailElement, isOnRail, isSpeedChangeOnRail, isMilepostOnRail, isReferredSwitch, getPos: getPrecisePos, isOverlapping
};
