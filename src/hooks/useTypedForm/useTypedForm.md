useTypedForm expects an object config for each form field that needs to be binded within the form like other React libs to forms like "react-form-hook"

type payload {...}

{ bind, ....} = useTypedForm<Payload>(config)

<form>
    <input {...bind(bindConfig)}>

useTypedForm is just the responsible to define the Form reducer but all the form's is handled through classes, using Object Oriented Programming and design patterns,

Initially the bind funcion inject props into the form field element like name, onChange, etc. So the Hook get instances of the classes that contains the logic and it just implements the features provided for the classes

type FieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type ValidationFormFieldProps = Pick<FieldElement, "required" | "maxLength" | "minLength" | "pattern" | "min" | "max">

type ValidationType = keyof ValidityState;


interface ValidationConfig {
    validationPropName: keyof ValidationFormFieldProps;
    validationPropValue?: boolean;
    errorMessage?: string;
}

interface ValidationState {
    isValid: boolean
    errorMessage?: string;
}


interface ValidationConfig<PropToEvaluate keyof FieldElement> {
    propValue: FieldElement[PropToEvaluate];
    errorMessage?: string
}

interface ValidationI {
    validationValue: boolean;
    errorMessage?: string
}

abstract class Validation implements ValidationI<PropToEvaluate keyof FieldElement> {
    constructor (ValidationConfig)
    {}
}

class RequiredValidationStrategy extends Validation<"required"> {
    // it class Validate a prop and return 
}




is a hook that besides the common features of
the React's libraries to handle forms (like react-form-hook, tank stank form, formik etc.) it expects an object that lets implement an adapter to transform the input event to the object typed with the interface specified with the generic Payload


interface FormControlConfig<K extends keyof Payload> {
  eventToPayloadAdapter: (
    e: React.ChangeEvent<FieldElement>,
  ) => Payload[K] | undefined;
  required?: boolean;
}

type FormConfig = { [K in keyof Payload]: FormControlConfig<K> };

