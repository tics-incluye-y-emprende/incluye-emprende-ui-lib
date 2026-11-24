import { RawValue } from "../../formControl/models";
import { ValidationRules, ValidationsConfig, ValidationType } from "../models";
import { Validator, validationStrategiesPerProp } from "../validator";

type RuleName = keyof ValidationRules;

/** Every rule with the kind of error it represents. */
const rules: [rule: RuleName, errorType: ValidationType][] = [
  ["required", "valueMissing"],
  ["minLength", "tooShort"],
  ["maxLength", "tooLong"],
  ["pattern", "patternMismatch"],
  ["min", "rangeUnderflow"],
  ["max", "rangeOverflow"],
  ["custom", "customError"],
];
const ruleNames = rules.map(([rule]) => rule);

const required = { propValue: true };
const notRequired = { propValue: false };
const minLength = { propValue: 3 };
const maxLength = { propValue: 5 };
const pattern = { propValue: "[a-z]+" };
const min = { propValue: "9" };
const max = { propValue: "10" };
const custom = { propValue: (rawValue: RawValue) => rawValue === "admin" };

/** Validates the value and summarizes the result: the field's validity and the rules that failed. */
function validate(validations: ValidationsConfig, rawValue: RawValue) {
  const { isValid, errorsState } = new Validator({ validations }).validate(
    rawValue,
  );
  const failedRules = ruleNames.filter(
    (rule) => errorsState[rule].isValid === false,
  );
  return { isValid, failedRules };
}

/** Adds an error message to one rule of the config. */
function withMessage(
  rule: RuleName,
  validations: ValidationsConfig,
): ValidationsConfig {
  return {
    ...validations,
    [rule]: { ...validations[rule], errorMessage: "Custom message" },
  };
}

describe("validationStrategiesPerProp", () => {
  /** Creates the strategy of any rule through the map, as the Validator does. */
  function createStrategy<R extends RuleName>(
    rule: R,
    propValue: ValidationRules[R],
  ) {
    return new validationStrategiesPerProp[rule]({ propValue });
  }

  it("has one strategy per rule", () => {
    expect(Object.keys(validationStrategiesPerProp).sort()).toEqual(
      [...ruleNames].sort(),
    );
  });

  it("maps each rule to the strategy with its error type", () => {
    const errorTypes = {
      required: createStrategy("required", true).errorType,
      minLength: createStrategy("minLength", 3).errorType,
      maxLength: createStrategy("maxLength", 5).errorType,
      pattern: createStrategy("pattern", "[a-z]+").errorType,
      min: createStrategy("min", "9").errorType,
      max: createStrategy("max", "10").errorType,
      custom: createStrategy("custom", () => true).errorType,
    };
    expect(errorTypes).toEqual(Object.fromEntries(rules));
  });
});

describe("Validator", () => {
  describe("field validity", () => {
    type Case = [
      description: string,
      validations: ValidationsConfig,
      rawValue: RawValue,
      isValid: boolean,
      failedRules: RuleName[],
    ];

    it.each<Case>([
      ["accepts any text", {}, "Nico", true, []],
      ["accepts an empty text", {}, "", true, []],
      ["accepts undefined", {}, undefined, true, []],
      ["accepts an empty group", {}, [], true, []],
    ])(
      "without rules: %s",
      (_description, validations, rawValue, isValid, failedRules) => {
        expect(validate(validations, rawValue)).toEqual({
          isValid,
          failedRules,
        });
      },
    );

    it.each<Case>([
      ["accepts a text", { required }, "Nico", true, []],
      ["accepts a group", { required }, ["red"], true, []],
      ["rejects undefined", { required }, undefined, false, ["required"]],
      ["rejects an empty text", { required }, "", false, ["required"]],
      ["rejects an empty group", { required }, [], false, ["required"]],
      [
        "accepts a value that passes all the rules",
        { required, minLength, maxLength, pattern },
        "abc",
        true,
        [],
      ],
      [
        "rejects a value that fails only one rule",
        { required, minLength, pattern },
        "ab",
        false,
        ["minLength"],
      ],
      [
        "rejects a value that fails several rules",
        { required, minLength, pattern },
        "1",
        false,
        ["minLength", "pattern"],
      ],
      [
        "accepts a group when all its elements pass",
        { required, minLength },
        ["abc", "abcd"],
        true,
        [],
      ],
      [
        "rejects a group when one element fails",
        { required, minLength },
        ["abc", "ab"],
        false,
        ["minLength"],
      ],
      [
        "rejects a value that min and max cannot compare",
        { required, min, max },
        "abc",
        false,
        ["min", "max"],
      ],
      [
        "evaluates the other rules when the value is missing",
        { required, minLength },
        "",
        false,
        ["required", "minLength"],
      ],
    ])(
      "required: %s",
      (_description, validations, rawValue, isValid, failedRules) => {
        expect(validate(validations, rawValue)).toEqual({
          isValid,
          failedRules,
        });
      },
    );

    // Absent and false are the two ways of not being required.
    describe.each<[description: string, requiredConfig: ValidationsConfig]>([
      ["required is absent", {}],
      ["required is false", { required: notRequired }],
    ])("not required because %s", (_group, requiredConfig) => {
      it.each<Case>([
        ["accepts a value that passes", { minLength }, "abc", true, []],
        [
          "rejects a value that fails a rule",
          { minLength },
          "ab",
          false,
          ["minLength"],
        ],
        [
          "rejects a value that fails several rules",
          { minLength, pattern },
          "1",
          false,
          ["minLength", "pattern"],
        ],
        [
          "accepts an empty text, although its rules fail",
          { minLength, pattern, min, max },
          "",
          true,
          ["minLength", "pattern", "min", "max"],
        ],
        [
          "accepts undefined, although its rules fail",
          { minLength, pattern, min, max },
          undefined,
          true,
          ["minLength", "pattern", "min", "max"],
        ],
        [
          "accepts an empty text, although custom fails",
          { custom },
          "",
          true,
          ["custom"],
        ],
        [
          "accepts an empty group, although custom fails",
          { custom },
          [],
          true,
          ["custom"],
        ],
        [
          "rejects a blank space, which is not an empty text",
          { minLength },
          " ",
          false,
          ["minLength"],
        ],
        [
          "rejects the text '0', which is not an empty text",
          { min },
          "0",
          false,
          ["min"],
        ],
      ])("%s", (_description, validations, rawValue, isValid, failedRules) => {
        expect(
          validate({ ...requiredConfig, ...validations }, rawValue),
        ).toEqual({ isValid, failedRules });
      });
    });
  });

  describe("state of each rule", () => {
    /** Each rule alone, with a value that passes it and another one that fails it. */
    const cases: [
      rule: RuleName,
      validations: ValidationsConfig,
      validValue: RawValue,
      invalidValue: RawValue,
    ][] = [
      ["required", { required }, "Nico", ""],
      ["minLength", { minLength }, "abc", "ab"],
      ["maxLength", { maxLength }, "abcde", "abcdef"],
      ["pattern", { pattern }, "abc", "123"],
      ["min", { min }, "9", "8"],
      ["max", { max }, "10", "11"],
      ["custom", { custom }, "admin", "Nico"],
    ];

    it.each(cases)(
      "%s is true when it passes",
      (rule, validations, validValue) => {
        const state = new Validator({ validations }).validate(validValue);
        expect(state.errorsState[rule].isValid).toBe(true);
      },
    );

    it.each(cases)(
      "%s is the only one false when it alone is configured and fails",
      (rule, validations, _validValue, invalidValue) => {
        expect(validate(validations, invalidValue)).toEqual({
          isValid: false,
          failedRules: [rule],
        });
      },
    );

    it.each(ruleNames)("%s is undefined when it is not configured", (rule) => {
      const state = new Validator({ validations: {} }).validate("Nico");
      expect(state.errorsState[rule].isValid).toBeUndefined();
    });

    it.each(cases)(
      "%s has its error type and message when it fails",
      (rule, validations, _validValue, invalidValue) => {
        const { errorsState } = new Validator({
          validations: withMessage(rule, validations),
        }).validate(invalidValue);
        expect(errorsState[rule].type).toBe(Object.fromEntries(rules)[rule]);
        expect(errorsState[rule].message).toBe("Custom message");
      },
    );

    it.each(cases)(
      "%s has no error type nor message when it passes",
      (rule, validations, validValue) => {
        const { errorsState } = new Validator({
          validations: withMessage(rule, validations),
        }).validate(validValue);
        expect(errorsState[rule].type).toBeUndefined();
        expect(errorsState[rule].message).toBeUndefined();
      },
    );

    it.each(ruleNames)(
      "%s has no error type nor message when it is not configured",
      (rule) => {
        const { errorsState } = new Validator({ validations: {} }).validate("");
        expect(errorsState[rule].type).toBeUndefined();
        expect(errorsState[rule].message).toBeUndefined();
      },
    );

    it("keeps the error type and message of a failed rule in a valid, empty field", () => {
      const state = new Validator({
        validations: withMessage("minLength", { minLength }),
      }).validate("");
      expect(state.isValid).toBe(true);
      expect(state.errorsState.minLength.type).toBe("tooShort");
      expect(state.errorsState.minLength.message).toBe("Custom message");
    });

    it("has no message when a failed rule does not configure it", () => {
      const { errorsState } = new Validator({
        validations: { required },
      }).validate("");
      expect(errorsState.required.message).toBeUndefined();
    });
  });

  it("holds no value: each call only depends on the value received", () => {
    const validator = new Validator({ validations: { required } });
    const results = ["Nico", "", "Nico"].map(
      (rawValue) => validator.validate(rawValue).isValid,
    );
    expect(results).toEqual([true, false, true]);
  });

  it("passes the raw value to custom without modifying it", () => {
    const check = vi.fn(() => true);
    const rawValue = ["red", "blue"];
    new Validator({ validations: { custom: { propValue: check } } }).validate(
      rawValue,
    );
    expect(check).toHaveBeenCalledWith(rawValue);
  });
});
