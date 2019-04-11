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

const REF_PREFIX = {
    incoming: 'tec',
    outgoing: 'tbc'
};

module.exports = {
    marshall: (trackId, absPos, element) => {
        
        const { vaihde } = element;

        const type = SWITCH_TYPES[element.vaihde.tyyppi];
        const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });

        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const $ = cheerio.load('<switch/>', config.cheerio);
        $('switch').attr('id', element.tunniste);
        $('switch').attr('name', element.nimi);
        $('switch').attr('type', type);
        $('switch').attr('pos', pos);
        $('switch').attr('absPos', absPos + pos);

        // TODO filter by 'nouseva', find etu-taka, taka-etu. etu-vas/oik, vas/oik-etu etc.

        const nousevat = _.filter(vaihde.raideyhteydet, (y) => y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva');
        const etuTaka = findConnection(nousevat, 'etu', 'taka');
        const takaEtu = findConnection(nousevat, 'taka', 'etu');
        const etuVasen = findConnection(nousevat, 'etu', 'vasen');
        const vasenEtu = findConnection(nousevat, 'vasen', 'etu');
        const etuOikea = findConnection(nousevat, 'etu', 'oikea');
        const oikeaEtu = findConnection(nousevat, 'oikea', 'etu');

        const straight = etuTaka || takaEtu;
        const parting = etuVasen || etuOikea || vasenEtu || oikeaEtu;

        const straightInRef = straight.mistaRooli === 'etu' ? straight.mista : straight.minne;
        const straightInOrientation = straight.mistaRooli === 'etu' ? 'incoming' : 'outgoing';

        const straightOutRef = straight.mistaRooli === 'etu' ? straight.minne : straight.mista;
        const straightOutOrientation = straightInOrientation === 'incoming' ? 'outgoing' : 'incoming';

        const partingRef = parting.mistaRooli === 'etu' ? parting.minne : parting.mista;
        const partingOrientation = straightInOrientation === 'incoming' ? 'outgoing' : 'incoming';
        const partingCourse = parting.mistaRooli === 'oikea' || parting.minneRooli === 'oikea' ? 'right' : 'left';

        const connections = [
            `<connection id="swc1_${element.tunniste}" ref="${REF_PREFIX[straightInOrientation]}_${straightInRef}" course="straight" orientation="${straightInOrientation}" />`,
            `<connection id="swc2_${element.tunniste}" ref="${REF_PREFIX[straightOutOrientation]}_${straightOutRef}" course="straight" orientation="${straightOutOrientation}" />`,
            `<connection id="swc3_${element.tunniste}" ref="${REF_PREFIX[partingOrientation]}_${partingRef}" course="${partingCourse}" orientation="${partingOrientation}" />`
        ];

        $('switch').append(connections);

        return $.xml();
    }
};

function findConnection(yhteydet, mista, minne) {
   return  _.find(yhteydet, (y) => y.mistaRooli === mista && y.minneRooli === minne);
}
