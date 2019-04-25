const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

module.exports = {
    Direction,
    DIRECTIONS,
    marshall: (railId, absPos, nopeudet) => {

        if (nopeudet.suunnattu) {
            const dir = DIRECTIONS[nopeudet.suunnattu] || Direction.UP;
            return [
                getSpeedChange(railId, absPos, nopeudet, dir)
            ];
        }
        
        // if direction is unspecified, assume the same in both directions
        return [
            getSpeedChange(railId, absPos, nopeudet, Direction.UP),
            getSpeedChange(railId, absPos, nopeudet, Direction.DOWN)
        ];
    }
};

function getSpeedChange(railId, absPos, nopeudet, dir) {

    const { ratanumero, alku } = nopeudet.ratakmvali;

    const id = `sc_${railId}_${alku.ratakm}_${alku.etaisyys}_${dir}`;
    const name = `${ratanumero} ${alku.ratakm}+${alku.etaisyys}`;
    const profileRef = `sppr_${railId}_${alku.ratakm}_${alku.etaisyys}_${dir}`;
    const max = _.max(_.map(nopeudet.nopeusrajoitukset, 'nopeus'));

    const pos = ((alku.ratakm * 1000) + alku.etaisyys) - absPos;

    const $ = cheerio.load('<speedChange/>', config.cheerio);
    $('speedChange').attr('id', id);
    $('speedChange').attr('name', name);
    $('speedChange').attr('pos', pos);
    $('speedChange').attr('absPos', absPos + pos);
    $('speedChange').attr('dir', dir);
    $('speedChange').attr('profileRef', profileRef);
    $('speedChange').attr('vMax', max);

    return $.xml();
}