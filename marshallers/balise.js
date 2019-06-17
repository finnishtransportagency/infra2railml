const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const dir = element.baliisi.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = elementUtils.getPosition(trackId, element);
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<balise/>', config.cheerio);
        $('balise').attr('id', element.tunniste);
        $('balise').attr('name', element.nimi);
        $('balise').attr('pos', pos);
        $('balise').attr('absPos', absPos);
        $('balise').attr('dir', dir);

        return $.xml();        
    }
};
