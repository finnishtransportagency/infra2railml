/*
 * Copyright 2019 FINNISH TRANSPORT INFRASTRUCTURE AGENCY
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission – subsequent versions of the EUPL (the "License");
 * You may not use this work except in compliance with the License.
 * 
 * You may obtain a copy of the License at:
 * https://joinup.ec.europa.eu/software/page/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const speeds = require('./speeds');
const operationControlPoint = require('./operation-control-point');

// Notice: the order of child elements is significant.
// https://wiki.railml.org/index.php?title=Infrastructure

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