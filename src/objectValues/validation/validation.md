# Validation

Validates the raw value of each field of a form: the value of the element, before it is
formatted or transformed for the payload.

- **Strategies** (`validationStrategy.ts`): one class per rule. Each one only decides whether the
  value passes its own rule and knows nothing about the others.
- **`Validator`** (`validator.ts`): receives a raw value and the configured rules of its field, and
  combines their results into the validity of the field. It is immutable: each raw value has its own.

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

| Rule | Passes when | Error type | `""` | `undefined` |
| --- | --- | --- | --- | --- |
| `required` | there is a value, or `propValue` is false | `valueMissing` | fails if `propValue` is true | fails if `propValue` is true |
| `minLength` | the text has at least that many characters | `tooShort` | fails if the limit is above 0 | fails |
| `maxLength` | the text does not exceed that many characters | `tooLong` | passes | passes |
| `pattern` | the **whole** text matches | `patternMismatch` | passes if the pattern matches it | evaluated as `""` |
| `min` | value >= limit (numbers or dates) | `rangeUnderflow` | fails | fails |
| `max` | value <= limit (numbers or dates) | `rangeOverflow` | fails | fails |
| `custom` | your function returns true | `customError` | your function decides | your function decides |

## What you need to know

### 1. Rules differ from native validation on empty values

Browsers skip `minLength`, `pattern`, `min` and `max` when the field is empty. These rules do
not: each one evaluates every value.

### 2. A field is valid only when no rule fails

There is no exception for fields that are not required: `required` is one more rule.

| Rules | `undefined` | `""` | `"ab"` | `"abc"` |
| --- | --- | --- | --- | --- |
| none, or only `required: false` | valid | valid | valid | valid |
| `required: true` | invalid | invalid | valid | valid |
| `minLength: 3` | invalid | invalid | invalid | valid |
| `required: false` and `minLength: 3` | invalid | invalid | invalid | valid |

To make a field optional, but correct when it has a value, use **only** `custom`, or a
`pattern` that accepts the empty text:

```ts
custom: { propValue: (rawValue) => !rawValue || rawValue.length >= 3 }

pattern: { propValue: "([0-9]{3})?" }
```

If your `custom` or your `pattern` accepts `undefined`, that is respected, but it does not make up
for another rule that fails: with `min: 9` the field is invalid.

### 3. A field can be invalid before the user changes it

A field without default value starts as `undefined`, which fails every rule
but `maxLength`, unless your `custom` or `pattern` accepts it or `required` is false. To show errors only after the user interacts, use `isTouched`:

```tsx
{field.isTouched && field.validationState.errorsState.minLength.message}
```

### 4. A rule's `isValid` has three values

`true` (passes), `false` (fails) and `undefined` (not configured, so it does not count). Compare
with `=== false`: `!isValid` would also include the rules that are not configured.
`type` and `message` are only present when the rule fails.

### 5. `custom` always counts

It receives every raw value, also the empty ones, and decides whether they pass.

### 6. A value that cannot be checked is invalid

`min` and `max` fail with a text that is neither a number nor a date, such as `"abc"`.

### 7. Groups (multiple selects)

This version does not handle groups of checkboxes that share a name.

- `minLength`, `maxLength`, `pattern`, `min` and `max` evaluate **each element**; all of them must
  pass. They do not count the selected options: use `custom` for that.
- A group without elements passes those rules.
- `required` (at least one element) and `custom` evaluate the whole group.

### 8. Validations do not guarantee the Payload type

They only check the raw value. When the field's adapter returns `undefined`, the payload includes the raw value as is, even if it does not match the Payload type.
Making the fields match the body expected by the API is the responsibility of whoever implements the form.

### 9. Validations do not know whether a checkbox or radio is checked

The raw value of both is their `value`, whether or not they are checked. `checked` is independent:
read it in the adapter, with `e.target.checked`. So `required` and `custom` cannot reject an
unchecked checkbox, and default, patched, set or reset values do not check or uncheck it.

### 10. `noValidate` is your decision

`bind` sets the native `required` attribute, so without `noValidate` the browser can block the
submit with its own message before `handleSubmit` runs. With it, only the `Validator` decides.

```tsx
<form noValidate onSubmit={handleSubmit(save)}>
```
