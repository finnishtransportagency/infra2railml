const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// railML tSignalType
const SignalType = {
    MAIN: 'main',
    DISTANT: 'distant',
    REPEATER: 'repeater',
    COMBINED: 'combined',
    SHUNTING: 'shunting',
    OTHER: (tyyppi) => `other:${tyyppi}`
};

// tSignalFunction: exit|home|blocking|intermediate
const SignalFunction = {
    EXIT: 'exit',
    HOME: 'home',
    BLOCKING: 'blocking',
    INTERMEDIATE: 'intermediate'
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
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const dir = element.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = elementUtils.getPosition(trackId, element);
        const type = SIGNAL_TYPES[element.opastin.tyyppi];
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        // Notice: home/exit signal typing not provided by the API, end-user should fix all home signals!
        const func = element.liikennepaikka === null ? SignalFunction.BLOCKING : SignalFunction.EXIT;

        // TODO element.opastin.puoli (vasen/oikea): corresponding railML term?

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', element.tunniste);
        $('signal').attr('type', type);
        $('signal').attr('name', element.nimi);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos);
        $('signal').attr('dir', dir);
        $('signal').attr('virtual', 'false');
        $('signal').attr('function', func);

        return $.xml();        
    }
};
