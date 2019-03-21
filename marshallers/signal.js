const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

const SignalType = {
    MAIN: 'main',
    DISTANT: 'distant',
    REPEATER: 'repeater',
    COMBINED: 'combined',
    SHUNTING: 'shunting'
};

const SIGNAL_TYPES = {
    "es": SignalType.DISTANT,
    "jo": '',
    "jp": '',
    "me": '',
    "pa": SignalType.MAIN,
    "pav": SignalType.MAIN,
    "pa2": SignalType.MAIN,
    "ps": SignalType.COMBINED,
    "psv": SignalType.COMBINED,
    "ps2": SignalType.COMBINED,
    "ps2v": SignalType.COMBINED,
    "ra": '',
    "rd": '',
    "rp": '',
    "sm": '',
    "su": '',
    "to": SignalType.REPEATER,
    "vk": '',
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
    marshall: (trackId, absPos, opastin) => {

        const dir = opastin.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(opastin.ratakmsijainnit, { ratanumero: trackId });
        const type = SIGNAL_TYPES[opastin.opastin.tyyppi];

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', opastin.tunniste);
        $('signal').attr('type', type);
        $('signal').attr('name', opastin.nimi);
        $('signal').attr('pos', sijainti.etaisyys);
        $('signal').attr('absPos', absPos + sijainti.etaisyys);
        $('signal').attr('dir', dir);

        return $.html();        
    }
};
