import { Box, Text, useApp } from "ink";
import Link from "ink-link";
import SelectInput from "ink-select-input";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import PropTypes from "prop-types";
import { useReducer, useState } from "react";
import { recycleService } from "./api.js";
import { toFile } from "./ical.js";
import { reducer } from "./utils.js";

const isPostalCodeValid = (code: number) => code >= 1000 && code <= 9999;

type ActiveStep =
  | "ENTER_POSTAL_CODE"
  | "SELECT_POSTAL_CODE"
  | "ENTER_STREET_NAME"
  | "SELECT_STREET_NAME"
  | "ENTER_HOUSE_NUMBER"
  | "LOADING"
  | "FINISH";

type Form = {
  postalCode?: string;
  street?: string;
  house?: string;
};

type Options = {
  postalCode: Array<{ label: string; value: string }>;
  street: Array<{ label: string; value: string }>;
  house: Array<{ label: string; value: string }>;
};

export const formReducer = reducer<Form>();
export const optionReducer = reducer<Options>();

export default function App({ token = "" }) {
  const [activeStep, setActiveStep] = useState<ActiveStep>("ENTER_POSTAL_CODE");
  const [form, updateForm] = useReducer(formReducer, {});
  const [choice, updateChoice] = useReducer(formReducer, {});
  const [options, updateOptions] = useReducer(optionReducer, {
    postalCode: [],
    street: [],
    house: [],
  });
  const { exit } = useApp();

  const api = recycleService(token);

  return (
    <Box flexDirection="column" gap={1}>
      <Box>
        <Box borderStyle="doubleSingle">
          <Text>Recycle ➡️ 📆</Text>
        </Box>
      </Box>

      {activeStep === "LOADING" && <Spinner />}

      {activeStep === "ENTER_POSTAL_CODE" && (
        <TextInput
          placeholder="Postal code"
          value={form.postalCode ?? ""}
          onChange={postalCode => {
            updateForm({ postalCode });
          }}
          onSubmit={async () => {
            if (form?.postalCode === undefined) return;
            const code = Number.parseInt(form.postalCode, 10);
            if (!isPostalCodeValid(code)) return;
            setActiveStep("LOADING");
            const ids = await api.getPostalCodeId(code);
            if (ids.length === 0) return;
            setActiveStep("SELECT_POSTAL_CODE");
            updateOptions({ postalCode: ids });
          }}
        />
      )}

      {activeStep === "SELECT_POSTAL_CODE" && (
        <SelectInput
          items={options.postalCode}
          onSelect={({ value, label }) => {
            const postalCode = value.split("#")[0] ?? "";
            updateChoice({ postalCode });
            updateForm({ postalCode: label.split(" - ").join(" ") });
            setActiveStep("ENTER_STREET_NAME");
          }}
        />
      )}

      {activeStep === "ENTER_STREET_NAME" && (
        <TextInput
          placeholder="Street"
          value={form.street ?? ""}
          onChange={street => {
            updateForm({ street });
          }}
          onSubmit={async () => {
            if (
              form.street === undefined ||
              choice.postalCode === undefined ||
              form.street.length < 5
            ) {
              return;
            }

            setActiveStep("LOADING");
            const ids = await api.getStreetId(choice.postalCode, form.street);
            if (ids.length === 0) {
              setActiveStep("ENTER_STREET_NAME");
              return;
            }

            setActiveStep("SELECT_STREET_NAME");
            updateOptions({ street: ids });
          }}
        />
      )}

      {activeStep === "SELECT_STREET_NAME" && (
        <SelectInput
          items={options.street}
          onSelect={({ value, label }) => {
            updateChoice({ street: value });
            updateForm({ street: label });
            setActiveStep("ENTER_HOUSE_NUMBER");
          }}
        />
      )}

      {activeStep === "ENTER_HOUSE_NUMBER" && (
        <TextInput
          placeholder="House number"
          value={form.house ?? ""}
          onChange={house => {
            updateForm({ house });
          }}
          onSubmit={async () => {
            if (
              form.house === undefined ||
              choice.postalCode === undefined ||
              choice.street === undefined
            ) {
              return;
            }

            setActiveStep("LOADING");
            updateForm({ house: form.house });
            const recypark = await api.getRecypark({
              postalCode: form.postalCode!.split(" ")[0]!,
              street: form.street!,
              house: Number.parseInt(form.house, 10),
            });
            const calendar = await api.getCalendar({
              postalCode: choice.postalCode,
              street: choice.street,
              house: Number.parseInt(form.house, 10),
              address: `${form.street} ${form.house}, ${form.postalCode}`,
            });
            await toFile(calendar, recypark);
            setActiveStep("FINISH");
            setTimeout(exit, 100);
          }}
        />
      )}

      {activeStep === "FINISH" && (
        <Box flexDirection="column">
          <Text>Done! 🚀</Text>
          <Box marginBottom={1} />
          <Text>1. Create a dedicated calendar</Text>
          <Text>2. Import it:</Text>
          <Text>
            - GMail:{" "}
            <Link url="https://calendar.google.com/calendar/u/0/r/settings/export">
              https://calendar.google.com/calendar/u/0/r/settings/export
            </Link>
          </Text>
          <Text>
            - ICloud:{" "}
            <Link url="https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac">
              https://support.apple.com/guide/calendar/import-or-export-calendars-icl1023/mac
            </Link>
          </Text>
          <Text>
            - Outlook:{" "}
            <Link url="https://outlook.live.com/calendar/0/addcalendar">
              https://outlook.live.com/calendar/0/addcalendar
            </Link>
          </Text>
        </Box>
      )}
    </Box>
  );
}

App.propTypes = {
  token: PropTypes.string.isRequired,
};
