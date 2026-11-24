# Validation

Validates the raw value of each field of a form: the value of the element, before it is
formatted or transformed for the payload.

- **Strategies** (`validationStrategy.ts`): one class per rule. Each one only decides whether the
  value passes its own rule and knows nothing about the others.
- **`Validator`** (`validator.ts`): runs the configured rules of one field and combines their
  results into the validity of the field.

## Usage

Rules are configured per field, in `validations`. `errorMessage` is optional.

```ts
validations: {
  required: { propValue: true, errorMessage: "The name is required" },
  minLength: { propValue: 3, errorMessage: "Use at least 3 characters" },
  custom: { propValue: (rawValue) => rawValue !== "admin" },
}
```

The result is the field's `validationState`:

```ts
// with the value "ab"
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

## Rules

| Rule | Passes when | Error type | `""` or `undefined` |
| --- | --- | --- | --- |
| `required` | there is a value, or `propValue` is false | `valueMissing` | fails if `propValue` is true |
| `minLength` | the text has at least that many characters | `tooShort` | length 0: fails if the limit is above 0 |
| `maxLength` | the text does not exceed that many characters | `tooLong` | length 0: passes |
| `pattern` | the **whole** text matches | `patternMismatch` | passes only if the pattern matches `""` |
| `min` | value >= limit (numbers or dates) | `rangeUnderflow` | fails |
| `max` | value <= limit (numbers or dates) | `rangeOverflow` | fails |
| `custom` | your function returns true | `customError` | your function decides |

## What you need to know

### 1. Rules differ from native validation on empty values

Browsers skip `minLength`, `pattern`, `min` and `max` when the field is empty. These strategies
do not: each rule evaluates every value. Allowing an optional field to be empty is decided
by the `Validator`.

### 2. An optional field can be empty, but not wrong

- **Required:** valid only if no configured rule fails.
- **Not required** (`required` is absent or its `propValue` is false): valid if it is empty or no
  configured rule fails.

Empty means `undefined`, `""` or `[]`. A blank space (`" "`) and `"0"` are values.

With `minLength: 3`:

| Value | Required | Not required |
| --- | --- | --- |
| `"abc"` | valid | valid |
| `"ab"` | invalid | invalid |
| `""` | invalid | **valid** |

### 3. Check the field's `isValid` before showing errors

An empty optional field is valid, but its rules can still fail in `errorsState`. Without
this check, it would show an error although the field is valid.

```tsx
{!validationState.isValid && errorsState.minLength.message}
```

### 4. A rule's `isValid` has three values

`true` (passes), `false` (fails) and `undefined` (not configured, so it does not count). Compare
with `=== false`: `!isValid` would also include the rules that are not configured.
`type` and `message` are only present when the rule fails.

### 5. `custom` is also ignored in an empty optional field

A check such as "the phone is mandatory if there is no email" needs `required: { propValue: true }`
on that field to make it invalid when it is empty.

### 6. A value that cannot be checked is invalid

`min` and `max` fail with a text that is neither a number nor a date, such as `"abc"`.

### 7. Groups (checkbox groups and multiple selects)

- `minLength`, `maxLength`, `pattern`, `min` and `max` evaluate **each element**; all of them must
  pass. They do not count the selected options: use `custom` for that.
- A group without elements passes those rules.
- `required` (at least one element) and `custom` evaluate the whole group.

### 8. Validations do not guarantee the Payload type

They only check the raw value. When the field's adapter returns `undefined` (e.g. an empty optional
field), the payload includes the raw value as is, even if it does not match the Payload type.
Making the fields match the body expected by the API is the responsibility of whoever implements the form.

### 9. `noValidate` is your decision

`bind` sets the native `required` attribute, so without `noValidate` the browser can block the
submit with its own message before `handleSubmit` runs. With it, only the `Validator` decides.

```tsx
<form noValidate onSubmit={handleSubmit(save)}>
```
