import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { Form } from "./Form";
import { Button } from "../Button";
import React, { SelectHTMLAttributes } from "react";

const meta = {
  title: "Components/Form",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    onSubmit: fn((e: React.FormEvent<HTMLFormElement>) => e.preventDefault()),
  },
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

interface Payload {
  name: string;
  date: Date;
  quantity: number;
  fruit: string;
  color: string[];
  message: string;
  subject: string;
}

type ValidationType = keyof ValidityState;

const x: ValidationType[] = [
  "badInput",
  "customError",
  "patternMismatch",
  "rangeOverflow",
  "rangeUnderflow",
  "stepMismatch",
  "tooLong",
  "tooShort",
  "typeMismatch",
  "valueMissing",
];

/** The DOM elements a field can be (not their props) */
type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

type InputAttrs = React.InputHTMLAttributes<FieldElement>;
type TextareaAttrs = React.TextareaHTMLAttributes<FieldElement>;
type SelectAttrs = React.SelectHTMLAttributes<FieldElement>;

/** Keys present in all three (keyof a union = only the shared keys) */
type CommonFieldKeys = keyof (InputAttrs | TextareaAttrs | SelectAttrs);

/**
 * Props shared by input, textarea and select, derived from React's own types.
 * Intersecting the three makes every prop valid on each element, so it spreads onto any of them.
 */
type CommonFieldProps = Pick<InputAttrs, CommonFieldKeys> &
  Pick<TextareaAttrs, CommonFieldKeys> &
  Pick<SelectAttrs, CommonFieldKeys>;

interface FormControlConfig<K extends keyof Payload> {
  eventToPayloadAdapter: (
    e: React.ChangeEvent<FieldElement>,
  ) => Payload[K] | undefined;
  required?: boolean;
}

/** Each key gets its own config, so every adapter must return that key's payload type */
type FormConfig = { [K in keyof Payload]: FormControlConfig<K> };

const Implementation: React.FC = () => {
  const formConfig: FormConfig = {
    name: {
      required: true,
      eventToPayloadAdapter: (e) => (e.target as HTMLInputElement).value,
    },
    date: {
      required: true,
      eventToPayloadAdapter: (e) =>
        (e.target as HTMLInputElement).valueAsDate ?? undefined,
    },
    quantity: {
      required: true,
      eventToPayloadAdapter: (e) =>
        (e.target as HTMLInputElement).valueAsNumber,
    },
    fruit: {
      required: true,
      eventToPayloadAdapter: (e) => (e.target as HTMLInputElement).value,
    },
    color: {
      required: true,
      eventToPayloadAdapter: (e) => {
        const checkboxes = document.querySelectorAll<HTMLInputElement>(
          'input[name="color"]:checked',
        );
        const selectedColors = Array.from(checkboxes).map(
          (checkbox) => checkbox.value,
        );
        return selectedColors;
      },
    },
    message: {
      eventToPayloadAdapter: (e) => (e.target as HTMLTextAreaElement).value,
    },
    subject: {
      required: true,
      eventToPayloadAdapter: (e) => (e.target as HTMLSelectElement).value,
    },
  };

  const getPayload = (): Payload | undefined => {
    return Object.keys(formConfig).reduce<Payload | undefined>((acc, key) => {
      if (acc === undefined) return undefined;
      const fieldConfig = formConfig[key as keyof Payload];
      const value = (form as any)[key];
      if (fieldConfig.required && (value === undefined || value === null)) {
        return undefined;
      }
      return { ...acc, [key]: value };
    }, {} as Payload);
  };

  const [form, setForm] = React.useState<Partial<Payload>>({});

  const bindField = <K extends keyof Payload>(
    fieldName: K,
  ): CommonFieldProps => {
    const { eventToPayloadAdapter, required } = formConfig[fieldName];
    return {
      name: fieldName,
      required,
      onChange: (e) => {
        const value = eventToPayloadAdapter(e);
        setForm((prev) => ({ ...prev, [fieldName]: value }));
      },
    };
  };

  return (
    <form aria-label="Contact" action="/send" method="post" className="extra">
      <div>
        <input type="text" {...bindField("name")} />
        <label htmlFor="name">Name:</label>
      </div>
      <div>
        <input type="date" {...bindField("date")} />
        <label htmlFor="date">Date:</label>
      </div>
      <div>
        <input
          type="number"
          id="quantity"
          min="1"
          max="5"
          {...bindField("quantity")}
        />
        <label htmlFor="quantity">Quantity (between 1 and 5):</label>
      </div>
      <fieldset>
        <legend>Choose your favorite fruit:</legend>
        <div>
          <input
            type="radio"
            id="apple"
            value="apple"
            {...bindField("fruit")}
          />
          <label htmlFor="apple">Apple</label>
        </div>
        <div>
          <input
            type="radio"
            id="banana"
            value="banana"
            {...bindField("fruit")}
          />
          <label htmlFor="banana">Banana</label>
        </div>
        <div>
          <input
            type="radio"
            id="cherry"
            value="cherry"
            {...bindField("fruit")}
          />
          <label htmlFor="cherry">Cherry</label>
        </div>
      </fieldset>
      <fieldset>
        <legend>Choose your favorite colors:</legend>
        <div>
          <input type="checkbox" id="red" value="red" {...bindField("color")} />
          <label htmlFor="red">Red</label>
        </div>
        <div>
          <input
            type="checkbox"
            id="green"
            value="green"
            {...bindField("color")}
          />
          <label htmlFor="green">Green</label>
        </div>
        <div>
          <input
            type="checkbox"
            id="blue"
            value="blue"
            {...bindField("color")}
          />
          <label htmlFor="blue">Blue</label>
        </div>
      </fieldset>
      <div>
        <textarea {...bindField("message")} />
        <label htmlFor="message">Message:</label>
      </div>
      <div>
        <select {...bindField("subject")}>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
          <option value="option3">Option 3</option>
        </select>
        <label htmlFor="subject">Subject:</label>
      </div>
      <Button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          const payload = getPayload();
          if (payload === undefined) {
            console.error(
              "Form submission failed: required fields are missing.",
            );
            return;
          }
          console.log("Form submitted with payload:", payload);
        }}
      >
        Send
      </Button>
      <pre>{JSON.stringify(form, null, 2)}</pre>
    </form>
  );
};

export const Default: Story = {
  args: {
    children: <Implementation />,
  },
};
