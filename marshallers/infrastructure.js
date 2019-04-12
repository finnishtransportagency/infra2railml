const cheerio = require('cheerio');
const config = require('../config');

module.exports = {
    marshall: (model) => {
        
        const { index } = model;
        const $ = cheerio.load('<infrastructure><infraAttrGroups/><tracks/><trackGroups/></infrastructure>', config.cheerio);
        
        $('infrastructure').attr('id', `infra_${index.trackId}_${index.from}-${index.to}`);
        $('infrastructure').attr('name', `Rata ${index.trackId} (${index.from}-${index.to} km)`)
        
        $('infrastructure > tracks').append(model.tracks);
        $('infrastructure > infraAttrGroups').append(model.speeds);

        if (config.railml.visualize === true) {
            $('infrastructure > trackGroups').append(`<line id="line_${index.trackId}_${index.from}_${index.to}"/>`);
            $('infrastructure > trackGroups > line').append(model.trackRefs);
        }

        return $.xml();
    }
}