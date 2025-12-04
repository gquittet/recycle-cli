#!/usr/bin/env node

import { render } from "ink";
import Spinner from "ink-spinner";
import meow from "meow";
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

try {
  const token = await api.login();
  clear();
  render(<App token={token} />);
} catch {
  console.error("Unable to get the token.");
  cleanup();
}
