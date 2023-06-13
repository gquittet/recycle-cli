import { createWriteStream } from "fs";
import { DateTime } from "luxon";

export const toFile = async <
  T extends { label: string; timestamp: Date; value: string; address: string },
>(
  collection: T[][],
  recypark?: { latitude: number; longitude: number; name: string },
) => {
  return new Promise<void>((resolve, reject) => {
    // prettier-ignore
    const recyparkLink = recypark
			? `https://maps.apple.com/?ll=${recypark.latitude},${recypark.longitude}&q=${encodeURIComponent(recypark.name)}`
			: '';

    const writer = createWriteStream("recycle.ics");
    writer.write(startIcal());

    for (const items of collection) {
      writer.write(createEvent(items, recyparkLink));
    }

    writer.write(endIcal());

    writer.close(error => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
};

export const startIcal = () => {
  // noinspection SpellCheckingInspection
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:www.example.com
X-PUBLISHED-TTL:P1W
`;
};

export const createEvent = <
  T extends { label: string; timestamp: Date; value: string; address: string },
>(
  items: T[],
  recyparkLink: string,
): string => {
  if (items.length === 0) return "";

  const id = items.map(({ value }) => value).join("-");
  const description = items.map(({ label }) => `- ${label}`).join("\\n");
  const location = items[0]!.address.replace(",", "\\,");

  const timestamp = DateTime.fromJSDate(items[0]!.timestamp);
  const day = timestamp.toISODate({
    format: "basic",
  });
  const alert = timestamp
    .minus({ days: 1 })
    .set({ hour: 18 })
    .startOf("hour")
    .setZone("utc")
    .toISO({ format: "basic", suppressMilliseconds: true });

  // noinspection SpellCheckingInspection
  return `BEGIN:VEVENT
UID:${id}
DTSTART;TZID=Europe/Brussels;VALUE=DATE:${day}
SEQUENCE:0
TRANSP:TRANSPARENT
DTEND;TZID=Europe/Brussels;VALUE=DATE:${day}
LOCATION:${location}
URL:${recyparkLink}
SUMMARY:Collecte des déchets 🗑
DESCRIPTION:${description}\\n\\n${recyparkLink}
X-MICROSOFT-CDO-ALLDAYEVENT:TRUE
BEGIN:VALARM
TRIGGER;VALUE=DATE-TIME:${alert}
ACTION:DISPLAY
END:VALARM
END:VEVENT
`;
};

// noinspection SpellCheckingInspection
export const endIcal = () => `END:VCALENDAR`;
