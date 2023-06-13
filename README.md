# Recycle CLI

An unofficial Recycle (https://www.recycleapp.be/) CLI to generate an iCal file.

- [Recycle CLI](#recycle-cli)
  - [Features](#features)
  - [Demo](#demo)
  - [Install](#install)
    - [Release](#release)
      - [Requirements](#requirements)
    - [Latest development](#latest-development)
      - [Requirements](#requirements-1)
  - [CLI](#cli)

## Features

✔ Display a notification the day before  
✔ Show the nearest Recycling-park in the agenda  
✔ Fully compliant with the iCal standard (https://www.rfc-editor.org/rfc/rfc5545)  
✔ Fully compliant with Apple Calendar, Outlook, Google Calendar, ...

## Demo

https://github.com/gquittet/recycle-cli/assets/11082739/39b16d2b-0311-4312-b667-7397bdaa06d6

## Install

### Release

#### Requirements

- NodeJS >= 16

```shell
npx recycle
```

### Latest development

#### Requirements

- Git
- NodeJS >= 16

```shell
git clone https://github.com/gquittet/recycle-cli
npm install
npm run build
node dist/cli.js # or ./dist/cli.js
```

## CLI

```
$ ./recycle --help

  Usage
    $ recycle
```
