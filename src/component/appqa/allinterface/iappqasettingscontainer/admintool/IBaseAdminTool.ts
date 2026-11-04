
import { FeatureState } from "../../../../shared/alldefaultprops/basic/DefaultPropsAppqaSettingsContainer"

interface IBaseAdminTool {
    uniqueName: string; // Unique identifier for the component
    featureLabel: string; // Label displayed as a header
    description: string; // Description displayed below the header
    tableLabel: string; // Label for the grid table
    rowData: any[]; // Data for the grid rows
    columnDefs: any[]; // Column definitions for the grid
    featureState: FeatureState; // State of the feature (e.g., Stopped, Running, Paused)
    handleStart: () => void; // Callback for the Start button
    handlePause: () => void; // Callback for the Pause button
    handleResume: () => void; // Callback for the Resume button
    handleStop: () => void; // Callback for the Stop button
}

export type { IBaseAdminTool }