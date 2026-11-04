
interface Task {
    FeatureName: string;
    Required: boolean | null;
    Skip: boolean | null;
    TaskName: string;
    TaskLabel: string;
    TaskTooltip: string;
    TaskResponse: string | null;
}


interface IAdminTool {
    uniqueName: string; // Unique identifier for the component
    featureLabel: string; // Label for the feature note: check the json file for the Feature Label to test
    featureId: string; // Unique identifier for the feature
    featureDescription: string; // Description of the feature
}

export type { IAdminTool, Task }