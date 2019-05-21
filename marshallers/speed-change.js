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

/**
 * Marshalls the given speed limits object to railML speedChange element(s).
 * 
 * If the speed limits are given for certain direction (up/down), returns a
 * single corresponding element.
 * 
 * If the speed limits are not directed, assumes equal limits for both directions,
 * thus returning two elements for the range specified by the speed limit object.
 */
function marshall(railId, absPos, nopeudet) {

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

/**
 * Renders a speedChange element.
 */
function getSpeedChange(railId, absPos, nopeudet, dir) {

    const { ratanumero, alku, loppu } = nopeudet.ratakmvali;
    const sijainti = dir === Direction.UP ? alku : loppu;

    const id = getSpeedChangeId(railId, sijainti, dir);
    const profileRef = getSpeedProfileId(railId, sijainti, dir);
    const name = `Nopeusrajoitus ${ratanumero} ${sijainti.ratakm}+${sijainti.etaisyys}`;
    const max = _.max(_.map(nopeudet.nopeusrajoitukset, 'nopeus'));
    const pos = ((sijainti.ratakm * 1000) + sijainti.etaisyys) - absPos;

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

/**
 * Returns a speed profile id for given rail, position and direction.
 */
function getSpeedProfileId(railId, sijainti, dir) {
    return `sppr_${formatId(railId, sijainti, dir)}`;
}

/**
 * Returns a speed change ID for given rail, position and direction.
 */
function getSpeedChangeId(railId, sijainti, dir) {
    return `sc_${formatId(railId, sijainti, dir)}`;
}

/**
 * Formats the common part of speed change/profile id.
 */
function formatId(railId, sijainti, dir) {
    return `${railId}_${sijainti.ratakm}_${sijainti.etaisyys}_${dir}`;
}


module.exports = {
    Direction, DIRECTIONS, getSpeedChangeId, getSpeedProfileId, marshall
};