import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import type { ChangeEvent } from "react";
import { useTypedForm } from "./useTypedForm";

interface StoryArgs {
  /** Called with the payload when a valid form is submitted (see the Actions panel). */
  onValid: (payload: unknown) => void;
}

const meta = {
  title: "Hooks/useTypedForm",
  args: { onValid: fn() },
  parameters: {
    // Shows the code of each story as it is written here.
    docs: { source: { type: "code" } },
  },
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<StoryArgs>;

/** Each key of the payload has its own config, and `bind` connects it to an element. */
export const Basic: Story = {
  render: function Basic({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{ name: string; age: number }>({
      fieldsConfig: {
        name: { eventToPayloadAdapter: (e) => e.target.value },
        age: {
          eventToPayloadAdapter: (e) =>
            e.target.value === "" ? undefined : Number(e.target.value),
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Name <input {...bind("name")} />
        </label>
        <label>
          Age <input type="number" {...bind("age")} />
        </label>
        <button>Send</button>
      </form>
    );
  },
};

/** The form is submitted only when no rule fails. Here the errors are shown once the field is touched. */
export const Validations: Story = {
  render: function Validations({ onValid }) {
    const { bind, handleSubmit, state } = useTypedForm<{ name: string }>({
      fieldsConfig: {
        name: {
          eventToPayloadAdapter: (e) => e.target.value,
          validations: {
            required: { propValue: true, errorMessage: "Write your name" },
            minLength: {
              propValue: 3,
              errorMessage: "Use at least 3 characters",
            },
            custom: {
              propValue: (element) => element.value !== "admin",
              errorMessage: "This name is not available",
            },
          },
        },
      },
    });
    const { isTouched, validationState } = state.fields.name;
    const { required, minLength, custom } = validationState.errorsState;
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Name <input {...bind("name")} />
        </label>
        {isTouched && (
          <ul>
            <li>{required.message}</li>
            <li>{minLength.message}</li>
            <li>{custom.message}</li>
          </ul>
        )}
        <button disabled={!state.isValid}>Send</button>
      </form>
    );
  },
};

/** `required` does not make a field optional when it is false. Use only `custom` or a `pattern` that accepts an empty text. */
export const OptionalField: Story = {
  render: function OptionalField({ onValid }) {
    const { bind, handleSubmit, state } = useTypedForm<{ code: string }>({
      fieldsConfig: {
        code: {
          eventToPayloadAdapter: (e) => e.target.value,
          validations: {
            pattern: { propValue: "([0-9]{3})?", errorMessage: "Use 3 digits" },
          },
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Code (optional) <input {...bind("code")} />
        </label>
        <p>{state.fields.code.validationState.errorsState.pattern.message}</p>
        <button>Send</button>
      </form>
    );
  },
};

/** The formatter only changes what is shown while the field is not focused. The payload keeps the value without format. */
export const Formatter: Story = {
  render: function Formatter({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{ phone: string }>({
      fieldsConfig: {
        phone: {
          eventToPayloadAdapter: (e) => e.target.value,
          defaultValue: "3001234567",
          formatter: (phone) =>
            `${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6)}`,
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Phone <input type="tel" {...bind("phone")} />
        </label>
        <button>Send</button>
      </form>
    );
  },
};

/** `patchValue` changes the default value and respects what the user wrote, `setValue` changes the current one and `reset` returns to the default. */
export const PatchSetAndReset: Story = {
  render: function PatchSetAndReset({ onValid }) {
    const { bind, handleSubmit, patchValue, setValue, reset, state } =
      useTypedForm<{ name: string }>({
        fieldsConfig: {
          name: {
            eventToPayloadAdapter: (e) => e.target.value,
            defaultValue: "Nico",
          },
        },
      });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Name <input {...bind("name")} />
        </label>
        <p>Default value: {state.fields.name.defaultValue.currentValue}</p>
        <p>Has changed: {String(state.hasChanged)}</p>
        <button type="button" onClick={() => patchValue({ name: "Ana" })}>
          Patch with Ana
        </button>
        <button type="button" onClick={() => setValue({ name: "Luz" })}>
          Set Luz
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
        <button>Send</button>
      </form>
    );
  },
};

/** Multiple selects are not supported. */
export const SelectAndTextarea: Story = {
  render: function SelectAndTextarea({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{
      message: string;
      fruit: string;
    }>({
      fieldsConfig: {
        message: { eventToPayloadAdapter: (e) => e.target.value },
        fruit: { eventToPayloadAdapter: (e) => e.target.value },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Message <textarea {...bind("message")} />
        </label>
        <label>
          Fruit{" "}
          <select {...bind("fruit")}>
            <option value="">Choose a fruit</option>
            <option value="apple">Apple</option>
            <option value="banana">Banana</option>
          </select>
        </label>
        <button>Send</button>
      </form>
    );
  },
};

/** Each adapter chooses what to read: `checked` or `value`. A required checkbox must be checked, and a required file input must have a file. Groups of checkboxes are not supported. */
export const CheckboxAndRadios: Story = {
  render: function CheckboxAndRadios({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{
      terms: boolean;
      size: string;
    }>({
      fieldsConfig: {
        terms: {
          eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
            e.target.checked,
          defaultValue: false,
          validations: { required: { propValue: true } },
        },
        size: {
          eventToPayloadAdapter: (e) => e.target.value,
          defaultValue: "small",
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          <input type="checkbox" {...bind("terms")} /> Accept the
          terms
        </label>
        <fieldset>
          <legend>Size</legend>
          <label>
            <input type="radio" value="small" {...bind("size")} /> Small
          </label>
          <label>
            <input type="radio" value="large" {...bind("size")} /> Large
          </label>
        </fieldset>
        <button>Send</button>
      </form>
    );
  },
};

/** The adapter takes the File from the event. */
export const FileInput: Story = {
  render: function FileInput({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{ file: File }>({
      fieldsConfig: {
        file: {
          eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
            e.target.files?.[0],
          validations: { required: { propValue: true } },
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          File <input type="file" {...bind("file")} />
        </label>
        <button>Send</button>
      </form>
    );
  },
};

/** A value that is not a text, a number nor a boolean needs `payloadToElementAdapter`, to be shown in the element. */
export const DateInput: Story = {
  render: function DateInput({ onValid }) {
    const { bind, handleSubmit } = useTypedForm<{ birthday: Date }>({
      fieldsConfig: {
        birthday: {
          eventToPayloadAdapter: (e) =>
            e.target.value === "" ? undefined : new Date(e.target.value),
          payloadToElementAdapter: (date) => date.toISOString().slice(0, 10),
          defaultValue: new Date("2000-01-31"),
          validations: { max: { propValue: "2008-01-01" } },
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Birthday <input type="date" {...bind("birthday")} />
        </label>
        <button>Send</button>
      </form>
    );
  },
};

/** `payload` is undefined until the form is valid. `partialPayload` always has every key, with the invalid ones as undefined. */
export const PayloadAndPartialPayload: Story = {
  render: function PayloadAndPartialPayload({ onValid }) {
    const { bind, handleSubmit, state } = useTypedForm<{
      name: string;
      age: number;
    }>({
      fieldsConfig: {
        name: {
          eventToPayloadAdapter: (e) => e.target.value,
          validations: { required: { propValue: true } },
        },
        age: {
          eventToPayloadAdapter: (e) =>
            e.target.value === "" ? undefined : Number(e.target.value),
          validations: { min: { propValue: 18 } },
        },
      },
    });
    return (
      <form onSubmit={handleSubmit(onValid)}>
        <label>
          Name <input {...bind("name")} />
        </label>
        <label>
          Age (18 or more) <input type="number" {...bind("age")} />
        </label>
        <pre>payload: {JSON.stringify(state.payload)}</pre>
        <pre>partialPayload: {JSON.stringify(state.partialPayload)}</pre>
        <button>Send</button>
      </form>
    );
  },
};
