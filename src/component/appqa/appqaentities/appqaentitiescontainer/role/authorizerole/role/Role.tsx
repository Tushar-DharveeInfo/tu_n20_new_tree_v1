
import { useEffect, useRef, useState } from "react";
import "../../../../../allcss/appqaentitiescontainer/role/Role.css";
import { useStatusBarContext } from "../../../../../../shared/context/hooks/StatusBarHooks";
import { useSessionContext } from "../../../../../../shared/context/hooks/SessionHooks";
import { axiosInterceptor } from "../../../../../../shared/interceptors/Interceptor";
import { AUTH } from "../../../../../../shared/interceptors/EndPoints";
import { CardLayout } from "../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { Role24x24 } from "@n20a/libicon";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { IRoleProps, IRoleRecord } from "../../../../../allinterface/iappqaentitiescontainer/role/IRole";
import { FnGetDisplayValue } from "../../../../../allcommon/FnGetAddressDisplay";



const extractRolesWithGroupName = (value: unknown): IRoleRecord[] => {
    if (!value || typeof value !== "object") {
        return [];
    }

    const result: IRoleRecord[] = [];

    const traverseRoleNodes = (nodes: unknown) => {
        if (!Array.isArray(nodes)) return;

        for (const node of nodes) {
            if (!node || typeof node !== "object") continue;
            const roleNode = node as Record<string, unknown>;

            const groupName = String(roleNode.GroupName ?? "").trim();
            if (groupName) {
                result.push(roleNode as IRoleRecord);
            }

            traverseRoleNodes(roleNode.Children);
            traverseRoleNodes(roleNode.Roles);
        }
    };

    const root = value as Record<string, unknown>;
    traverseRoleNodes(root.Roles);
    return result.sort((a, b) =>
        (a.Name ?? "").localeCompare(b.Name ?? "", undefined, {
            sensitivity: "base",
        })
    );
};

/** Builds CardLayout name/value rows from a role record. */
const buildRoleCardFields = (
    roleTitle: string,
    description: string
): ICardLayoutField[] => {
    const fields: ICardLayoutField[] = [
        {
            Name: "Role",
            Value: roleTitle || "—",
            Header: 1,
        },
    ];

    if (description) {
        fields.push({ Name: "Description", Value: description });
    }

    return fields;
};

const Role = (roleProps: IRoleProps) => {
    const uniqueName = roleProps.uniqueName ?? "role-card";
    const [roles, setRoles] = useState<IRoleRecord[]>([]);
    const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);
    const [hasRequestedRoles, setHasRequestedRoles] = useState<boolean>(false);
    const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(roleProps.selectedRoleId);
    const statusBarContext = useStatusBarContext();
    const statusBarContextRef = useRef(statusBarContext);
    const sessionContext = useSessionContext();
    const rolePropsRef = useRef(roleProps);
    const hasLoadedRoles = useRef<boolean>(false);
    const sessionId = sessionContext?.SessionList?.find((item: any) => item.VariableName?.toLowerCase() === "sessionid")?.SessionValue;

    useEffect(() => {
        rolePropsRef.current = roleProps;
    }, [roleProps]);

    useEffect(() => {
        setSelectedRoleId(roleProps.selectedRoleId);
    }, [roleProps.selectedRoleId]);

    useEffect(() => {
        if (hasLoadedRoles.current) {
            return;
        }
        hasLoadedRoles.current = true;

        const handleGetRolesResponse = (response: unknown, status?: string) => {
            setIsLoadingRoles(false);
            if (status === "200" && response && typeof response === "object" && "entitiesJson" in response) {
                let parsedJson: unknown = null;
                try {
                    parsedJson = JSON.parse(response.entitiesJson as string);
                } catch {
                    parsedJson = null;
                }

                const parsedData = extractRolesWithGroupName(parsedJson);
                if (Array.isArray(parsedData)) {
                    setRoles(parsedData);
                    if (parsedData.length && !rolePropsRef.current.selectedRoleId) {
                        const firstRole = parsedData[0];
                        const firstRoleId = firstRole.EntID ?? firstRole.RecID ?? FnGetDisplayValue(firstRole, ["Name", "_Role", "Role"]);
                        setSelectedRoleId(firstRoleId);
                        rolePropsRef.current.handleSelectedCard?.(firstRole);
                    }
                } else {
                    setRoles([]);
                }
            } else {
                setRoles([]);
            }
        };

        setHasRequestedRoles(true);
        setIsLoadingRoles(true);
        axiosInterceptor({
            url: AUTH.GetEntitiesForFeatureAuth,
            data: {
                entityName: "Role",
                pageType: 1,
                sessionId: sessionId
            },
            allowShowLoader: true,
            setFetchData: handleGetRolesResponse
        }, statusBarContextRef.current).catch(() => {
            setIsLoadingRoles(false);
            setRoles([]);
        });
    }, [sessionId]);

    const shouldShowLoading = isLoadingRoles;
    const shouldShowNoData = hasRequestedRoles && !isLoadingRoles && roles.length === 0;

    const handleRoleClick = (_event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>, data: unknown) => {
        const selectedRole = data as IRoleRecord;
        const roleId = selectedRole.EntID ?? selectedRole.RecID ?? FnGetDisplayValue(selectedRole, ["Name", "_Role", "Role"]);
        setSelectedRoleId(roleId);
        roleProps.handleSelectedCard?.(selectedRole);
    };

    return (
        <div className="nz-role-card-container" key={uniqueName} data-card-layout-list role="listbox" aria-label="Roles">
            {shouldShowLoading ? (
                <div className="nz-role-card-status-message">Loading...</div>
            ) : roles.length ? roles.map((role: IRoleRecord, index: number) => {
                const roleName = FnGetDisplayValue(role, ["Name", "_Role", "Role"]);
                const groupName = FnGetDisplayValue(role, ["GroupName"]);
                const roleTitle = groupName ? `${groupName}->${roleName}` : roleName;
                const description = FnGetDisplayValue(role, ["Desc250", "Description"]);
                const roleId = role.EntID ?? role.RecID ?? FnGetDisplayValue(role, ["Name", "_Role", "Role"]);
                const cardFields = buildRoleCardFields(roleTitle, description);

                return (
                    <CardLayout
                        key={`${uniqueName}-${role.EntID ?? role.RecID ?? roleName}-${index}`}
                        uniqueName={`${uniqueName}-${index}`}
                        className="nz-role-card-main"
                        data={role}
                        fields={cardFields}
                        isSelected={selectedRoleId === roleId}
                        onClick={handleRoleClick}
                        hideRightMouseMenu={true}
                        ContentImage={{
                            uniqueName: `${uniqueName}-role-image-${index}`,
                            source: <Role24x24
                                size={FnGetCssVariable("--image-size-2")}
                                fill="none"
                                strokeWidth={1} />,
                            w: "var(--image-size-2)",
                            tooltip: "Role",
                            type: "svg",
                        }}
                    />
                );
            }) : shouldShowNoData ? (
                <div className="nz-role-card-status-message">No Data Found</div>
            ) : null}
        </div>
    );
};

export { Role };
