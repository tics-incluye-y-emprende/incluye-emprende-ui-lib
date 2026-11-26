import type { ChangeEvent } from "react";
import { ValidationsState } from "../../validation/models";
import { Validator } from "../../validation/validator";
import { FormControl } from "../formControl";
import { ElementState, ElementValue, FieldElement } from "../models";

// Validator has its own tests.
vi.mock("../../validation/validator", () => ({ Validator: vi.fn() }));

interface Payload {
  name: string;
  quantity: number;
  terms: boolean;
  birthday: Date;
  file: File;
  any: unknown;
}

const validState: ValidationsState = {
  isValid: true,
  errorsState: {
    required: { isValid: true },
    minLength: { isValid: undefined },
    maxLength: { isValid: undefined },
    pattern: { isValid: undefined },
    min: { isValid: undefined },
    max: { isValid: undefined },
    custom: { isValid: undefined },
  },
};

const invalidState: ValidationsState = {
  isValid: false,
  errorsState: {
    required: { isValid: false, type: "valueMissing", message: "Required" },
    minLength: { isValid: undefined },
    maxLength: { isValid: undefined },
    pattern: { isValid: undefined },
    min: { isValid: undefined },
    max: { isValid: undefined },
    custom: { isValid: undefined },
  },
};

const file = new File(["content"], "cv.pdf");

/** Before the element mounts. */
const unmounted: ElementState = {
  kind: undefined,
  value: undefined,
  checked: undefined,
  files: undefined,
  badInput: undefined,
};
const textState: ElementState = {
  kind: "input:text",
  value: "Ana",
  checked: false,
  files: [],
  badInput: false,
};
const otherTextState: ElementState = {
  kind: "input:text",
  value: "Luz",
  checked: false,
  files: [],
  badInput: false,
};
const object = { id: 1 };

describe("FormControl", () => {
  const ValidatorMock = vi.mocked(Validator);
  const adapter = vi.fn();
  const toElement = vi.fn();
  const formatter = vi.fn();
  const event = {} as ChangeEvent<FieldElement>;

  /** Field with the default value "Nico". */
  let control: FormControl<Payload, "name">;
  /** Field without default value. */
  let emptyControl: FormControl<Payload, "name">;
  /** Field with the default value "Nico" and a formatter. */
  let formatted: FormControl<Payload, "name">;

  beforeEach(() => {
    vi.resetAllMocks();
    ValidatorMock.mockReturnValue(validState as Validator);
    formatter.mockReturnValue("formatted");
    toElement.mockReturnValue("shown");

    control = new FormControl<Payload, "name">({
      eventToPayloadAdapter: adapter,
      defaultValue: "Nico",
    });
    emptyControl = new FormControl<Payload, "name">({
      eventToPayloadAdapter: adapter,
    });
    formatted = new FormControl<Payload, "name">({
      eventToPayloadAdapter: adapter,
      formatter,
      defaultValue: "Nico",
    });
  });

  describe("initial state", () => {
    it("starts with the default value, without calling the adapter", () => {
      expect(control.defaultValue).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
      expect(control.value).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
      expect(adapter).not.toHaveBeenCalled();
    });

    it("starts without value when there is no default value", () => {
      expect(emptyControl.defaultValue).toEqual({
        currentValue: undefined,
        prevValue: undefined,
        hasChanged: false,
      });
      expect(emptyControl.value).toEqual({
        currentValue: undefined,
        prevValue: undefined,
        hasChanged: false,
      });
    });

    it("keeps a default value that is false or 0", () => {
      const terms = new FormControl<Payload, "terms">({
        eventToPayloadAdapter: adapter,
        defaultValue: false,
      });
      const quantity = new FormControl<Payload, "quantity">({
        eventToPayloadAdapter: adapter,
        defaultValue: 0,
      });
      expect(terms.value.currentValue).toBe(false);
      expect(quantity.value.currentValue).toBe(0);
    });

    it("starts without focus and untouched", () => {
      expect(control.isFocused).toBe(false);
      expect(control.isTouched).toBe(false);
    });
  });

  describe("value.hasChanged", () => {
    it.each<
      [
        description: string,
        defaultValue: unknown,
        value: unknown,
        hasChanged: boolean,
      ]
    >([
      ["another text", "Nico", "Ana", true],
      ["the same text", "Nico", "Nico", false],
      ["a different case", "Nico", "nico", true],
      ["an empty text without default", undefined, "", true],
      ["undefined with an empty default", "", undefined, true],
      ["undefined without default", undefined, undefined, false],
      ["null without default", undefined, null, true],
      ["0 without default", undefined, 0, true],
      ["false without default", undefined, false, true],
      ["another boolean", false, true, true],
      ["the same boolean", false, false, false],
      ["a number and its text", 1, "1", true],
      ["NaN without default", undefined, NaN, true],
      ["NaN with NaN as default", NaN, NaN, false],
      ["the same date", new Date("2026-11-23"), new Date("2026-11-23"), false],
      ["another date", new Date("2026-11-23"), new Date("2026-11-24"), true],
      ["two invalid dates", new Date("abc"), new Date("abc"), false],
      ["the same file", file, file, false],
      ["another file", file, new File(["content"], "cv.pdf"), true],
      ["the same object", object, object, false],
      ["another object with the same content", object, { id: 1 }, true],
    ])(
      "compares with the default value: %s",
      (_description, defaultValue, value, hasChanged) => {
        const field = new FormControl<Payload, "any">({
          eventToPayloadAdapter: adapter,
          defaultValue,
        });
        expect(field.setValue(value).value.hasChanged).toBe(hasChanged);
      },
    );
  });

  describe("eventToPayload", () => {
    it("is what the adapter returns for the event and the control", () => {
      adapter.mockReturnValue("Ana");
      expect(control.eventToPayload(event)).toBe("Ana");
      expect(adapter).toHaveBeenCalledTimes(1);
      expect(adapter.mock.lastCall?.[0]).toBe(event);
      expect(adapter.mock.lastCall?.[1]).toBe(control);
    });

    it("gives the adapter the control after the last operation", () => {
      const next = control.setValue("Ana");
      next.eventToPayload(event);
      expect(adapter.mock.lastCall?.[1]).toBe(next);
    });

    it("is undefined when the adapter returns undefined", () => {
      adapter.mockReturnValue(undefined);
      expect(control.eventToPayload(event)).toBeUndefined();
    });

    it("does not hide an error of the adapter", () => {
      adapter.mockImplementation(() => {
        throw new Error("Adapter error");
      });
      expect(() => control.eventToPayload(event)).toThrow("Adapter error");
    });

    it("changes nothing", () => {
      adapter.mockReturnValue("Ana");
      control.eventToPayload(event);
      expect(control.value.currentValue).toBe("Nico");
    });
  });

  describe("change", () => {
    it("updates the value, but not the default one", () => {
      const changed = control.change("Ana", textState);
      expect(changed.value).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(changed.defaultValue.currentValue).toBe("Nico");
    });

    it("keeps the value before the last change as prevValue", () => {
      const changed = control.change("Ana", textState).change("Luz", textState);
      expect(changed.value.currentValue).toBe("Luz");
      expect(changed.value.prevValue).toBe("Ana");
    });

    it("has not changed when the user returns to the default value", () => {
      expect(control.change("Ana", textState).change("Nico", textState).value.hasChanged).toBe(false);
    });

    it("accepts undefined", () => {
      expect(control.change(undefined, textState).value).toEqual({
        currentValue: undefined,
        prevValue: "Nico",
        hasChanged: true,
      });
    });

    it("does not call the adapter", () => {
      control.change("Ana", textState);
      expect(adapter).not.toHaveBeenCalled();
    });

    it("keeps focus and touch", () => {
      const changed = control.focus().click().change("Ana", textState);
      expect(changed.isFocused).toBe(true);
      expect(changed.isTouched).toBe(true);
    });
  });

  describe("payloadValue", () => {
    it("is the default value", () => {
      expect(control.payloadValue).toBe("Nico");
    });

    it("is the value after each operation", () => {
      expect(control.change("Ana", textState).payloadValue).toBe("Ana");
      expect(control.setValue("Ana").payloadValue).toBe("Ana");
      expect(control.patchValue("Ana").payloadValue).toBe("Ana");
      expect(control.change("Ana", textState).reset().payloadValue).toBe("Nico");
    });

    it("can be false", () => {
      const terms = new FormControl<Payload, "terms">({
        eventToPayloadAdapter: adapter,
        defaultValue: false,
      });
      expect(terms.payloadValue).toBe(false);
    });

    it("can be a File", () => {
      const field = new FormControl<Payload, "file">({
        eventToPayloadAdapter: adapter,
      });
      expect(field.change(file, textState).focus().click().blur().payloadValue).toBe(file);
    });

    it("is undefined while the field is not valid, keeping the value", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      const invalid = control.change("Ana", textState);
      expect(invalid.payloadValue).toBeUndefined();
      expect(invalid.value.currentValue).toBe("Ana");
    });

    it("is the value before the element mounts, when the validity is undefined", () => {
      ValidatorMock.mockReturnValue({ ...invalidState, isValid: undefined } as Validator);
      expect(control.payloadValue).toBe("Nico");
    });

    it("is undefined when the default value is not valid, keeping it", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      expect(control.payloadValue).toBeUndefined();
      expect(control.defaultValue.currentValue).toBe("Nico");
    });

    it("returns when the field is valid again", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      const invalid = control.change("A", textState);
      ValidatorMock.mockReturnValue(validState as Validator);
      expect(invalid.change("Ana", textState).payloadValue).toBe("Ana");
    });
  });

  describe("formattedValue", () => {
    it("is what the formatter returns for the default value", () => {
      expect(formatted.formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Nico");
    });

    it("is undefined without formatter", () => {
      expect(control.formattedValue).toBeUndefined();
    });

    it("is calculated for the changed value, also while it is focused", () => {
      expect(formatted.focus().change("Ana", textState).formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for setValue", () => {
      expect(formatted.setValue("Ana").formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for patchValue", () => {
      expect(formatted.patchValue("Ana").formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for reset", () => {
      const changed = formatted.setValue("Ana");
      expect(changed.reset().formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Nico");
    });

    it("is calculated although the field is not valid", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      expect(formatted.setValue("Ana").formattedValue).toBe("formatted");
    });

    it("is calculated for 0 and false", () => {
      const field = new FormControl<Payload, "any">({
        eventToPayloadAdapter: adapter,
        formatter,
      });
      expect(field.setValue(0).formattedValue).toBe("formatted");
      expect(field.setValue(false).formattedValue).toBe("formatted");
    });

    it.each<[description: string, value: unknown]>([
      ["undefined", undefined],
      ["null", null],
      ["an empty text", ""],
      ["NaN", NaN],
      ["an invalid date", new Date("abc")],
    ])("does not call the formatter with %s", (_description, value) => {
      const field = new FormControl<Payload, "any">({
        eventToPayloadAdapter: adapter,
        formatter,
        defaultValue: value,
      });
      expect(field.formattedValue).toBeUndefined();
      expect(formatter).not.toHaveBeenCalled();
    });
  });

  describe("elementValue", () => {
    it.each<
      [description: string, value: unknown, elementValue: ElementValue]
    >([
      ["a text", "Nico", "Nico"],
      ["an empty text", "", ""],
      ["a number", 3.5, "3.5"],
      ["0", 0, "0"],
      ["true", true, true],
      ["false", false, false],
      ["undefined", undefined, undefined],
      ["null", null, undefined],
      ["NaN", NaN, undefined],
      ["a date", new Date("2026-11-23"), undefined],
      ["a file", file, undefined],
      ["an object", object, undefined],
    ])("without adapter, shows %s", (_description, value, elementValue) => {
      const field = new FormControl<Payload, "any">({
        eventToPayloadAdapter: adapter,
        defaultValue: value,
      });
      expect(field.elementValue).toBe(elementValue);
    });

    it("is what payloadToElementAdapter returns", () => {
      const birthday = new FormControl<Payload, "birthday">({
        eventToPayloadAdapter: adapter,
        payloadToElementAdapter: toElement,
        defaultValue: new Date("2026-11-23"),
      });
      expect(birthday.elementValue).toBe("shown");
      expect(toElement).toHaveBeenLastCalledWith(new Date("2026-11-23"));
    });

    it("can be false when payloadToElementAdapter returns it", () => {
      toElement.mockReturnValue(false);
      const field = new FormControl<Payload, "name">({
        eventToPayloadAdapter: adapter,
        payloadToElementAdapter: toElement,
        defaultValue: "no",
      });
      expect(field.elementValue).toBe(false);
    });

    it.each<[description: string, value: unknown]>([
      ["undefined", undefined],
      ["null", null],
      ["NaN", NaN],
      ["an invalid date", new Date("abc")],
      ["a file", file],
    ])(
      "does not call payloadToElementAdapter with %s",
      (_description, value) => {
        const field = new FormControl<Payload, "any">({
          eventToPayloadAdapter: adapter,
          payloadToElementAdapter: toElement,
          defaultValue: value,
        });
        expect(field.elementValue).toBeUndefined();
        expect(toElement).not.toHaveBeenCalled();
      },
    );

    it("is the value after each operation", () => {
      expect(control.change("Ana", textState).elementValue).toBe("Ana");
      expect(control.setValue("Ana").elementValue).toBe("Ana");
      expect(control.patchValue("Ana").elementValue).toBe("Ana");
      expect(control.setValue("Ana").reset().elementValue).toBe("Nico");
    });

    it("is the value although the field is not valid", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      expect(control.elementValue).toBe("Nico");
    });

    it("is the formatted value while it is not focused", () => {
      expect(formatted.elementValue).toBe("formatted");
      expect(formatted.focus().blur().elementValue).toBe("formatted");
    });

    it("is the value without format while it is focused", () => {
      expect(formatted.focus().elementValue).toBe("Nico");
    });

    it("is the value when the formatter is not called for it", () => {
      expect(formatted.setValue("").elementValue).toBe("");
    });
  });

  describe("elementVersion", () => {
    it("changes when setValue changes the value", () => {
      expect(control.setValue("Ana").elementVersion).not.toBe(
        control.elementVersion,
      );
    });

    it("changes when patchValue changes the value", () => {
      expect(control.patchValue("Ana").elementVersion).not.toBe(
        control.elementVersion,
      );
    });

    it("does not change when patchValue respects the value", () => {
      const changed = control.change("Ana", textState);
      expect(changed.patchValue("Luz").elementVersion).toBe(
        changed.elementVersion,
      );
    });

    it("changes when reset returns to the default value", () => {
      const changed = control.change("Ana", textState);
      expect(changed.reset().elementVersion).not.toBe(changed.elementVersion);
    });

    it("changes when reset follows a change event with the same value", () => {
      const changed = emptyControl.change(undefined, textState);
      expect(changed.reset().elementVersion).not.toBe(changed.elementVersion);
    });

    it("does not change when reset only removes the touch", () => {
      const clicked = control.click();
      expect(clicked.reset().elementVersion).toBe(clicked.elementVersion);
    });

    it("never returns to an earlier version", () => {
      const first = control.setValue("Ana");
      const second = first.reset();
      expect(second.elementVersion).not.toBe(control.elementVersion);
      expect(second.elementVersion).not.toBe(first.elementVersion);
    });

    it("does not change when the user changes the element", () => {
      expect(control.change("Ana", textState).elementVersion).toBe(control.elementVersion);
    });

    it("does not change with focus, click and blur", () => {
      expect(control.focus().click().blur().elementVersion).toBe(
        control.elementVersion,
      );
    });

    it("changes with focus and blur when there is a formatted value", () => {
      const focused = formatted.focus();
      const blurred = focused.blur();
      expect(focused.elementVersion).not.toBe(formatted.elementVersion);
      expect(blurred.elementVersion).not.toBe(focused.elementVersion);
    });

    it("does not change with focus and blur when the formatter is not called", () => {
      const empty = formatted.setValue("");
      expect(empty.focus().blur().elementVersion).toBe(empty.elementVersion);
    });

    it("does not change with a blur without focus", () => {
      expect(formatted.blur().elementVersion).toBe(formatted.elementVersion);
    });

    it("does not change with a click, also with formatter", () => {
      expect(formatted.click().elementVersion).toBe(formatted.elementVersion);
    });
  });

  describe("focus, blur and click", () => {
    it("focus marks it as focused, but not as touched", () => {
      const focused = control.focus();
      expect(focused.isFocused).toBe(true);
      expect(focused.isTouched).toBe(false);
    });

    it("blur marks it as touched and not focused, without clicks", () => {
      const blurred = control.focus().blur();
      expect(blurred.isFocused).toBe(false);
      expect(blurred.isTouched).toBe(true);
    });

    it("click marks it as touched, but not as focused", () => {
      const clicked = control.click();
      expect(clicked.isFocused).toBe(false);
      expect(clicked.isTouched).toBe(true);
    });

    it("do not modify the values", () => {
      const next = formatted.setValue("Ana").focus().click().blur();
      expect(next.value).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(next.defaultValue.currentValue).toBe("Nico");
      expect(next.payloadValue).toBe("Ana");
      expect(next.formattedValue).toBe("formatted");
    });
  });

  describe("patchValue", () => {
    it("updates the default and current values when the field has not changed", () => {
      const patched = control.patchValue("Ana");
      expect(patched.defaultValue).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(patched.value).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: false,
      });
    });

    it("keeps the default value before the last patch as prevValue", () => {
      expect(control.patchValue("Ana").patchValue("Luz").defaultValue).toEqual({
        currentValue: "Luz",
        prevValue: "Ana",
        hasChanged: true,
      });
    });

    it("has not changed the default when it is patched with the same value", () => {
      expect(control.patchValue("Nico").defaultValue).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
    });

    it("only updates the default value when the user changed the field", () => {
      const patched = control.change("Ana", textState).patchValue("Luz");
      expect(patched.defaultValue).toEqual({
        currentValue: "Luz",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(patched.value).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
    });

    it("only updates the default value when setValue changed the field", () => {
      const patched = control.setValue("Ana").patchValue("Luz");
      expect(patched.defaultValue.currentValue).toBe("Luz");
      expect(patched.value.currentValue).toBe("Ana");
    });

    it("respects a field that the user cleared", () => {
      const patched = emptyControl.change("", textState).patchValue("Ana");
      expect(patched.value.currentValue).toBe("");
      expect(patched.defaultValue.currentValue).toBe("Ana");
    });

    it("respects a text that could not be converted", () => {
      const quantity = new FormControl<Payload, "quantity">({
        eventToPayloadAdapter: adapter,
      });
      const patched = quantity.change(NaN, textState).patchValue(3);
      expect(patched.value.currentValue).toBeNaN();
      expect(patched.defaultValue.currentValue).toBe(3);
    });

    it("updates the current value when the field returned to the default", () => {
      const patched = control
        .setValue("Ana")
        .setValue("Nico")
        .patchValue("Luz");
      expect(patched.value.currentValue).toBe("Luz");
    });

    it("has not changed when the new default is the current value", () => {
      const patched = control.setValue("Ana").patchValue("Ana");
      expect(patched.value.hasChanged).toBe(false);
    });

    it("removes the default value with undefined", () => {
      const patched = control.patchValue(undefined);
      expect(patched.defaultValue).toEqual({
        currentValue: undefined,
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(patched.value.currentValue).toBeUndefined();
    });

    it("keeps focus and touch", () => {
      const patched = control.focus().click().patchValue("Ana");
      expect(patched.isFocused).toBe(true);
      expect(patched.isTouched).toBe(true);
    });
  });

  describe("setValue", () => {
    it("updates the value, but not the default one", () => {
      const next = control.setValue("Ana");
      expect(next.value).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(next.defaultValue).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
    });

    it("keeps focus and touch", () => {
      const next = control.focus().click().setValue("Ana");
      expect(next.isFocused).toBe(true);
      expect(next.isTouched).toBe(true);
    });
  });

  describe("reset", () => {
    it("returns to the default value", () => {
      expect(control.setValue("Ana").reset().value).toEqual({
        currentValue: "Nico",
        prevValue: "Ana",
        hasChanged: false,
      });
    });

    it("returns to the last patched default value", () => {
      const next = control.setValue("Ana").patchValue("Luz").reset();
      expect(next.value.currentValue).toBe("Luz");
      expect(next.value.hasChanged).toBe(false);
    });

    it("removes the value when there is no default", () => {
      const next = emptyControl.setValue("Ana").reset();
      expect(next.value.currentValue).toBeUndefined();
      expect(next.value.hasChanged).toBe(false);
    });

    it("does not modify the default value", () => {
      const next = control.patchValue("Ana").setValue("Luz").reset();
      expect(next.defaultValue).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
    });

    it("is not touched anymore after a click", () => {
      expect(control.click().reset().isTouched).toBe(false);
    });

    it("is not touched anymore after a blur", () => {
      expect(control.focus().blur().reset().isTouched).toBe(false);
    });

    it("can be touched again", () => {
      expect(control.click().reset().click().isTouched).toBe(true);
    });

    it("keeps the focus", () => {
      expect(control.focus().reset().isFocused).toBe(true);
    });
  });

  describe("elementState", () => {
    it("starts with every property undefined", () => {
      expect(control.elementState).toEqual(unmounted);
    });

    it("is the one of the last change event", () => {
      expect(control.change("Ana", textState).elementState).toBe(textState);
    });

    it("is the one of the last syncElement", () => {
      expect(control.syncElement(textState).elementState).toBe(textState);
    });

    it.each(["setValue", "patchValue"] as const)(
      "does not change with %s, until syncElement",
      (operation) => {
        const synced = control.syncElement(textState);
        expect(synced[operation]("Luz").elementState).toBe(textState);
      },
    );

    it("does not change with reset, until syncElement", () => {
      const changed = control.change("Ana", textState);
      expect(changed.reset().elementState).toBe(textState);
    });

    it("does not change with focus, click and blur", () => {
      const synced = control.syncElement(textState);
      expect(synced.focus().click().blur().elementState).toBe(textState);
    });
  });

  describe("syncElement", () => {
    it("only changes the element state", () => {
      const clicked = control.click();
      const synced = clicked.syncElement(textState);
      expect(synced.value).toEqual(clicked.value);
      expect(synced.defaultValue).toEqual(clicked.defaultValue);
      expect(synced.isTouched).toBe(true);
      expect(synced.elementVersion).toBe(clicked.elementVersion);
    });

    it("returns the same control with an equal state", () => {
      const synced = control.syncElement(textState);
      expect(synced.syncElement({ ...textState })).toBe(synced);
    });

    it("returns a new control with another state", () => {
      const synced = control.syncElement(textState);
      expect(synced.syncElement(otherTextState)).not.toBe(synced);
    });

    it.each<[description: string, elementState: ElementState]>([
      ["another kind", { ...textState, kind: "textarea" }],
      ["another checked", { ...textState, checked: true }],
      ["another bad input", { ...textState, badInput: true }],
      ["another file", { ...textState, files: [new File(["content"], "cv.pdf")] }],
    ])("returns a new control with %s", (_description, elementState) => {
      const synced = control.syncElement(textState);
      expect(synced.syncElement(elementState)).not.toBe(synced);
    });

    it("compares the files one by one", () => {
      const synced = control.syncElement({ ...textState, files: [file] });
      expect(synced.syncElement({ ...textState, files: [file] })).toBe(synced);
    });

    it("does not modify the original", () => {
      control.syncElement(otherTextState);
      expect(control.elementState).toEqual(unmounted);
    });
  });

  describe("validationState", () => {
    it("is the validator created for the element state before it mounts", () => {
      expect(control.validationState).toEqual(validState);
      expect(ValidatorMock).toHaveBeenLastCalledWith({
        elementState: unmounted,
        validations: {},
      });
    });

    it("is created for the element state of the change", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      expect(control.change("Ana", textState).validationState).toEqual(invalidState);
      expect(ValidatorMock).toHaveBeenLastCalledWith({
        elementState: textState,
        validations: {},
      });
    });

    it("is created for the last element state after several operations", () => {
      ValidatorMock.mockReturnValue(invalidState as Validator);
      const next = control
        .focus()
        .click()
        .change("Eva", textState)
        .blur()
        .patchValue("Ana")
        .reset()
        .setValue("Luz")
        .syncElement(otherTextState);
      expect(next.validationState).toEqual(invalidState);
      expect(ValidatorMock).toHaveBeenLastCalledWith({
        elementState: otherTextState,
        validations: {},
      });
    });

    it("passes the configured rules", () => {
      const field = new FormControl<Payload, "name">({
        eventToPayloadAdapter: adapter,
        defaultValue: "Nico",
        validations: { required: { propValue: true } },
      });
      expect(field.validationState).toEqual(validState);
      expect(ValidatorMock).toHaveBeenLastCalledWith({
        elementState: unmounted,
        validations: { required: { propValue: true } },
      });
    });
  });

  describe("when nothing changes", () => {
    it("focus returns the same control if it is already focused", () => {
      const focused = control.focus();
      expect(focused.focus()).toBe(focused);
    });

    it("click returns the same control if it is already touched", () => {
      const clicked = control.click();
      expect(clicked.click()).toBe(clicked);
    });

    it("blur returns the same control if it is touched and not focused", () => {
      const blurred = control.focus().blur();
      expect(blurred.blur()).toBe(blurred);
    });

    it("blur returns a new control if it is touched but focused", () => {
      const focused = control.click().focus();
      expect(focused.blur()).not.toBe(focused);
    });

    it("blur returns a new control if it is neither touched nor focused", () => {
      expect(control.blur()).not.toBe(control);
      expect(control.blur().isTouched).toBe(true);
    });

    it.each<[description: string, value: unknown]>([
      ["a text", "Ana"],
      ["an empty text", ""],
      ["undefined", undefined],
      ["null", null],
      ["0", 0],
      ["false", false],
      ["NaN", NaN],
      ["a file", file],
      ["an object", object],
    ])("setValue returns the same control when it has %s", (_description, value) => {
      const field = new FormControl<Payload, "any">({
        eventToPayloadAdapter: adapter,
        defaultValue: "Nico",
      });
      const next = field.setValue(value);
      expect(next.setValue(value)).toBe(next);
    });

    it("setValue compares the dates by their time", () => {
      const birthday = new FormControl<Payload, "birthday">({
        eventToPayloadAdapter: adapter,
        payloadToElementAdapter: toElement,
        defaultValue: new Date("2026-11-23"),
      });
      expect(birthday.setValue(new Date("2026-11-23"))).toBe(birthday);
    });

    it("setValue returns a new control with a different empty value", () => {
      expect(emptyControl.setValue("")).not.toBe(emptyControl);
    });

    it("patchValue returns the same control with the current default value", () => {
      expect(control.patchValue("Nico")).toBe(control);
      expect(emptyControl.patchValue(undefined)).toBe(emptyControl);
    });

    it("patchValue compares the dates by their time", () => {
      const birthday = new FormControl<Payload, "birthday">({
        eventToPayloadAdapter: adapter,
        payloadToElementAdapter: toElement,
        defaultValue: new Date("2026-11-23"),
      });
      expect(birthday.patchValue(new Date("2026-11-23"))).toBe(birthday);
    });

    it("patchValue returns the same control although the field has changed", () => {
      const changed = control.setValue("Ana");
      expect(changed.patchValue("Nico")).toBe(changed);
    });

    it("reset returns the same control if it has its default value and is untouched", () => {
      expect(control.reset()).toBe(control);
      expect(emptyControl.reset()).toBe(emptyControl);
    });

    it("reset returns the same control the second time", () => {
      const reset = control.change("Ana", textState).click().reset();
      expect(reset.reset()).toBe(reset);
    });

    it("reset returns a new control if it is touched", () => {
      const clicked = control.click();
      expect(clicked.reset()).not.toBe(clicked);
    });

    it("change returns a new control although the value is the same", () => {
      expect(control.change("Nico", textState)).not.toBe(control);
    });

    it("reset returns a new control after a change event, although the value is the default one", () => {
      const changed = control.change("Nico", textState);
      expect(changed.reset()).not.toBe(changed);
    });
  });

  describe("immutability", () => {
    it("change does not modify the original", () => {
      expect(control.change("Ana", textState)).not.toBe(control);
      expect(control.value.currentValue).toBe("Nico");
    });

    it("focus does not modify the original", () => {
      expect(control.focus()).not.toBe(control);
      expect(control.isFocused).toBe(false);
    });

    it("blur does not modify the original", () => {
      const focused = control.focus();
      expect(focused.blur()).not.toBe(focused);
      expect(focused.isFocused).toBe(true);
      expect(focused.isTouched).toBe(false);
    });

    it("click does not modify the original", () => {
      expect(control.click()).not.toBe(control);
      expect(control.isTouched).toBe(false);
    });

    it("patchValue does not modify the original", () => {
      expect(control.patchValue("Ana")).not.toBe(control);
      expect(control.defaultValue.currentValue).toBe("Nico");
      expect(control.value.currentValue).toBe("Nico");
    });

    it("setValue does not modify the original", () => {
      expect(control.setValue("Ana")).not.toBe(control);
      expect(control.value.currentValue).toBe("Nico");
    });

    it("reset does not modify the original", () => {
      const changed = control.setValue("Ana").click();
      expect(changed.reset()).not.toBe(changed);
      expect(changed.value.currentValue).toBe("Ana");
      expect(changed.isTouched).toBe(true);
    });
  });
});
