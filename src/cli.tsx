#!/usr/bin/env node

import { render } from "ink";
import Spinner from "ink-spinner";
import meow from "meow";
import React from "react";
import * as api from "./api.js";
import App from "./app.js";

meow(
  `
	Usage
	  $ recycle-cli
`,
  {
    importMeta: import.meta,
  },
);

const { clear, cleanup } = render(<Spinner />);

api
  .login()
  .then(token => {
    clear();
    render(<App token={token} />);
  })
  .catch(() => {
    console.error("Unable to get the token.");
    cleanup();
  });
