const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

// railML tSwitchType
const SwitchType = {
    ORDINARY: 'ordinary',
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

module.exports = {
    marshall: (trackId, absPos, element) => {
        
        const { vaihde } = element;

        const type = SWITCH_TYPES[element.vaihde.tyyppi];
        const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });

        const $ = cheerio.load('<switch/>', config.cheerio);
        $('switch').attr('id', element.tunniste);
        $('switch').attr('name', element.nimi);
        $('switch').attr('type', type);
        $('switch').attr('pos', sijainti.etaisyys);
        $('switch').attr('absPos', absPos + sijainti.etaisyys);

        const straight = _.find(vaihde.raideyhteydet, (y) => y.mistaRooli === 'etu' && y.minneRooli === 'taka');
        const parting = _.find(vaihde.raideyhteydet, (y) => y.mistaRooli === 'etu' && (y.minneRooli === 'vasen' || y.minneRooli === 'oikea'));
        const partingCourse = parting.minneRooli === 'oikea' ? 'right' : 'left';

        const ao = straight.minneSuunta === 'nouseva' ? 'incoming' : 'outgoing';
        const bo = ao === 'incoming' ? 'outgoing' : 'incoming';
        const co = parting.minneSuunta === 'nouseva' ? 'incoming' : 'outgoing';

        const prefixes = { incoming: 'tec', outgoing: 'tbc'};

        const connections = [
            `<connection id="swc_${element.tunniste}_a" ref="${prefixes[ao]}_${straight.mista}" course="straight" orientation="${ao}" />`,
            `<connection id="swc_${element.tunniste}_b" ref="${prefixes[bo]}_${straight.minne}" course="straight" orientation="${bo}" />`,
            `<connection id="swc_${element.tunniste}_c" ref="${prefixes[co]}_${parting.minne}" course="${partingCourse}" orientation="${co}" />`
        ];


        $('switch').append(connections);

        return $.html();
    }
};
