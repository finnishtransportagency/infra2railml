const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// https://wiki.railml.org/index.php?title=IS:trackCircuitBorder

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const sijainti = elementUtils.getPosition(trackId, element);
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<trackCircuitBorder/>', config.cheerio);
        $('trackCircuitBorder').attr('id', element.tunniste);
        $('trackCircuitBorder').attr('name', element.nimi);
        $('trackCircuitBorder').attr('pos', pos);
        $('trackCircuitBorder').attr('absPos', absPos);

        return $.xml();        
    }
};
