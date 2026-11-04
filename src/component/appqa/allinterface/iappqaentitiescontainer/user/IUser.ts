
interface IUserProps {
    uniqueName?: string;
    tabIndex?: string | number;
    featureId?: string;
    selectedUserId?: string;
    checkRoleName?: string | null;
    checkBasicRole?: string | null;
    onUserSelect?: (user: IUserContactEntity) => void;
    handleSelectedCard?: (user: IUserContactEntity) => void;
}

interface IUserContactEntity {
    EntID?: string;
    RecID?: string;
    _User?: string;
    LoginUser?: string;
    UserName?: string;
    User?: string;
    BasicRole?: string;
    Roles?: string;
    Email?: string;
    Phone?: string;
    ContactName?: string;
    CompanyName?: string;
    TenantName?: string;
    TeamName?: string;
    EntityName?: string;
    IsAuthorized?: boolean;
    [key: string]: unknown;
}

export type { IUserProps, IUserContactEntity };