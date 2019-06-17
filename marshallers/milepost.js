const cheerio = require('cheerio');
const config = require('../config');
const positionUtils = require('../utils/position-utils');

// Milepost is a special kind of signal
module.exports = {
    marshall: (trackId, railId, alku, kilometrit, kilometri) => {

        const id = `${railId}_${trackId}km${kilometri.ratakm}`;
        
        const { ratanumero, ratakm } = kilometri;
        const sijainti = { ratanumero, ratakm, etaisyys: 0 };
        const name = `Rata ${trackId} km ${kilometri.ratakm}`;
        const pos = positionUtils.getPosition(alku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', id);
        $('signal').attr('type', 'other:kmpaalu');
        $('signal').attr('name', name);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos);
        $('signal').attr('dir', 'up');
        $('signal').attr('virtual', 'true');
        $('signal').append(`<milepost shownValue="${kilometri.ratakm}" switchable="false" />`)

        // TODO should have reference to mileageChange?

        return $.xml();        
    }
};
