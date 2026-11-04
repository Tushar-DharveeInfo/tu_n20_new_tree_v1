import { JSX } from "react";



interface IDcmConsole {

    dcmConsole?: JSX.Element | null; // Optional, can be used for DCM Console integration
    setDCMConsole: (dcmConsole?: JSX.Element | null) => void;

}
export type { IDcmConsole }