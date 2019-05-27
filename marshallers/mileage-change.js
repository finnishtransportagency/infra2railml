const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (railId, alku, km) => {

        if (km.pituus === 1000) return undefined;

        // TODO fix math!

        const absPos = km.ratakm * 1000;
        const pos = absPos - ((alku.ratakm * 1000) + alku.etaisyys);
        const absPosIn = absPos + km.pituus;
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