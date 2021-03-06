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
 * Returns the element position object, primarily by given track number. If
 * no position matches the specified track, first found position is returned.
 */
function getPosition(ratanumero, element) {
    return _.find(element.ratakmsijainnit, { ratanumero }) || _.first(element.ratakmsijainnit);
}

/**
 * Resolve the track begin/end element by given position, e.g. switch or buffer stop.
 */
function getConnectingElement(position, elements) {

    const criteria = { ratakm: position.ratakm, etaisyys: position.etaisyys };
    const vaihde = _.find(elements.vaihde, (v) => !!_.find(v.ratakmsijainnit, criteria));
    const puskin = _.find(elements.puskin, (p) => !!_.find(p.ratakmsijainnit, criteria));
    const element = vaihde || puskin;

    return element;
}

/**
 * Resolve reference from track begin or end connection to another track or switch connection.
 * The connections determined here are to follow OpenTrack generated models where only the
 * parting switch direction is referenced by tracks and the straight direction references
 * are from track end to track beginning.
 */
function getReference(railId, type, element) {

    if (!element || !element.vaihde) return '';

    const nousevat = _.filter(element.vaihde.raideyhteydet, (y) =>
        y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva' && (y.mista === railId || y.minne === railId)
    );

    // find all switch connections
    const etuTaka = _.find(nousevat, (y) => y.mistaRooli === 'etu' && y.minneRooli === 'taka');
    const takaEtu = _.find(nousevat, (y) => y.mistaRooli === 'taka' && y.minneRooli === 'etu');
    const etuVasen = _.find(nousevat, (y) => y.mistaRooli === 'etu' && y.minneRooli === 'vasen');
    const vasenEtu = _.find(nousevat, (y) => y.mistaRooli === 'vasen' && y.minneRooli === 'etu');
    const etuOikea = _.find(nousevat, (y) => y.mistaRooli === 'etu' && y.minneRooli === 'oikea');
    const oikeaEtu = _.find(nousevat, (y) => y.mistaRooli === 'oikea' && y.minneRooli === 'etu');

    // ..or is it a crossing? find connections for the referenced track/direction
    // Here be dragons, the crossings from API don't seem to provide the required connections?
    const bc = _.find(nousevat, (y) => y.mistaRooli === 'b' && y.minneRooli === 'c');
    const cb = _.find(nousevat, (y) => y.mistaRooli === 'c' && y.minneRooli === 'b');

    // for switches straight is primary, left/right for side-tracks. BC/CB for non-continuous line of crossings.
    const yhteys = etuTaka || takaEtu || etuVasen || vasenEtu || etuOikea || oikeaEtu || bc || cb;

    if (!yhteys) {
        console.error(`Error: failed to resolve connections of switch ${element.tunniste}`);
        return '';
    }

    if (yhteys.mista === yhteys.minne) {
        
        // The switch is located somewhere between rail ends, no reference.
        return '';

    } else if (yhteys.mistaRooli === 'vasen' || yhteys.mistaRooli === 'oikea') {
        
        // incoming from parting direction
        return `swc_${element.tunniste}`;

    } else if (yhteys.minneRooli === 'vasen' || yhteys.minneRooli === 'oikea') {
        
        // outgoing parting direction
        return `swc_${element.tunniste}`;

    } else if (yhteys.mista === railId && (yhteys.mistaRooli === 'b' || yhteys.mistaRooli === 'c')) {

        // incoming connection to crossing
        return `crci_${element.tunniste}`;

    } else if (yhteys.minne === railId && (yhteys.minneRooli === 'b' || yhteys.minneRooli === 'c')) {

        // outgoing connection from crossing
        return `crco_${element.tunniste}`

    } else if (yhteys.mista === railId) {
        
        // straight, incoming track referencing the next track's begin connection
        return `tbc_${yhteys.minne}`;
    
    } else if (yhteys.minne === railId) {
        
        // straight, outgoing track referencing the previous track's end connection
        return `tec_${yhteys.mista}`;
    }

    console.error(`Error: failed to determine ${type} connection ref for track ${railId}!`);

    return '';
}

module.exports = {
    getPosition, getConnectingElement, getReference
}
