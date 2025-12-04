import { type FlatXoConfig } from "xo";

const xoConfig: FlatXoConfig = [
  { space: true, react: true, prettier: true },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
      "capitalized-comments": "off",
    },
  },
];

export default xoConfig;
