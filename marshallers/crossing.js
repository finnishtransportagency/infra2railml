const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');

const CrossingType = {
    SIMPLE: 'simpleCrossing',
    SIMPLE_SWITCH: 'simpleSwitchCrossing',
    DOUBLE_SWITCH: 'doubleSwitchCrossing'
};

const CROSSING_TYPES = {
    rr: CrossingType.SIMPLE,
    srr: CrossingType.SIMPLE_SWITCH
};

module.exports = {
    marshall: (trackId, absPos, element) => {

        const type = CROSSING_TYPES[element.vaihde.tyyppi];
        const sijainti = elementUtils.getPosition(trackId, element);
        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const $ = cheerio.load('<crossing/>', config.cheerio);
        $('crossing').attr('id', element.tunniste);
        $('crossing').attr('name', element.nimi);
        $('crossing').attr('type', type);
        $('crossing').attr('pos', pos);
        $('crossing').attr('absPos', absPos + pos);

        return $.xml();
    }
};
