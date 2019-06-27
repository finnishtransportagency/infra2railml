const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const railUtils = require('../utils/rail-utils');
const speedChange = require('./speed-change');
const electrificationChange = require('./electrification-change');
const platformEdge = require('./platform-edge');

// Notice: the order of child elements is significant.
// https://wiki.railml.org/index.php?title=IS:trackElements

module.exports = {
    marshall: (raide, ratanumero, alku, loppu, elementit, kilometrit) => {

        const raideId = raide.tunniste;
        const nopeudet = railUtils.getSpeedLimits(raide, ratanumero, alku, loppu);
        
        const $ = cheerio.load('<trackElements/>', config.cheerio);

        const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(raideId, alku, kilometrit, n)));
        if (!_.isEmpty(speedChanges)) {
            $('trackElements').append('<speedChanges/>');
            $('trackElements > speedChanges').append(_.join(speedChanges, ''));
        }

        // TODO is electrificationChange correct railML term?
        const electrificationChanges = _.map(elementit.erotusjakso, (ej) => electrificationChange.marshall(ratanumero, alku, kilometrit, ej));
        if (!_.isEmpty(electrificationChanges)) {
            $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
        }

        const platform = platformEdge.marshall(raideId, alku, kilometrit, raide.liikennepaikanRaide);
        if (!_.isEmpty(platform)) {
            $('trackElements').append(`<platformEdges>${platform}</platformEdges>`);
        }

        // TODO append gradientChanges when provided by the API

        return $('trackElements').children().length > 0 ? $.xml() : '';
    }
}