const _ = require('lodash');
const positionUtils = require('./position-utils');

/**
 * Resolves the slope for given position from the specified slope change
 * points. The returned point may be exact match on position or an assumption
 * based on the nearest known change point. If unable to resolve the point,
 * assumes a flat track.
 * 
 * TODO is matching by position accurate enough?
 */
function getSlope(sijainti, suunta, kaltevuudet) {

    const suuntaan = _.filter(kaltevuudet, { suunta });

    // exact position match
    const onPosition = _.find(suuntaan, (s) => {
        return s.sijainti.ratanumero === sijainti.ratanumero &&
               s.sijainti.ratakm === sijainti.ratakm &&
               s.sijainti.etaisyys === sijainti.etaisyys;
    });

    if (!_.isEmpty(onPosition)) {
        return onPosition;
    }

    const preceding = _.last(_.takeWhile(suuntaan, (slope) =>
        slope.sijainti.ratakm < sijainti.ratakm ||
        (slope.sijainti.ratakm === sijainti.ratakm && slope.sijainti.etaisyys < sijainti.etaisyys)
    ));

    // no exact match, assume preceding value or zero
    // TODO how to determine the slope before model beginning?
    const kaltevuus = _.isEmpty(preceding) ? 0.0 : preceding.kaltevuus;

    return { sijainti, suunta, kaltevuus };
}

/**
 * Converts the given elevation points to track slope values.
 */
function toSlopes(korkeuspisteet, kilometrit) {
    return _.transform(korkeuspisteet, (res, korkeudet, ratanumero) => {
        const sorted = _.sortBy(korkeudet, (k) => positionUtils.getAbsolutePosition(k.sijainti));
        res[ratanumero] = slopes(sorted, kilometrit, []);
        return res;
    }, {});
}

/**
 * Recursive calculation of the slopes between given elevation points.
 */
function slopes(korkeuspisteet, kilometrit, kaltevuudet) {

    if (_.isEmpty(_.tail(korkeuspisteet))) {
        // end of array reached
        return kaltevuudet;
    }

    const head = _.head(korkeuspisteet);
    const tail = _.tail(korkeuspisteet);
    const next = _.first(tail);

    const x = positionUtils.getPosition(head.sijainti, next.sijainti, kilometrit);
    const y = next.korkeus - head.korkeus;
    
    // Zero values mean "no change", thus no need for gradientChange element at this point.
    // The x below zero might happen if we're missing kilometers due to 404 from API.
    if (x <= 0 || y == 0) {
        return slopes(tail, kilometrit, kaltevuudet);
    }

    const slopePerMille = Math.tan(y/x) * 1000;

    // round to three decimals and switch sign for opposite direction
    const slopeUp = Math.round(slopePerMille * 1000) / 1000;
    const slopeDown = -1.0 * slopeUp;

    kaltevuudet.push({ sijainti: head.sijainti, suunta: 'nouseva', kaltevuus: slopeUp });
    kaltevuudet.push({ sijainti: next.sijainti, suunta: 'laskeva', kaltevuus: slopeDown });        
        
    return slopes(tail, kilometrit, kaltevuudet);
}

module.exports = {
    getSlope, toSlopes
}

