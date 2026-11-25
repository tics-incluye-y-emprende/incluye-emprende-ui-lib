import {
  executeFormControlStrategy,
  FormControlInputStrategy,
  FormControlSelectStrategy,
  FormControlTextareaStrategy,
} from "../formControl";
import { FieldElement, RawValue } from "../models";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeFormControlStrategy", () => {
  it("creates the strategy of an input", () => {
    const input = document.createElement("input");
    expect(executeFormControlStrategy(input)).toBeInstanceOf(FormControlInputStrategy);
  });

  it("creates the strategy of a select", () => {
    const select = document.createElement("select");
    expect(executeFormControlStrategy(select)).toBeInstanceOf(FormControlSelectStrategy);
  });

  it("creates the strategy of a textarea", () => {
    const textarea = document.createElement("textarea");
    expect(executeFormControlStrategy(textarea)).toBeInstanceOf(FormControlTextareaStrategy);
  });

  it("throws an error with the tag name when the element is not supported", () => {
    const div = document.createElement("div") as unknown as FieldElement;
    expect(() => executeFormControlStrategy(div)).toThrow(/div/i);
  });
});

describe("FormControlInputStrategy", () => {
  it.each<[type: string, value: string, checked: boolean, rawValue: RawValue]>([
    ["text", "Nico", false, "Nico"],
    ["checkbox", "terms", true, "terms"],
    ["checkbox", "terms", false, "terms"],
    ["radio", "red", true, "red"],
    ["radio", "red", false, "red"],
    ["file", "", false, ""],
  ])(
    "reads type %s with value '%s' and checked=%s as %s",
    (type, value, checked, rawValue) => {
      const input = document.createElement("input");
      input.type = type;
      input.value = value;
      input.checked = checked;
      expect(new FormControlInputStrategy(input).getRawValue()).toBe(rawValue);
    },
  );

  it("shows the value of a text", () => {
    const input = document.createElement("input");
    new FormControlInputStrategy(input).setRawValue("Nico");
    expect(input.value).toBe("Nico");
  });

  it.each(["checkbox", "radio"])(
    "does not modify the checked state of a %s",
    (type) => {
      const input = document.createElement("input");
      input.type = type;
      input.value = "terms";
      new FormControlInputStrategy(input).setRawValue("terms");
      expect(input.checked).toBe(false);
      expect(input.value).toBe("terms");
    },
  );
});

describe("FormControlTextareaStrategy", () => {
  it.each(["two\nlines", ""])("reads the unmodified text '%s'", (value) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    expect(new FormControlTextareaStrategy(textarea).getRawValue()).toBe(value);
  });

  it.each<[rawValue: RawValue, value: string]>([
    ["Hello", "Hello"],
    ["", ""],
    [undefined, ""],
  ])("shows %s as '%s'", (rawValue, value) => {
    const textarea = document.createElement("textarea");
    textarea.value = "before";
    new FormControlTextareaStrategy(textarea).setRawValue(rawValue);
    expect(textarea.value).toBe(value);
  });

  it("does not write an equal value", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "Hello";
    const write = vi.spyOn(HTMLTextAreaElement.prototype, "value", "set");
    new FormControlTextareaStrategy(textarea).setRawValue("Hello");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("FormControlSelectStrategy with a single selection", () => {
  let select: HTMLSelectElement;

  beforeEach(() => {
    select = document.createElement("select");
    select.innerHTML = `
      <option value="">Choose a color</option>
      <option value="red">Red</option>
      <option value="blue" selected>Blue</option>
    `;
  });

  it("reads the selected value", () => {
    expect(new FormControlSelectStrategy(select).getRawValue()).toBe("blue");
  });

  it("reads the empty option as an empty text", () => {
    select.selectedIndex = 0;
    expect(new FormControlSelectStrategy(select).getRawValue()).toBe("");
  });

  it("reads an empty text when nothing is selected", () => {
    select.selectedIndex = -1;
    expect(new FormControlSelectStrategy(select).getRawValue()).toBe("");
  });

  it.each<[description: string, rawValue: RawValue, selectedIndex: number]>([
    ["the matching option", "red", 1],
    ["the empty option for undefined", undefined, 0],
    ["nothing for another value", "pink", -1],
  ])("selects %s", (_description, rawValue, selectedIndex) => {
    new FormControlSelectStrategy(select).setRawValue(rawValue);
    expect(select.selectedIndex).toBe(selectedIndex);
  });

  it("selects nothing for undefined when there is no empty option", () => {
    select.innerHTML = `<option value="red" selected>Red</option>`;
    new FormControlSelectStrategy(select).setRawValue(undefined);
    expect(select.selectedIndex).toBe(-1);
  });
});

describe("FormControlSelectStrategy with a multiple selection", () => {
  let select: HTMLSelectElement;

  beforeEach(() => {
    select = document.createElement("select");
    select.multiple = true;
    select.innerHTML = `
      <option value="red">Red</option>
      <option value="green" selected>Green</option>
      <option value="blue">Blue</option>
    `;
  });

  it("reads a list with the selected value", () => {
    expect(new FormControlSelectStrategy(select).getRawValue()).toEqual(["green"]);
  });

  it("reads the selected values in DOM order", () => {
    select.options[2].selected = true;
    select.options[0].selected = true;
    expect(new FormControlSelectStrategy(select).getRawValue()).toEqual(["red", "green", "blue"]);
  });

  it("reads an empty list when nothing is selected", () => {
    select.selectedIndex = -1;
    expect(new FormControlSelectStrategy(select).getRawValue()).toEqual([]);
  });

  it.each<
    [
      description: string,
      rawValue: RawValue,
      red: boolean,
      green: boolean,
      blue: boolean,
    ]
  >([
    ["only the matching options", ["red", "blue"], true, false, true],
    ["only the options that exist", ["red", "pink"], true, false, false],
    ["a single string as a list of one", "red", true, false, false],
    ["nothing for an empty list", [], false, false, false],
    ["nothing for undefined", undefined, false, false, false],
  ])("selects %s", (_description, rawValue, red, green, blue) => {
    new FormControlSelectStrategy(select).setRawValue(rawValue);
    expect(select.options[0].selected).toBe(red);
    expect(select.options[1].selected).toBe(green);
    expect(select.options[2].selected).toBe(blue);
  });
});
