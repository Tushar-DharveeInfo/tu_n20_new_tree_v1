

/*DCI to-site hierarchy fields used for session find redirect. */
interface IDciToSiteNode {
    SiteName?: string;
    SiteID?: string;
    RoomName?: string;
    RoomID?: string;
    FloorName?: string;
    FloorID?: string;
    LocationName?: string;
    LocationID?: string;
    DeviceName?: string;
    DeviceID?: string;
}

/*DCI record shown in the Select Datacenter Interconnect popup. */
interface IDciRecord {
    Name?: string;
    DCIFromSiteNode?: IDciToSiteNode;
    DCIToSiteNode?: IDciToSiteNode;
}

/*Session payload shape returned by transformData for Find navigation. */
interface IDciSessionFindPayload {
    _Site?: string;
    SiteID?: string;
    _Room?: string;
    RoomID?: string;
    _Floor?: string;
    FloorID?: string;
    _Location?: string;
    LocationID?: string;
    _Device?: string;
    DeviceID?: string;
}

/*Props for the Select Datacenter Interconnect cabling kebab-menu popup. */
interface IShowDatacenterInterconnect {
    uniqueName: string;
    dciRecords: IDciRecord[];
    featureId: string;
    handleClose: () => void;
}

export type {
    IShowDatacenterInterconnect,
    IDciRecord,
    IDciToSiteNode,
    IDciSessionFindPayload,
};
