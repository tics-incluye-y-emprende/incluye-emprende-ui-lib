import type { ChangeEvent } from "react";
import { FormControl } from "../../formControl/formControl";
import { FieldElement } from "../../formControl/models";
import { TypedForm } from "../form";
import { PatchValues, SetValues } from "../models";

// FormControl has its own tests.
vi.mock("../../formControl/formControl", () => ({ FormControl: vi.fn() }));

interface Payload {
  name: string;
  age: number;
}

describe("TypedForm", () => {
  const FormControlMock = vi.mocked(FormControl);

  const name = {
    rawValue: { currentValue: "Nico", hasChanged: false },
    payloadValue: "NICO" as string | undefined,
    validationState: { isValid: true },
    isTouched: false,
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    patchValue: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
  };
  const age = {
    rawValue: { currentValue: "3", hasChanged: false },
    payloadValue: 3 as number | undefined,
    validationState: { isValid: true },
    isTouched: false,
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    patchValue: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
  };
  /** What the operations of name return when it changes. */
  const newName = {
    rawValue: { currentValue: "Ana", hasChanged: true },
    payloadValue: "ANA",
    validationState: { isValid: true },
    isTouched: true,
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    patchValue: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
  };
  /** What the operations of age return when it changes. */
  const newAge = {
    rawValue: { currentValue: "4", hasChanged: true },
    payloadValue: 4,
    validationState: { isValid: true },
    isTouched: true,
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    patchValue: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
  };

  const nameConfig = { rawToPayloadAdapter: () => "NICO", defaultValue: "Nico" };
  const ageConfig = { rawToPayloadAdapter: () => 3, defaultValue: "3" };
  const event = {} as ChangeEvent<FieldElement>;

  let form: TypedForm<Payload>;

  beforeEach(() => {
    vi.resetAllMocks();
    name.rawValue.hasChanged = false;
    name.payloadValue = "NICO";
    name.validationState.isValid = true;
    name.isTouched = false;
    age.rawValue.hasChanged = false;
    age.payloadValue = 3;
    age.validationState.isValid = true;
    age.isTouched = false;

    // The controls are created in the order of the config.
    FormControlMock.mockReturnValueOnce(name as never);
    FormControlMock.mockReturnValueOnce(age as never);
    form = new TypedForm<Payload>({
      fieldsConfig: { name: nameConfig, age: ageConfig },
    });
  });

  describe("fields", () => {
    it("creates one control per key, with its config", () => {
      expect(form.fields.name).toBe(name);
      expect(form.fields.age).toBe(age);
      expect(FormControlMock).toHaveBeenCalledTimes(2);
      expect(FormControlMock).toHaveBeenNthCalledWith(1, nameConfig);
      expect(FormControlMock).toHaveBeenNthCalledWith(2, ageConfig);
    });

    it("only has the keys of the config", () => {
      expect(Object.keys(form.fields)).toEqual(["name", "age"]);
    });

    it("does not create the controls again after an operation", () => {
      name.focus.mockReturnValue(newName);
      expect(form.focus("name").fields.age).toBe(age);
      expect(FormControlMock).toHaveBeenCalledTimes(2);
    });
  });

  describe("without fields", () => {
    it("is valid, with an empty payload", () => {
      const emptyForm = new TypedForm<object>({ fieldsConfig: {} });
      expect(emptyForm.isValid).toBe(true);
      expect(emptyForm.isTouched).toBe(false);
      expect(emptyForm.hasChanged).toBe(false);
      expect(emptyForm.fields).toEqual({});
      expect(emptyForm.payload).toEqual({});
      expect(emptyForm.partialPayload).toEqual({});
    });

    it("returns the same form in reset", () => {
      const emptyForm = new TypedForm<object>({ fieldsConfig: {} });
      expect(emptyForm.reset()).toBe(emptyForm);
    });
  });

  describe("isValid", () => {
    it.each([
      [true, true, true],
      [false, true, false],
      [true, false, false],
      [false, false, false],
    ])("with fields valid=%s and valid=%s is %s", (first, second, isValid) => {
      name.validationState.isValid = first;
      age.validationState.isValid = second;
      expect(form.isValid).toBe(isValid);
    });
  });

  describe("isTouched", () => {
    it.each([
      [false, false, false],
      [true, false, true],
      [false, true, true],
      [true, true, true],
    ])("with fields touched=%s and touched=%s is %s", (first, second, isTouched) => {
      name.isTouched = first;
      age.isTouched = second;
      expect(form.isTouched).toBe(isTouched);
    });
  });

  describe("hasChanged", () => {
    it.each([
      [false, false, false],
      [true, false, true],
      [false, true, true],
      [true, true, true],
    ])("with fields changed=%s and changed=%s is %s", (first, second, hasChanged) => {
      name.rawValue.hasChanged = first;
      age.rawValue.hasChanged = second;
      expect(form.hasChanged).toBe(hasChanged);
    });

    it("is false again when the fields return to their default value", () => {
      name.setValue.mockReturnValue(newName);
      newName.setValue.mockReturnValue(name);
      const changed = form.setValue({ name: "Ana" });
      expect(changed.hasChanged).toBe(true);
      expect(changed.setValue({ name: "Nico" }).hasChanged).toBe(false);
    });
  });

  describe("payload", () => {
    it("has the payload value of every field when the form is valid", () => {
      expect(form.payload).toStrictEqual({ name: "NICO", age: 3 });
    });

    it("is undefined when one field is not valid", () => {
      age.validationState.isValid = false;
      age.payloadValue = undefined;
      expect(form.payload).toBeUndefined();
    });

    it("keeps the undefined value of a valid field, without using its raw value", () => {
      name.payloadValue = undefined;
      expect(form.payload).toStrictEqual({ name: undefined, age: 3 });
    });

    it("uses the new control after an operation", () => {
      name.change.mockReturnValue(newName);
      expect(form.change("name", event).payload).toStrictEqual({
        name: "ANA",
        age: 3,
      });
    });
  });

  describe("partialPayload", () => {
    it("is complete when the form is valid", () => {
      expect(form.partialPayload).toStrictEqual({ name: "NICO", age: 3 });
    });

    it("has the invalid fields as undefined", () => {
      age.validationState.isValid = false;
      age.payloadValue = undefined;
      expect(form.partialPayload).toStrictEqual({ name: "NICO", age: undefined });
    });

    it("has every key when no field is valid", () => {
      name.validationState.isValid = false;
      name.payloadValue = undefined;
      age.validationState.isValid = false;
      age.payloadValue = undefined;
      expect(form.partialPayload).toStrictEqual({
        name: undefined,
        age: undefined,
      });
    });
  });

  describe("change", () => {
    it("passes the event to the field and returns a new form with its new control", () => {
      name.change.mockReturnValue(newName);
      const next = form.change("name", event);
      expect(name.change).toHaveBeenCalledWith(event);
      expect(next).toBeInstanceOf(TypedForm);
      expect(next).not.toBe(form);
      expect(next.fields.name).toBe(newName);
    });

    it("does not modify the other fields nor the original form", () => {
      name.change.mockReturnValue(newName);
      const next = form.change("name", event);
      expect(next.fields.age).toBe(age);
      expect(age.change).not.toHaveBeenCalled();
      expect(form.fields.name).toBe(name);
    });

    it("throws an error with the name of an unknown field", () => {
      expect(() => form.change("email" as keyof Payload, event)).toThrow(/email/);
    });
  });

  describe.each(["focus", "blur", "click"] as const)("%s", (operation) => {
    it("returns a new form with the new control of the field", () => {
      name[operation].mockReturnValue(newName);
      const next = form[operation]("name");
      expect(name[operation]).toHaveBeenCalledTimes(1);
      expect(next).toBeInstanceOf(TypedForm);
      expect(next).not.toBe(form);
      expect(next.fields.name).toBe(newName);
    });

    it("does not modify the other fields nor the original form", () => {
      name[operation].mockReturnValue(newName);
      const next = form[operation]("name");
      expect(next.fields.age).toBe(age);
      expect(age[operation]).not.toHaveBeenCalled();
      expect(form.fields.name).toBe(name);
    });

    it("returns the same form when the field does not change", () => {
      name[operation].mockReturnValue(name);
      expect(form[operation]("name")).toBe(form);
    });

    it("throws an error with the name of an unknown field", () => {
      expect(() => form[operation]("email" as keyof Payload)).toThrow(/email/);
    });
  });

  describe.each(["patchValue", "setValue"] as const)("%s", (operation) => {
    it("only changes the passed fields", () => {
      name[operation].mockReturnValue(newName);
      const next = form[operation]({ name: "Ana" });
      expect(name[operation]).toHaveBeenCalledWith("Ana");
      expect(age[operation]).not.toHaveBeenCalled();
      expect(next).toBeInstanceOf(TypedForm);
      expect(next).not.toBe(form);
      expect(next.fields.name).toBe(newName);
      expect(next.fields.age).toBe(age);
    });

    it("changes several fields", () => {
      name[operation].mockReturnValue(newName);
      age[operation].mockReturnValue(newAge);
      const next = form[operation]({ name: "Ana", age: "4" });
      expect(name[operation]).toHaveBeenCalledWith("Ana");
      expect(age[operation]).toHaveBeenCalledWith("4");
      expect(next.fields.name).toBe(newName);
      expect(next.fields.age).toBe(newAge);
    });

    it("passes undefined when the key is present", () => {
      name[operation].mockReturnValue(newName);
      const next = form[operation]({ name: undefined });
      expect(name[operation]).toHaveBeenCalledWith(undefined);
      expect(next.fields.name).toBe(newName);
    });

    it("ignores an unknown key", () => {
      name[operation].mockReturnValue(newName);
      const values = { name: "Ana", email: "a@b.co" } as PatchValues<Payload> &
        SetValues<Payload>;
      const next = form[operation](values);
      expect(next.fields.name).toBe(newName);
      expect(Object.keys(next.fields)).toEqual(["name", "age"]);
    });

    it("returns the same form without values", () => {
      expect(form[operation]({})).toBe(form);
    });

    it("returns the same form when no field changes", () => {
      name[operation].mockReturnValue(name);
      age[operation].mockReturnValue(age);
      expect(form[operation]({ name: "Nico", age: "3" })).toBe(form);
    });

    it("returns a new form when only one of the fields changes", () => {
      name[operation].mockReturnValue(name);
      age[operation].mockReturnValue(newAge);
      const next = form[operation]({ name: "Nico", age: "4" });
      expect(next).not.toBe(form);
      expect(next.fields.name).toBe(name);
      expect(next.fields.age).toBe(newAge);
    });

    it("does not modify the original form", () => {
      name[operation].mockReturnValue(newName);
      form[operation]({ name: "Ana" });
      expect(form.fields.name).toBe(name);
    });
  });

  it("setValue accepts a list", () => {
    name.setValue.mockReturnValue(newName);
    form.setValue({ name: ["red", "blue"] });
    expect(name.setValue).toHaveBeenCalledWith(["red", "blue"]);
  });

  describe("reset", () => {
    it("resets every field", () => {
      name.reset.mockReturnValue(newName);
      age.reset.mockReturnValue(newAge);
      const next = form.reset();
      expect(name.reset).toHaveBeenCalledTimes(1);
      expect(age.reset).toHaveBeenCalledTimes(1);
      expect(next).toBeInstanceOf(TypedForm);
      expect(next.fields.name).toBe(newName);
      expect(next.fields.age).toBe(newAge);
    });

    it("keeps the control of the fields that do not change", () => {
      name.reset.mockReturnValue(newName);
      age.reset.mockReturnValue(age);
      const next = form.reset();
      expect(next).not.toBe(form);
      expect(next.fields.name).toBe(newName);
      expect(next.fields.age).toBe(age);
    });

    it("returns the same form when no field changes", () => {
      name.reset.mockReturnValue(name);
      age.reset.mockReturnValue(age);
      expect(form.reset()).toBe(form);
    });

    it("does not modify the original form", () => {
      name.reset.mockReturnValue(newName);
      age.reset.mockReturnValue(newAge);
      form.reset();
      expect(form.fields.name).toBe(name);
      expect(form.fields.age).toBe(age);
    });
  });

  it("accumulates the changes of several operations", () => {
    name.change.mockReturnValue(newName);
    age.setValue.mockReturnValue(newAge);
    const next = form.change("name", event).setValue({ age: "4" });
    expect(next.fields.name).toBe(newName);
    expect(next.fields.age).toBe(newAge);
    expect(next.isTouched).toBe(true);
    expect(next.hasChanged).toBe(true);
    expect(next.payload).toStrictEqual({ name: "ANA", age: 4 });
  });
});
