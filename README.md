# Infra-API transformation to railML v2.2

Converts selected data sets from https://rata.digitraffic.fi/infra-api/0.3 to railML v2.2, mainly to be imported in OpenTrack simulation software.

## Requirements

- Git client
- Node.js v10.15.3
- NPM v6.4.1

## Setup

- [NVM](https://github.com/creationix/nvm) is recommended for installing Node.js and NPM.
- Clone the source code repository
    - `git clone <this repository>`
- Go to infra2railml directory
- Install dependencies and create a symlink for the 
    - `npm install && npm link`
- Confirm the `infra2railml` command is found in PATH
    - `infra2railml --version`

## Usage

For general usage and options, see `infra2railml --help` and `infra2railml [track|rails]--help`.

### Tracks

Tracks are generated with `track` command, followed by track ID, start kilometer and end kilometer. Desired track length may also be given instead of end kilometer. For example, track 007 kilometers 28 through 37:

- `infra2railml track 007 --from 28 --to 37`
- `infra2railml track 007 --from 28 --length 10`

Each track kilometer is represented as railML `<track/>` object, including most track elements regardless of the actual rail they are related to.

### Rails

Rails are generated with `rails` command, followed by track ID, start kilometer and end kilometer. Desired track length may also be given instead of end kilometer. For example, rails from track 007 kilometers 28 through 37:

- `infra2railml rails 007 --from 28 --to 37`
- `infra2railml rails 007 --from 28 --length 10`

Each individual rail will result in railML track element, including the relevant track elements, switch connections, speed limits etc. No visualization is generated at the moment.
