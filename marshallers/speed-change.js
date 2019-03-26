const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (trackId, absPos, change) => {

        const max = _.max(change.nopeusrajoitukset, (nr) => nr.nopeus);
        const profileRef = `sppr_${trackId}_${change.ratakmvali.alku.ratakm}_${change.ratakmvali.alku.etaisyys}`;

        const a = cheerio.load('<speedChange/>', config.cheerio);
        a('speedChange').attr('id', `sc_${change.ratakmvali.alku.ratakm}_${change.ratakmvali.alku.etaisyys}`);
        a('speedChange').attr('name', `${trackId} ${change.ratakmvali.alku.ratakm}+${change.ratakmvali.alku.etaisyys}`);
        a('speedChange').attr('pos', change.ratakmvali.alku.etaisyys);
        a('speedChange').attr('absPos', absPos +  change.ratakmvali.alku.etaisyys);
        a('speedChange').attr('dir', change.suunnattu || 'up'); // TODO map values to (up|down)
        a('speedChange').attr('profileRef', profileRef);
        a('speedChange').attr('vMax', max);

        /*const b = cheerio.load('<speedChange/>', config.cheerio);
        b('speedChange').attr('id', `sce_${change.ratakmvali.loppu.ratakm}_${change.ratakmvali.loppu.etaisyys}`);
        b('speedChange').attr('name', `${trackId} ${change.ratakmvali.loppu.ratakm} loppu`);
        b('speedChange').attr('pos', change.ratakmvali.loppu.etaisyys);
        b('speedChange').attr('absPos', absPos +  change.ratakmvali.loppu.etaisyys);
        b('speedChange').attr('dir', change.suunnattu || 'up');
        b('speedChange').attr('profileRef', profileRef);
        b('speedChange').attr('vMax', max);*/

        return a.html();
    }
};
