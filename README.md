# Infra-API transformation to railML v2.2

----
Note! This application has not been developed for a while and might therefore not work correctly. The development of the application is currently assessed. 
----

A command-line tool for converting selected data sets from the [Railway Infrastructrure API](https://rata.digitraffic.fi/infra-api/0.3) to [railML v2.2](https://www.railml.org) format. The resulting railML models have been tested with [OpenTrack](http://www.opentrack.ch/) simulation software.

The [Railway Infrastructrure API](https://rata.digitraffic.fi/infra-api/0.3) is an open data API provided by the [Traffic Management Finland Group](https://tmfg.fi/en) as a part of the [Digitraffic](https://www.digitraffic.fi/en/) service. The railway infrastructure data is licensed under the [Creative Commons 4.0 BY license](https://www.digitraffic.fi/en/terms-of-service/). 

## Development Environment

### Tools

The following tools are required to be installed first.

- Git client
- Node.js v10.15.3
- NPM v6.4.1

### Additional Tools

Depending on your needs, these may also be helpful.

- [RailVivid](https://www.railml.org/en/user/railvivid.html) for validating railML files.
- [nvm](https://github.com/creationix/nvm) for installing Node.js and NPM (Mac/Linux).
  - On Windows, see [nvm-windows](https://github.com/coreybutler/nvm-windows).
- [Pkg](https://github.com/zeit/pkg) for building binary releases for distribution

## Environment Setup

On Mac/Linux, open a new terminal and follow these steps. On Windows, you may
use Command Prompt, Powershell or Git Bash to issue the commands. The latter is
likely most compatible with these instructions.

- Clone this repository somewhere on your disk
    - `git clone https://github.com/finnishtransportagency/infra2railml.git`
- Switch to infra2railml directory
    - `cd infra2railml`
- With Nodejs/npm, install the required dependencies
    - `npm install`
- Create a symlink to enable running the tool in any folder
    - `npm link`
- Confirm the `infra2railml` command is now found in PATH
    - `infra2railml --version` (should output version, e.g. "1.0.0")

*Notice: while we don't have an installer/executable package at the moment, the above instructions can also be used to set up the tool for end-users as well.*

## Usage

For general usage and options, see `infra2railml --help`.

### Railway Infrastucture

Infrastructure model is generated by by giving a track ID, first and last track kilometer. The given kilometers are inclusive, but notice that all rails that may span over the requested scope are also included with full length. Instead of the last kilometer, the desired track length may also be given. For example, to load and convert 10 kilometers of track 007:

- `infra2railml 007 --from 28 --to 37`
- `infra2railml 007 --from 28 --length 10`

### Stations

Stations sub-command generates a flat list of all stations in Finland.

- `infra2railml stations`


## Implementation Details

The following describes the most important implementation details, to help understand the certain solutions and decisions we've made during the development.

### Infra API Usage

The application uses the following API resources (variable path members denoted by `$`):

- `../elementit/$tunniste.json`
- `../kilometrimerkit/$tunniste.json`
- `../radat/$ratanumero/$ratakm.json`
- `../raiteet/$tunniste.json`
- `../rautatieliikennepaikat.json`
- `../rautatieliikennepaikat/$tunniste.json`

The data is fetched by loading the desired track kilometers, then all elements of each kilometer, and finally the rails related to each element. The objects are complemented with selected child-objects, i.e. plain ID references are translated to actual objects.

For each run, the HTTP requests are cached on client side to avoid repetitive calls to API and the number of concurrent requests is also limited to avoid exhausting the API server. See [config](./config.js) for related settings.

### Naming Conventions

The API and railML terminology is overlapping but in the API everything is given in Finnish. Hence, to avoid confusion, Finnish terms are generally used to refer to API structures and variables, while English is used for railML and general code.

### Terminology Mapping

The terminology is mapped between Infra API and railML as follows:

|Infra API term             |Corresponding or related railML 2.2 terms      |Notes
|---                        |---                                            |---
|akselinlaskija             |trainDetector                                  |trainDetector could hold other counter types too.
|baliisi                    |balise                                         |elementti.baliisi
|erotusjakso                |electrificationChange                          |Is this correct?
|kilometripaalu             |signal/milepost                                |Also "ratakilometri"
|korkeuspiste               |gradientChange                                 |Elevations are converted into slopes
|nopeusrajoitukset          |speedChange, infraAttributes/speed             |
|opastin                    |signal                                         |elementti.opastin
|raide                      |track                                          |Also "rail" in source code.
|raideeristys               |trackCircuitBorder                             |
|raideristeys               |crossing                                       |elementti.vaihde (tyyppi: rr, srr, yrv, krv)
|rautatieliikennepaikka     |ocp, platformEdge, stopPost                    |Also "station" in source code.
|sijainti (km + etaisyys)   |pos, absPos, mileageChange                     |Calculated relative to track begin
|vaihde                     |switch                                         |elementti.vaihde

### Identifiers

The API identifies objects with unique identifiers given in the field `tunniste`. However, in railML it is common we also need to identify and reference various child elements nested under the main object element. Thus, to avoid artificial IDs and make it easier to refer children from other contexts, the IDs are prefixed with abbreviations based on object type. In some cases the IDs are also suffixed with abbreviations or position on track to ensure the uniqueness of IDs. For example,

|Object/Child                   |Infra-API object ID            |Corresponding railML ID
|---                            |---                            |---
|track                          |x.x.xxx.LIVI.INFRA.44.117326   |x.x.xxx.LIVI.INFRA.44.117326
|track/trackBegin               |-                              |tb_x.x.xxx.LIVI.INFRA.44.117326
|track/trackBegin/connection    |-                              |tbc_x.x.xxx.LIVI.INFRA.44.117326
|track/trackEnd                 |-                              |te_x.x.xxx.LIVI.INFRA.44.117326
|track/trackEnd/connection      |-                              |tec_x.x.xxx.LIVI.INFRA.44.117326
|switch                         |x.x.xxx.LIVI.INFRA.24.102936   |x.x.xxx.LIVI.INFRA.24.102936
|switch/connection              |-                              |swc_x.x.xxx.LIVI.INFRA.24.102936

The above is only to give general idea, in practice there are many more.

### Tracks

Each individual rail (raide) from Infra API will result in railML track element, including the chosen track elements and features. Track begin and end connections are from track to track (main tracks, track end referencing the beginning of next track) or from track to switch (side tracks, track begin or end referencing a switch or crossing). Track may also be left open-ended if they reach outside of requested track scope or be terminated with a buffer stop.

### Mileposts, Mileages and Positions

Mileposts are special signals including a `milepost` child element, but otherwise they're similar to regular signals. The milepost signal represents the real posts that are placed along the tracks, and thus the distance between them may not be exactly 1000 meters. Hence, when requesting a certain length of a track in kilometers, the actual length of the track may be more or less of expected. Because of this, all `pos` attribute values must be calculated using all the involved track kilometers, which is handled by the [position-utils](./utils/position-utils.js) module. This applies also for the `mileageChange` elements that are used to define corrections in form of "jumps" or "missing parts" in the track length.

Most track elements are matched with rail beginnings or ends by comparing the track positions given in `km + distance` format. Notice that sometimes this comparison may fail if the rail and switch positions given by the API are not precisely the same, which might happen due to an inconsistency in the infrastructure data.

### Switches

In railML, a `switch` element may contain up to three connections, but we've been following the style that OpenTrack is using and thus all switches contain only one connection/reference to a track, which is always the parting direction of the switch (left/right). Hence, the straight direction tracks always refer each other directly from end to beginning. Due to this, switches must always be nested under the main tracks or otherwise there is no connection to the main track. All references mention here are always two-way so that navigating in both directions is possible. The switches received from Infra API are always examined using the rising direction (nouseva).

Generally, there are two ways a switch may be defined in the resulting railML:

1) The switch `s` is positioned on a main track "between rails", for example at position `p` at the end of the `track` element representing the rail `a-b` (track end `pos` equals switch `pos`). The end of `a-b` references the beginning of `c-d` to keep the graph continuous. The `switch` element contains a single `connection` element as a child, referencing the beginning of the `track` that represents the rail `e-f`.


    ```
    a           b       c               d
    |-----------||--s--||---------------|  main track
                p    \ 
                      \
                       ||---------------|  side track
                        e               f
    ```

    Notice: the switch could also be nested at the beginning of the `track` representing the rail `c-d`, which would not affect the resulting graph.

1) The switch `s` is positioned at an arbitrary point `p` along the rail `a-b` which is considered continuous until the end `b`. The `switch` element must be nested under the `track` element representing rail `a-b` and contains a single `connection` child element that references the beginning of the `track` representing the rail `c-d`.

    ```
    a               p                  b
    |---------------s------------------|  main track
                     \ 
                      \
                       |---------------|  side track
                       c              d
    ```

### Crossings

The Infra-API defines crossings as a sub-type of a switch, but in railML they are modelled using a separate `crossing` element. The conversion is somewhat problematic or even impossible because the API defines the crossing connections quite often as "non-breaking" for both directions. This means that there are only two individual rails involved, simply "running through" the crossing, instead of two incoming and two outgoing rails connected at the four points A, B, C and D. Also, depending on the crossing type, there is some variance how the connections are given. We can place the crossing along the rail of the other direction, e.g. A-D, without referring the rail explicitly (the `crossing` is simply nested as a child of `track`) but for B-C we need references for both incoming and outgoing rail end and begin, which are often not given in the data provided by the API.

For example, to model a simple crossing on rail `a-b` at position `p`, the railML `crossing` element can be nested under the `track` that represents `a-b`. However, to keep the graph continuous the `crossing` also requires two `connection` child elements that reference the end of rail `c-d` and the beginning of rail `e-f`. However, the API often defines the connections as a single rail `c-f`.

```
     c               d
     |---------------|
                      \ 
   a |-----------------p-----------------| b
                        \
                         |---------------|
                         e               f
```

### Signals

Signals are positioned on `tracks` using the `pos` and `absPos` attributes. The Infra API does not provide information about blocking, home and exit signals. Thus we assume that all signal that are not related to any station (rautatieliikennepaikka) are blocking. Signals related to stations are always modeled as being "exit". Therefore, the home signals should be fixed by the user by switching the certain exit signals to home.

### Speed Changes

Speed limits are collected from each rail and nested as `track` children. The speed categories are generated from the exact same data and nested under railML infrastructure element. It is quite common for Infra API to not defined the direction of speed limits. When no direction is given, we assume equal limits in both directions and position the `speedChange` elements with limit begin (up) and end (down) positions. Otherwise, only the given direction is used and the begin position is used.

### Gradient Changes

The API provides us with elevation information for each rail. This is mapped in railML `gradientChange` elements by first calculating the corresponding slope angles based on distance and elevation change between each elevation point. However, forming a continuous line of these points in rail-to-rail manner seems quite a tedious task, so we've simply assumed most parellel rails to have same elevation enough closely. In general this should work, especially for single or dual tracks, but might produce inaccuracy on more complex areas where each rail may have different elevation and slope near the same track position.
 
 ## Visualization (for OpenTrack software)
 
 The process of creating visualization railML XML happens alongside the creation of the data portion of the railML XML in the following order:
 
 1. As the railML XML for tracks is being generated, an array containing the information of all the elements to be visualized is also being constructed.
 2. A bounding box is then calculated that is big enough to contain all the elements to be visualized. This is used to determine the size of the visualization in OpenTrack software.
 3. Finally, the visualization railML XML is generated where the position of an element is determined by scaling its real world position with the CANVAS_SIZE_RATIO constant that is specifically optimized for OpenTrack software view.
 
 In addition to the visualization XML, an HTML page visualization can also be generated for debug purposes or just as an alternative visualization. If enabled in the settings, these will appear as .html files alongside the data/visualization XML files.
 
 NOTE: Currently the source data is fetched from Infra API with the parameters `{ srsName: 'crs:84', presentation: 'diagram' }`. Having the coordinates in diagram presentation helps to make the visualization more understandable. If new data is being fetched (and visualized) in the future from the Infra API, it should also have the same (or consistent) settings.     
