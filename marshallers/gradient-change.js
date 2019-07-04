const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const gradientUtils = require('../utils/gradient-utils');
const positionUtils = require('../utils/position-utils');


// https://wiki.railml.org/index.php?title=IS:gradientChange

module.exports = {
    marshall: (raideId, raideAlku, korkeuspisteet, kaltevuudet, kilometrit) => {
        
        const begin = [
            getGradienChange(raideId, raideAlku, 'laskeva', raideAlku, kaltevuudet, kilometrit),
            getGradienChange(raideId, raideAlku, 'nouseva', raideAlku, kaltevuudet, kilometrit)
        ];
        
        const changes = _.flatMap(korkeuspisteet, (k) => [
            getGradienChange(raideId, raideAlku, 'laskeva', k.sijainti, kaltevuudet, kilometrit),
            getGradienChange(raideId, raideAlku, 'nouseva', k.sijainti, kaltevuudet, kilometrit)
        ]);
        
        return _.reject(_.concat(begin, changes), _.isEmpty);
    }
};

/**
 * Marshall gradientChange for the given position. Position may be
 * arbitrary, e.g. track begin, or exact corresponding to korkeuspiste.
 */
function getGradienChange(raideId, raideAlku, suunta, sijainti, kaltevuudet, kilometrit) {

    const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
    const absPos = positionUtils.getAbsolutePosition(sijainti);
    const slope = gradientUtils.getSlope(sijainti, suunta, kaltevuudet);
    const dir = suunta === 'nouseva' ? 'up' : 'down';

    const $ = cheerio.load('<gradientChange/>', config.cheerio);
    $('gradientChange').attr('id', `gc_${raideId}_${pos}_${dir}`);
    $('gradientChange').attr('pos', pos);
    $('gradientChange').attr('absPos', absPos);
    $('gradientChange').attr('dir', dir);
    $('gradientChange').attr('slope', slope.kaltevuus);

    return $.xml();
}
