import { ElementState } from "../../formControl/models";
import {
  CheckedRequiredValidationStrategy,
  CustomValidationStrategy,
  DateMaxValueValidationStrategy,
  DateMinValueValidationStrategy,
  FileRequiredValidationStrategy,
  MaxLengthValidationStrategy,
  MaxValueValidationStrategy,
  MinLengthValidationStrategy,
  MinValueValidationStrategy,
  PatternValidationStrategy,
  RequiredValidationStrategy,
} from "../validationStrategy";

const file = new File(["content"], "cv.pdf");

/** [description, kind, value, checked, files, badInput, expected result] */
type Case = [
  description: string,
  kind: ElementState["kind"],
  value: string,
  checked: boolean,
  files: File[],
  badInput: boolean,
  isValid: boolean,
];

describe("RequiredValidationStrategy", () => {
  it.each<Case>([
    ["accepts a text", "input:text", "Nico", false, [], false, true],
    ["accepts the text '0'", "input:text", "0", false, [], false, true],
    ["accepts a blank space", "input:text", " ", false, [], false, true],
    ["rejects an empty text", "input:text", "", false, [], false, false],
    ["rejects an empty textarea", "textarea", "", false, [], false, false],
    ["accepts a selected option", "select", "red", false, [], false, true],
    ["rejects the empty option", "select", "", false, [], false, false],
    ["accepts a number", "input:number", "3", false, [], false, true],
    ["rejects an empty number", "input:number", "", false, [], false, false],
    ["accepts a number with bad input", "input:number", "", false, [], true, true],
    ["accepts a date", "input:date", "2026-11-26", false, [], false, true],
    ["rejects an empty date", "input:date", "", false, [], false, false],
    ["accepts another type with a value", "input:color", "#000000", false, [], false, true],
  ])("%s", (_description, kind, value, checked, files, badInput, isValid) => {
    const required = new RequiredValidationStrategy({ propValue: true });
    expect(required.validate({ kind, value, checked, files, badInput })).toBe(isValid);
  });

  it("accepts an empty text when it is not required", () => {
    const notRequired = new RequiredValidationStrategy({ propValue: false });
    expect(
      notRequired.validate({ kind: "input:text", value: "", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });
});

describe("CheckedRequiredValidationStrategy", () => {
  it("is a required strategy", () => {
    expect(new CheckedRequiredValidationStrategy({ propValue: true })).toBeInstanceOf(
      RequiredValidationStrategy,
    );
  });

  it.each<Case>([
    ["accepts a checked checkbox", "input:checkbox", "on", true, [], false, true],
    ["rejects an unchecked checkbox, although it has a value", "input:checkbox", "on", false, [], false, false],
    ["accepts a group with a checked radio", "input:radio", "red", true, [], false, true],
    ["rejects a group without checked radios", "input:radio", "", false, [], false, false],
  ])("%s", (_description, kind, value, checked, files, badInput, isValid) => {
    const required = new CheckedRequiredValidationStrategy({ propValue: true });
    expect(required.validate({ kind, value, checked, files, badInput })).toBe(isValid);
  });

  it("accepts an unchecked checkbox when it is not required", () => {
    const notRequired = new CheckedRequiredValidationStrategy({ propValue: false });
    expect(
      notRequired.validate({ kind: "input:checkbox", value: "on", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });
});

describe("FileRequiredValidationStrategy", () => {
  it("is a required strategy", () => {
    expect(new FileRequiredValidationStrategy({ propValue: true })).toBeInstanceOf(
      RequiredValidationStrategy,
    );
  });

  it.each<Case>([
    ["accepts a file", "input:file", "C:\\fakepath\\cv.pdf", false, [file], false, true],
    ["rejects a file input without files", "input:file", "", false, [], false, false],
    [
      "rejects a file input with a value but without files",
      "input:file",
      "C:\\fakepath\\cv.pdf",
      false,
      [],
      false,
      false,
    ],
  ])("%s", (_description, kind, value, checked, files, badInput, isValid) => {
    const required = new FileRequiredValidationStrategy({ propValue: true });
    expect(required.validate({ kind, value, checked, files, badInput })).toBe(isValid);
  });

  it("accepts a file input without files when it is not required", () => {
    const notRequired = new FileRequiredValidationStrategy({ propValue: false });
    expect(
      notRequired.validate({ kind: "input:file", value: "", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });
});

describe("MinLengthValidationStrategy", () => {
  it.each<[description: string, value: string, isValid: boolean]>([
    ["rejects a text one character below the limit", "ab", false],
    ["accepts a text with the exact length", "abc", true],
    ["accepts a longer text", "abcd", true],
    ["rejects an empty text", "", false],
  ])("%s", (_description, value, isValid) => {
    const minLength = new MinLengthValidationStrategy({ propValue: 3 });
    expect(
      minLength.validate({ kind: "input:text", value, checked: false, files: [], badInput: false }),
    ).toBe(isValid);
  });

  it("uses the configured limit", () => {
    const minLength = new MinLengthValidationStrategy({ propValue: 5 });
    expect(
      minLength.validate({ kind: "textarea", value: "abcd", checked: false, files: [], badInput: false }),
    ).toBe(false);
  });
});

describe("MaxLengthValidationStrategy", () => {
  it.each<[description: string, value: string, isValid: boolean]>([
    ["accepts a shorter text", "ab", true],
    ["accepts a text with the exact length", "abc", true],
    ["rejects a text one character above the limit", "abcd", false],
    ["accepts an empty text", "", true],
  ])("%s", (_description, value, isValid) => {
    const maxLength = new MaxLengthValidationStrategy({ propValue: 3 });
    expect(
      maxLength.validate({ kind: "input:text", value, checked: false, files: [], badInput: false }),
    ).toBe(isValid);
  });

  it("uses the configured limit", () => {
    const maxLength = new MaxLengthValidationStrategy({ propValue: 5 });
    expect(
      maxLength.validate({ kind: "textarea", value: "abcd", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });
});

describe("PatternValidationStrategy", () => {
  it.each<[description: string, value: string, isValid: boolean]>([
    ["accepts a text that matches completely", "123", true],
    ["rejects a text that does not match", "abc", false],
    ["rejects extra text before the match", "a123", false],
    ["rejects extra text after the match", "123a", false],
    ["rejects an empty text", "", false],
  ])("%s", (_description, value, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "[0-9]{3}" });
    expect(
      pattern.validate({ kind: "input:text", value, checked: false, files: [], badInput: false }),
    ).toBe(isValid);
  });

  it.each<[description: string, value: string, isValid: boolean]>([
    ["accepts the first alternative", "cat", true],
    ["accepts the last alternative", "dog", true],
    ["rejects extra text after the first alternative", "cats", false],
    ["rejects extra text before the last alternative", "hotdog", false],
  ])("%s", (_description, value, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "cat|dog" });
    expect(
      pattern.validate({ kind: "input:text", value, checked: false, files: [], badInput: false }),
    ).toBe(isValid);
  });

  it.each<[description: string, value: string, isValid: boolean]>([
    ["accepts an empty text when the pattern matches it", "", true],
    ["accepts a text that matches the optional pattern", "123", true],
    ["rejects a text that does not match the optional pattern", "12", false],
  ])("%s", (_description, value, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "([0-9]{3})?" });
    expect(
      pattern.validate({ kind: "input:text", value, checked: false, files: [], badInput: false }),
    ).toBe(isValid);
  });
});

/** [description, value, badInput, expected result] */
type RangeCase = [description: string, value: string, badInput: boolean, isValid: boolean];

describe("MinValueValidationStrategy", () => {
  it.each<RangeCase>([
    ["rejects a smaller number", "8", false, false],
    ["accepts the exact number", "9", false, true],
    ["accepts a greater number", "9.5", false, true],
    ["compares numbers by value, not as texts", "10", false, true],
    ["rejects a negative number", "-10", false, false],
    ["rejects an empty value", "", false, false],
    ["rejects a bad input", "", true, false],
  ])("%s", (_description, value, badInput, isValid) => {
    const min = new MinValueValidationStrategy({ propValue: 9 });
    expect(min.validate({ kind: "input:number", value, checked: false, files: [], badInput })).toBe(isValid);
  });

  it("accepts a limit written as a text", () => {
    const min = new MinValueValidationStrategy({ propValue: "9" });
    expect(
      min.validate({ kind: "input:range", value: "10", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });

  it("accepts 0 with the limit 0", () => {
    const min = new MinValueValidationStrategy({ propValue: 0 });
    expect(
      min.validate({ kind: "input:number", value: "0", checked: false, files: [], badInput: false }),
    ).toBe(true);
  });
});

describe("DateMinValueValidationStrategy", () => {
  it("is a min strategy", () => {
    expect(new DateMinValueValidationStrategy({ propValue: "2026-11-23" })).toBeInstanceOf(
      MinValueValidationStrategy,
    );
  });

  it.each<[description: string, kind: ElementState["kind"], limit: string, value: string, isValid: boolean]>([
    ["rejects an earlier date", "input:date", "2026-11-23", "2026-11-22", false],
    ["accepts the exact date", "input:date", "2026-11-23", "2026-11-23", true],
    ["accepts a later date", "input:date", "2026-11-23", "2026-11-24", true],
    ["compares dates by year first", "input:date", "2026-11-23", "2027-01-01", true],
    ["rejects an earlier time", "input:time", "09:30", "09:29", false],
    ["accepts a later time", "input:time", "09:30", "10:00", true],
    ["accepts a later time with seconds", "input:time", "09:30", "09:30:01", true],
    ["rejects an earlier month", "input:month", "2026-11", "2026-10", false],
    ["accepts a later week", "input:week", "2026-W48", "2026-W49", true],
    ["rejects an earlier date and time", "input:datetime-local", "2026-11-26T09:30", "2026-11-26T09:00", false],
    ["rejects an empty value", "input:date", "2026-11-23", "", false],
  ])("%s", (_description, kind, limit, value, isValid) => {
    const min = new DateMinValueValidationStrategy({ propValue: limit });
    expect(min.validate({ kind, value, checked: false, files: [], badInput: false })).toBe(isValid);
  });

  it("rejects a bad input", () => {
    const min = new DateMinValueValidationStrategy({ propValue: "2026-11-23" });
    expect(
      min.validate({ kind: "input:date", value: "", checked: false, files: [], badInput: true }),
    ).toBe(false);
  });
});

describe("MaxValueValidationStrategy", () => {
  it.each<RangeCase>([
    ["accepts a smaller number", "9", false, true],
    ["accepts the exact number", "10", false, true],
    ["rejects a slightly greater number", "10.5", false, false],
    ["compares numbers by value, not as texts", "9", false, true],
    ["accepts a negative number", "-20", false, true],
    ["rejects an empty value", "", false, false],
    ["rejects a bad input", "", true, false],
  ])("%s", (_description, value, badInput, isValid) => {
    const max = new MaxValueValidationStrategy({ propValue: 10 });
    expect(max.validate({ kind: "input:number", value, checked: false, files: [], badInput })).toBe(isValid);
  });

  it("accepts a limit written as a text", () => {
    const max = new MaxValueValidationStrategy({ propValue: "10" });
    expect(
      max.validate({ kind: "input:range", value: "11", checked: false, files: [], badInput: false }),
    ).toBe(false);
  });
});

describe("DateMaxValueValidationStrategy", () => {
  it("is a max strategy", () => {
    expect(new DateMaxValueValidationStrategy({ propValue: "2026-11-23" })).toBeInstanceOf(
      MaxValueValidationStrategy,
    );
  });

  it.each<[description: string, kind: ElementState["kind"], limit: string, value: string, isValid: boolean]>([
    ["accepts an earlier date", "input:date", "2026-11-23", "2026-11-22", true],
    ["accepts the exact date", "input:date", "2026-11-23", "2026-11-23", true],
    ["rejects a later date", "input:date", "2026-11-23", "2026-11-24", false],
    ["compares dates by year first", "input:date", "2026-11-23", "2027-01-01", false],
    ["accepts an earlier time", "input:time", "18:00", "09:00", true],
    ["rejects a later time", "input:time", "18:00", "18:01", false],
    ["rejects a later month", "input:month", "2026-11", "2026-12", false],
    ["rejects an empty value", "input:date", "2026-11-23", "", false],
  ])("%s", (_description, kind, limit, value, isValid) => {
    const max = new DateMaxValueValidationStrategy({ propValue: limit });
    expect(max.validate({ kind, value, checked: false, files: [], badInput: false })).toBe(isValid);
  });
});

describe("CustomValidationStrategy", () => {
  const state: ElementState = {
    kind: "input:checkbox",
    value: "on",
    checked: true,
    files: [],
    badInput: false,
  };

  it("accepts the element when the check returns true", () => {
    const custom = new CustomValidationStrategy({ propValue: () => true });
    expect(custom.validate(state)).toBe(true);
  });

  it("rejects the element when the check returns false", () => {
    const custom = new CustomValidationStrategy({ propValue: () => false });
    expect(custom.validate(state)).toBe(false);
  });

  it("passes the element state to the check without modifying it", () => {
    const check = vi.fn(() => true);
    const custom = new CustomValidationStrategy({ propValue: check });
    custom.validate(state);
    expect(check).toHaveBeenCalledWith(state);
  });
});

describe("errorType and errorMessage", () => {
  it.each([
    ["required", new RequiredValidationStrategy({ propValue: true, errorMessage: "Error" }), "valueMissing"],
    ["required of checked", new CheckedRequiredValidationStrategy({ propValue: true, errorMessage: "Error" }), "valueMissing"],
    ["required of files", new FileRequiredValidationStrategy({ propValue: true, errorMessage: "Error" }), "valueMissing"],
    ["minLength", new MinLengthValidationStrategy({ propValue: 3, errorMessage: "Error" }), "tooShort"],
    ["maxLength", new MaxLengthValidationStrategy({ propValue: 3, errorMessage: "Error" }), "tooLong"],
    ["pattern", new PatternValidationStrategy({ propValue: "", errorMessage: "Error" }), "patternMismatch"],
    ["min", new MinValueValidationStrategy({ propValue: 1, errorMessage: "Error" }), "rangeUnderflow"],
    ["min of dates", new DateMinValueValidationStrategy({ propValue: "", errorMessage: "Error" }), "rangeUnderflow"],
    ["max", new MaxValueValidationStrategy({ propValue: 1, errorMessage: "Error" }), "rangeOverflow"],
    ["max of dates", new DateMaxValueValidationStrategy({ propValue: "", errorMessage: "Error" }), "rangeOverflow"],
    ["custom", new CustomValidationStrategy({ propValue: () => true, errorMessage: "Error" }), "customError"],
  ])("%s has the type %s and its message", (_rule, strategy, type) => {
    expect(strategy.errorType).toBe(type);
    expect(strategy.errorMessage).toBe("Error");
  });

  it("has no message when it is not configured", () => {
    expect(new RequiredValidationStrategy({ propValue: true }).errorMessage).toBeUndefined();
  });
});
