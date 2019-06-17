const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const operationControlPoint = require('./operation-control-point');

module.exports = {
    marshall: (model) => {
        
        const { index } = model;
        const $ = cheerio.load('<infrastructure><infraAttrGroups/><tracks/><trackGroups/><operationControlPoints/></infrastructure>', config.cheerio);
        
        $('infrastructure').attr('id', `infra_${index.trackId}_${index.from}-${index.to}`);
        $('infrastructure').attr('name', `Rata ${index.trackId} (${index.from}-${index.to} km)`)
        
        $('infrastructure > tracks').append(model.tracks);
        $('infrastructure > infraAttrGroups').append(model.speeds);

        const ocps = _.map(index.liikennepaikat, operationControlPoint.marshall);
        $('infrastructure > operationControlPoints').append(ocps);

        if (config.railml.visualize === true) {
            $('infrastructure > trackGroups').append(`<line id="line_${index.trackId}_${index.from}_${index.to}"/>`);
            $('infrastructure > trackGroups > line').append(model.trackRefs);
        }

        return $.xml();
    }
}