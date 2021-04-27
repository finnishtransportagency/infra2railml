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
const formatter = require('xml-formatter');
const _ = require('lodash');
const cheerio = require('cheerio');
const track = require('./track');
const config = require('../config');
const infrastructure = require('./infrastructure');
const infrastructureVis = require('./infrastructure-vis');
const station = require('./station');
const visualizationUtils = require('../utils/visualization-utils');

const XML_NAMESPACES = {
    'version': '2.2', 'xmlns': 'http://www.railml.org/schemas/2013',
    'xmlns:xsi': 'http://www.railml.org/schemas/2013'
    //'xsi:schemaLocation': 'http://www.railml.org/schemas/2013 http://schemas.railml.org/2013/railML-2.2/railML.xsd'
};

const RAILML_STUB = '<?xml version="1.0" encoding="UTF-8"?><railml/>';

/**
 * Infra-API base types from which the railML track elements are created.
 */
const BaseType = {
    RAILS: 'raiteet',
    STATIONS: 'liikennepaikat'
};

/**
 * Base type marshallers.
 */
const RAILML_MARSHALLERS = {
    raiteet: track.marshall,
    liikennepaikat: station.marshall
};

/**
 * Marshall given base types to railML tracks.
 */
function marshall(baseType, index) {

    const objects = index[baseType];
    const transformer = RAILML_MARSHALLERS[baseType];

    return new Promise((resolve, reject) => {
    
        if (!objects || !transformer) {
            reject(new Error(`Invalid base type '${baseType}'.`));
        }

        // TODO move transforming to infrastructure marshaller
        const memo = { index, tracks: [], speeds: [], trackRefs: [], stations: [], marshalled: [], visualElements: [] };
        const results = _.transform(objects, transformer, memo);

        const $ = cheerio.load(RAILML_STUB, config.cheerio);
        _.each(XML_NAMESPACES, (val, key) => $('railml').attr(key, val));
        
        const infra = infrastructure.marshall(baseType, results);
        $('railml').append(infra);

        if (baseType === BaseType.RAILS && config.railml.visualize === true) {
            // calculate bounding box for visual elements
            const boundingBox = visualizationUtils.getBoundingBox(memo.visualElements);

            const visuals = infrastructureVis.marshall(baseType, results, boundingBox);
            $('railml').append(visuals);

            if(config.railml.debugVisualization === true) {
                // creatnodee a debug image
                const { createCanvas } = require('canvas');
                const canvas = createCanvas(5000, 5000);
                const fileNamePrefix = `Rails-${results.index.trackId}_${results.index.from}_${results.index.to}`;
                visualizationUtils.createHTMLCanvasVisualization(fileNamePrefix, canvas, memo.visualElements, boundingBox);
            }
        }

        resolve(formatter($.xml()));
    });
}

module.exports = {
    BaseType, marshall
};
