# Recycle CLI

An unofficial Recycle (https://www.recycleapp.be/) CLI to generate an iCal file.

## Features

✔ Display a notification the day before  
✔ Show the nearest Recycling-park in the agenda  
✔ Fully compliant with the iCal standard (https://www.rfc-editor.org/rfc/rfc5545)  
✔ Fully compliant with Apple Calendar, Outlook, Google Calendar, ...

## Demo

https://github.com/gquittet/recycle-cli/assets/11082739/39b16d2b-0311-4312-b667-7397bdaa06d6

<img src="./assets/demo.gif" alt="Demonstration">

## Install

NodeJS >= 16

```shell
npm install -g recycle-cli
```

## Run

```shell
npx recycle
```

### Contribute

#### Requirements

- Git
- NodeJS >= 16
- PNPM

```shell
git clone https://github.com/gquittet/recycle-cli
pnpm install
pnpm run build
node dist/cli.js
```
