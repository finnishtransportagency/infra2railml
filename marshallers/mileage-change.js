const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (railId, alku, km) => {

        // TODO return undef if milepost not between rail begin/end

        if (km.pituus === 1000) return undefined;

        const absPos = 1000 + km.ratakm * 1000;
        const absPosIn = km.pituus + km.ratakm * 1000;
        const pos = absPos - ((alku.ratakm * 1000) + alku.etaisyys);
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