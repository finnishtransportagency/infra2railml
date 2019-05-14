const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

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

module.exports = {
    marshall: (trackId, absPos, element) => {
        
        const type = SWITCH_TYPES[element.vaihde.tyyppi];
        const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId }) || _.first(element.ratakmsijainnit);
        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const connections = getConnections(element);
        if (_.isEmpty(connections)) {
            return '';
        }

        const $ = cheerio.load('<switch/>', config.cheerio);
        $('switch').attr('id', element.tunniste);
        $('switch').attr('name', element.nimi);
        $('switch').attr('description', element.nimi);
        $('switch').attr('type', type);
        $('switch').attr('pos', pos);
        $('switch').attr('absPos', absPos + pos);
        $('switch').append(connections);

        return $.xml();
    }
};

function getConnections(element) {

    const { vaihde } = element;

    const nousevat = _.filter(vaihde.raideyhteydet, (y) => y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva');
    if (nousevat.length === 0) {
        console.error(`ERROR: switch ${element.tunniste} has no connections!`);
        return [];
    }

    const etuVasen = findConnection(nousevat, 'etu', 'vasen');
    const vasenEtu = findConnection(nousevat, 'vasen', 'etu');
    const etuOikea = findConnection(nousevat, 'etu', 'oikea');
    const oikeaEtu = findConnection(nousevat, 'oikea', 'etu');
    const parting = etuVasen || etuOikea || vasenEtu || oikeaEtu;

    if (_.isEmpty(parting)) {
        console.error(`ERROR: unable to resolve connections on switch ${element.tunniste}`);
        return [];
    }

    const ref = parting.mistaRooli === 'etu' ? parting.minne : parting.mista;
    const course = parting.mistaRooli === 'oikea' || parting.minneRooli === 'oikea' ? 'right' : 'left';
    const orientation = parting.mistaRooli === 'etu' ? 'outgoing' : 'incoming';    

    // Max. 3 connections, single connection style following the OpenTrack generated models
    // where only the parting direction is referenced by side tracks and straight direction
    // tracks reference each others directly.
    return [
        `<connection id="swc_${element.tunniste}" ref="${REF_PREFIX[orientation]}_${ref}" course="${course}" orientation="${orientation}" />`
    ];
}

function findConnection(yhteydet, mista, minne) {
   return  _.find(yhteydet, (y) => y.mistaRooli === mista && y.minneRooli === minne);
}
