

interface IAppqaDelegate {
    uniqueName: string;//unique identifier for the control
    featureId: string //feature id of selected menu
    handleShowUserMessage?: (messageText: string, container?: HTMLDivElement) => void;
}

interface IUserDelegation {
    ImpersonatedUserID: string;
    ImpersonatedUser: string;
    ImpersonatedShortName?: string;
    StartDate: string; // format: 'dd-mm-yyyy'
    EndDate: string;   // format: 'dd-mm-yyyy'
    Note?: string;
    Email: string,
    EmailOptin: string,
    Phone: string,
    Address: string,
    PhoneType?: boolean,
    Enabled?: boolean
}

interface IGridRowItem {
    RecID: number | string | null;
    AutoID: number;
    CanChange: boolean;
    DefaultAPValue?: any; // depends on your API shape
    GroupName: string;
    GroupNameDesc?: string;
    SubGroupName?: string;
    SubGroupNameDesc?: string;
    ChangeEvent?: string | null; // or function type if it's a callback
    EntID: number | string | null;
    EntityName?: string;
    _AP: string;
    PropertyLabel?: string;
    NameDesc?: string;
    Value?: any;
    ValueDesc?: string;
    MaxInstances: number;
    IsNZ: boolean;
    IsRequired: boolean;
    LastUpdated?: string | Date;
    NOrder?: number;
    DisplayControl: string; // or enum if you have a set of known values
    InputMask: string;
    GroupControl?: string;
    RegEx?: string;
    IsSaved: boolean;
    IsEdit: boolean;
    IsReadOnly: boolean;
    disabled: boolean;
    OldValue?: any;
    MaxLength: number;
}

interface IDelegateToAnotherUser {
    uniqueName: string;//unique identifier for the control
    handleShowUserMessage?: (messageText: string) => void;
    /** When true, shows Start Date / End Date text on each card and renders renderForm date editor. */
    showStartEndDate?: boolean;
}

interface IDelegateUser {
    tempId?: string;
    _User?: string; // user name
    LoginUser?: string; // login user name 
    DelegateUserEntID: string;
    DelegateUser: string; // delegate user name
    StartDate: string;
    EndDate: string;
    EntID?: string;
    RecID?: string;
    LastUpdated?: string;
    DelegateUserRole?: string;
    checked: boolean; // if true then checked checkbox
    EntityName?: string;
    ContactName?: string;
    FullName?: string;
    Email?: string;
    EmailAddress?: string;
    PrimaryEmail?: string;
    EmailOptin?: string | boolean;
    Address?: string;
    Address1?: string;
    Address2?: string;
    City?: string;
    State?: string;
    Country?: string;
    Zip?: string;
    Phone?: string;
    PhoneNumber?: string;
    Mobile?: string;
    PhoneType?: string;
    IsAuthorized?: boolean;
    DelegateUserShortName?: string;
    DelegateUserBasicRole?: string;
    DelegateUserEnabled?: boolean;
}

export type { IAppqaDelegate, IUserDelegation, IGridRowItem, IDelegateToAnotherUser, IDelegateUser }