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

// https://wiki.railml.org/index.php?title=IS:ocp

const NameType = {
    OPERATIONAL: 'operationalName',
    TRAFFIC: 'trafficName',
    LOCAL: 'localName',
    OTHER: (val) => `other:${val}`
};

const OperationalType = {
    STATION: 'station',
    STOPPING_POINT: 'stoppingPoint',
    DEPOT: 'depot',
    CROSSOVER: 'crossover',
    JUNCTION: 'junction',
    BLOCK_POST: 'blockPost',
    BLOCK_SIGNAL: 'blockSignal',
    SIDING: 'siding',
    OTHER: (val) => `other:${val}`
};

const OPERATIONAL_TYPES = {
    'liikennepaikka': OperationalType.STATION,
    'linjavaihde': OperationalType.JUNCTION,
    'seisake': OperationalType.STOPPING_POINT
};

module.exports = {
    marshall: (liikennepaikka) => {

        if (_.isEmpty(liikennepaikka)) {
            return undefined;
        }

        const opType = OPERATIONAL_TYPES[liikennepaikka.tyyppi] || OperationalType.STATION; 
        
        const $ = cheerio.load('<ocp/>', config.cheerio);
        $('ocp').attr('id', liikennepaikka.tunniste);
        $('ocp').attr('code', liikennepaikka.lyhenne);
        $('ocp').attr('name', liikennepaikka.kuljettajaAikatauluNimi);
        $('ocp').attr('type', NameType.OPERATIONAL);
        $('ocp').attr('abbrevation', liikennepaikka.lyhenne);
        $('ocp').append(`<propOperational operationalType="${opType}"/>`);

        return $.xml();        
    }
};
