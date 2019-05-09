const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

// Milepost is a special kind of signal
module.exports = {
    marshall: (trackId, railId, alku, kilometri) => {

        const id = `${railId}_${trackId}km${kilometri.ratakm}`;
        const absPos = kilometri.ratakm * 1000;
        const pos = absPos - ((alku.ratakm * 1000) + alku.etaisyys);
        const name = `Rata ${trackId} km ${kilometri.ratakm}`;

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', id);
        $('signal').attr('type', 'main');
        $('signal').attr('name', name);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos);
        $('signal').attr('dir', 'up');
        $('signal').attr('virtual', 'false');
        $('signal').append(`<milepost shownValue="${kilometri.ratakm}" switchable="false" />`)

        return $.xml();        
    }
};
