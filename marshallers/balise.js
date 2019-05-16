const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');

module.exports = {
    marshall: (trackId, absPos, element) => {
        
        const dir = element.baliisi.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = elementUtils.getPosition(trackId, element);

        const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

        const $ = cheerio.load('<balise/>', config.cheerio);
        $('balise').attr('id', element.tunniste);
        $('balise').attr('name', element.nimi);
        $('balise').attr('pos', pos);
        $('balise').attr('absPos', absPos + pos);
        $('balise').attr('dir', dir);

        return $.xml();        
    }
};
