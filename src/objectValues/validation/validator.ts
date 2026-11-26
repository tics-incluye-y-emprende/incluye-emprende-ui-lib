import { ElementKind } from "../formControl/models";
import {
  ValidationsState,
  ValidationConfigI,
  ValidationRules,
  ValidationConfig,
  ValidationI,
  ErrorState,
} from "./models";
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
} from "./validationStrategy";

/** The class of one rule, created with its config. */
type StrategyClass<P extends keyof ValidationRules> = new (
  config: ValidationConfig<ValidationRules[P]>,
) => ValidationI;

/**
 * The classes of one rule, by kind of element. `default` evaluates the kinds without their own class.
 * A kind without class and without default does not support the rule.
 */
export type StrategiesPerKind<P extends keyof ValidationRules> = Partial<
  Record<ElementKind | "default", StrategyClass<P>>
>;

/**
 * Maps each validation prop and kind of element to the class that evaluates it, so the Validator can
 * create them from the config. Supporting another kind means adding an entry, not modifying a strategy.
 */
export const validationStrategiesPerProp: {
  [P in keyof ValidationRules]: StrategiesPerKind<P>;
} = {
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
};

/**
 * Validation state of one element state: runs all the rules configured for the field and summarizes the results.
 * It is immutable: FormControl owns the element state and creates another Validator when it changes.
 */
export class Validator implements ValidationsState {
  /** Receives the element state and the rules to apply to it. */
  constructor(private readonly config: ValidationConfigI) {}

  /**
   * The result of the whole field: undefined before the element mounts; then, true only if no rule
   * fails (rules that are not configured do not count).
   * `required` is one more rule: without it, the others are still evaluated with empty values.
   */
  public get isValid(): boolean | undefined {
    throw new Error("Not implemented");
  }

  /**
   * The result of each rule, calculated independently of the others, by the class that
   * validationStrategiesPerProp gives for the kind of the element (its own class or the default).
   * Before the element mounts (its kind is undefined), it creates no strategy.
   * Throws an error with the rule and the kind when the rule has no class for that kind.
   * Its isValid is undefined when the rule is not in the config or the element has not mounted.
   * Its type and message are only present when the rule fails.
   */
  public get errorsState(): Record<keyof ValidationRules, ErrorState> {
    throw new Error("Not implemented");
  }
}
