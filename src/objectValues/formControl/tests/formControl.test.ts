import type { ChangeEvent } from "react";
import { ValidationsState } from "../../validation/models";
import { FormControl } from "../formControl";
import { DefaultValue, FieldElement, RawValue } from "../models";

interface Payload {
  name: string;
  quantity: number;
  file: File;
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

describe("FormControl", () => {
  const createValidator = vi.fn();
  const adapter = vi.fn();
  const formatter = vi.fn();

  let input: HTMLInputElement;
  let event: ChangeEvent<FieldElement>;
  /** Field with the default value "Nico". */
  let control: FormControl<Payload, "name">;
  /** Field without default value. */
  let emptyControl: FormControl<Payload, "name">;

  beforeEach(() => {
    vi.resetAllMocks();
    createValidator.mockReturnValue(validState);
    adapter.mockReturnValue("payload");
    formatter.mockReturnValue("formatted");

    input = document.createElement("input");
    event = { target: input, currentTarget: input } as ChangeEvent<HTMLInputElement>;

    control = new FormControl<Payload, "name">(
      { rawToPayloadAdapter: adapter, formatter, defaultValue: "Nico" },
      createValidator,
    );
    emptyControl = new FormControl<Payload, "name">(
      { rawToPayloadAdapter: adapter, formatter },
      createValidator,
    );
  });

  describe("initial state", () => {
    it("starts with the default value", () => {
      expect(control.defaultValue).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
      expect(control.rawValue).toEqual({
        currentValue: "Nico",
        prevValue: undefined,
        hasChanged: false,
      });
    });

    it("starts without value when there is no default value", () => {
      expect(emptyControl.defaultValue).toEqual({
        currentValue: undefined,
        prevValue: undefined,
        hasChanged: false,
      });
      expect(emptyControl.rawValue).toEqual({
        currentValue: undefined,
        prevValue: undefined,
        hasChanged: false,
      });
    });

    it("starts without focus and untouched", () => {
      expect(control.isFocused).toBe(false);
      expect(control.isTouched).toBe(false);
    });
  });

  describe("rawValue.hasChanged", () => {
    it.each<
      [
        description: string,
        defaultValue: DefaultValue,
        rawValue: RawValue,
        hasChanged: boolean,
      ]
    >([
      ["another text", "Nico", "Ana", true],
      ["the same text", "Nico", "Nico", false],
      ["a different case", "Nico", "nico", true],
      ["a blank space without default", undefined, " ", true],
      ["'0' without default", undefined, "0", true],
      ["an empty text without default", undefined, "", true],
      ["an empty list without default", undefined, [], true],
      ["undefined without default", undefined, undefined, false],
      ["undefined with an empty default", "", undefined, true],
      ["an empty list with an empty default", "", [], true],
      ["an empty text with an empty default", "", "", false],
      ["an empty text with a default", "Nico", "", true],
      ["a list with only the default", "red", ["red"], false],
      ["a list with the default and another", "red", ["red", "blue"], true],
      ["a list with another element", "red", ["blue"], true],
    ])(
      "compares with the default value: %s",
      (_description, defaultValue, rawValue, hasChanged) => {
        const field = new FormControl<Payload, "name">(
          { rawToPayloadAdapter: adapter, defaultValue },
          createValidator,
        );
        expect(field.setValue(rawValue).rawValue.hasChanged).toBe(hasChanged);
      },
    );
  });

  describe("change", () => {
    it("updates the raw value, but not the default one", () => {
      input.value = "Ana";
      const changed = control.change(event);
      expect(changed.rawValue).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(changed.defaultValue.currentValue).toBe("Nico");
    });

    it("keeps the value before the last change as prevValue", () => {
      input.value = "Ana";
      const first = control.change(event);
      input.value = "Luz";
      const second = first.change(event);
      expect(second.rawValue.currentValue).toBe("Luz");
      expect(second.rawValue.prevValue).toBe("Ana");
    });

    it("has not changed when the user writes the default value again", () => {
      input.value = "Ana";
      const first = control.change(event);
      input.value = "Nico";
      const second = first.change(event);
      expect(second.rawValue.hasChanged).toBe(false);
    });

    it("has changed when the user writes and clears a field without default", () => {
      input.value = "a";
      const first = emptyControl.change(event);
      input.value = "";
      const second = first.change(event);
      expect(second.rawValue).toEqual({
        currentValue: "",
        prevValue: "a",
        hasChanged: true,
      });
    });

    it("reads the list of a multiple select", () => {
      const select = document.createElement("select");
      select.multiple = true;
      select.innerHTML = `
        <option value="red" selected>Red</option>
        <option value="blue" selected>Blue</option>
      `;
      const changed = control.change({
        target: select,
        currentTarget: select,
      } as ChangeEvent<HTMLSelectElement>);
      expect(changed.rawValue.currentValue).toEqual(["red", "blue"]);
    });

    it("reads a textarea", () => {
      const textarea = document.createElement("textarea");
      textarea.value = "Hello";
      const changed = control.change({
        target: textarea,
        currentTarget: textarea,
      } as ChangeEvent<HTMLTextAreaElement>);
      expect(changed.rawValue.currentValue).toBe("Hello");
    });

    it("throws when the element is not supported", () => {
      const div = document.createElement("div");
      const divEvent = {
        target: div,
        currentTarget: div,
      } as unknown as ChangeEvent<FieldElement>;
      expect(() => control.change(divEvent)).toThrow(/div/i);
    });

    it("keeps focus and touch", () => {
      const changed = control.focus().click().change(event);
      expect(changed.isFocused).toBe(true);
      expect(changed.isTouched).toBe(true);
    });
  });

  describe("payloadValue", () => {
    it("is what the adapter returns for the default value, without event", () => {
      const field = new FormControl<Payload, "name">(
        { rawToPayloadAdapter: adapter, defaultValue: "Nico" },
        createValidator,
      );
      expect(field.payloadValue).toBe("payload");
      expect(adapter.mock.lastCall?.[0]).toBe("Nico");
      expect(adapter.mock.lastCall?.[1]).toBeUndefined();
    });

    it("can have a type different from the raw value", () => {
      adapter.mockReturnValue(3);
      const quantity = new FormControl<Payload, "quantity">(
        { rawToPayloadAdapter: adapter, defaultValue: "3" },
        createValidator,
      );
      expect(quantity.payloadValue).toBe(3);
      expect(quantity.rawValue.currentValue).toBe("3");
    });

    it("calls the adapter with the raw value and the event of the change", () => {
      adapter.mockReturnValue("new payload");
      input.value = "Ana";
      expect(control.change(event).payloadValue).toBe("new payload");
      expect(adapter).toHaveBeenLastCalledWith("Ana", event);
    });

    it("calls the adapter without event for setValue", () => {
      adapter.mockReturnValue("new payload");
      expect(control.setValue("Ana").payloadValue).toBe("new payload");
      expect(adapter.mock.lastCall?.[0]).toBe("Ana");
      expect(adapter.mock.lastCall?.[1]).toBeUndefined();
    });

    it("calls the adapter without event for patchValue", () => {
      adapter.mockReturnValue("new payload");
      expect(control.patchValue("Ana").payloadValue).toBe("new payload");
      expect(adapter.mock.lastCall?.[0]).toBe("Ana");
      expect(adapter.mock.lastCall?.[1]).toBeUndefined();
    });

    it("calls the adapter without event for reset", () => {
      input.value = "Ana";
      const changed = control.change(event);
      adapter.mockReturnValue("new payload");
      expect(changed.reset().payloadValue).toBe("new payload");
      expect(adapter.mock.lastCall?.[0]).toBe("Nico");
      expect(adapter.mock.lastCall?.[1]).toBeUndefined();
    });

    it("is undefined when the adapter returns undefined", () => {
      adapter.mockReturnValue(undefined);
      expect(control.setValue("Ana").payloadValue).toBeUndefined();
    });

    it("is undefined when the default value is not valid", () => {
      createValidator.mockReturnValue(invalidState);
      const invalid = new FormControl<Payload, "name">(
        { rawToPayloadAdapter: adapter, defaultValue: "Nico" },
        createValidator,
      );
      expect(invalid.payloadValue).toBeUndefined();
    });

    it("is undefined while the field is not valid, keeping the raw value", () => {
      createValidator.mockReturnValue(invalidState);
      input.value = "Ana";
      const invalid = control.change(event);
      expect(invalid.payloadValue).toBeUndefined();
      expect(invalid.rawValue.currentValue).toBe("Ana");
    });

    it("returns when the field is valid again", () => {
      createValidator.mockReturnValue(invalidState);
      const invalid = control.change(event);
      createValidator.mockReturnValue(validState);
      expect(invalid.change(event).payloadValue).toBe("payload");
    });

    it("can be a File, also after focus, click and blur", () => {
      const file = new File(["content"], "cv.pdf");
      adapter.mockReturnValue(file);
      input.type = "file";
      const changed = new FormControl<Payload, "file">(
        { rawToPayloadAdapter: adapter },
        createValidator,
      ).change(event);
      expect(changed.focus().click().blur().payloadValue).toBe(file);
      expect(adapter).toHaveBeenLastCalledWith("", event);
    });
  });

  describe("formattedValue", () => {
    it("is what the formatter returns for the default value", () => {
      expect(control.formattedValue).toBe("formatted");
      expect(formatter).toHaveBeenLastCalledWith("Nico");
    });

    it("is undefined without formatter", () => {
      const field = new FormControl<Payload, "name">(
        { rawToPayloadAdapter: adapter, defaultValue: "Nico" },
        createValidator,
      );
      expect(field.formattedValue).toBeUndefined();
    });

    it("is calculated for the changed value, also while it is focused", () => {
      formatter.mockReturnValue("new format");
      input.value = "Ana";
      expect(control.focus().change(event).formattedValue).toBe("new format");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for setValue", () => {
      formatter.mockReturnValue("new format");
      expect(control.setValue("Ana").formattedValue).toBe("new format");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for patchValue", () => {
      formatter.mockReturnValue("new format");
      expect(control.patchValue("Ana").formattedValue).toBe("new format");
      expect(formatter).toHaveBeenLastCalledWith("Ana");
    });

    it("is calculated for reset", () => {
      const changed = control.setValue("Ana");
      formatter.mockReturnValue("new format");
      expect(changed.reset().formattedValue).toBe("new format");
      expect(formatter).toHaveBeenLastCalledWith("Nico");
    });

    it("is calculated although the field is not valid", () => {
      createValidator.mockReturnValue(invalidState);
      expect(control.setValue("Ana").formattedValue).toBe("formatted");
    });

    it.each<[description: string, rawValue: RawValue]>([
      ["undefined", undefined],
      ["an empty text", ""],
      ["an empty list", []],
      ["a list", ["red"]],
    ])("does not call the formatter with %s", (_description, rawValue) => {
      expect(emptyControl.setValue(rawValue).formattedValue).toBeUndefined();
      expect(formatter).not.toHaveBeenCalledWith(rawValue);
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
      const next = control.setValue("Ana").focus().click().blur();
      expect(next.rawValue).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(next.defaultValue.currentValue).toBe("Nico");
      expect(next.payloadValue).toBe("payload");
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
      expect(patched.rawValue).toEqual({
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
        prevValue: "Nico",
        hasChanged: false,
      });
    });

    it("only updates the default value when the user changed the field", () => {
      input.value = "Ana";
      const patched = control.change(event).patchValue("Luz");
      expect(patched.defaultValue).toEqual({
        currentValue: "Luz",
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(patched.rawValue).toEqual({
        currentValue: "Ana",
        prevValue: "Nico",
        hasChanged: true,
      });
    });

    it("only updates the default value when setValue changed the field", () => {
      const patched = control.setValue("Ana").patchValue("Luz");
      expect(patched.defaultValue.currentValue).toBe("Luz");
      expect(patched.rawValue.currentValue).toBe("Ana");
    });

    it("respects a field that the user cleared", () => {
      input.value = "";
      const patched = emptyControl.change(event).patchValue("Ana");
      expect(patched.rawValue.currentValue).toBe("");
      expect(patched.defaultValue.currentValue).toBe("Ana");
    });

    it("updates the current value when the field returned to the default", () => {
      const patched = control
        .setValue("Ana")
        .setValue("Nico")
        .patchValue("Luz");
      expect(patched.rawValue.currentValue).toBe("Luz");
    });

    it("has not changed when the new default is the current value", () => {
      const patched = control.setValue("Ana").patchValue("Ana");
      expect(patched.rawValue.hasChanged).toBe(false);
    });

    it("removes the default value with undefined", () => {
      const patched = control.patchValue(undefined);
      expect(patched.defaultValue).toEqual({
        currentValue: undefined,
        prevValue: "Nico",
        hasChanged: true,
      });
      expect(patched.rawValue.currentValue).toBeUndefined();
    });

    it("keeps focus and touch", () => {
      const patched = control.focus().click().patchValue("Ana");
      expect(patched.isFocused).toBe(true);
      expect(patched.isTouched).toBe(true);
    });
  });

  describe("setValue", () => {
    it("updates the raw value, but not the default one", () => {
      const next = control.setValue("Ana");
      expect(next.rawValue).toEqual({
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

    it("accepts a list", () => {
      expect(
        control.setValue(["red", "blue"]).rawValue.currentValue,
      ).toEqual(["red", "blue"]);
    });

    it("keeps focus and touch", () => {
      const next = control.focus().click().setValue("Ana");
      expect(next.isFocused).toBe(true);
      expect(next.isTouched).toBe(true);
    });
  });

  describe("reset", () => {
    it("returns to the default value", () => {
      expect(control.setValue("Ana").reset().rawValue).toEqual({
        currentValue: "Nico",
        prevValue: "Ana",
        hasChanged: false,
      });
    });

    it("returns to the last patched default value", () => {
      const next = control.setValue("Ana").patchValue("Luz").reset();
      expect(next.rawValue.currentValue).toBe("Luz");
      expect(next.rawValue.hasChanged).toBe(false);
    });

    it("removes the value when there is no default", () => {
      const next = emptyControl.setValue("Ana").reset();
      expect(next.rawValue.currentValue).toBeUndefined();
      expect(next.rawValue.hasChanged).toBe(false);
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

  describe("validationState", () => {
    it("is the validator created for the default value", () => {
      expect(control.validationState).toEqual(validState);
      expect(createValidator).toHaveBeenLastCalledWith({
        rawValue: "Nico",
        validations: {},
      });
    });

    it("is created for the changed raw value", () => {
      createValidator.mockReturnValue(invalidState);
      input.value = "Ana";
      expect(control.change(event).validationState).toEqual(invalidState);
      expect(createValidator).toHaveBeenLastCalledWith({
        rawValue: "Ana",
        validations: {},
      });
    });

    it("keeps the way of creating validators after every operation", () => {
      createValidator.mockReturnValue(invalidState);
      const next = control
        .focus()
        .click()
        .change(event)
        .blur()
        .patchValue("Ana")
        .reset()
        .setValue("Luz");
      expect(next.validationState).toEqual(invalidState);
      expect(createValidator).toHaveBeenLastCalledWith({
        rawValue: "Luz",
        validations: {},
      });
    });

    it("passes the configured rules", () => {
      const field = new FormControl<Payload, "name">(
        {
          rawToPayloadAdapter: adapter,
          defaultValue: "Nico",
          validations: { required: { propValue: true } },
        },
        createValidator,
      );
      expect(field.validationState).toEqual(validState);
      expect(createValidator).toHaveBeenLastCalledWith({
        rawValue: "Nico",
        validations: { required: { propValue: true } },
      });
    });

    it("creates a Validator by default", () => {
      const field = new FormControl<Payload, "name">({
        rawToPayloadAdapter: adapter,
        validations: {
          required: { propValue: true, errorMessage: "Required" },
        },
      });
      expect(field.validationState.isValid).toBe(false);
      expect(field.validationState.errorsState.required.message).toBe("Required");
    });
  });

  describe("immutability", () => {
    it("change does not modify the original", () => {
      input.value = "Ana";
      expect(control.change(event)).not.toBe(control);
      expect(control.rawValue.currentValue).toBe("Nico");
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
      expect(control.rawValue.currentValue).toBe("Nico");
    });

    it("setValue does not modify the original", () => {
      expect(control.setValue("Ana")).not.toBe(control);
      expect(control.rawValue.currentValue).toBe("Nico");
    });

    it("reset does not modify the original", () => {
      const changed = control.setValue("Ana").click();
      expect(changed.reset()).not.toBe(changed);
      expect(changed.rawValue.currentValue).toBe("Ana");
      expect(changed.isTouched).toBe(true);
    });
  });
});
