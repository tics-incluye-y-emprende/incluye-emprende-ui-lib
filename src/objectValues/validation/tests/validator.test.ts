import { ElementState } from "../../formControl/models";
import { ValidationRules, ValidationsConfig, ValidationType } from "../models";
import { Validator, validationStrategiesPerProp } from "../validator";
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

/** Before the element mounts. */
const unmounted: ElementState = {
  kind: undefined,
  value: undefined,
  checked: undefined,
  files: undefined,
  badInput: undefined,
};

describe("validationStrategiesPerProp", () => {
  it("maps each rule and kind to its strategy", () => {
    expect(validationStrategiesPerProp).toEqual({
      required: {
        default: RequiredValidationStrategy,
        "input:checkbox": CheckedRequiredValidationStrategy,
        "input:radio": CheckedRequiredValidationStrategy,
        "input:file": FileRequiredValidationStrategy,
      },
      minLength: {
        "input:text": MinLengthValidationStrategy,
        "input:search": MinLengthValidationStrategy,
        "input:url": MinLengthValidationStrategy,
        "input:tel": MinLengthValidationStrategy,
        "input:email": MinLengthValidationStrategy,
        "input:password": MinLengthValidationStrategy,
        textarea: MinLengthValidationStrategy,
        select: MinLengthValidationStrategy,
      },
      maxLength: {
        "input:text": MaxLengthValidationStrategy,
        "input:search": MaxLengthValidationStrategy,
        "input:url": MaxLengthValidationStrategy,
        "input:tel": MaxLengthValidationStrategy,
        "input:email": MaxLengthValidationStrategy,
        "input:password": MaxLengthValidationStrategy,
        textarea: MaxLengthValidationStrategy,
        select: MaxLengthValidationStrategy,
      },
      pattern: {
        "input:text": PatternValidationStrategy,
        "input:search": PatternValidationStrategy,
        "input:url": PatternValidationStrategy,
        "input:tel": PatternValidationStrategy,
        "input:email": PatternValidationStrategy,
        "input:password": PatternValidationStrategy,
        textarea: PatternValidationStrategy,
        select: PatternValidationStrategy,
      },
      max: {
        "input:number": MaxValueValidationStrategy,
        "input:range": MaxValueValidationStrategy,
        "input:date": DateMaxValueValidationStrategy,
        "input:month": DateMaxValueValidationStrategy,
        "input:week": DateMaxValueValidationStrategy,
        "input:time": DateMaxValueValidationStrategy,
        "input:datetime-local": DateMaxValueValidationStrategy,
      },
      min: {
        "input:number": MinValueValidationStrategy,
        "input:range": MinValueValidationStrategy,
        "input:date": DateMinValueValidationStrategy,
        "input:month": DateMinValueValidationStrategy,
        "input:week": DateMinValueValidationStrategy,
        "input:time": DateMinValueValidationStrategy,
        "input:datetime-local": DateMinValueValidationStrategy,
      },
      custom: { default: CustomValidationStrategy },
    });
  });
});

describe("Validator", () => {
  describe("isValid of a text field", () => {
    type Case = [
      description: string,
      validations: ValidationsConfig,
      value: string,
      isValid: boolean,
    ];

    it.each<Case>([
      ["accepts any text", {}, "Nico", true],
      ["accepts an empty text", {}, "", true],
    ])("without rules: %s", (_description, validations, value, isValid) => {
      const validator = new Validator({
        elementState: { kind: "input:text", value, checked: false, files: [], badInput: false },
        validations,
      });
      expect(validator.isValid).toBe(isValid);
    });

    it.each<Case>([
      ["accepts a text", { required: { propValue: true } }, "Nico", true],
      ["rejects an empty text", { required: { propValue: true } }, "", false],
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
    ])("required: %s", (_description, validations, value, isValid) => {
      const validator = new Validator({
        elementState: { kind: "input:text", value, checked: false, files: [], badInput: false },
        validations,
      });
      expect(validator.isValid).toBe(isValid);
    });

    it.each<Case>([
      ["accepts a value that passes", { minLength: { propValue: 3 } }, "abc", true],
      ["rejects a value that fails", { minLength: { propValue: 3 } }, "ab", false],
      ["rejects an empty text that fails", { minLength: { propValue: 3 } }, "", false],
      ["accepts an empty text that passes", { maxLength: { propValue: 3 } }, "", true],
      ["accepts an empty text when custom accepts it", { custom: { propValue: () => true } }, "", true],
      ["rejects an empty text when custom rejects it", { custom: { propValue: () => false } }, "", false],
    ])("required is absent: %s", (_description, validations, value, isValid) => {
      const validator = new Validator({
        elementState: { kind: "input:text", value, checked: false, files: [], badInput: false },
        validations,
      });
      expect(validator.isValid).toBe(isValid);
    });

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
        "accepts an empty text that the optional pattern accepts",
        { required: { propValue: false }, pattern: { propValue: "([0-9]{3})?" } },
        "",
        true,
      ],
    ])("required is false: %s", (_description, validations, value, isValid) => {
      const validator = new Validator({
        elementState: { kind: "input:text", value, checked: false, files: [], badInput: false },
        validations,
      });
      expect(validator.isValid).toBe(isValid);
    });
  });

  describe("isValid of other kinds", () => {
    it.each<
      [
        description: string,
        elementState: ElementState,
        validations: ValidationsConfig,
        isValid: boolean,
      ]
    >([
      [
        "a required checkbox is valid when checked",
        { kind: "input:checkbox", value: "on", checked: true, files: [], badInput: false },
        { required: { propValue: true } },
        true,
      ],
      [
        "a required checkbox is not valid when unchecked",
        { kind: "input:checkbox", value: "on", checked: false, files: [], badInput: false },
        { required: { propValue: true } },
        false,
      ],
      [
        "a required file input is not valid without files",
        { kind: "input:file", value: "", checked: false, files: [], badInput: false },
        { required: { propValue: true } },
        false,
      ],
      [
        "a number with bad input passes required but not min",
        { kind: "input:number", value: "", checked: false, files: [], badInput: true },
        { required: { propValue: true }, min: { propValue: 1 } },
        false,
      ],
      [
        "a time is compared with its limits",
        { kind: "input:time", value: "10:00", checked: false, files: [], badInput: false },
        { min: { propValue: "09:00" }, max: { propValue: "18:00" } },
        true,
      ],
    ])("%s", (_description, elementState, validations, isValid) => {
      expect(new Validator({ elementState, validations }).isValid).toBe(isValid);
    });

    it.each<[rule: string, validations: ValidationsConfig, kind: ElementState["kind"]]>([
      ["minLength", { minLength: { propValue: 3 } }, "input:checkbox"],
      ["maxLength", { maxLength: { propValue: 3 } }, "input:number"],
      ["pattern", { pattern: { propValue: "[a-z]+" } }, "input:file"],
      ["min", { min: { propValue: 1 } }, "input:text"],
      ["max", { max: { propValue: 1 } }, "select"],
    ])("throws an error with the rule %s and the kind %s, which has no strategy", (rule, validations, kind) => {
      const validator = new Validator({
        elementState: { kind, value: "", checked: false, files: [], badInput: false },
        validations,
      });
      expect(() => validator.errorsState).toThrow(rule);
      expect(() => validator.errorsState).toThrow(kind);
    });

    it("throws an error when a rule does not support the kind", () => {
      const validator = new Validator({
        elementState: { kind: "input:checkbox", value: "on", checked: true, files: [], badInput: false },
        validations: { minLength: { propValue: 3 } },
      });
      expect(() => validator.isValid).toThrow("input:checkbox");
      expect(() => validator.errorsState).toThrow("input:checkbox");
    });
  });

  describe("before the element mounts", () => {
    it.each<[description: string, validations: ValidationsConfig]>([
      ["there are no rules", {}],
      ["required is true", { required: { propValue: true } }],
      ["required is false", { required: { propValue: false } }],
      ["there are several rules", { required: { propValue: true }, minLength: { propValue: 3 }, min: { propValue: 1 } }],
      ["custom rejects everything", { custom: { propValue: () => false } }],
    ])("isValid is undefined when %s", (_description, validations) => {
      expect(new Validator({ elementState: unmounted, validations }).isValid).toBeUndefined();
    });

    it("does not call custom", () => {
      const check = vi.fn(() => true);
      new Validator({ elementState: unmounted, validations: { custom: { propValue: check } } }).errorsState;
      expect(check).not.toHaveBeenCalled();
    });

    it("does not throw with rules that its kind could not support", () => {
      const validator = new Validator({
        elementState: unmounted,
        validations: { minLength: { propValue: 3 }, min: { propValue: 1 } },
      });
      expect(validator.errorsState.minLength.isValid).toBeUndefined();
    });

    it("every rule is undefined, without type nor message", () => {
      const { errorsState } = new Validator({
        elementState: unmounted,
        validations: {
          required: { propValue: true, errorMessage: "Error" },
          minLength: { propValue: 3, errorMessage: "Error" },
          maxLength: { propValue: 3, errorMessage: "Error" },
          pattern: { propValue: "[a-z]+", errorMessage: "Error" },
          min: { propValue: 1, errorMessage: "Error" },
          max: { propValue: 1, errorMessage: "Error" },
          custom: { propValue: () => false, errorMessage: "Error" },
        },
      });
      expect(errorsState).toEqual({
        required: { isValid: undefined },
        minLength: { isValid: undefined },
        maxLength: { isValid: undefined },
        pattern: { isValid: undefined },
        min: { isValid: undefined },
        max: { isValid: undefined },
        custom: { isValid: undefined },
      });
    });
  });

  describe("errorsState", () => {
    it.each<
      [
        rule: keyof ValidationRules,
        validations: ValidationsConfig,
        elementState: ElementState,
      ]
    >([
      ["required", { required: { propValue: true, errorMessage: "Error" } }, { kind: "input:text", value: "Nico", checked: false, files: [], badInput: false }],
      ["minLength", { minLength: { propValue: 3, errorMessage: "Error" } }, { kind: "input:text", value: "abc", checked: false, files: [], badInput: false }],
      ["maxLength", { maxLength: { propValue: 3, errorMessage: "Error" } }, { kind: "input:text", value: "abc", checked: false, files: [], badInput: false }],
      ["pattern", { pattern: { propValue: "[a-z]+", errorMessage: "Error" } }, { kind: "input:text", value: "abc", checked: false, files: [], badInput: false }],
      ["min", { min: { propValue: 9, errorMessage: "Error" } }, { kind: "input:number", value: "9", checked: false, files: [], badInput: false }],
      ["max", { max: { propValue: 10, errorMessage: "Error" } }, { kind: "input:number", value: "10", checked: false, files: [], badInput: false }],
      ["custom", { custom: { propValue: () => true, errorMessage: "Error" } }, { kind: "input:text", value: "Nico", checked: false, files: [], badInput: false }],
    ])("%s passes, without type nor message", (rule, validations, elementState) => {
      const { errorsState } = new Validator({ elementState, validations });
      expect(errorsState[rule]).toEqual({ isValid: true });
    });

    it.each<
      [
        rule: keyof ValidationRules,
        type: ValidationType,
        validations: ValidationsConfig,
        elementState: ElementState,
      ]
    >([
      ["required", "valueMissing", { required: { propValue: true, errorMessage: "Error" } }, { kind: "input:text", value: "", checked: false, files: [], badInput: false }],
      ["minLength", "tooShort", { minLength: { propValue: 3, errorMessage: "Error" } }, { kind: "input:text", value: "ab", checked: false, files: [], badInput: false }],
      ["maxLength", "tooLong", { maxLength: { propValue: 3, errorMessage: "Error" } }, { kind: "input:text", value: "abcd", checked: false, files: [], badInput: false }],
      ["pattern", "patternMismatch", { pattern: { propValue: "[a-z]+", errorMessage: "Error" } }, { kind: "input:text", value: "123", checked: false, files: [], badInput: false }],
      ["min", "rangeUnderflow", { min: { propValue: 9, errorMessage: "Error" } }, { kind: "input:number", value: "8", checked: false, files: [], badInput: false }],
      ["max", "rangeOverflow", { max: { propValue: 10, errorMessage: "Error" } }, { kind: "input:number", value: "11", checked: false, files: [], badInput: false }],
      ["custom", "customError", { custom: { propValue: () => false, errorMessage: "Error" } }, { kind: "input:text", value: "Nico", checked: false, files: [], badInput: false }],
    ])("%s fails with type %s and its message", (rule, type, validations, elementState) => {
      const { errorsState } = new Validator({ elementState, validations });
      expect(errorsState[rule]).toEqual({ isValid: false, type, message: "Error" });
    });

    it("has no message when the failed rule does not configure it", () => {
      const { errorsState } = new Validator({
        elementState: { kind: "input:text", value: "", checked: false, files: [], badInput: false },
        validations: { required: { propValue: true } },
      });
      expect(errorsState.required.isValid).toBe(false);
      expect(errorsState.required.message).toBeUndefined();
    });

    it("is undefined for the rules that are not configured", () => {
      const { errorsState } = new Validator({
        elementState: { kind: "input:checkbox", value: "on", checked: false, files: [], badInput: false },
        validations: {},
      });
      expect(errorsState).toEqual({
        required: { isValid: undefined },
        minLength: { isValid: undefined },
        maxLength: { isValid: undefined },
        pattern: { isValid: undefined },
        min: { isValid: undefined },
        max: { isValid: undefined },
        custom: { isValid: undefined },
      });
    });

    it("evaluates each rule independently", () => {
      const { errorsState } = new Validator({
        elementState: { kind: "input:text", value: "ab", checked: false, files: [], badInput: false },
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
        elementState: { kind: "input:text", value: "", checked: false, files: [], badInput: false },
        validations: {
          required: { propValue: true },
          minLength: { propValue: 3 },
        },
      });
      expect(errorsState.required.isValid).toBe(false);
      expect(errorsState.minLength.isValid).toBe(false);
    });
  });

  it("passes the element state to custom without modifying it", () => {
    const check = vi.fn().mockReturnValue(true);
    const elementState: ElementState = {
      kind: "input:file",
      value: "",
      checked: false,
      files: [],
      badInput: false,
    };
    const validator = new Validator({
      elementState,
      validations: { custom: { propValue: check } },
    });
    expect(validator.isValid).toBe(true);
    expect(check).toHaveBeenCalledWith(elementState);
  });
});
