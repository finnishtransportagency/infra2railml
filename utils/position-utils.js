const _ = require('lodash');

/**
 * Calculates the absPos attribute value for given km+distance position.
 */
function getAbsolutePosition(sijainti) {
    return (sijainti.ratakm * 1000) + sijainti.etaisyys;
}

/**
 * Calculates the precise pos attribute value for given position, relative to
 * specified reference point, e.g. track begin position, and true length of
 * corresponding track kilometers.
 * 
 * The track kilometers may not always be exactly 1000 meters due to historical
 * reasons, e.g. changes in track infrastructure or route, which may affect greatly
 * in the rail element positioning. In railML this is handled by presenting the
 * pos attribute values with actual kilometer lengths taken into account and by
 * nesting mileageChange elements in track elements that span over kilometers
 * with varying lengths.
 * 
 * For example, given with positions in format "milepost + distance in meters",
 * 
 *  M1         M2         M3          M4     (mileposts, i.e. track kilometers)
 *  |  1000    |   925    |   1000    |      (actual length between mileposts)
 * 
 *       A------------------P------B         (position P on rail A-B) 
 *     1+500              3+100  3+500
 * 
 * For P, pos = sum(M1.length, M2.length, M3.length) - A.distance + P.distance
 * 
 * With above values, pos = (1000 + 925 + 1000) - 500 + 100 = 2525,
 * while without correction ((3 * 1000) + 100) - 500 = 2600.
 */
function getPosition(raideAlku, sijainti, kilometrit) {

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
    getAbsolutePosition, getPosition
}