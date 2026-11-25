import {
  CheckboxInputStrategy,
  executeFormControlInputStrategy,
  FileInputStrategy,
  RadioInputStrategy,
  TextInputStrategy,
} from "../formControlInput";
import { RawValue } from "../models";

let input: HTMLInputElement;

beforeEach(() => {
  input = document.createElement("input");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeFormControlInputStrategy", () => {
  it.each([
    ["text", TextInputStrategy],
    ["tel", TextInputStrategy],
    ["email", TextInputStrategy],
    ["password", TextInputStrategy],
    ["search", TextInputStrategy],
    ["url", TextInputStrategy],
    ["number", TextInputStrategy],
    ["date", TextInputStrategy],
    ["checkbox", CheckboxInputStrategy],
    ["radio", RadioInputStrategy],
    ["file", FileInputStrategy],
  ])("creates the strategy of type %s", (type, Strategy) => {
    input.type = type;
    expect(executeFormControlInputStrategy(input)).toBeInstanceOf(Strategy);
  });
});

describe("TextInputStrategy", () => {
  it.each([
    ["text", " Nico "],
    ["number", "3"],
    ["date", "2026-11-24"],
    ["text", ""],
  ])("reads the unmodified value of type %s: '%s'", (type, value) => {
    input.type = type;
    input.value = value;
    expect(new TextInputStrategy(input).getRawValue("before")).toBe(value);
  });

  it.each<[rawValue: RawValue, value: string]>([
    ["Ana", "Ana"],
    ["", ""],
    [undefined, ""],
  ])("shows %s as '%s'", (rawValue, value) => {
    input.value = "Nico";
    new TextInputStrategy(input).setRawValue(rawValue);
    expect(input.value).toBe(value);
  });

  it("does not write an equal value", () => {
    input.value = "Nico";
    const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
    new TextInputStrategy(input).setRawValue("Nico");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("CheckboxInputStrategy", () => {
  beforeEach(() => {
    input.type = "checkbox";
  });

  it("reads its value when it is checked", () => {
    input.value = "terms";
    input.checked = true;
    expect(new CheckboxInputStrategy(input).getRawValue(undefined)).toBe("terms");
  });

  it("reads 'on' when it has no value", () => {
    input.checked = true;
    expect(new CheckboxInputStrategy(input).getRawValue(undefined)).toBe("on");
  });

  it("reads undefined when it is not checked", () => {
    input.value = "terms";
    expect(new CheckboxInputStrategy(input).getRawValue("terms")).toBeUndefined();
  });

  it.each<[rawValue: RawValue, before: boolean, after: boolean]>([
    ["terms", false, true],
    ["terms", true, true],
    ["other", true, false],
    ["other", false, false],
    ["", true, false],
    [undefined, true, false],
  ])("with %s goes from checked=%s to %s", (rawValue, before, after) => {
    input.value = "terms";
    input.checked = before;
    new CheckboxInputStrategy(input).setRawValue(rawValue);
    expect(input.checked).toBe(after);
    expect(input.value).toBe("terms");
  });

  it("does not write an equal state", () => {
    input.value = "terms";
    input.checked = true;
    const write = vi.spyOn(HTMLInputElement.prototype, "checked", "set");
    new CheckboxInputStrategy(input).setRawValue("terms");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("RadioInputStrategy", () => {
  beforeEach(() => {
    input.type = "radio";
    input.value = "red";
  });

  it("reads its value when it is checked", () => {
    input.checked = true;
    expect(new RadioInputStrategy(input).getRawValue("blue")).toBe("red");
  });

  it("keeps the current value when it is not checked", () => {
    expect(new RadioInputStrategy(input).getRawValue("blue")).toBe("blue");
  });

  it("keeps undefined when it is not checked", () => {
    expect(new RadioInputStrategy(input).getRawValue(undefined)).toBeUndefined();
  });

  it.each<[rawValue: RawValue, before: boolean, after: boolean]>([
    ["red", false, true],
    ["red", true, true],
    ["blue", true, false],
    ["blue", false, false],
    ["", true, false],
    [undefined, true, false],
  ])("with %s goes from checked=%s to %s", (rawValue, before, after) => {
    input.checked = before;
    new RadioInputStrategy(input).setRawValue(rawValue);
    expect(input.checked).toBe(after);
    expect(input.value).toBe("red");
  });

  it("does not write an equal state", () => {
    input.checked = true;
    const write = vi.spyOn(HTMLInputElement.prototype, "checked", "set");
    new RadioInputStrategy(input).setRawValue("red");
    expect(write).not.toHaveBeenCalled();
  });
});

// Browsers do not allow selecting a file by code, so the input's value is mocked.
describe("FileInputStrategy", () => {
  beforeEach(() => {
    input.type = "file";
  });

  it("reads the value given by the browser", () => {
    vi.spyOn(HTMLInputElement.prototype, "value", "get").mockReturnValue(
      "C:\\fakepath\\cv.pdf",
    );
    expect(new FileInputStrategy(input).getRawValue(undefined)).toBe(
      "C:\\fakepath\\cv.pdf",
    );
  });

  it("reads an empty text when there is no file", () => {
    expect(new FileInputStrategy(input).getRawValue(undefined)).toBe("");
  });

  it.each<[rawValue: RawValue]>([[undefined], [""]])(
    "clears the selection with '%s'",
    (rawValue) => {
      vi.spyOn(HTMLInputElement.prototype, "value", "get").mockReturnValue(
        "C:\\fakepath\\cv.pdf",
      );
      const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
      new FileInputStrategy(input).setRawValue(rawValue);
      expect(write).toHaveBeenCalledWith("");
    },
  );

  it("ignores any other value", () => {
    const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
    new FileInputStrategy(input).setRawValue("C:\\fakepath\\other.pdf");
    expect(write).not.toHaveBeenCalled();
  });
});
