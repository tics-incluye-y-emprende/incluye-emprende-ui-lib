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
    expect(new TextInputStrategy(input).getRawValue()).toBe(value);
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
    input.value = "terms";
  });

  it.each([true, false])("reads its value when checked is %s", (checked) => {
    input.checked = checked;
    expect(new CheckboxInputStrategy(input).getRawValue()).toBe("terms");
  });

  it("reads 'on' when it has no value", () => {
    input.removeAttribute("value");
    expect(new CheckboxInputStrategy(input).getRawValue()).toBe("on");
  });

  it.each<[rawValue: RawValue, checked: boolean]>([
    ["terms", false],
    ["terms", true],
    ["other", false],
    ["other", true],
    ["", true],
    [undefined, true],
  ])(
    "setRawValue with %s does not modify checked=%s nor its value",
    (rawValue, checked) => {
      input.checked = checked;
      new CheckboxInputStrategy(input).setRawValue(rawValue);
      expect(input.checked).toBe(checked);
      expect(input.value).toBe("terms");
    },
  );
});

describe("RadioInputStrategy", () => {
  beforeEach(() => {
    input.type = "radio";
    input.value = "red";
  });

  it.each([true, false])("reads its value when checked is %s", (checked) => {
    input.checked = checked;
    expect(new RadioInputStrategy(input).getRawValue()).toBe("red");
  });

  it.each<[rawValue: RawValue, checked: boolean]>([
    ["red", false],
    ["red", true],
    ["other", false],
    ["other", true],
    ["", true],
    [undefined, true],
  ])(
    "setRawValue with %s does not modify checked=%s nor its value",
    (rawValue, checked) => {
      input.checked = checked;
      new RadioInputStrategy(input).setRawValue(rawValue);
      expect(input.checked).toBe(checked);
      expect(input.value).toBe("red");
    },
  );
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
    expect(new FileInputStrategy(input).getRawValue()).toBe(
      "C:\\fakepath\\cv.pdf",
    );
  });

  it("reads an empty text when there is no file", () => {
    expect(new FileInputStrategy(input).getRawValue()).toBe("");
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
