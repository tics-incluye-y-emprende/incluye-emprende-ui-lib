import { RawValue } from "../../formControl/models";
import { ValidationRules, ValidationType } from "../models";
import {
  CustomValidationStrategy,
  MaxLengthValidationStrategy,
  MaxValueValidationStrategy,
  MinLengthValidationStrategy,
  MinValueValidationStrategy,
  PatternValidationStrategy,
  RequiredValidationStrategy,
} from "../validationStrategy";

/** [description, raw value, expected result] */
type Case = [description: string, rawValue: RawValue, isValid: boolean];

describe("RequiredValidationStrategy", () => {
  it.each<Case>([
    ["accepts a text", "Nico", true],
    ["accepts the text '0'", "0", true],
    ["accepts a group with one option", ["red"], true],
    ["accepts a group with several options", ["red", "blue"], true],
    ["rejects undefined", undefined, false],
    ["rejects an empty text", "", false],
    ["rejects a group without options", [], false],
  ])("%s", (_description, rawValue, isValid) => {
    const required = new RequiredValidationStrategy({ propValue: true });
    expect(required.validate(rawValue)).toBe(isValid);
  });

  it.each<Case>([
    ["accepts undefined when it is not required", undefined, true],
    ["accepts an empty text when it is not required", "", true],
    ["accepts an empty group when it is not required", [], true],
    ["accepts a text when it is not required", "Nico", true],
  ])("%s", (_description, rawValue, isValid) => {
    const notRequired = new RequiredValidationStrategy({ propValue: false });
    expect(notRequired.validate(rawValue)).toBe(isValid);
  });
});

describe("MinLengthValidationStrategy", () => {
  it.each<Case>([
    ["rejects a text one character below the limit", "ab", false],
    ["accepts a text with the exact length", "abc", true],
    ["accepts a longer text", "abcd", true],
    ["rejects an empty text", "", false],
    ["rejects undefined", undefined, false],
    ["accepts a group when all its elements pass", ["abc", "abcd"], true],
    ["rejects a group when one element fails", ["abc", "ab"], false],
    ["accepts a group without elements", [], true],
  ])("%s", (_description, rawValue, isValid) => {
    const minLength = new MinLengthValidationStrategy({ propValue: 3 });
    expect(minLength.validate(rawValue)).toBe(isValid);
  });

  it("uses the configured limit", () => {
    const minLength = new MinLengthValidationStrategy({ propValue: 5 });
    expect(minLength.validate("abcd")).toBe(false);
  });
});

describe("MaxLengthValidationStrategy", () => {
  it.each<Case>([
    ["accepts a shorter text", "ab", true],
    ["accepts a text with the exact length", "abc", true],
    ["rejects a text one character above the limit", "abcd", false],
    ["accepts an empty text", "", true],
    ["rejects undefined", undefined, false],
    ["accepts a group when all its elements pass", ["abc", "ab"], true],
    ["rejects a group when one element fails", ["abc", "abcd"], false],
    ["accepts a group without elements", [], true],
  ])("%s", (_description, rawValue, isValid) => {
    const maxLength = new MaxLengthValidationStrategy({ propValue: 3 });
    expect(maxLength.validate(rawValue)).toBe(isValid);
  });

  it("uses the configured limit", () => {
    const maxLength = new MaxLengthValidationStrategy({ propValue: 5 });
    expect(maxLength.validate("abcd")).toBe(true);
  });
});

describe("PatternValidationStrategy", () => {
  it.each<Case>([
    ["accepts a text that matches completely", "123", true],
    ["rejects a text that does not match", "abc", false],
    ["rejects extra text before the match", "a123", false],
    ["rejects extra text after the match", "123a", false],
    ["rejects an empty text", "", false],
    ["rejects undefined", undefined, false],
    ["accepts a group when all its elements pass", ["123", "456"], true],
    ["rejects a group when one element fails", ["123", "abc"], false],
    ["accepts a group without elements", [], true],
  ])("%s", (_description, rawValue, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "[0-9]{3}" });
    expect(pattern.validate(rawValue)).toBe(isValid);
  });

  it.each<Case>([
    ["accepts the first alternative", "cat", true],
    ["accepts the last alternative", "dog", true],
    ["rejects extra text after the first alternative", "cats", false],
    ["rejects extra text before the last alternative", "hotdog", false],
  ])("%s", (_description, rawValue, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "cat|dog" });
    expect(pattern.validate(rawValue)).toBe(isValid);
  });

  it.each<Case>([
    ["accepts an empty text when the pattern matches it", "", true],
    [
      "accepts undefined when the pattern matches an empty text",
      undefined,
      true,
    ],
    ["accepts a text that matches the optional pattern", "123", true],
    ["rejects a text that does not match the optional pattern", "12", false],
  ])("%s", (_description, rawValue, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue: "([0-9]{3})?" });
    expect(pattern.validate(rawValue)).toBe(isValid);
  });

  it.each<[pattern: string, isValid: boolean]>([
    ["", true],
    [".*", true],
    ["[0-9]*", true],
    ["([0-9]{3})?", true],
    ["|[0-9]{3}", true],
    [".+", false],
    ["undefined", false],
  ])("evaluates undefined with the pattern '%s' as %s", (propValue, isValid) => {
    const pattern = new PatternValidationStrategy({ propValue });
    expect(pattern.validate(undefined)).toBe(isValid);
  });
});

describe("MinValueValidationStrategy", () => {
  it.each<Case>([
    ["rejects a smaller number", "8", false],
    ["accepts the exact number", "9", true],
    ["accepts a greater number", "9.5", true],
    ["compares numbers by value, not as text", "10", true],
    ["rejects a negative number", "-10", false],
    ["rejects an empty text", "", false],
    ["rejects undefined", undefined, false],
    ["accepts a group when all its elements pass", ["9", "10"], true],
    ["rejects a group when one element fails", ["9", "8"], false],
    ["accepts a group without elements", [], true],
    ["rejects a text that is not a number", "abc", false],
    ["rejects a group when one element is not a number", ["9", "abc"], false],
  ])("%s", (_description, rawValue, isValid) => {
    const min = new MinValueValidationStrategy({ propValue: "9" });
    expect(min.validate(rawValue)).toBe(isValid);
  });

  it.each<Case>([
    ["rejects an earlier date", "2026-11-22", false],
    ["accepts the exact date", "2026-11-23", true],
    ["accepts a later date", "2026-11-24", true],
    ["rejects a text that is not a date", "abc", false],
    ["compares dates by year first", "2027-01-01", true],
  ])("%s", (_description, rawValue, isValid) => {
    const min = new MinValueValidationStrategy({ propValue: "2026-11-23" });
    expect(min.validate(rawValue)).toBe(isValid);
  });
});

describe("MaxValueValidationStrategy", () => {
  it.each<Case>([
    ["accepts a smaller number", "9", true],
    ["accepts the exact number", "10", true],
    ["rejects a slightly greater number", "10.5", false],
    ["rejects a greater number", "11", false],
    ["accepts a negative number", "-20", true],
    ["rejects an empty text", "", false],
    ["rejects undefined", undefined, false],
    ["accepts a group when all its elements pass", ["10", "9"], true],
    ["rejects a group when one element fails", ["10", "11"], false],
    ["accepts a group without elements", [], true],
    ["rejects a text that is not a number", "abc", false],
    ["rejects a group when one element is not a number", ["10", "abc"], false],
  ])("%s", (_description, rawValue, isValid) => {
    const max = new MaxValueValidationStrategy({ propValue: "10" });
    expect(max.validate(rawValue)).toBe(isValid);
  });

  it.each<Case>([
    ["accepts an earlier date", "2026-11-22", true],
    ["accepts the exact date", "2026-11-23", true],
    ["rejects a later date", "2026-11-24", false],
    ["rejects a text that is not a date", "abc", false],
    ["compares dates by year first", "2027-01-01", false],
  ])("%s", (_description, rawValue, isValid) => {
    const max = new MaxValueValidationStrategy({ propValue: "2026-11-23" });
    expect(max.validate(rawValue)).toBe(isValid);
  });
});

describe("CustomValidationStrategy", () => {
  it("accepts the value when the check returns true", () => {
    const custom = new CustomValidationStrategy({ propValue: () => true });
    expect(custom.validate("Nico")).toBe(true);
  });

  it("accepts undefined when the check accepts it", () => {
    const custom = new CustomValidationStrategy({
      propValue: (rawValue) => rawValue === undefined,
    });
    expect(custom.validate(undefined)).toBe(true);
  });

  it("rejects undefined when the check rejects it", () => {
    const custom = new CustomValidationStrategy({
      propValue: (rawValue) => rawValue !== undefined,
    });
    expect(custom.validate(undefined)).toBe(false);
  });

  it("rejects the value when the check returns false", () => {
    const custom = new CustomValidationStrategy({ propValue: () => false });
    expect(custom.validate("Nico")).toBe(false);
  });

  it.each<[description: string, rawValue: RawValue]>([
    ["a text", "Nico"],
    ["a group", ["red", "blue"]],
    ["an empty text", ""],
    ["undefined", undefined],
  ])(
    "passes %s to the check without modifying it",
    (_description, rawValue) => {
      const check = vi.fn(() => true);
      const custom = new CustomValidationStrategy({ propValue: check });
      custom.validate(rawValue);
      expect(check).toHaveBeenCalledWith(rawValue);
    },
  );
});
