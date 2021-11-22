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
module.exports = {
    infraApi: {
        baseUrl: 'https://rata.digitraffic.fi/infra-api/0.3'
    },
    cheerio: {
        xmlMode: true,
        normalizeWhitespace: true
    },
    railml: {
        visualize: true,
        debugVisualization: true
    },
    http: {
        // The API is sometimes very slow..
        timeout: 300000,
        throttle: {
            // cache threshold for new fetch
            threshold: 15 * 60 * 1000
        },
        // number of concurrent requests
        concurrency: 10
    }
};
