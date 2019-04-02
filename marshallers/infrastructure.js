const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (model) => {
        
        const $ = cheerio.load('<infrastructure><infraAttrGroups/><tracks/></infrastructure>', config.cheerio);
        
        $('infrastructure').attr('id', `infra_${model.index.trackId}_${model.index.from}-${model.index.to}`);
        $('infrastructure').attr('name', `Rata ${model.index.trackId} (${model.index.from}-${model.index.to} km)`)
        $('infrastructure > tracks').append(model.tracks);
        $('infrastructure > infraAttrGroups').append(model.speeds);

        return $.html();
    }
}