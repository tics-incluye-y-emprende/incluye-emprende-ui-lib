# Validation

Validates the **element** of each field, not its payload value: what it shows, whether it is
checked, its files. So the rules are independent of the Payload type and of how the
`eventToPayloadAdapter` converts the event.

- **`ElementState`**: the properties of the element that rules need, read from it (never the element itself):
  `kind`, `value`, `checked`, `files` and `badInput`.
- **Strategies** (`validationStrategy.ts`): one class per rule, with the most common behavior. Its
  subclasses override only what is specific to some kinds of element, e.g. `CheckedRequiredValidationStrategy`.
  No strategy asks for the kind, and none knows about the other rules.
- **`validationStrategiesPerProp`** (`validator.ts`): the class of each rule for each kind, or its
  `default`. Supporting another kind means adding a class and an entry, not modifying a strategy.
- **`Validator`** (`validator.ts`): receives an element state and the configured rules of its field,
  and combines their results. It is immutable: each element state has its own.

## Usage

Rules are configured per field, in `validations`. `errorMessage` is optional.

```ts
validations: {
  required: { propValue: true, errorMessage: "The name is required" },
  minLength: { propValue: 3, errorMessage: "Use at least 3 characters" },
  custom: { propValue: (element) => element.value !== "admin" },
}
```

The result is the field's `validationState`:

```ts
// with the text "ab"
{
  isValid: false, // the whole field
  errorsState: {
    required: { isValid: true },
    minLength: { isValid: false, type: "tooShort", message: "Use at least 3 characters" },
    custom: { isValid: true },
    maxLength: { isValid: undefined }, // not configured, like pattern, min and max
    // ...
  },
}
```

## Kinds of element

`kind` is `"select"`, `"textarea"` or `"input:"` plus the type of the input.

- **Text-like:** `input:text`, `input:search`, `input:url`, `input:tel`, `input:email`, `input:password` and `textarea`.
- **Number:** `input:number` and `input:range`.
- **Date:** `input:date`, `input:month`, `input:week`, `input:time` and `input:datetime-local`.

## Rules

| Rule | Supported kinds | Passes when | Error type |
| --- | --- | --- | --- |
| `required` | all | see below, or `propValue` is false | `valueMissing` |
| `minLength` | text-like and select | the value has at least that many characters | `tooShort` |
| `maxLength` | text-like and select | the value does not exceed that many characters | `tooLong` |
| `pattern` | text-like and select | the **whole** value matches | `patternMismatch` |
| `min` | number and date | value >= limit | `rangeUnderflow` |
| `max` | number and date | value <= limit | `rangeOverflow` |
| `custom` | all | your function returns true for the element state | `customError` |

A rule configured on a kind without class nor default throws an error with the rule and the kind
when the element mounts.

| Rule | Class | Kinds |
| --- | --- | --- |
| `required` | `RequiredValidationStrategy` | default |
| | `CheckedRequiredValidationStrategy` | checkbox, radio |
| | `FileRequiredValidationStrategy` | file |
| `minLength`, `maxLength`, `pattern` | `MinLength`, `MaxLength`, `PatternValidationStrategy` | text-like, select |
| `min`, `max` | `MinValue`, `MaxValueValidationStrategy` | number, range |
| | `DateMinValue`, `DateMaxValueValidationStrategy` | date kinds |
| `custom` | `CustomValidationStrategy` | default |

`required` evaluates a different property for each kind:

| Kind | Passes when |
| --- | --- |
| checkbox | it is checked |
| radio | a radio of the group is checked |
| file | there is at least one file |
| any other | its value is not `""`, or the browser has text it cannot convert (`badInput`) |

`min` and `max` compare number kinds as numbers. Date kinds are compared as texts, whose format
makes their order the order of the dates and times: write the limit in the format of the input,
e.g. `"2026-11-26"`, `"2026-11"` or `"09:30"`. They fail with `""` and with `badInput`.

## What you need to know

### 1. Nothing is evaluated before the element mounts

The field's state has an `ElementState` whose properties are all `undefined`. It is still
evaluated, so the rules exist, but every one is `undefined`, and so is the field's `isValid`.
When the element mounts, the hook reads it and its initial content is evaluated. The same happens
with fields whose element is shown later.

A field whose element has not mounted does not block the submit: its payload value is sent without
validation.

### 2. Rules differ from native validation on empty values

Browsers skip `minLength`, `pattern`, `min` and `max` when the field is empty. These rules do
not: each one evaluates every value.

### 3. A field is valid only when no rule fails

There is no exception for fields that are not required: `required` is one more rule.

| Rules | `""` | `"ab"` | `"abc"` |
| --- | --- | --- | --- |
| none, or only `required: false` | valid | valid | valid |
| `required: true` | invalid | valid | valid |
| `minLength: 3` | invalid | invalid | valid |
| `required: false` and `minLength: 3` | invalid | invalid | valid |

To make a field optional, but correct when it has a value, use **only** `custom`, or a
`pattern` that accepts the empty text:

```ts
custom: { propValue: (element) => element.value === "" || element.value.length >= 3 }

pattern: { propValue: "([0-9]{3})?" }
```

### 4. A field can be invalid before the user changes it

Once its element mounts, its initial content is evaluated. To show errors only after the user
interacts, use `isTouched`:

```tsx
{field.isTouched && field.validationState.errorsState.minLength.message}
```

A submit does not mark the fields as touched, so showing errors only with `isTouched` hides them
in a form that is submitted without interacting with it.

### 5. A rule's `isValid` has three values

`true` (passes), `false` (fails) and `undefined` (not configured, or the element has not mounted).
Compare with `=== false`: `!isValid` would also include the rules that are not evaluated.
`type` and `message` are only present when the rule fails.

### 6. `custom` receives the element state

It is called with every element state, also the empty ones, and decides whether they pass. It is not
called before the element mounts.

```ts
custom: { propValue: (element) => (element.files?.[0]?.size ?? 0) < 1_000_000 }
```

### 7. Validations do not guarantee the Payload type

They evaluate the element, not what its adapter returned. The form's `payload` has what each adapter
returned, even if it is `undefined`. Making the fields match the body expected by the API is the
responsibility of whoever implements the form.

- **`payload`:** the complete result, `undefined` while the form is not valid.
- **`partialPayload`:** the complete object, with the invalid fields as `undefined`.

### 8. After `patchValue`, `setValue` and `reset`, the element is evaluated again

The hook writes the new value to the element, reads it back and evaluates it. If the element cannot
show the value (e.g. a select without that option), the validation evaluates what it shows.

### 9. Only the library's rules count

The browser's own checks of each type (`email`, `url`, `step`) are not added as rules.

### 10. `noValidate` is your decision

`bind` sets the native `required` attribute, so without `noValidate` the browser can block the
submit with its own message before `handleSubmit` runs. With it, only the `Validator` decides.
Without it, the browser can also block a form that the `Validator` accepts, e.g. because of
`type="email"` or `step`.

```tsx
<form noValidate onSubmit={handleSubmit(save)}>
```
