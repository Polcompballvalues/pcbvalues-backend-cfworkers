const EN_MONTHS = [
    ["Jan", "January"],
    ["Feb", "February"],
    ["Mar", "March"],
    ["Apr", "April"],
    ["May", "May"],
    ["Jun", "June"],
    ["Jul", "July"],
    ["Aug", "August"],
    ["Sep", "September"],
    ["Oct", "October"],
    ["Nov", "November"],
    ["Dec", "December"]
] as [string, string][];

const EN_DAYS = [
    ["Sun", "Sunday"],
    ["Mon", "Monday"],
    ["Tue", "Tuesday"],
    ["Wed", "Wednesday"],
    ["Thu", "Thursday"],
    ["Fri", "Friday"],
    ["Sat", "Saturday"]
] as [string, string][];

type DayMonthStrings = {
    days?: [string, string][];
    months?: [string, string][];
}

/**
 * Formats date according to provided format in a token-by-token basis.
 * @param fmt Format string to be used.
 * @param date Date element to be formatted.
 * @param dayMonthStr Object containing optional `[string, string]` arrays with
 * day and month names to use in the format.
 * @yields Token of the formatted date according to the provided date.
 */
export default function* dateFmtTokens(
    fmt: string, date: Date, dayMonthStr: DayMonthStrings = {}
): Generator<string, void, void> {

    const chars = [...fmt].reverse();
    const days = dayMonthStr?.days ?? EN_DAYS;
    const months = dayMonthStr?.months ?? EN_MONTHS;

    while (chars.length) {
        const char = chars.pop()!;

        if (char === "%" && chars.length) {
            const nextChar = chars.pop()!;

            switch (nextChar) {
                case "%":
                    yield "%";
                    break;
                case "A":
                    yield days[date.getDay()]![1];
                    break;
                case "a":
                    yield days[date.getDay()]![0];
                    break;
                case "Y":
                    yield date.getFullYear().toFixed().padStart(4, "0");
                    break;
                case "y":
                    yield (date.getFullYear() % 100).toFixed().padStart(2, "0");
                    break;
                case "m":
                    yield (date.getMonth() + 1).toFixed().padStart(2, "0");
                    break;
                case "B":
                    yield months[date.getMonth()]![1];
                    break;
                case "b":
                    yield months[date.getMonth()]![0];
                    break;
                case "d":
                    yield date.getDate().toFixed().padStart(2, "0");
                    break;
                case "h":
                    yield date.getHours().toFixed().padStart(2, "0");
                    break;
                case "M":
                    yield date.getMinutes().toFixed().padStart(2, "0");
                    break;
                case "s":
                    yield date.getSeconds().toFixed().padStart(2, "0");
                    break;
                case "u":
                    yield date.getMilliseconds().toFixed().padStart(3, "0");
                    break;
                case "z":
                    const offset = date.getTimezoneOffset();
                    const [hours, mins] = [
                        Math.floor(Math.abs(offset) / 60).toFixed(0).padStart(2, "0"),
                        (Math.abs(offset) % 60).toFixed(0).padStart(2, "0")
                    ];
                    yield `${offset <= 0 ? "+" : "-"}${hours}:${mins}`;
                    break;
                default:
                    yield char + nextChar;
            }
        } else {
            yield char;
        }
    }
}
