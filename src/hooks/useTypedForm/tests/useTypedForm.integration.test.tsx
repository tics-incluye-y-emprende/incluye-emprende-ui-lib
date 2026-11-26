import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode, useState, type ChangeEvent } from "react";
import { useTypedForm } from "../useTypedForm";

// The hook with the real classes, as a developer would use it.

interface TextPayload {
  name: string;
  phone: string;
}

const save = vi.fn();

function TextForm() {
  const { bind, handleSubmit, patchValue, setValue, reset, state } =
    useTypedForm<TextPayload>({
      fieldsConfig: {
        name: {
          eventToPayloadAdapter: (e) => e.target.value,
          defaultValue: "Nico",
          validations: {
            minLength: { propValue: 3, errorMessage: "Too short" },
          },
        },
        phone: {
          eventToPayloadAdapter: (e) => e.target.value,
          formatter: (phone) => `+57 ${phone}`,
        },
      },
    });
  return (
    <form onSubmit={handleSubmit(save)}>
      <input aria-label="Name" {...bind("name")} />
      <input aria-label="Phone" type="tel" {...bind("phone")} />
      <p>{state.fields.name.validationState.errorsState.minLength.message}</p>
      <button type="button" onClick={() => patchValue({ name: "Patched" })}>
        Patch
      </button>
      <button type="button" onClick={() => setValue({ name: "Set" })}>
        Set
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
      <button>Send</button>
    </form>
  );
}

beforeEach(() => {
  save.mockReset();
});

describe("useTypedForm with texts", () => {
  it("shows the default value and submits it", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    expect(screen.getByLabelText("Name")).toHaveValue("Nico");
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledWith({ name: "Nico", phone: undefined });
  });

  it("submits what the user writes", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Ana");
    await user.type(screen.getByLabelText("Phone"), "300");
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ name: "Ana", phone: "300" });
  });

  it("does not submit an invalid form and shows its error", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "An");
    await user.click(screen.getByText("Send"));
    expect(save).not.toHaveBeenCalled();
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("shows the value without format while focused and the formatted one otherwise", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.type(screen.getByLabelText("Phone"), "300");
    expect(screen.getByLabelText("Phone")).toHaveValue("300");
    await user.tab();
    expect(screen.getByLabelText("Phone")).toHaveValue("+57 300");
    await user.click(screen.getByLabelText("Phone"));
    expect(screen.getByLabelText("Phone")).toHaveValue("300");
  });

  it("shows the patched value", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.click(screen.getByText("Patch"));
    expect(screen.getByLabelText("Name")).toHaveValue("Patched");
  });

  it("does not patch what the user wrote", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.type(screen.getByLabelText("Name"), "las");
    await user.click(screen.getByText("Patch"));
    expect(screen.getByLabelText("Name")).toHaveValue("Nicolas");
  });

  it("shows the set value, and the default one after reset", async () => {
    const user = userEvent.setup();
    render(<TextForm />);
    await user.click(screen.getByText("Set"));
    expect(screen.getByLabelText("Name")).toHaveValue("Set");
    await user.click(screen.getByText("Reset"));
    expect(screen.getByLabelText("Name")).toHaveValue("Nico");
  });

  it("works in StrictMode", async () => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <TextForm />
      </StrictMode>,
    );
    await user.type(screen.getByLabelText("Name"), "las");
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ name: "Nicolas", phone: undefined });
  });
});

interface ElementsPayload {
  message: string;
  fruit: string;
  size: string;
  terms: boolean;
  file: File;
}

function ElementsForm() {
  const { bind, handleSubmit, reset } = useTypedForm<ElementsPayload>({
    fieldsConfig: {
      message: { eventToPayloadAdapter: (e) => e.target.value },
      fruit: { eventToPayloadAdapter: (e) => e.target.value },
      size: { eventToPayloadAdapter: (e) => e.target.value, defaultValue: "s" },
      terms: {
        eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
          e.target.checked,
        defaultValue: true,
      },
      file: {
        eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
          e.target.files?.[0],
      },
    },
  });
  return (
    <form onSubmit={handleSubmit(save)}>
      <textarea aria-label="Message" {...bind("message")} />
      <select aria-label="Fruit" {...bind("fruit")}>
        <option value="">Choose</option>
        <option value="apple">Apple</option>
      </select>
      <input aria-label="Small" type="radio" value="s" {...bind("size")} />
      <input aria-label="Large" type="radio" value="l" {...bind("size")} />
      <input aria-label="Terms" type="checkbox" {...bind("terms")} />
      <input aria-label="File" type="file" {...bind("file")} />
      <button type="button" onClick={reset}>
        Reset
      </button>
      <button>Send</button>
    </form>
  );
}

describe("useTypedForm with other elements", () => {
  it("submits the text of a textarea", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    await user.type(screen.getByLabelText("Message"), "Hello");
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].message).toBe("Hello");
  });

  it("submits the option of a select", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    await user.selectOptions(screen.getByLabelText("Fruit"), "apple");
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].fruit).toBe("apple");
  });

  it("submits the value of the chosen radio, which stays checked", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    await user.click(screen.getByLabelText("Small"));
    await user.click(screen.getByLabelText("Large"));
    expect(screen.getByLabelText("Small")).not.toBeChecked();
    expect(screen.getByLabelText("Large")).toBeChecked();
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].size).toBe("l");
  });

  it("shows the default value of a radio and of a checkbox, and submits them", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    expect(screen.getByLabelText("Small")).toBeChecked();
    expect(screen.getByLabelText("Large")).not.toBeChecked();
    expect(screen.getByLabelText("Terms")).toBeChecked();
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].size).toBe("s");
    expect(save.mock.lastCall?.[0].terms).toBe(true);
  });

  it("submits false for an unchecked checkbox", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    await user.click(screen.getByLabelText("Terms"));
    expect(screen.getByLabelText("Terms")).not.toBeChecked();
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].terms).toBe(false);
  });

  it("reset returns every element to its default value", async () => {
    const user = userEvent.setup();
    render(<ElementsForm />);
    await user.type(screen.getByLabelText("Message"), "Hello");
    await user.selectOptions(screen.getByLabelText("Fruit"), "apple");
    await user.click(screen.getByLabelText("Large"));
    await user.click(screen.getByLabelText("Terms"));
    await user.upload(
      screen.getByLabelText("File"),
      new File(["content"], "cv.pdf"),
    );
    await user.click(screen.getByText("Reset"));
    expect(screen.getByLabelText("Message")).toHaveValue("");
    expect(screen.getByLabelText("Fruit")).toHaveValue("");
    expect(screen.getByLabelText("Small")).toBeChecked();
    expect(screen.getByLabelText("Large")).not.toBeChecked();
    expect(screen.getByLabelText("Terms")).toBeChecked();
    expect(screen.getByLabelText<HTMLInputElement>("File").files).toHaveLength(0);
  });

  it("submits the file", async () => {
    const user = userEvent.setup();
    const file = new File(["content"], "cv.pdf");
    render(<ElementsForm />);
    await user.upload(screen.getByLabelText("File"), file);
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].file).toBe(file);
  });
});

interface ConvertedPayload {
  price: number;
  birthday: Date;
}

function ConvertedForm() {
  const { bind, handleSubmit, patchValue, reset, state } =
    useTypedForm<ConvertedPayload>({
      fieldsConfig: {
        price: {
          eventToPayloadAdapter: (e) =>
            e.target.value === "" ? undefined : Number(e.target.value),
          validations: {
            required: { propValue: true, errorMessage: "Required" },
            custom: {
              propValue: (element) => Number(element.value) >= 1,
              errorMessage: "Too low",
            },
          },
        },
        birthday: {
          eventToPayloadAdapter: (e) =>
            e.target.value === "" ? undefined : new Date(e.target.value),
          payloadToElementAdapter: (date) => date.toISOString().slice(0, 10),
          defaultValue: new Date("2000-01-31"),
        },
      },
    });
  return (
    <form onSubmit={handleSubmit(save)}>
      <input aria-label="Price" {...bind("price")} />
      <input aria-label="Birthday" type="date" {...bind("birthday")} />
      <p>{state.fields.price.validationState.errorsState.custom.message}</p>
      <button type="button" onClick={() => patchValue({ price: 5 })}>
        Patch
      </button>
      <button type="button" onClick={reset}>
        Reset
      </button>
      <button>Send</button>
    </form>
  );
}

describe("useTypedForm with converted values", () => {
  it("shows a date with its adapter and submits it as a date", async () => {
    const user = userEvent.setup();
    render(<ConvertedForm />);
    expect(screen.getByLabelText("Birthday")).toHaveValue("2000-01-31");
    await user.type(screen.getByLabelText("Price"), "2");
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledWith({
      price: 2,
      birthday: new Date("2000-01-31"),
    });
  });

  it("does not rewrite the text while the user writes", async () => {
    const user = userEvent.setup();
    render(<ConvertedForm />);
    await user.type(screen.getByLabelText("Price"), "1.");
    expect(screen.getByLabelText("Price")).toHaveValue("1.");
    await user.type(screen.getByLabelText("Price"), "50");
    expect(screen.getByLabelText("Price")).toHaveValue("1.50");
    await user.click(screen.getByText("Send"));
    expect(save.mock.lastCall?.[0].price).toBe(1.5);
  });

  it("keeps a text that cannot be converted, which is not valid", async () => {
    const user = userEvent.setup();
    render(<ConvertedForm />);
    await user.type(screen.getByLabelText("Price"), "abc");
    await user.click(screen.getByText("Patch"));
    await user.click(screen.getByText("Send"));
    expect(screen.getByLabelText("Price")).toHaveValue("abc");
    expect(screen.getByText("Too low")).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it("shows a patched number, and its default after reset", async () => {
    const user = userEvent.setup();
    render(<ConvertedForm />);
    await user.click(screen.getByText("Patch"));
    expect(screen.getByLabelText("Price")).toHaveValue("5");
    await user.clear(screen.getByLabelText("Price"));
    await user.type(screen.getByLabelText("Price"), "abc");
    await user.click(screen.getByText("Reset"));
    expect(screen.getByLabelText("Price")).toHaveValue("5");
  });
});

interface RequiredPayload {
  terms: boolean;
  cv: File;
  start: string;
}

function RequiredForm() {
  const { bind, handleSubmit, state } = useTypedForm<RequiredPayload>({
    fieldsConfig: {
      terms: {
        eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
          e.target.checked,
        defaultValue: false,
        validations: { required: { propValue: true, errorMessage: "Accept" } },
      },
      cv: {
        eventToPayloadAdapter: (e: ChangeEvent<HTMLInputElement>) =>
          e.target.files?.[0],
        validations: { required: { propValue: true, errorMessage: "Attach" } },
      },
      start: {
        eventToPayloadAdapter: (e) => e.target.value,
        defaultValue: "08:00",
        validations: { min: { propValue: "09:00", errorMessage: "Too early" } },
      },
    },
  });
  const { terms, cv, start } = state.fields;
  return (
    <form noValidate onSubmit={handleSubmit(save)}>
      <input aria-label="Terms" type="checkbox" {...bind("terms")} />
      <input aria-label="CV" type="file" {...bind("cv")} />
      <input aria-label="Start" type="time" {...bind("start")} />
      <p>{terms.validationState.errorsState.required.message}</p>
      <p>{cv.validationState.errorsState.required.message}</p>
      <p>{start.validationState.errorsState.min.message}</p>
      <button>Send</button>
    </form>
  );
}

describe("useTypedForm validates the elements", () => {
  it("evaluates the initial values once the elements mount", () => {
    render(<RequiredForm />);
    expect(screen.getByText("Accept")).toBeInTheDocument();
    expect(screen.getByText("Attach")).toBeInTheDocument();
    expect(screen.getByText("Too early")).toBeInTheDocument();
  });

  it("validates a required checkbox with checked", async () => {
    const user = userEvent.setup();
    render(<RequiredForm />);
    await user.click(screen.getByLabelText("Terms"));
    expect(screen.queryByText("Accept")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Terms"));
    expect(screen.getByText("Accept")).toBeInTheDocument();
  });

  it("validates a required file input with its files", async () => {
    const user = userEvent.setup();
    render(<RequiredForm />);
    await user.upload(screen.getByLabelText("CV"), new File(["content"], "cv.pdf"));
    expect(screen.queryByText("Attach")).not.toBeInTheDocument();
  });

  it("compares a time with its limit", async () => {
    const user = userEvent.setup();
    render(<RequiredForm />);
    await user.clear(screen.getByLabelText("Start"));
    await user.type(screen.getByLabelText("Start"), "10:00");
    expect(screen.queryByText("Too early")).not.toBeInTheDocument();
  });

  it("submits when every element is valid", async () => {
    const user = userEvent.setup();
    const cv = new File(["content"], "cv.pdf");
    render(<RequiredForm />);
    await user.click(screen.getByLabelText("Terms"));
    await user.upload(screen.getByLabelText("CV"), cv);
    await user.clear(screen.getByLabelText("Start"));
    await user.type(screen.getByLabelText("Start"), "10:00");
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledWith({ terms: true, cv, start: "10:00" });
  });
});

interface DynamicPayload {
  name: string;
  company: string;
}

function DynamicForm() {
  const [showCompany, setShowCompany] = useState(false);
  const { bind, handleSubmit, state } = useTypedForm<DynamicPayload>({
    fieldsConfig: {
      name: { eventToPayloadAdapter: (e) => e.target.value, defaultValue: "Nico" },
      company: {
        eventToPayloadAdapter: (e) => e.target.value,
        validations: { required: { propValue: true, errorMessage: "Required" } },
      },
    },
  });
  const { isValid } = state.fields.company.validationState;
  return (
    <form noValidate onSubmit={handleSubmit(save)}>
      <input aria-label="Name" {...bind("name")} />
      {showCompany && <input aria-label="Company" {...bind("company")} />}
      <p>Company valid: {String(isValid)}</p>
      <button type="button" onClick={() => setShowCompany(true)}>
        Show company
      </button>
      <button>Send</button>
    </form>
  );
}

describe("useTypedForm with fields that mount later", () => {
  it("does not evaluate a field before its element mounts, and submits without it", async () => {
    const user = userEvent.setup();
    render(<DynamicForm />);
    expect(screen.getByText("Company valid: undefined")).toBeInTheDocument();
    await user.click(screen.getByText("Send"));
    expect(save).toHaveBeenCalledWith({ name: "Nico", company: undefined });
  });

  it("evaluates the field once its element mounts", async () => {
    const user = userEvent.setup();
    render(<DynamicForm />);
    await user.click(screen.getByText("Show company"));
    expect(screen.getByText("Company valid: false")).toBeInTheDocument();
    await user.click(screen.getByText("Send"));
    expect(save).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText("Company"), "Acme");
    expect(screen.getByText("Company valid: true")).toBeInTheDocument();
  });
});
