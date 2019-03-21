const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (trackId, absPos, baliisi) => {
        
        const dir = baliisi.baliisi.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = _.find(baliisi.ratakmsijainnit, { ratanumero: trackId });

        const $ = cheerio.load('<balise/>', config.cheerio);
        $('balise').attr('id', baliisi.tunniste);
        $('balise').attr('name', baliisi.nimi);
        $('balise').attr('pos', sijainti.etaisyys);
        $('balise').attr('absPos', absPos + sijainti.etaisyys);
        $('balise').attr('dir', dir);

        return $.html();        
    }
};
