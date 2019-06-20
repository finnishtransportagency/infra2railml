const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const speeds = require('./speeds');
const operationControlPoint = require('./operation-control-point');

module.exports = {
    marshall: (baseType, model) => {

        const { index } = model;
        const $ = cheerio.load('<infrastructure/>', config.cheerio);
        
        const now = new Date();

        const infraId = baseType === 'raiteet' ?
            `infra_${index.trackId}_${index.from}_${index.to}` : `ocps_${now.getTime()}`;

        const name = baseType === 'raiteet' ?
            `Rata ${index.trackId} km ${index.from}-${index.to} (${now.toISOString()})` : `Liikennepaikat ${now.toISOString()}`;         

        $('infrastructure').attr('id', infraId);         
        $('infrastructure').attr('name', name);
        $('infrastructure').attr('version', '2.2');
        
        const speedAttrs = _.uniq(_.flatMap(index.raiteet, (r) => _.flatMap(r.nopeusrajoitukset, (n) => speeds.marshall(r.tunniste, n))));
        if (!_.isEmpty(speedAttrs)) {
            $('infrastructure').append('<infraAttrGroups/>');
            $('infrastructure > infraAttrGroups').append(speedAttrs);
        }

        if (!_.isEmpty(model.tracks)) {
            $('infrastructure').append('<tracks/>');
            $('infrastructure > tracks').append(model.tracks);
        }

        if (!_.isEmpty(model.trackRefs)) {
            const line = `<line id="line_${index.trackId}_${index.from}_${index.to}" name="${index.trackId}" />`;
            $('infrastructure').append('<trackGroups/>');
            $('infrastructure > trackGroups').append(line);
            $('infrastructure > trackGroups > line').append(model.trackRefs);
        }

        if (!_.isEmpty(index.liikennepaikat)) {
            const ocps = _.map(index.liikennepaikat, operationControlPoint.marshall);
            $('infrastructure').append('<operationControlPoints/>');
            $('infrastructure > operationControlPoints').append(ocps);
        }

        return $.xml();
    }
}