const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (railId, raideAlku, kilometrit, km) => {

        // TODO return undef if milepost not between rail begin/end

        if (km.pituus === 1000) return undefined;

        const sijainti = { ratakm: km.ratakm, etaisyys: km.pituus };
        const alkuAbsPos = positionUtils.getAbsolutePosition(raideAlku);
        
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = 1000 + km.ratakm * 1000;
        const absPosIn = alkuAbsPos + pos;

        const type = km.pituus > 1000 ? 'overlapping' : 'missing';
        const id = `mc_${railId}_${pos}`;

        const $ = cheerio.load('<mileageChange/>', config.cheerio);
        $('mileageChange').attr('id', id);
        $('mileageChange').attr('pos', pos);
        $('mileageChange').attr('absPosIn', absPosIn);
        $('mileageChange').attr('absPos', absPos);
        $('mileageChange').attr('absDir', 'raising');
        $('mileageChange').attr('type', type);

        return $.xml();        
    }
};