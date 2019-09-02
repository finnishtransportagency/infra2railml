/*
 * Copyright 2019 FINNISH TRANSPORT INFRASTRUCTURE AGENCY
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission – subsequent versions of the EUPL (the "License");
 * You may not use this work except in compliance with the License.
 * 
 * You may obtain a copy of the License at:
 * https://joinup.ec.europa.eu/software/page/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
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
 * ```
 *  M1         M2         M3          M4     (mileposts, i.e. track kilometers)
 *  |  1000    |   925    |   1000    |      (actual length between mileposts)
 * 
 *       A-----------------P----B            (position P on rail A-B) 
 *     1+500             3+100 3+500
 * ```
 * For P, pos = sum(M1.length, M2.length) - A.distance + P.distance
 * 
 * With above values, pos = (1000 + 925) - 500 + 100 = 1525 meters,
 * while without correction (1000 + 1000) - 500 + 100 = 1600 meters.
 */
function getPosition(raideAlku, sijainti, kilometrit) {

    // rail begin and position within the same kilometer
    if (raideAlku.ratakm === sijainti.ratakm) {
        return sijainti.etaisyys - raideAlku.etaisyys;
    }

    // calculate the actual length of leading kilometers
    const kms = _.filter(kilometrit, (km) =>
        km.ratakm >= raideAlku.ratakm && km.ratakm < sijainti.ratakm);
    
    const length = _.sumBy(kms, 'pituus');
    
    const result = length - raideAlku.etaisyys + sijainti.etaisyys;

    if (result < 0) {
        console.error("Error: pos < 0", raideAlku, sijainti);
    }

    return result;
}

module.exports = {
    getAbsolutePosition, getPosition
}