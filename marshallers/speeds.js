const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const { Direction, DIRECTIONS, getSpeedProfileId } = require('./speed-change');

/**
 * Marshalls the given speed limits object to railML speed elements, wrapped
 * in infraAttributes parent element. Should there be any additional attributes,
 * the nesting should likely be lifted in track element marshaller.
 */
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

    const { alku, loppu } = nopeudet.ratakmvali;
    const sijainti = dir === Direction.UP ? alku : loppu;
    const profileId = getSpeedProfileId(railId, sijainti, dir);

    const speeds = _.uniq(_.map(nopeudet.nopeusrajoitukset, (speed, category) => {
        return `<speed trainCategory="${category}" vMax="${speed.nopeus}" />`;
    }));

    const $ = cheerio.load(`<infraAttributes><speeds/></infraAttributes>`, config.cheerio);
    $('infraAttributes').attr('id', profileId);
    $('infraAttributes > speeds').append(speeds);
    
    return $.xml();
}