const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const { Direction, DIRECTIONS } = require('./speed-change');

module.exports = {
    marshall: (railId, nopeudet) => {
        
        if (nopeudet.suunnattu) {
            const dir = DIRECTIONS[nopeudet.suunnattu] || Direction.UP;
            return [
                getSpeedAttrs(railId, nopeudet, dir)
            ];
        }
        
        return [
            getSpeedAttrs(railId, nopeudet, Direction.UP),
            getSpeedAttrs(railId, nopeudet, Direction.DOWN)
        ];
    }
};

function getSpeedAttrs(railId, nopeudet, dir) {

    const suffix = dir ? `_${dir}` : '';
    const profileId = `sppr_${railId}_${nopeudet.ratakmvali.alku.ratakm}_${nopeudet.ratakmvali.alku.etaisyys}${suffix}`;

    const speeds = _.uniq(_.map(nopeudet.nopeusrajoitukset, (speed, category) => {
        return `<speed trainCategory="${category}" vMax="${speed.nopeus}" />`;
    }));

    const $ = cheerio.load(`<infraAttributes><speeds/></infraAttributes>`, config.cheerio);
    $('infraAttributes').attr('id', profileId);
    $('infraAttributes > speeds').append(speeds);
    
    return $.xml();
}