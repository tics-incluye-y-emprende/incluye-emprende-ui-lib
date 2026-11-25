import { RawValue } from "../../formControl/models";
import { ValidationRules, ValidationsConfig, ValidationType } from "../models";
import { Validator, validationStrategiesPerProp } from "../validator";
import {
  CustomValidationStrategy,
  MaxLengthValidationStrategy,
  MaxValueValidationStrategy,
  MinLengthValidationStrategy,
  MinValueValidationStrategy,
  PatternValidationStrategy,
  RequiredValidationStrategy,
} from "../validationStrategy";

describe("validationStrategiesPerProp", () => {
  it("maps each rule to its strategy", () => {
    expect(validationStrategiesPerProp).toEqual({
      required: RequiredValidationStrategy,
      minLength: MinLengthValidationStrategy,
      maxLength: MaxLengthValidationStrategy,
      pattern: PatternValidationStrategy,
      min: MinValueValidationStrategy,
      max: MaxValueValidationStrategy,
      custom: CustomValidationStrategy,
    });
  });
});

describe("Validator", () => {
  describe("isValid of the field", () => {
    type Case = [
      description: string,
      validations: ValidationsConfig,
      rawValue: RawValue,
      isValid: boolean,
    ];

    it.each<Case>([
      ["accepts any text", {}, "Nico", true],
      ["accepts an empty text", {}, "", true],
      ["accepts an empty group", {}, [], true],
    ])("without rules: %s", (_description, validations, rawValue, isValid) => {
      const validator = new Validator({ rawValue, validations });
      expect(validator.isValid).toBe(isValid);
    });

    it.each<Case>([
      ["accepts a text", { required: { propValue: true } }, "Nico", true],
      ["accepts a group", { required: { propValue: true } }, ["red"], true],
      ["rejects undefined", { required: { propValue: true } }, undefined, false],
      ["rejects an empty text", { required: { propValue: true } }, "", false],
      ["rejects an empty group", { required: { propValue: true } }, [], false],
      [
        "accepts a value that passes all the rules",
        {
          required: { propValue: true },
          minLength: { propValue: 3 },
          pattern: { propValue: "[a-z]+" },
        },
        "abc",
        true,
      ],
      [
        "rejects a value that fails only one rule",
        {
          required: { propValue: true },
          minLength: { propValue: 3 },
          pattern: { propValue: "[a-z]+" },
        },
        "ab",
        false,
      ],
      [
        "rejects a value that fails several rules",
        {
          required: { propValue: true },
          minLength: { propValue: 3 },
          pattern: { propValue: "[a-z]+" },
        },
        "1",
        false,
      ],
      [
        "accepts a group when all its elements pass",
        { required: { propValue: true }, minLength: { propValue: 3 } },
        ["abc", "abcd"],
        true,
      ],
      [
        "rejects a group when one element fails",
        { required: { propValue: true }, minLength: { propValue: 3 } },
        ["abc", "ab"],
        false,
      ],
      [
        "rejects a value that min cannot compare",
        { required: { propValue: true }, min: { propValue: "9" } },
        "abc",
        false,
      ],
    ])("required: %s", (_description, validations, rawValue, isValid) => {
      const validator = new Validator({ rawValue, validations });
      expect(validator.isValid).toBe(isValid);
    });

    it.each<Case>([
      ["accepts a value that passes", { minLength: { propValue: 3 } }, "abc", true],
      ["rejects a value that fails", { minLength: { propValue: 3 } }, "ab", false],
      ["rejects an empty text that fails", { minLength: { propValue: 3 } }, "", false],
      ["accepts an empty text that passes", { maxLength: { propValue: 3 } }, "", true],
      ["rejects undefined with minLength", { minLength: { propValue: 3 } }, undefined, false],
      ["rejects undefined with maxLength", { maxLength: { propValue: 3 } }, undefined, false],
      ["rejects undefined with min", { min: { propValue: "9" } }, undefined, false],
      ["rejects undefined with max", { max: { propValue: "10" } }, undefined, false],
      ["rejects an empty group when custom rejects it", { custom: { propValue: () => false } }, [], false],
    ])(
      "required is absent: %s",
      (_description, validations, rawValue, isValid) => {
        const validator = new Validator({ rawValue, validations });
        expect(validator.isValid).toBe(isValid);
      },
    );

    it.each<Case>([
      ["accepts an empty text when it is the only rule", { required: { propValue: false } }, "", true],
      [
        "accepts a value that passes the other rules",
        { required: { propValue: false }, minLength: { propValue: 3 } },
        "abc",
        true,
      ],
      [
        "rejects a value that fails another rule",
        { required: { propValue: false }, minLength: { propValue: 3 } },
        "ab",
        false,
      ],
      [
        "rejects an empty text that fails another rule",
        { required: { propValue: false }, minLength: { propValue: 3 } },
        "",
        false,
      ],
      [
        "rejects undefined when there is another rule",
        { required: { propValue: false }, maxLength: { propValue: 3 } },
        undefined,
        false,
      ],
      [
        "rejects an empty group when custom rejects it",
        { required: { propValue: false }, custom: { propValue: () => false } },
        [],
        false,
      ],
    ])(
      "required is false: %s",
      (_description, validations, rawValue, isValid) => {
        const validator = new Validator({ rawValue, validations });
        expect(validator.isValid).toBe(isValid);
      },
    );
  });

  describe("isValid with undefined", () => {
    it.each<[description: string, validations: ValidationsConfig]>([
      ["there are no rules", {}],
      ["required is false", { required: { propValue: false } }],
      ["the pattern accepts the empty text", { pattern: { propValue: "[0-9]*" } }],
      ["the pattern is optional", { pattern: { propValue: "([0-9]{3})?" } }],
      ["custom accepts it", { custom: { propValue: () => true } }],
      [
        "custom compares it explicitly",
        { custom: { propValue: (rawValue) => rawValue === undefined } },
      ],
      [
        "required is false and the pattern accepts it",
        { required: { propValue: false }, pattern: { propValue: "[0-9]*" } },
      ],
      [
        "required is false and custom accepts it",
        { required: { propValue: false }, custom: { propValue: () => true } },
      ],
      [
        "the pattern and custom accept it",
        { pattern: { propValue: "[0-9]*" }, custom: { propValue: () => true } },
      ],
      [
        "all the rules that can accept it do",
        {
          required: { propValue: false },
          pattern: { propValue: "[0-9]*" },
          custom: { propValue: () => true },
        },
      ],
    ])("is valid when %s", (_description, validations) => {
      const validator = new Validator({ rawValue: undefined, validations });
      expect(validator.isValid).toBe(true);
    });

    it.each<[description: string, validations: ValidationsConfig]>([
      ["the pattern rejects it", { pattern: { propValue: "[0-9]+" } }],
      [
        "the pattern only matches the word undefined",
        { pattern: { propValue: "undefined" } },
      ],
      ["custom rejects it", { custom: { propValue: () => false } }],
      [
        "the pattern accepts it, but required does not",
        { required: { propValue: true }, pattern: { propValue: "[0-9]*" } },
      ],
      [
        "the pattern accepts it, but min does not",
        { pattern: { propValue: "[0-9]*" }, min: { propValue: "9" } },
      ],
      [
        "the pattern accepts it, but custom does not",
        { pattern: { propValue: "[0-9]*" }, custom: { propValue: () => false } },
      ],
      [
        "custom accepts it, but required does not",
        { required: { propValue: true }, custom: { propValue: () => true } },
      ],
      [
        "custom accepts it, but minLength does not",
        { custom: { propValue: () => true }, minLength: { propValue: 3 } },
      ],
      [
        "custom accepts it, but the pattern does not",
        { custom: { propValue: () => true }, pattern: { propValue: "[0-9]+" } },
      ],
    ])("is invalid when %s", (_description, validations) => {
      const validator = new Validator({ rawValue: undefined, validations });
      expect(validator.isValid).toBe(false);
    });

    it.each<[rule: "required" | "pattern" | "custom", validations: ValidationsConfig]>([
      ["required", { required: { propValue: false, errorMessage: "Error" } }],
      ["pattern", { pattern: { propValue: "[0-9]*", errorMessage: "Error" } }],
      ["custom", { custom: { propValue: () => true, errorMessage: "Error" } }],
    ])("%s has no error when it accepts it", (rule, validations) => {
      const { errorsState } = new Validator({
        rawValue: undefined,
        validations,
      });
      expect(errorsState[rule].isValid).toBe(true);
      expect(errorsState[rule].type).toBeUndefined();
      expect(errorsState[rule].message).toBeUndefined();
    });
  });

  describe("errorsState", () => {
    it.each<
      [
        rule: keyof ValidationRules,
        validations: ValidationsConfig,
        rawValue: RawValue,
      ]
    >([
      ["required", { required: { propValue: true, errorMessage: "Error" } }, "Nico"],
      ["minLength", { minLength: { propValue: 3, errorMessage: "Error" } }, "abc"],
      ["maxLength", { maxLength: { propValue: 3, errorMessage: "Error" } }, "abc"],
      ["pattern", { pattern: { propValue: "[a-z]+", errorMessage: "Error" } }, "abc"],
      ["min", { min: { propValue: "9", errorMessage: "Error" } }, "9"],
      ["max", { max: { propValue: "10", errorMessage: "Error" } }, "10"],
      ["custom", { custom: { propValue: () => true, errorMessage: "Error" } }, "Nico"],
    ])("%s passes, without type nor message", (rule, validations, rawValue) => {
      const { errorsState } = new Validator({ rawValue, validations });
      expect(errorsState[rule].isValid).toBe(true);
      expect(errorsState[rule].type).toBeUndefined();
      expect(errorsState[rule].message).toBeUndefined();
    });

    it.each<
      [
        rule: keyof ValidationRules,
        type: ValidationType,
        validations: ValidationsConfig,
        rawValue: RawValue,
      ]
    >([
      ["required", "valueMissing", { required: { propValue: true, errorMessage: "Error" } }, ""],
      ["minLength", "tooShort", { minLength: { propValue: 3, errorMessage: "Error" } }, "ab"],
      ["maxLength", "tooLong", { maxLength: { propValue: 3, errorMessage: "Error" } }, "abcd"],
      ["pattern", "patternMismatch", { pattern: { propValue: "[a-z]+", errorMessage: "Error" } }, "123"],
      ["min", "rangeUnderflow", { min: { propValue: "9", errorMessage: "Error" } }, "8"],
      ["max", "rangeOverflow", { max: { propValue: "10", errorMessage: "Error" } }, "11"],
      ["custom", "customError", { custom: { propValue: () => false, errorMessage: "Error" } }, "Nico"],
    ])(
      "%s fails with type %s and its message",
      (rule, type, validations, rawValue) => {
        const { errorsState } = new Validator({ rawValue, validations });
        expect(errorsState[rule].isValid).toBe(false);
        expect(errorsState[rule].type).toBe(type);
        expect(errorsState[rule].message).toBe("Error");
      },
    );

    it("has no message when the failed rule does not configure it", () => {
      const { errorsState } = new Validator({
        rawValue: "",
        validations: { required: { propValue: true } },
      });
      expect(errorsState.required.isValid).toBe(false);
      expect(errorsState.required.message).toBeUndefined();
    });

    it.each<[rule: keyof ValidationRules]>([
      ["required"],
      ["minLength"],
      ["maxLength"],
      ["pattern"],
      ["min"],
      ["max"],
      ["custom"],
    ])("%s is undefined when it is not configured", (rule) => {
      const { errorsState } = new Validator({ rawValue: "", validations: {} });
      expect(errorsState[rule].isValid).toBeUndefined();
      expect(errorsState[rule].type).toBeUndefined();
      expect(errorsState[rule].message).toBeUndefined();
    });

    it("evaluates each rule independently", () => {
      const { errorsState } = new Validator({
        rawValue: "ab",
        validations: {
          required: { propValue: true },
          minLength: { propValue: 3 },
          pattern: { propValue: "[a-z]+" },
        },
      });
      expect(errorsState.required.isValid).toBe(true);
      expect(errorsState.minLength.isValid).toBe(false);
      expect(errorsState.pattern.isValid).toBe(true);
      expect(errorsState.maxLength.isValid).toBeUndefined();
    });

    it("evaluates the other rules when the value is missing", () => {
      const { errorsState } = new Validator({
        rawValue: "",
        validations: {
          required: { propValue: true },
          minLength: { propValue: 3 },
        },
      });
      expect(errorsState.required.isValid).toBe(false);
      expect(errorsState.minLength.isValid).toBe(false);
    });
  });

  it("is independent of the validators of other values", () => {
    const valid = new Validator({
      rawValue: "Nico",
      validations: { required: { propValue: true } },
    });
    const invalid = new Validator({
      rawValue: "",
      validations: { required: { propValue: true } },
    });
    expect(invalid.isValid).toBe(false);
    expect(valid.isValid).toBe(true);
  });

  it("passes the raw value to custom without modifying it", () => {
    const check = vi.fn().mockReturnValue(true);
    const validator = new Validator({
      rawValue: ["red", "blue"],
      validations: { custom: { propValue: check } },
    });
    expect(validator.isValid).toBe(true);
    expect(check).toHaveBeenCalledWith(["red", "blue"]);
  });
});
