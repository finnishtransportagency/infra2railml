const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (limits, railId) => {
        
        const profileRef = `sppr_${railId}_${limits.ratakmvali.alku.ratakm}_${limits.ratakmvali.alku.etaisyys}`;

        const speeds = _.uniq(_.map(limits.nopeusrajoitukset, (speed, category) => {
            return `<speed trainCategory="${category}" vMax="${speed.nopeus}" />`;
        }));

        const $ = cheerio.load(`<infraAttributes><speeds/></infraAttributes>`, config.cheerio);
        $('infraAttributes').attr('id', profileRef);
        $('infraAttributes > speeds').append(speeds);
        
        return $.xml();
    },
    
};
