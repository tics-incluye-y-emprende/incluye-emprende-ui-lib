import {
  CheckboxInputStrategy,
  executeFormControlInputStrategy,
  FileInputStrategy,
  RadioInputStrategy,
  TextInputStrategy,
} from "../formControlInput";
import { ElementValue } from "../models";

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
  it.each<[value: ElementValue, text: string]>([
    [" Ana ", " Ana "],
    ["", ""],
    [undefined, ""],
    [true, "true"],
    [false, "false"],
  ])("shows %s as '%s'", (value, text) => {
    input.value = "Nico";
    new TextInputStrategy(input).setElementValue(value);
    expect(input.value).toBe(text);
  });

  it.each([
    ["number", "3"],
    ["date", "2026-11-24"],
  ])("shows the value of type %s", (type, value) => {
    input.type = type;
    new TextInputStrategy(input).setElementValue(value);
    expect(input.value).toBe(value);
  });

  it("does not write an equal value", () => {
    input.value = "Nico";
    const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
    new TextInputStrategy(input).setElementValue("Nico");
    expect(write).not.toHaveBeenCalled();
  });
});

describe("CheckboxInputStrategy", () => {
  it.each<[value: ElementValue, before: boolean, checked: boolean]>([
    [true, false, true],
    [true, true, true],
    [false, true, false],
    [false, false, false],
    ["terms", false, true],
    ["other", true, false],
    ["", true, false],
    [undefined, true, false],
  ])(
    "with %s and checked=%s, checked is %s",
    (value, before, checked) => {
      input.type = "checkbox";
      input.value = "terms";
      input.checked = before;
      new CheckboxInputStrategy(input).setElementValue(value);
      expect(input.checked).toBe(checked);
      expect(input.value).toBe("terms");
    },
  );
});

describe("RadioInputStrategy", () => {
  it.each<
    [
      value: ElementValue,
      radioValue: string,
      before: boolean,
      checked: boolean,
    ]
  >([
    ["red", "red", false, true],
    ["red", "red", true, true],
    ["blue", "red", true, false],
    ["", "red", true, false],
    [undefined, "red", true, false],
    [true, "true", false, true],
    [true, "false", true, false],
    [false, "false", false, true],
    [false, "true", true, false],
  ])(
    "with %s, the radio '%s' with checked=%s has checked=%s",
    (value, radioValue, before, checked) => {
      input.type = "radio";
      input.value = radioValue;
      input.checked = before;
      new RadioInputStrategy(input).setElementValue(value);
      expect(input.checked).toBe(checked);
      expect(input.value).toBe(radioValue);
    },
  );
});

// Browsers do not allow selecting a file by code, so the input's value is mocked.
describe("FileInputStrategy", () => {
  beforeEach(() => {
    input.type = "file";
  });

  it.each<[value: ElementValue]>([[undefined], [""]])(
    "clears the selection with '%s'",
    (value) => {
      vi.spyOn(HTMLInputElement.prototype, "value", "get").mockReturnValue(
        "C:\\fakepath\\cv.pdf",
      );
      const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
      new FileInputStrategy(input).setElementValue(value);
      expect(write).toHaveBeenCalledWith("");
    },
  );

  it.each<[value: ElementValue]>([["C:\\fakepath\\other.pdf"], [true], [false]])(
    "ignores %s",
    (value) => {
      const write = vi.spyOn(HTMLInputElement.prototype, "value", "set");
      new FileInputStrategy(input).setElementValue(value);
      expect(write).not.toHaveBeenCalled();
    },
  );
});

describe("getElementState", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    ["text", " Nico ", "input:text"],
    ["number", "3", "input:number"],
    ["date", "2026-11-26", "input:date"],
    ["time", "09:30", "input:time"],
    ["text", "", "input:text"],
  ])("reads the text of type %s: '%s'", (type, value, kind) => {
    input.type = type;
    input.value = value;
    expect(new TextInputStrategy(input).getElementState()).toEqual({
      kind,
      value,
      checked: false,
      files: [],
      badInput: false,
    });
  });

  it("reads the bad input of the browser", () => {
    input.type = "number";
    vi.spyOn(input, "validity", "get").mockReturnValue({
      badInput: true,
    } as ValidityState);
    expect(new TextInputStrategy(input).getElementState().badInput).toBe(true);
  });

  it.each([true, false])("reads a checkbox with checked=%s", (checked) => {
    input.type = "checkbox";
    input.value = "terms";
    input.checked = checked;
    expect(new CheckboxInputStrategy(input).getElementState()).toEqual({
      kind: "input:checkbox",
      value: "terms",
      checked,
      files: [],
      badInput: false,
    });
  });

  it("reads the checked radio of its group in the form", () => {
    document.body.innerHTML = `
      <form>
        <input type="radio" name="size" value="s" />
        <input type="radio" name="size" value="l" checked />
        <input type="radio" name="other" value="x" checked />
      </form>
      <input type="radio" name="size" value="m" checked />
    `;
    const small = document.querySelector<HTMLInputElement>('[value="s"]')!;
    expect(new RadioInputStrategy(small).getElementState()).toEqual({
      kind: "input:radio",
      value: "l",
      checked: true,
      files: [],
      badInput: false,
    });
  });

  it("reads the group in the document when the radio has no form", () => {
    document.body.innerHTML = `
      <input type="radio" name="size" value="s" />
      <input type="radio" name="size" value="l" checked />
    `;
    const small = document.querySelector<HTMLInputElement>('[value="s"]')!;
    expect(new RadioInputStrategy(small).getElementState().value).toBe("l");
  });

  it("reads a group without checked radios", () => {
    document.body.innerHTML = `
      <form>
        <input type="radio" name="size" value="s" />
        <input type="radio" name="size" value="l" />
      </form>
    `;
    const small = document.querySelector<HTMLInputElement>('[value="s"]')!;
    expect(new RadioInputStrategy(small).getElementState()).toEqual({
      kind: "input:radio",
      value: "",
      checked: false,
      files: [],
      badInput: false,
    });
  });

  it("reads the chosen files and the path given by the browser", () => {
    const file = new File(["content"], "cv.pdf");
    input.type = "file";
    vi.spyOn(input, "files", "get").mockReturnValue([file] as unknown as FileList);
    vi.spyOn(HTMLInputElement.prototype, "value", "get").mockReturnValue(
      "C:\\fakepath\\cv.pdf",
    );
    expect(new FileInputStrategy(input).getElementState()).toEqual({
      kind: "input:file",
      value: "C:\\fakepath\\cv.pdf",
      checked: false,
      files: [file],
      badInput: false,
    });
  });

  it("reads a file input without files", () => {
    input.type = "file";
    expect(new FileInputStrategy(input).getElementState()).toEqual({
      kind: "input:file",
      value: "",
      checked: false,
      files: [],
      badInput: false,
    });
  });
});
