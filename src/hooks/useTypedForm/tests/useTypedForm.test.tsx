import { act, renderHook } from "@testing-library/react";
import { StrictMode, type ChangeEvent, type FormEvent } from "react";
import { TypedForm } from "../../../objectValues/form/form";
import { executeFormControlStrategy } from "../../../objectValues/formControl/formControl";
import { ElementState, FieldElement } from "../../../objectValues/formControl/models";
import { useTypedForm } from "../useTypedForm";

// Both have their own tests.
vi.mock("../../../objectValues/form/form", () => ({ TypedForm: vi.fn() }));
vi.mock("../../../objectValues/formControl/formControl", () => ({
  executeFormControlStrategy: vi.fn(),
}));

interface Payload {
  name: string;
  phone: string;
}

describe("useTypedForm", () => {
  const TypedFormMock = vi.mocked(TypedForm);
  const executeStrategyMock = vi.mocked(executeFormControlStrategy);

  const props = {
    fieldsConfig: {
      name: {
        eventToPayloadAdapter: () => "Nico",
        validations: { required: { propValue: true } },
      },
      phone: { eventToPayloadAdapter: () => "300" },
    },
  };

  const form = {
    payload: { name: "Nico", phone: "300" } as Payload | undefined,
    fields: {
      name: { elementValue: "Nico", elementVersion: 0, eventToPayload: vi.fn() },
      phone: { elementValue: "300", elementVersion: 0, eventToPayload: vi.fn() },
    },
    change: vi.fn(),
    focus: vi.fn(),
    blur: vi.fn(),
    click: vi.fn(),
    patchValue: vi.fn(),
    setValue: vi.fn(),
    reset: vi.fn(),
    syncElement: vi.fn(),
  };
  /** What the operations of the form return: the name must be written again. */
  const newForm = {
    payload: { name: "Ana", phone: "300" },
    fields: {
      name: { elementValue: "Ana", elementVersion: 1, eventToPayload: vi.fn() },
      phone: { elementValue: "300", elementVersion: 0, eventToPayload: vi.fn() },
    },
    syncElement: vi.fn(),
  };
  /** What the form returns when the user changes the name: it must not be written. */
  const changedForm = {
    payload: { name: "Ana", phone: "300" },
    fields: {
      name: { elementValue: "Ana", elementVersion: 0, eventToPayload: vi.fn() },
      phone: { elementValue: "300", elementVersion: 0, eventToPayload: vi.fn() },
    },
    syncElement: vi.fn(),
  };
  const strategy = { setElementValue: vi.fn(), getElementState: vi.fn() };
  const eventInput = document.createElement("input");
  const changeEvent = { target: eventInput } as ChangeEvent<FieldElement>;
  const elementState: ElementState = {
    kind: "input:text",
    value: "Ana",
    checked: false,
    files: [],
    badInput: false,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    form.payload = { name: "Nico", phone: "300" };
    TypedFormMock.mockReturnValue(form as never);
    executeStrategyMock.mockReturnValue(strategy as never);
    strategy.getElementState.mockReturnValue(elementState);
    // The sync after a write does not change the form, unless a test says so.
    form.syncElement.mockReturnValue(form);
    newForm.syncElement.mockReturnValue(newForm);
    changedForm.syncElement.mockReturnValue(changedForm);
  });

  describe("state", () => {
    it("is the form created with the config", () => {
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      expect(result.current.state).toBe(form);
      expect(TypedFormMock).toHaveBeenCalledWith(props);
    });

    it("is the same after rendering again with another config object", () => {
      const { result, rerender } = renderHook(() =>
        useTypedForm<Payload>({
          fieldsConfig: {
            name: { eventToPayloadAdapter: () => "Nico" },
            phone: { eventToPayloadAdapter: () => "300" },
          },
        }),
      );
      TypedFormMock.mockReturnValue(newForm as never);
      rerender();
      expect(result.current.state).toBe(form);
    });

    it("does not change when the operation returns the same form", () => {
      form.focus.mockReturnValue(form);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").onFocus());
      expect(result.current.state).toBe(form);
    });
  });

  describe("bind", () => {
    it("returns the name of the field", () => {
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      expect(result.current.bind("name").name).toBe("name");
      expect(result.current.bind("phone").name).toBe("phone");
    });

    it("returns the value of the required rule, undefined when there is none", () => {
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      expect(result.current.bind("name").required).toBe(true);
      expect(result.current.bind("phone").required).toBeUndefined();
    });

    it("returns false when the required rule is false", () => {
      const { result } = renderHook(() =>
        useTypedForm<Payload>({
          fieldsConfig: {
            name: {
              eventToPayloadAdapter: () => "Nico",
              validations: { required: { propValue: false } },
            },
            phone: { eventToPayloadAdapter: () => "300" },
          },
        }),
      );
      expect(result.current.bind("name").required).toBe(false);
    });

    it("onChange changes the field to the payload value and the element state of the event", () => {
      form.fields.name.eventToPayload.mockReturnValue("Ana");
      form.change.mockReturnValue(changedForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").onChange(changeEvent));
      expect(form.fields.name.eventToPayload).toHaveBeenCalledWith(changeEvent);
      expect(executeStrategyMock).toHaveBeenCalledWith(eventInput);
      expect(form.change).toHaveBeenCalledWith("name", "Ana", elementState);
      expect(result.current.state).toBe(changedForm);
    });

    it("onChange reads the event once, also in StrictMode", () => {
      form.fields.name.eventToPayload.mockReturnValue("Ana");
      form.change.mockReturnValue(changedForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props), {
        wrapper: StrictMode,
      });
      act(() => result.current.bind("name").onChange(changeEvent));
      expect(form.fields.name.eventToPayload).toHaveBeenCalledTimes(1);
      expect(strategy.getElementState).toHaveBeenCalledTimes(1);
    });

    it("onChange throws the error of the adapter in the handler", () => {
      form.fields.name.eventToPayload.mockImplementation(() => {
        throw new Error("Adapter error");
      });
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      expect(() => result.current.bind("name").onChange(changeEvent)).toThrow(
        "Adapter error",
      );
      expect(form.change).not.toHaveBeenCalled();
    });

    it("does not control the content of the element", () => {
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      expect(result.current.bind("name")).not.toHaveProperty("value");
      expect(result.current.bind("name")).not.toHaveProperty("defaultValue");
      expect(result.current.bind("name")).not.toHaveProperty("checked");
      expect(result.current.bind("name")).not.toHaveProperty("defaultChecked");
    });

    it("onFocus focuses the field", () => {
      form.focus.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").onFocus());
      expect(form.focus).toHaveBeenCalledWith("name");
      expect(result.current.state).toBe(newForm);
    });

    it("onBlur blurs the field", () => {
      form.blur.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").onBlur());
      expect(form.blur).toHaveBeenCalledWith("name");
      expect(result.current.state).toBe(newForm);
    });

    it("onClick clicks the field", () => {
      form.click.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").onClick());
      expect(form.click).toHaveBeenCalledWith("name");
      expect(result.current.state).toBe(newForm);
    });
  });

  describe("ref of bind", () => {
    it("shows the value when the element mounts", () => {
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      expect(executeStrategyMock).toHaveBeenCalledWith(input);
      expect(strategy.setElementValue).toHaveBeenCalledTimes(1);
      expect(strategy.setElementValue).toHaveBeenCalledWith("Nico");
    });

    it("does not write again without changes", () => {
      const input = document.createElement("input");
      const { result, rerender } = renderHook(() =>
        useTypedForm<Payload>(props),
      );
      act(() => result.current.bind("name").ref(input));
      rerender();
      act(() => result.current.bind("name").ref(null));
      act(() => result.current.bind("name").ref(input));
      expect(strategy.setElementValue).toHaveBeenCalledTimes(1);
    });

    it("writes the new value when the version changes", () => {
      form.setValue.mockReturnValue(newForm);
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      act(() => result.current.setValue({ name: "Ana" }));
      act(() => result.current.bind("name").ref(input));
      expect(strategy.setElementValue).toHaveBeenCalledTimes(2);
      expect(strategy.setElementValue).toHaveBeenLastCalledWith("Ana");
    });

    it("does not write what the user enters", () => {
      form.change.mockReturnValue(changedForm);
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      act(() => result.current.bind("name").onChange(changeEvent));
      act(() => result.current.bind("name").ref(input));
      expect(strategy.setElementValue).toHaveBeenCalledTimes(1);
    });

    it("shows the current value in an element that mounts later", () => {
      form.change.mockReturnValue(changedForm);
      const input = document.createElement("input");
      const laterInput = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      act(() => result.current.bind("name").onChange(changeEvent));
      act(() => result.current.bind("name").ref(laterInput));
      expect(executeStrategyMock).toHaveBeenLastCalledWith(laterInput);
      expect(strategy.setElementValue).toHaveBeenLastCalledWith("Ana");
    });

    it("writes to every element of the field, like radios", () => {
      const first = document.createElement("input");
      const second = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(first));
      act(() => result.current.bind("name").ref(second));
      expect(executeStrategyMock).toHaveBeenCalledWith(first);
      expect(executeStrategyMock).toHaveBeenCalledWith(second);
      expect(strategy.setElementValue).toHaveBeenCalledTimes(2);
    });

    it("syncs the element state after writing", () => {
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      expect(strategy.getElementState).toHaveBeenCalledTimes(1);
      expect(form.syncElement).toHaveBeenCalledWith("name", elementState);
    });

    it("reads the element state after writing to it", () => {
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      expect(strategy.setElementValue.mock.invocationCallOrder[0]).toBeLessThan(
        strategy.getElementState.mock.invocationCallOrder[0],
      );
    });

    it("uses the form returned by syncElement", () => {
      form.syncElement.mockReturnValue(newForm);
      const input = document.createElement("input");
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(input));
      expect(result.current.state).toBe(newForm);
    });

    it("does not sync when it does not write", () => {
      const input = document.createElement("input");
      const { result, rerender } = renderHook(() =>
        useTypedForm<Payload>(props),
      );
      act(() => result.current.bind("name").ref(input));
      rerender();
      act(() => result.current.bind("name").ref(input));
      expect(form.syncElement).toHaveBeenCalledTimes(1);
    });

    it("does nothing when the element is unmounted", () => {
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.bind("name").ref(null));
      expect(executeStrategyMock).not.toHaveBeenCalled();
      expect(form.syncElement).not.toHaveBeenCalled();
    });

    it("is a new callback on each render", () => {
      const { result, rerender } = renderHook(() =>
        useTypedForm<Payload>(props),
      );
      const firstRef = result.current.bind("name").ref;
      rerender();
      expect(result.current.bind("name").ref).not.toBe(firstRef);
    });
  });

  describe("handleSubmit", () => {
    it("calls onValid with the payload and prevents the native submit", () => {
      const onValid = vi.fn();
      const preventDefault = vi.fn();
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() =>
        result.current.handleSubmit(onValid)({
          preventDefault,
        } as unknown as FormEvent<HTMLFormElement>),
      );
      expect(onValid).toHaveBeenCalledTimes(1);
      expect(onValid).toHaveBeenCalledWith({ name: "Nico", phone: "300" });
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("does not call onValid without payload, but prevents the native submit", () => {
      form.payload = undefined;
      const onValid = vi.fn();
      const preventDefault = vi.fn();
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() =>
        result.current.handleSubmit(onValid)({
          preventDefault,
        } as unknown as FormEvent<HTMLFormElement>),
      );
      expect(onValid).not.toHaveBeenCalled();
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it("does not call onValid before the submit", () => {
      const onValid = vi.fn();
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      result.current.handleSubmit(onValid);
      expect(onValid).not.toHaveBeenCalled();
    });
  });

  describe("patchValue, setValue and reset", () => {
    it("patchValue patches the form", () => {
      form.patchValue.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.patchValue({ name: "Ana" }));
      expect(form.patchValue).toHaveBeenCalledWith({ name: "Ana" });
      expect(result.current.state).toBe(newForm);
    });

    it("setValue sets the values of the form", () => {
      form.setValue.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.setValue({ name: "Ana" }));
      expect(form.setValue).toHaveBeenCalledWith({ name: "Ana" });
      expect(result.current.state).toBe(newForm);
    });

    it("reset resets the form", () => {
      form.reset.mockReturnValue(newForm);
      const { result } = renderHook(() => useTypedForm<Payload>(props));
      act(() => result.current.reset());
      expect(form.reset).toHaveBeenCalled();
      expect(result.current.state).toBe(newForm);
    });

    it("are the same functions on every render", () => {
      const { result, rerender } = renderHook(() =>
        useTypedForm<Payload>(props),
      );
      const { patchValue, setValue, reset } = result.current;
      rerender();
      expect(result.current.patchValue).toBe(patchValue);
      expect(result.current.setValue).toBe(setValue);
      expect(result.current.reset).toBe(reset);
    });
  });
});
