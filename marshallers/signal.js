const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

// railML tSignalType
const SignalType = {
    MAIN: 'main',
    DISTANT: 'distant',
    REPEATER: 'repeater',
    COMBINED: 'combined',
    SHUNTING: 'shunting',
    OTHER: (tyyppi) => `other:${tyyppi}`
};

const SIGNAL_TYPES = {
    "es": SignalType.DISTANT,
    "jo": SignalType.SHUNTING,
    "jp": SignalType.OTHER('jp'), // Junakulkutien päätekohtamerkki
    "me": SignalType.OTHER('me'), // Matkustajalaiturin ennakkomerkki
    "pa": SignalType.MAIN,
    "pav": SignalType.MAIN,
    "pa2": SignalType.MAIN,
    "ps": SignalType.COMBINED,
    "psv": SignalType.COMBINED,
    "ps2": SignalType.COMBINED,
    "ps2v": SignalType.COMBINED,
    "ra": SignalType.SHUNTING,
    "rd": SignalType.MAIN,
    "rp": SignalType.SHUNTING,
    "sm": SignalType.OTHER('sm'), // Seismerkki
    "su": SignalType.MAIN,
    "to": SignalType.REPEATER,
    "vk": SignalType.SHUNTING,
    "ye": SignalType.COMBINED,
    "ys": SignalType.COMBINED,
    "yse": SignalType.COMBINED,
    "ysj": SignalType.COMBINED,
    "ysje": SignalType.COMBINED,
    "ysjv": SignalType.COMBINED,
    "ysv": SignalType.COMBINED,
    "ysve": SignalType.COMBINED,
    "yv": SignalType.COMBINED,
    "y4": SignalType.COMBINED,
};

module.exports = {
    marshall: (trackId, absPos, element) => {

        const dir = element.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(element.ratakmsijainnit, { ratanumero: trackId });
        const type = SIGNAL_TYPES[element.opastin.tyyppi];

        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', element.tunniste);
        $('signal').attr('type', type);
        $('signal').attr('name', element.nimi);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos + pos);
        $('signal').attr('dir', dir);
        $('signal').attr('virtual', 'false');

        // TODO element.opastin.puoli (vas/oik), railML term?
        // TODO aSignal attribute "function" (tSignalFunction: exit|home|blocking|intermediate)

        return $.html();        
    }
};
