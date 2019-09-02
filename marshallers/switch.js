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
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// railML tSwitchType
const SwitchType = {
    ORDINARY: 'ordinarySwitch',
    INSIDE_CURVED_SWITCH: 'insideCurvedSwitch',
    OUTSIDE_CURVED_SWITCH: 'outsideCurvedSwitch',
    THREE_WAY_SWITCH: 'threeWaySwitch',
    OTHER: (tyyppi) => `other:${tyyppi}`
};

const SWITCH_TYPES = {
    "yvo" : SwitchType.ORDINARY,
    "yvv" : SwitchType.ORDINARY,
    "rr" : SwitchType.OTHER('rr'), // raideristeys/diamond crossing (railML tCrossing)
    "yrv" : SwitchType.ORDINARY,
    "krv" : SwitchType.ORDINARY,
    "tyv" : SwitchType.ORDINARY,
    "kvo" : SwitchType.THREE_WAY_SWITCH,
    "kvv" : SwitchType.THREE_WAY_SWITCH,
    "srr" : SwitchType.OTHER('srr'), // sovitettu raideristeys (railML tCrossing)
    "ukvv" : SwitchType.OUTSIDE_CURVED_SWITCH,
    "ukvo" : SwitchType.OUTSIDE_CURVED_SWITCH,
    "skvv" : SwitchType.INSIDE_CURVED_SWITCH,
    "skvo" : SwitchType.INSIDE_CURVED_SWITCH,    
};

// id prefixes for rail begin/end connections
const REF_PREFIX = {
    incoming: 'tec',
    outgoing: 'tbc'
};

// Left/right logic according to orientation, mirrored when "incoming" due
// to always using the upward directiong when determining the connections.
const COURSE = {
    outgoing: { right: 'right', left: 'left' },
    incoming: { right: 'left', left: 'right' }
};

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const type = SWITCH_TYPES[element.vaihde.tyyppi];
        const sijainti = elementUtils.getPosition(trackId, element);

        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);
        const connections = getConnections(element);

        if (_.isEmpty(connections)) {
            return undefined;
        }

        const $ = cheerio.load('<switch/>', config.cheerio);
        $('switch').attr('id', element.tunniste);
        $('switch').attr('name', element.nimi);
        $('switch').attr('description', element.nimi);
        $('switch').attr('type', type);
        $('switch').attr('pos', pos);
        $('switch').attr('absPos', absPos);
        $('switch').attr('ocpStationRef', element.liikennepaikka);
        $('switch').append(connections);

        return $.xml();
    }
};

/**
 * Resolves and renders the switch connection elements.
 */
function getConnections(element) {

    const { vaihde } = element;

    const nousevat = _.filter(vaihde.raideyhteydet, (y) => y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva');
    if (_.isEmpty(nousevat)) {
        console.error(`Error: switch ${element.tunniste} has no connections.`);
        return [];
    }

    const etuVasen = findConnection(nousevat, 'etu', 'vasen');
    const vasenEtu = findConnection(nousevat, 'vasen', 'etu');
    const etuOikea = findConnection(nousevat, 'etu', 'oikea');
    const oikeaEtu = findConnection(nousevat, 'oikea', 'etu');
    const parting = etuVasen || etuOikea || vasenEtu || oikeaEtu;

    if (_.isEmpty(parting)) {
        console.error(`Error: switch ${element.tunniste} has unexpected or missing connections.`);
        return [];
    }

    const ref = parting.mistaRooli === 'etu' ? parting.minne : parting.mista;
    const side = parting.mistaRooli === 'oikea' || parting.minneRooli === 'oikea' ? 'right' : 'left';
    const orientation = parting.mistaRooli === 'etu' ? 'outgoing' : 'incoming';
    const course = COURSE[orientation][side];

    // Max. 3 connections, single connection style following the OpenTrack generated models
    // where only the parting direction track is referred by the switch and straight direction
    // tracks reference each others directly.
    return [
        `<connection id="swc_${element.tunniste}" ref="${REF_PREFIX[orientation]}_${ref}" course="${course}" orientation="${orientation}" />`
    ];
}

function findConnection(yhteydet, mista, minne) {
   return  _.find(yhteydet, (y) => y.mistaRooli === mista && y.minneRooli === minne);
}
