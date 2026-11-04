// 1. State Initialization:
//    - Initialize state variables `showSuccess` and `readOnlyMode` using the `useState` hook.

// 2. Effect for Show Success:
//    - Use the `useEffect` hook to check if the `IsSaved` property in the `data` object changes.
//    - If `IsSaved` changes to `true`, set `showSuccess` to `true`, indicating a successful save.

// 3. Effect for Read-Only Mode:
//    - Use another `useEffect` hook to check user permissions and set the `readOnlyMode` based on the return value from `checkUserPermission`.

// 4. Rendering Component:
//    - The main component (`ValueRenderer`) renders based on the `data` and `value` properties passed as props.
//    - It displays a tooltip with `ValueDesc`.

// 5. Conditional Rendering of Display Controls:
//    - Check if `DisplayControl` is of type `WordEditControl`. If true, render a `div` with the content in `value`.
//    - If `MaxInstances` is 0, conditionally render different display controls (`YesNoControl`, `TrueFalseControl`, `EnableDisableControl`, `HiddenEditTextControl`) based on the `DisplayControl` type.
//    - Display the value if it doesn't match any of the predefined display control types.

// 6. Buttons for Form Instances:
//    - If `MaxInstances` is 1, render a button with an icon for single form instances.
//    - If `MaxInstances` is greater than 1, render a button with an icon for multiple form instances.

// 7. Event Handling:
//    - Attach event handlers (`onClick`) to the buttons, calling `handleClickFormInstance` and passing the component's props.

// 8. Component Styling:
//    - Apply CSS classes and styles for proper rendering and styling of the components.

// 9. Return Statement:
//    - The component returns JSX, encapsulated within a `span` element.

// 10. Export:
//     - Export the `ValueRenderer` functional component as the default export.

// This workflow outlines the key steps and logic in the provided code, from state initialization to rendering the component and handling events. The specific behavior depends on the values of `data` and `value` props and the conditions set in the code.


import React, { useState, useEffect, useRef } from 'react';
import { useSessionContext } from "../../../shared/context/hooks/SessionHooks";

import { FnCheckUserPermission } from "../../../shared/allcommon/basic/FnCheckUserPermission";
import { FnConvertDateToUtcOrUtcToDate } from '../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate';
import { FnIsValidDateInput } from '../../../appcontainer/allcommon/FnIsValidDateInput';
import { YesNoControl } from '@n20a/libform';
import { DisplayControlEnums } from '../../../shared/alldefaultprops/basic/DefaultPropsFormContainer';

interface IValueRendererProps {
  data: {
    IsSaved: boolean; //  If `IsSaved` changes to `true`, set `showSuccess` to `true`, indicating a successful save.
    ValueDesc: string; // It displays a tooltip with `ValueDesc`.
    DisplayControl?: string; // to render control
    MaxInstances: number;// If `MaxInstances` is greater than 1, render a button with an icon for multiple form instances.
    DefaultAPValue: string; //  default value of form control
    _AP?: string; // AP  value
    [key: string]: string | boolean | any;
  };
  value: string; // value of control
  disableControls?: boolean; // if true then readonly control
  handleClickFormInstance: (props: IValueRendererProps) => void; // handle form 
}

const ValueRenderer: React.FC<IValueRendererProps> = (props) => {
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const sessionContext = useSessionContext();
  const sessionRef = useRef(sessionContext.SessionList);
  // Effect to check user permission and set read-only mode
  useEffect(() => {
    const returnData = FnCheckUserPermission(sessionRef.current);
    setReadOnlyMode(returnData === "RW" ? false : true);

  }, []);
  return (

    <span title={props.data.ValueDesc} className="nz-cell-value-renderer-span" >
      {props?.data?.DisplayControl && props?.data?.DisplayControl?.toLowerCase() === DisplayControlEnums.HyperlinkControl.toString()?.toLowerCase() ?
        <a href={props.value} target="_blank" rel="noopener noreferrer">{props.data._AP}</a>
        : props?.data?.DisplayControl && props.data.DisplayControl?.toLowerCase() === DisplayControlEnums.WordEditControl.toString()?.toLowerCase() ? <div className="nz-div-wordEditControl-value" dangerouslySetInnerHTML={{ __html: typeof props.value === "string" ? props.value : "" }} /> : (<>{props.data.MaxInstances === 0 && <>
          {props?.data?.DisplayControl && (props.data.DisplayControl?.toLowerCase() === DisplayControlEnums.YesNoControl.toString()?.toLowerCase()
            || props.data.DisplayControl?.toLowerCase() === DisplayControlEnums.TrueFalseControl.toString()?.toLowerCase()
            || props.data.DisplayControl?.toLowerCase() === DisplayControlEnums.EnableDisableControl.toString()?.toLowerCase()) &&
            <YesNoControl name="valueRenderer" label={""} value={props.value === "1" || props.value === "true" || props.value === "yes" ? true : false} readOnly={true} />}
          {props?.data?.DisplayControl && props.data.DisplayControl?.toLowerCase() === DisplayControlEnums.HiddenEditTextControl.toString()?.toLowerCase() && <span> {props.value ? props.value.split('').map(() => '•') : ""}</span>}
          {props?.data?.DisplayControl && (props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.YesNoControl.toString()?.toLowerCase()
            && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.TrueFalseControl.toString()?.toLowerCase()
            && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.EnableDisableControl.toString()?.toLowerCase()
            && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.HiddenEditTextControl.toString()?.toLowerCase())
            && (props.data._AP?.toLowerCase() === "lastupdated" || props.data._AP?.toLowerCase().includes('startdate') || props.data._AP?.toLowerCase().includes('starttime') || props.data._AP?.toLowerCase().includes('endtime') || props.data._AP?.toLowerCase().includes('enddate')) ? (props.value && FnIsValidDateInput(props.value) ? FnConvertDateToUtcOrUtcToDate(props.value, false, true) : "") : props?.data?.DisplayControl && (props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.YesNoControl.toString()?.toLowerCase()
              && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.TrueFalseControl.toString()?.toLowerCase()
              && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.EnableDisableControl.toString()?.toLowerCase()
              && props?.data?.DisplayControl?.toLowerCase() !== DisplayControlEnums.HiddenEditTextControl.toString()?.toLowerCase())

          && props.value}

        </>}
        </>)
      }
      {!props?.data?.DisplayControl && props.value}

    </span >
  );
};

export { ValueRenderer }