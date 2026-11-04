import React, { useEffect, useMemo, useRef } from "react";
import {
    Check,
    Cloud24x24,
    Cross,
    Edit24x24,
    Plus,
    Role24x24,
    Site24x24,
    Team24x24,
    Tenant24x24,
    User24x24
} from "@n20a/libicon";
import "../../../../../allcss/appqaentitiescontainer/cloudprovider/EntityCardInstanceList.css";
import { FnGetCssVariable } from "../../../../../../appcontainer/allcommon/FnGetCssVariable";
import { FnParseJsonSafely } from "../../../../../../appcontainer/allcommon/FnParseJsonSafely";
import { ActionImage } from "../../../../../../shared/basic/actionimage/ActionImage";
import { Image } from "../../../../../../shared/basic/image/Image";
import { IImage } from "../../../../../../shared/allinterface/basic/IImage";
import { CardLayout } from "../../../../../../shared/cardlayout/CardLayout";
import { ICardLayoutField } from "../../../../../../shared/allinterface/cardlayout/ICardLayout";
import { IActionLabelItem } from "../../../../../../shared/allinterface/basic/IActionLabelItem";
import { IEntityCardInstanceList } from "../../../../../allinterface/iappqaentitiescontainer/cloudprovider/IEntityCardInstanceList";
import { FnRemovePrefixFromJsonKeys } from "../../../../../allcommon/FnRemovePrefixFromJsonKeys";
import { FnConvertDateToUtcOrUtcToDate } from "../../../../../../appcontainer/allcommon/FnConvertDateToUtcOrUtcToDate";
import { FnIsTruthyFlag } from "../../../../../../shared/allcommon/basic/FnIsTruthyFlag";
import { FnGetAddressDisplay, FnGetDisplayValue } from "../../../../../allcommon/FnGetAddressDisplay";

type EntityRecord = Record<string, unknown>;

type EntityIconComponent = React.ComponentType<{
    size?: string | number;
    fill?: string;
    strokeWidth?: number;
}>;

const ENTITY_ICON_MAP: Record<string, { Icon: EntityIconComponent; tooltip: string }> = {
    user: { Icon: User24x24, tooltip: "User" },
    team: { Icon: Team24x24, tooltip: "Team" },
    tenant: { Icon: Tenant24x24, tooltip: "Tenant" },
    role: { Icon: Role24x24, tooltip: "Role" },
    site: { Icon: Site24x24, tooltip: "Site" },
    partner: { Icon: Team24x24, tooltip: "Partner" },
    vendor: { Icon: Team24x24, tooltip: "Vendor" },
    tag: { Icon: Team24x24, tooltip: "Tag" },
    cloudprovider: { Icon: Cloud24x24, tooltip: "Cloud Provider" }
};

const normalizeEntityKey = (entityName: string): string =>
    entityName.toLowerCase().replace(/[\s_-]+/g, "");

const buildEntityContentImage = (
    entityName: string | undefined,
    uniqueName: string,
    actionCode: string,
    index: number
): IImage | undefined => {
    if (!entityName) {
        return undefined;
    }
    const config = ENTITY_ICON_MAP[normalizeEntityKey(entityName)];
    if (!config) {
        return undefined;
    }
    const { Icon, tooltip } = config;
    return {
        uniqueName: `${uniqueName}-${normalizeEntityKey(entityName)}-image-${actionCode}-${index}`,
        source: (
            <Icon
                size={FnGetCssVariable("--image-size-2")}
                fill="none"
                strokeWidth={1}
            />
        ),
        w: "var(--image-size-2)",
        tooltip,
        type: "svg"
    };
};

const resolveContentImage = (
    props: IEntityCardInstanceList,
    item: IActionLabelItem,
    record: EntityRecord,
    index: number
): IImage | undefined => {
    if (props.showContentImage === false) {
        return undefined;
    }
    if (props.getContentImage) {
        return props.getContentImage(item, record, index);
    }
    if (props.dynamicCardProps?.ContentImage) {
        return props.dynamicCardProps.ContentImage;
    }
    return buildEntityContentImage(
        props.entityName,
        props.uniqueName,
        item.actionCode,
        index
    );
};





const getPartnerDisplayName = (partner: EntityRecord): string => {
    const name = partner.Name ?? partner._Partner;
    if (typeof name === "string" && name.length > 0) {
        return name;
    }
    if (typeof partner._Partner === "string" && partner._Partner.length > 0) {
        return partner._Partner;
    }
    return "—";
};

const getPartnerCardTitle = (partner: EntityRecord): string => {
    const groupName = partner.GroupName;
    const name = getPartnerDisplayName(partner);
    if (typeof groupName === "string" && groupName.length > 0) {
        return `${name}`;
    }
    return name;
};

const getPartnerFromItem = (item: { profileString?: string }): EntityRecord => {
    if (!item.profileString) {
        return {};
    }
    const str = FnRemovePrefixFromJsonKeys(item.profileString);
    const parsed = FnParseJsonSafely(str);
    if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0] as EntityRecord;
    }
    return {};
};

// For user cards, keep Shortname/ShortName aligned with Title when Title exists.
const applyUserShortNameFromTitle = (
    record: EntityRecord,
    entityName?: string
): EntityRecord => {
    if (normalizeEntityKey(entityName ?? "") !== "user") {
        return record;
    }
    const title = FnGetDisplayValue(record, ["Title"]);
    if (!title) {
        return record;
    }
    return {
        ...record,
        ShortName: title,
        Shortname: title
    };
};

// For user list cards, prefer ShortName/Title over action-label text.
const getCardTitle = (
    item: Record<string, any>,
    partner: EntityRecord,
    entityName?: string
): string => {
    if (normalizeEntityKey(entityName ?? "") === "user") {
        const shortName = FnGetDisplayValue(partner, ["Shortname", "ShortName", "Title", "_User"]);
        if (shortName) {
            return shortName;
        }
    } else if (normalizeEntityKey(entityName ?? "") === "partner") {
        return `${getPartnerCardTitle(partner)} ${(partner.Purpose as string)?.length ? `(${partner.Purpose})` : ""}`;
    }
    return item.label || getPartnerCardTitle(partner);
};

const buildEnabledValueContent = (
    fieldUniqueName: string,
) => {
    return (
        <Image
            source={
                <Check
                    size={FnGetCssVariable("--image-size-1")}
                    fill="none"
                    strokeWidth={1}
                />
            }
            uniqueName={`${fieldUniqueName}-icheck`}
            w="var(--image-size-2)"
            tooltip="Enabled"
            type="svg"
        />
    );
};

const makeUserName = (userName: string, role?: string) => {
    if (role?.length) {
        return `${userName} (${role})`;
    } else {
        return userName
    }
}

/** Builds CardLayout name/value rows from an entity contact record. */
const buildEntityCardFields = (
    cardTitle: string,
    record: EntityRecord,
    fieldUniqueName: string
): ICardLayoutField[] => {
    const description = FnGetDisplayValue(record, ["Desc250", "Description"]);
    const contactName = FnGetDisplayValue(record, ["FullName", "ContactName"]);
    const email = FnGetDisplayValue(record, ["Email", "EmailAddress", "PrimaryEmail"]);
    const emailOptin = record.EmailOptin;
    const enabled = record.Enabled;
    const phone = FnGetDisplayValue(record, ["Phone", "PhoneNumber", "Mobile"]);
    const phonetype = FnGetDisplayValue(record, ["PhoneType"]);
    const address = FnGetAddressDisplay(record);
    const relationship = FnGetDisplayValue(record, ["Relationship"]);
    const baseRole = FnGetDisplayValue(record, ["BasicRole", "RoleName"])
    const StartDate = FnGetDisplayValue(record, ["StartDate"]);
    const EndDate = FnGetDisplayValue(record, ["EndDate"]);
    const UserCount = FnGetDisplayValue(record, ["UserCount"]);
    const RackCount = FnGetDisplayValue(record, ["RackCount"]);
    const ProductName = FnGetDisplayValue(record, ["ProductName"]);
    const LoginUser = FnGetDisplayValue(record, ["_User", "LoginUser"]);

    const fields: ICardLayoutField[] = [
        {
            Name: "Title",
            Value: baseRole ? makeUserName(cardTitle, baseRole) : cardTitle || "—",
            Header: 1,
        },
    ];
    if (cardTitle && enabled) {
        fields.push({
            Name: "",
            Value: "",
            ValueContent: buildEnabledValueContent(fieldUniqueName),
            Group: "Enabled",
            Header: 2,
            Row: "inline",
        });
    }

    if (email) {
        fields.push({
            Name: "Email",
            Value: email,
            Group: "email-row",
            Row: "inline",
        });
        fields.push({
            Name: "OptIn",
            Value: FnIsTruthyFlag(emailOptin) ? "✓" : "X",
            Group: "email-row",
            Row: "inline",
        });
    }
    if (contactName) {
        fields.push({
            Name: "Contact",
            Value: contactName,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (phone) {
        fields.push({
            Name: "Phone",
            Value: `${phone} (${phonetype})`,
            Group: "contact-row",
            Row: "inline",
        });
    }
    if (address) {
        fields.push({ Name: "Address", Value: address, Row: "inline" });
    }
    if (description) {
        fields.push({ Name: "Description", Value: description });
    }

    if (relationship) {
        fields.push({ Name: "Relationship", Value: relationship });
    }
    if (StartDate) {
        fields.push({
            Name: "Start Date", Value: FnConvertDateToUtcOrUtcToDate(StartDate, false, false),
            Group: "date-row",
            Row: "inline",
        });
    }
    if (EndDate) {
        fields.push({
            Name: "End Date", Value: FnConvertDateToUtcOrUtcToDate(EndDate, false, false),
            Group: "date-row",
            Row: "inline",
        });
    }
    if (ProductName) {
        fields.push({
            Name: "Product Name", Value: ProductName, Group: "count-row",
            Row: "inline",
        });
    }
    if (Number(UserCount) > 0) {
        fields.push({
            Name: "User Count", Value: UserCount, Group: "count-row",
            Row: "inline",
        });
    }
    if (Number(RackCount) > 0) {
        fields.push({
            Name: "Rack Count", Value: RackCount, Group: "count-row",
            Row: "inline",
        });
    }
    if (LoginUser) {
        fields.push({
            Name: "Login User", Value: LoginUser, Group: "count-row",
            Row: "inline",
        });
    }
    return fields;
};

const isCardVisibleInScrollPane = (
    scrollContainer: HTMLElement,
    cardElement: HTMLElement
): boolean => {
    const containerRect = scrollContainer.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();

    return cardRect.top >= containerRect.top
        && cardRect.bottom <= containerRect.bottom;
};

const EntityCardInstanceList = (props: IEntityCardInstanceList) => {
    const {
        uniqueName,
        actionLabelItems,
        selectedItem,
        handleSelectListItem,
        handleActionButtonClick,
        allowAdd = true,
        allowDelete = true,
        showEditButton = false,
        allowEdit = false,
        disableAdd = false,
        disableDelete = false,
        disableEdit = false,
        dynamicCardProps,
        hasRequestedData = false,
        isLoading = true
    } = props;

    const listScrollRef = useRef<HTMLDivElement>(null);
    const selectedCardRef = useRef<HTMLDivElement>(null);

    const showActionButtons =
        allowAdd || allowDelete || (showEditButton && allowEdit);

    const listStatusMessage = useMemo(() => {
        if (!hasRequestedData || isLoading) {
            return "Loading…";
        }
        if (!actionLabelItems?.length) {
            return "No Data Found";
        }
        return null;
    }, [actionLabelItems?.length, hasRequestedData, isLoading]);

    useEffect(() => {
        if (listStatusMessage || isLoading || !hasRequestedData || !selectedItem?.actionCode) {
            return;
        }

        const scrollSelectedCardIntoView = () => {
            const scrollContainer = listScrollRef.current;
            const selectedCard = selectedCardRef.current;

            if (!scrollContainer || !selectedCard) {
                return;
            }

            if (!isCardVisibleInScrollPane(scrollContainer, selectedCard)) {
                selectedCard.scrollIntoView({ block: "nearest", inline: "nearest" });
            }
        };

        const frameId = window.requestAnimationFrame(() => {
            scrollSelectedCardIntoView();
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [
        hasRequestedData,
        isLoading,
        listStatusMessage,
        selectedItem?.actionCode,
        actionLabelItems?.length,
    ]);

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLDivElement>,
        actionCode: string
    ) => {
        const allItems = Array.from(
            document.querySelectorAll<HTMLDivElement>(".nz-action-image-container")
        );
        const currentIndex = allItems.findIndex((el) => el === e.currentTarget);

        if (e.key === "ArrowDown") {
            e.preventDefault();
            const next = (currentIndex + 1) % allItems.length;
            allItems[next]?.focus();
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const prev =
                (currentIndex - 1 + allItems.length) % allItems.length;
            allItems[prev]?.focus();
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleActionButtonClick(e, actionCode);
        }
    };

    const addImage: IImage = {
        uniqueName: `${uniqueName}-iadd`,
        source: (
            <Plus
                size={FnGetCssVariable("--image-size-2")}
                fill="none"
                strokeWidth={1}
            />
        ),
        type: "svg",
        w: "var(--image-size-2)",
        tooltip: "Click to Add"
    };
    const editImage: IImage = {
        uniqueName: `${uniqueName}-iedit`,
        source: (
            <Edit24x24
                size={FnGetCssVariable("--image-size-2")}
                fill="none"
                strokeWidth={1}
            />
        ),
        w: "var(--image-size-2)",
        type: "svg",
        tooltip: "Click to Edit"
    };
    const deleteImage: IImage = {
        uniqueName: `${uniqueName}-idelete`,
        source: (
            <Cross size={FnGetCssVariable("--image-size-2")} fill="red" />
        ),
        w: "var(--image-size-2)",
        type: "svg",
        tooltip: "Click to Delete"
    };

    const actions: {
        allow: boolean;
        image: IImage;
        code: string;
        disabled?: boolean;
    }[] = [
            {
                allow: allowAdd,
                image: addImage,
                code: "add",
                disabled: disableAdd
            },
            {
                allow: showEditButton && allowEdit,
                image: editImage,
                code: "edit",
                disabled: disableEdit
            },
            {
                allow: allowDelete,
                image: deleteImage,
                code: "delete",
                disabled: disableDelete
            }
        ];

    return (
        <div
            className={`nz-entity-card-instance-list-container${showActionButtons ? " nz-action-with-buttons" : ""}`}
        >
            <div
                ref={listScrollRef}
                className="nz-entity-card-list nz-list-data"
            >
                {listStatusMessage ? (
                    <div className="nz-entity-card-instance-list-status">
                        {listStatusMessage}
                    </div>
                ) : (
                    actionLabelItems.map((item: Record<string, any>, index) => {
                        const partner = applyUserShortNameFromTitle(
                            getPartnerFromItem(item),
                            props.entityName
                        );
                        const isSelected =
                            selectedItem?.actionCode === item.actionCode;
                        const cardTitle = getCardTitle(
                            item,
                            partner,
                            props.entityName
                        );
                        const contentImage = resolveContentImage(
                            props,
                            item as IActionLabelItem,
                            partner,
                            index
                        );
                        const cardFields = buildEntityCardFields(
                            cardTitle,
                            partner,
                            `${uniqueName}-card-${item.actionCode}`
                        );

                        return (
                            <div
                                key={`${uniqueName}-${item.actionCode}`}
                                ref={isSelected ? selectedCardRef : undefined}
                                className={`nz-entity-card-list-item${isSelected ? " nz-entity-card-list-item--selected" : ""}`}
                                data-entity-card-action-code={item.actionCode}
                            >
                                <CardLayout
                                    uniqueName={`${uniqueName}-card-${item.actionCode}`}
                                    data={partner}
                                    fields={cardFields}
                                    isSelected={isSelected}
                                    onClick={(event) => {
                                        handleSelectListItem(
                                            event,
                                            item.actionCode
                                        );
                                    }}
                                    className={`nz-entity-card-main${dynamicCardProps?.className ? ` ${dynamicCardProps.className}` : ""}`}
                                    hideRightMouseMenu={
                                        dynamicCardProps?.hideRightMouseMenu ?? true
                                    }
                                    allowEditButton={
                                        dynamicCardProps?.allowEditButton
                                        ?? (showEditButton && allowEdit)
                                    }
                                    allowDeleteButton={
                                        dynamicCardProps?.allowDeleteButton ?? false
                                    }
                                    isEditDisabled={dynamicCardProps?.isEditDisabled ?? disableEdit}
                                    isDeleteDisabled={dynamicCardProps?.isDeleteDisabled}
                                    containerName={dynamicCardProps?.containerName}
                                    featureId={dynamicCardProps?.featureId}
                                    featureData={dynamicCardProps?.featureData}
                                    handleMouseForEdit={
                                        dynamicCardProps?.handleMouseForEdit
                                        ?? (() =>
                                            handleActionButtonClick(
                                                {} as React.MouseEvent<HTMLDivElement>,
                                                "edit"
                                            ))
                                    }
                                    handleMouseForDelete={
                                        dynamicCardProps?.handleMouseForDelete
                                    }
                                    handleNodeMenuOnClick={
                                        dynamicCardProps?.handleNodeMenuOnClick
                                    }
                                    ContentImage={contentImage}
                                />
                            </div>
                        );
                    })
                )}
            </div>
            {actions.some((a) => a.allow) ? (
                <div className="nz-entity-card-action-panel nz-action-panel">
                    {actions.map((a, index) =>
                        a.allow ? (
                            <div
                                key={a.code}
                                onKeyDown={(e) => handleKeyDown(e, a.code)}
                                style={{ display: "inline-block" }}
                            >
                                <ActionImage
                                    image={a.image}
                                    w="var(--node_height)"
                                    h="var(--node_height)"
                                    uniqueName={`${uniqueName}-ai${a.code}`}
                                    actionCode={a.code}
                                    disabled={a.disabled}
                                    handleMouse={handleActionButtonClick}
                                />
                            </div>
                        ) : null
                    )}
                </div>
            ) : null}
        </div>
    );
};

export { EntityCardInstanceList };
