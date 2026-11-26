import {
  executeFormControlStrategy,
  FormControlInputStrategy,
  FormControlSelectStrategy,
  FormControlTextareaStrategy,
} from "../formControl";
import { ElementValue, FieldElement } from "../models";

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

  it("throws an error with a multiple select", () => {
    const select = document.createElement("select");
    select.multiple = true;
    expect(() => executeFormControlStrategy(select)).toThrow(/multiple/i);
  });
});

describe("FormControlInputStrategy", () => {
  it("shows the text of a text input", () => {
    const input = document.createElement("input");
    new FormControlInputStrategy(input).setElementValue("Nico");
    expect(input.value).toBe("Nico");
  });

  it("checks a checkbox", () => {
    const input = document.createElement("input");
    input.type = "checkbox";
    new FormControlInputStrategy(input).setElementValue(true);
    expect(input.checked).toBe(true);
  });

  it("checks a radio", () => {
    const input = document.createElement("input");
    input.type = "radio";
    input.value = "red";
    new FormControlInputStrategy(input).setElementValue("red");
    expect(input.checked).toBe(true);
  });
});

describe("FormControlTextareaStrategy", () => {
  it.each<[value: ElementValue, text: string]>([
    ["two\nlines", "two\nlines"],
    ["", ""],
    [undefined, ""],
    [true, "true"],
    [false, "false"],
  ])("shows %s as '%s'", (value, text) => {
    const textarea = document.createElement("textarea");
    textarea.value = "before";
    new FormControlTextareaStrategy(textarea).setElementValue(value);
    expect(textarea.value).toBe(text);
  });

  it("does not write an equal value", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "Hello";
    const write = vi.spyOn(HTMLTextAreaElement.prototype, "value", "set");
    new FormControlTextareaStrategy(textarea).setElementValue("Hello");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("FormControlSelectStrategy", () => {
  let select: HTMLSelectElement;

  beforeEach(() => {
    select = document.createElement("select");
    select.innerHTML = `
      <option value="">Choose</option>
      <option value="red">Red</option>
      <option value="blue" selected>Blue</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    `;
  });

  it.each<[description: string, value: ElementValue, selectedIndex: number]>([
    ["the matching option", "red", 1],
    ["the empty option for an empty text", "", 0],
    ["the empty option for undefined", undefined, 0],
    ["the option 'true' for true", true, 3],
    ["the option 'false' for false", false, 4],
    ["nothing for another value", "pink", -1],
  ])("selects %s", (_description, value, selectedIndex) => {
    new FormControlSelectStrategy(select).setElementValue(value);
    expect(select.selectedIndex).toBe(selectedIndex);
  });

  it("selects nothing for undefined when there is no empty option", () => {
    select.innerHTML = `<option value="red" selected>Red</option>`;
    new FormControlSelectStrategy(select).setElementValue(undefined);
    expect(select.selectedIndex).toBe(-1);
  });
});

describe("getElementState", () => {
  it("reads a text input with its type", () => {
    const input = document.createElement("input");
    input.type = "email";
    input.value = "a@b.co";
    expect(new FormControlInputStrategy(input).getElementState()).toEqual({
      kind: "input:email",
      value: "a@b.co",
      checked: false,
      files: [],
      badInput: false,
    });
  });

  it("reads a textarea", () => {
    const textarea = document.createElement("textarea");
    textarea.value = "two\nlines";
    expect(new FormControlTextareaStrategy(textarea).getElementState()).toEqual({
      kind: "textarea",
      value: "two\nlines",
      checked: false,
      files: [],
      badInput: false,
    });
  });

  it.each<[description: string, selectedIndex: number, value: string]>([
    ["the selected option", 1, "red"],
    ["the empty option", 0, ""],
    ["an empty text when nothing is selected", -1, ""],
  ])("reads %s of a select", (_description, selectedIndex, value) => {
    const select = document.createElement("select");
    select.innerHTML = `
      <option value="">Choose</option>
      <option value="red">Red</option>
    `;
    select.selectedIndex = selectedIndex;
    expect(new FormControlSelectStrategy(select).getElementState()).toEqual({
      kind: "select",
      value,
      checked: false,
      files: [],
      badInput: false,
    });
  });
});
